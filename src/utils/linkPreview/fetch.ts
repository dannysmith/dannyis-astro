/**
 * Getting an external page, and remembering it.
 *
 * One network round-trip per page per build, however many cards render it, with
 * the result cached to disk between builds. What we store is the raw captured
 * `<head>`, not parsed fields — so improving the parser later applies to every
 * cached link instantly and offline, with no refetch of sites that may since
 * have died or started blocking us.
 *
 * The cache lives inside Astro's cache dir so the existing CI cache step covers
 * it (see docs/developer/deployment.md). It is not committed, so a cold cache
 * refetches everything, and a cold cache *plus* a dead site loses that link's
 * metadata for good — the degraded path is normal here, not exceptional.
 *
 * Nothing here throws. A link that 404s, blocks us or times out is a fact about
 * the web, not an authoring error.
 */

/* global fetch, process, setTimeout */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { recordProblem } from '@utils/linkPreview/health'

/**
 * What happened when we asked for this URL.
 *
 * `blocked` and `dead` are deliberately distinct: sites 403, rate-limit and
 * challenge us for temporary reasons all the time, so only 404/410 is treated
 * as a link that has actually rotted.
 */
export type LinkStatus = 'ok' | 'blocked' | 'dead' | 'unreachable' | 'non-html'

export interface CapturedPage {
  /** The URL as authored. Always what we link to. */
  url: string
  /** Where the fetch landed, after redirects and archive unwrapping. */
  finalUrl: string
  status: LinkStatus
  contentType: string | null
  /** Captured `<head>`, or '' when we never got usable HTML. */
  head: string
  /** True when the authored URL was an archive link we resolved through. */
  archived: boolean
}

/** What the cache file holds. `url` and `archived` are recomputed from the request. */
interface StoredCapture {
  finalUrl: string
  status: LinkStatus
  contentType: string | null
  head: string
  fetchedAt: number
}

// Overridable so tests can point at a temp directory.
const CACHE_DIR =
  process.env.LINK_CACHE_DIR ?? path.join(process.cwd(), 'node_modules', '.astro', 'link-cache')
const CACHE_VERSION = 'v2'

/** Page metadata drifts, unlike a tweet, so captures revalidate rather than living forever. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

const FETCH_TIMEOUT_MS = 10_000
/**
 * Politeness, and a build that hammers 60 hosts at once times out against slow
 * ones. Shared with the image downloads, which go to the same hosts.
 */
const MAX_CONCURRENT_FETCHES = 6
/** Long enough for a blip to pass, short enough not to stall the build. */
const RETRY_DELAY_MS = 500

/**
 * Notion's public pages serve real per-page metadata only to known social
 * crawlers; every other UA gets a JS shell titled "Notion". This sentinel is
 * what unfurl.js, Slack and Discord send, and most blogs and news sites give it
 * good OG data too.
 */
const SOCIAL_UA = 'facebookexternalhit/1.1'
/** Some hosts 403 the social UA but answer a browser. */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** One capture per page per build, keyed so two links to the same page share it. */
const inFlight = new Map<string, Promise<StoredCapture>>()

export async function capturePage(url: string): Promise<CapturedPage> {
  // An archive link's metadata lives at the URL it archived. We still link to
  // the archive — it's what was asked for, and often the only readable copy —
  // but describe the page it holds.
  const archivedUrl = unwrapArchiveUrl(url)
  const target = archivedUrl ?? url
  const key = normaliseUrl(target)

  let pending = inFlight.get(key)
  if (!pending) {
    pending = withNetworkSlot(() => load(target, key, url))
    inFlight.set(key, pending)
  }

  const stored = await pending
  return {
    url,
    finalUrl: stored.finalUrl,
    status: stored.status,
    contentType: stored.contentType,
    head: stored.head,
    archived: archivedUrl !== null,
  }
}

async function load(url: string, key: string, authoredUrl: string): Promise<StoredCapture> {
  const cached = await readCache(key)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached

  const fresh = await capture(url)

  // Only a capture we actually read is stored. A non-HTML target isn't a
  // failure — a PDF link is a good link — but it has no head, so storing it
  // would let one mislabelled `text/plain` response bury a good capture for a
  // month. Re-checking its content type costs one cheap round-trip a build.
  if (fresh.status === 'ok') {
    await writeCache(key, fresh)
    return fresh
  }

  if (fresh.status !== 'non-html') recordProblem(authoredUrl, fresh.status)

  // A stale capture beats an empty card, but what happened *this* time is
  // current: a link that has started 404ing shows what it said when it worked,
  // marked dead. Failures are never cached, so an outage isn't baked in.
  return cached ? { ...cached, status: fresh.status, contentType: fresh.contentType } : fresh
}

async function capture(url: string): Promise<StoredCapture> {
  if (!isPublicHttpUrl(url)) return empty(url, 'unreachable')

  const first = await attempt(url, SOCIAL_UA)
  if (first.status === 'blocked') {
    const second = await attempt(url, BROWSER_UA)
    if (second.status === 'ok') return second
  }
  return first
}

async function attempt(url: string, userAgent: string): Promise<StoredCapture> {
  for (let tries = 0; tries < 2; tries++) {
    try {
      const hit = await fetchPublic(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      // A redirect chain that leaves the public internet, or never ends.
      if (!hit) return empty(url, 'unreachable')
      const { response, finalUrl } = hit

      if (response.status === 404 || response.status === 410) {
        await discard(response)
        return empty(finalUrl, 'dead')
      }
      if (response.status === 403 || response.status === 429) {
        await discard(response)
        return empty(finalUrl, 'blocked')
      }
      if (!response.ok) {
        await discard(response)
        if (tries === 0) {
          await sleep(RETRY_DELAY_MS)
          continue
        }
        return empty(finalUrl, 'unreachable')
      }

      const contentType = response.headers.get('content-type')
      if (!isHtml(contentType)) {
        await discard(response)
        return { ...empty(finalUrl, 'non-html'), contentType }
      }

      const head = readHead(await response.text())

      // A challenge page answers 200 with a real <head>, so status alone can't
      // catch it — and its title would otherwise become the card's title.
      if (isChallengePage(head)) return empty(finalUrl, 'blocked')

      return { finalUrl, status: 'ok', contentType, head, fetchedAt: Date.now() }
    } catch {
      // Timeout, DNS failure, TLS error, connection reset. One retry, because
      // failures aren't cached and a blip would otherwise cost this card its
      // metadata for the whole deploy.
      if (tries === 0) {
        await sleep(RETRY_DELAY_MS)
        continue
      }
      return empty(url, 'unreachable')
    }
  }

  return empty(url, 'unreachable')
}

/** Enough for a shortener chain plus a canonicalising hop or two. */
const MAX_REDIRECTS = 5

export interface PublicResponse {
  response: Response
  /** Where the chain actually ended, which is what relative URLs resolve against. */
  finalUrl: string
}

/**
 * Fetch, following redirects ourselves so every hop is checked *before* it is
 * requested.
 *
 * `redirect: 'follow'` would make the request and only let us notice
 * afterwards, which is enough to keep internal data off the site but not enough
 * to keep the build from touching a machine on the network it happens to run
 * on. The page we're reading chooses both its `og:image` and its redirects, so
 * that distinction is the whole point of the check.
 *
 * Returns null when a hop isn't public, or the chain never ends.
 */
export async function fetchPublic(url: string, init: RequestInit): Promise<PublicResponse | null> {
  let target = url

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttpUrl(target)) return null

    const response = await fetch(target, { ...init, redirect: 'manual' })

    const location = response.headers.get('location')
    const redirected = response.status >= 300 && response.status < 400 && location
    if (!redirected) return { response, finalUrl: target }

    await discard(response)
    try {
      target = new URL(location, target).href
    } catch {
      return null
    }
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function empty(finalUrl: string, status: LinkStatus): StoredCapture {
  return { finalUrl, status, contentType: null, head: '', fetchedAt: Date.now() }
}

/** A head big enough to hold any real metadata, and small enough to store. */
const MAX_HEAD_CHARS = 512_000

/**
 * Metadata all lives in the head, so everything past `</head>` goes — and the
 * head itself is capped, because a handful of sites inline hundreds of KB of
 * JSON into it (YouTube's runs to a megabyte) and every byte would otherwise
 * be stored and re-scanned on each render. `</head>` is optional in HTML, so
 * the cap is also what bounds a page that never closes it.
 */
function readHead(html: string): string {
  const end = html.search(/<\/head\s*>/i)
  return html.slice(0, Math.min(end === -1 ? html.length : end, MAX_HEAD_CHARS))
}

/** Release the socket for responses we won't read. */
async function discard(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // Already closed.
  }
}

function isHtml(contentType: string | null): boolean {
  if (!contentType) return true // Unlabelled: try parsing rather than give up.
  const type = contentType.split(';')[0].trim().toLowerCase()
  return type === 'text/html' || type === 'application/xhtml+xml'
}

const CHALLENGE_TITLES =
  /just a moment|attention required|checking your browser|making sure you|are you a robot|verify you are human|access denied/i

function isChallengePage(head: string): boolean {
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return title !== undefined && CHALLENGE_TITLES.test(title)
}

// ----------------------------------------------------------------------- URLs

/** Params that identify a campaign rather than a page. */
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_(cid|eid)$|igshid$)/i

/**
 * Strip tracking params and the fragment, so two links to the same page share
 * one capture. Used only for the cache key — never for the URL we fetch or link
 * to. Kept to unambiguous names: `ref`, `s` and `source` mean real things on
 * plenty of sites, and collapsing those would serve one page's card for another.
 */
export function normaliseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) parsed.searchParams.delete(key)
    }
    parsed.hash = ''
    return parsed.toString().replace(/\?$/, '')
  } catch {
    return url
  }
}

/**
 * Whether a URL is somewhere on the public internet worth fetching.
 *
 * A page we link to controls its own `og:image` and can redirect us wherever it
 * likes, so without this a build could be talked into requesting a machine on
 * the network it happens to run on — a laptop's dev server, or a cloud
 * metadata endpoint — and publishing whatever came back.
 *
 * Hostname-level only. A name that *resolves* to a private address still gets
 * through; catching that needs our own DNS resolution and connection pinning,
 * which is far more machinery than a personal site's build warrants. Every
 * redirect hop is checked before it is requested — see `fetchPublic`.
 */
export function isPublicHttpUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false

  // An IPv6 literal may carry an IPv4 address inside it, and `new URL` rewrites
  // `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe` — so the mapped form has to
  // be unpacked and judged as the IPv4 address it really is.
  if (host.includes(':')) {
    const mapped = mappedIpv4(host)
    return mapped ? isPublicIpv4(mapped) : !isPrivateIpv6(host)
  }

  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? isPublicIpv4(host) : true
}

/** The IPv4 address inside an IPv4-mapped IPv6 literal, else null. */
function mappedIpv4(host: string): string | null {
  const dotted = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted) return dotted[1]

  const hex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (!hex) return null
  const [high, low] = hex.slice(1, 3).map(part => parseInt(part, 16))
  return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`
}

function isPublicIpv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number)
  const isPrivate =
    a === 0 || // "this network"
    a === 10 ||
    a === 127 || // loopback
    a >= 224 || // multicast and reserved
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, including cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  return !isPrivate
}

/**
 * Unique-local `fc00::/7` and link-local `fe80::/10` — which runs to `febf`,
 * not just `fe80`. Only ever applied to a real IPv6 literal, since plenty of
 * public names start `fc` or `fd` (fcc.gov, fd.nl).
 */
function isPrivateIpv6(host: string): boolean {
  return host === '::1' || host === '::' || /^f[cd]/.test(host) || /^fe[89ab]/.test(host)
}

/**
 * Archive links carry the original URL in their path, so the interesting
 * metadata is a hop away: archive.ph/20260811223012/https://economist.com/…
 * (which itself rate-limits us) describes an Economist article.
 *
 * Returns null for anything that isn't an archive URL.
 */
export function unwrapArchiveUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '')
  if (!/^archive\.(ph|today|is|li|vn|fo|md)$/.test(host) && host !== 'web.archive.org') return null

  // Wayback paths carry flags on the timestamp (`/web/2026id_/https://…`).
  const match = parsed.pathname.match(/^\/(?:web\/)?[0-9]{4,14}[a-z_]*\/(.+)$/i)
  if (!match) return null

  const inner = match[1] + parsed.search + parsed.hash
  try {
    return new URL(/^https?:\/\//i.test(inner) ? inner : `https://${inner}`).href
  } catch {
    return null
  }
}

// --------------------------------------------------------------------- caching

/** The version is in the filename, so bumping it orphans old entries rather than reading them. */
function cachePath(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 16)
  return path.join(CACHE_DIR, `${CACHE_VERSION}-${hash}.json`)
}

async function readCache(key: string): Promise<StoredCapture | null> {
  try {
    return JSON.parse(await fs.readFile(cachePath(key), 'utf-8')) as StoredCapture
  } catch {
    return null
  }
}

async function writeCache(key: string, capture: StoredCapture): Promise<void> {
  // Best-effort: a cache we can't write is a slow build, not a broken one.
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cachePath(key), JSON.stringify(capture), 'utf-8')
  } catch (error) {
    console.warn(`Link cache write failed for ${key}:`, error)
  }
}

// ----------------------------------------------------------- concurrency limit

let activeFetches = 0
const waiting: Array<() => void> = []

/**
 * Hold one of a fixed number of outbound slots for the duration of `task`.
 * Shared by page captures and image downloads: they hit the same hosts, and a
 * limit only one of them respects isn't a limit.
 */
export async function withNetworkSlot<T>(task: () => Promise<T>): Promise<T> {
  // A loop, not an `if`: a waiter that wakes up can find the slot already taken
  // by a caller that arrived in the meantime, which would put us over the limit.
  while (activeFetches >= MAX_CONCURRENT_FETCHES) {
    await new Promise<void>(resolve => waiting.push(resolve))
  }
  activeFetches++
  try {
    return await task()
  } finally {
    activeFetches--
    waiting.shift()?.()
  }
}
