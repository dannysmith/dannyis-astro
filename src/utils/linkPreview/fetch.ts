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
  captureVersion: string
}

// Overridable so tests can point at a temp directory.
const CACHE_DIR =
  process.env.LINK_CACHE_DIR ?? path.join(process.cwd(), 'node_modules', '.astro', 'link-cache')
const CACHE_VERSION = 'v2'

/** Page metadata drifts, unlike a tweet, so captures revalidate rather than living forever. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

const FETCH_TIMEOUT_MS = 10_000
/** Politeness, and a build that hammers 60 hosts at once times out against slow ones. */
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
    pending = withSlot(() => load(target, key, url))
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

  if (fresh.status === 'ok' || fresh.status === 'non-html') {
    await writeCache(key, fresh)
    return fresh
  }

  recordProblem(authoredUrl, fresh.status)

  // A stale capture beats an empty card, but the *status* is current: a link
  // that has started 404ing shows what it said when it worked, marked dead.
  // Failures are never cached, so a transient outage isn't baked in.
  return cached ? { ...cached, status: fresh.status } : fresh
}

async function capture(url: string): Promise<StoredCapture> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return empty(url, 'unreachable')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return empty(url, 'unreachable')

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
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if (response.status === 404 || response.status === 410) {
        await discard(response)
        return empty(response.url || url, 'dead')
      }
      if (response.status === 403 || response.status === 429) {
        await discard(response)
        return empty(response.url || url, 'blocked')
      }
      if (!response.ok) {
        await discard(response)
        if (tries === 0) {
          await sleep(RETRY_DELAY_MS)
          continue
        }
        return empty(response.url || url, 'unreachable')
      }

      const contentType = response.headers.get('content-type')
      if (!isHtml(contentType)) {
        await discard(response)
        return { ...empty(response.url || url, 'non-html'), contentType }
      }

      const head = readHead(await response.text())

      // A challenge page answers 200 with a real <head>, so status alone can't
      // catch it — and its title would otherwise become the card's title.
      if (isChallengePage(head)) return empty(response.url || url, 'blocked')

      return {
        finalUrl: response.url || url,
        status: 'ok',
        contentType,
        head,
        fetchedAt: Date.now(),
        captureVersion: CACHE_VERSION,
      }
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function empty(finalUrl: string, status: LinkStatus): StoredCapture {
  return {
    finalUrl,
    status,
    contentType: null,
    head: '',
    fetchedAt: Date.now(),
    captureVersion: CACHE_VERSION,
  }
}

/** Everything after `</head>` is never metadata, and some pages are enormous. */
function readHead(html: string): string {
  const end = html.search(/<\/head\s*>/i)
  return end === -1 ? html : html.slice(0, end)
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

function cachePath(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 16)
  return path.join(CACHE_DIR, `${CACHE_VERSION}-${hash}.json`)
}

async function readCache(key: string): Promise<StoredCapture | null> {
  try {
    const stored = JSON.parse(await fs.readFile(cachePath(key), 'utf-8')) as StoredCapture
    return stored.captureVersion === CACHE_VERSION ? stored : null
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

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeFetches >= MAX_CONCURRENT_FETCHES) {
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
