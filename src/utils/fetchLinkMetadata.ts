/**
 * Build-time link metadata for <BookmarkCard> and <Notion>.
 *
 * Fetching is split from parsing on purpose:
 *
 *   capture — one network round-trip per URL per build, cached to disk
 *   derive  — a pure function from a capture to the fields a card renders
 *
 * The cache stores the raw captured `<head>`, not the derived fields. Improving
 * the extraction later then applies to every cached link instantly and offline,
 * with no refetch of sites that may since have died or started blocking us —
 * which matters because a lot of what we link to is someone's personal blog.
 * `CAPTURE_VERSION` invalidates stored HTML; `DERIVE_VERSION` is for reference
 * in cached files only (deriving happens on every render, so parser changes
 * take effect without invalidating anything).
 *
 * The cache lives inside Astro's cache dir so the existing CI cache step covers
 * it (see docs/developer/deployment.md). It is not committed, so a cold cache
 * refetches everything, and a cold cache *plus* a dead site loses that link's
 * metadata for good — the degraded rendering path is normal, not exceptional.
 *
 * Nothing here throws. A link that 404s, blocks us, or times out is a fact
 * about the web, not an authoring error, so every outcome maps onto a status
 * the card renders against and the build carries on. See docs/developer/link-metadata.md.
 */

/* global fetch, process */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
// Types and every extraction rule live in deriveLinkMetadata; this module only
// gets the bytes and remembers them.
import {
  derive,
  normaliseUrl,
  unwrapArchiveUrl,
  type LinkCapture,
  type LinkMetadata,
} from '@utils/deriveLinkMetadata'

const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.astro', 'link-cache')
const CAPTURE_VERSION = 'v1'
const DERIVE_VERSION = 'v1'

/** Page metadata drifts, unlike a tweet, so captures revalidate rather than living forever. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000

const FETCH_TIMEOUT_MS = 10_000
const MAX_HEAD_BYTES = 512 * 1024
/** Politeness, and a build that hammers 60 hosts at once times out against slow ones. */
const MAX_CONCURRENT_FETCHES = 6
const MAX_RETRY_DELAY_MS = 3_000

/**
 * Notion's public pages serve real per-page metadata only to known social
 * crawlers; every other UA gets a JS shell titled "Notion". This sentinel is
 * what unfurl.js, Slack and Discord send, and most blogs and news sites give it
 * good OG data too.
 */
const SOCIAL_UA = 'facebookexternalhit/1.1'
/** Some hosts 403 the social UA but answer a browser (e.g. lore.kernel.org). */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ---------------------------------------------------------------- public API

/**
 * Metadata for a URL, from cache when possible. Never throws and never returns
 * null — check `status` to decide how much to trust the fields.
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  return derive(await loadCapture(url))
}

// ------------------------------------------------------------------ capturing

/**
 * One capture per page per build, however many cards render it — keyed on the
 * normalised URL, so two links differing only by a utm_ tag share a capture.
 */
const inFlight = new Map<string, Promise<LinkCapture>>()

function loadCapture(url: string): Promise<LinkCapture> {
  const key = normaliseUrl(url)
  let pending = inFlight.get(key)
  if (!pending) {
    pending = withSlot(() => load(url, key))
    inFlight.set(key, pending)
  }
  return pending
}

async function load(url: string, key: string): Promise<LinkCapture> {
  const cached = await readCache(key)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return { ...cached, url }

  const fresh = await capture(url)

  if (fresh.outcome === 'fetched' || fresh.outcome === 'non-html') {
    await writeCache(key, fresh)
    return fresh
  }

  warn(url, fresh)

  // A stale capture beats an empty card, but the *status* is current: a link
  // that has started 404ing gets marked dead while still showing what it said
  // when it worked. Failures are never cached, so a transient outage doesn't
  // get baked in and replayed on every later build.
  return cached ? { ...cached, url, outcome: fresh.outcome, httpStatus: fresh.httpStatus } : fresh
}

async function capture(url: string): Promise<LinkCapture> {
  // An archive link's metadata lives at the URL it archived. We still link to
  // the archive — it's what was asked for, and often the only readable copy —
  // but describe the page it holds.
  const archivedUrl = unwrapArchiveUrl(url)
  const target = archivedUrl ?? url

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return emptyCapture(url, 'unreachable')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return emptyCapture(url, 'unreachable')
  }

  const result = await attemptWithFallback(target)
  return { ...result, url, archived: archivedUrl !== null }
}

async function attemptWithFallback(url: string): Promise<LinkCapture> {
  const first = await attempt(url, SOCIAL_UA)
  if (first.outcome === 'blocked' && first.httpStatus === 403) {
    const second = await attempt(url, BROWSER_UA)
    if (second.outcome === 'fetched') return second
  }
  return first
}

async function attempt(url: string, userAgent: string): Promise<LinkCapture> {
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

      const { status } = response

      if (status === 404 || status === 410) {
        await discard(response)
        return emptyCapture(url, 'dead', response, status)
      }

      if (status === 429 && tries === 0) {
        await discard(response)
        await sleep(retryAfterMs(response))
        continue
      }

      if (status === 403 || status === 429) {
        await discard(response)
        return emptyCapture(url, 'blocked', response, status)
      }

      if (!response.ok) {
        await discard(response)
        if (tries === 0) {
          await sleep(500)
          continue
        }
        return emptyCapture(url, 'unreachable', response, status)
      }

      const contentType = response.headers.get('content-type')
      if (!isHtml(contentType)) {
        await discard(response)
        return emptyCapture(url, 'non-html', response, status)
      }

      const head = await readHead(response)

      // A challenge page answers 200 with a real <head>, so status alone can't
      // catch it — and its title would otherwise become the card's title.
      if (isChallengePage(head)) return emptyCapture(url, 'blocked', response, status)

      return {
        url,
        finalUrl: response.url || url,
        httpStatus: status,
        contentType,
        head,
        fetchedAt: Date.now(),
        outcome: 'fetched',
        captureVersion: CAPTURE_VERSION,
        deriveVersion: DERIVE_VERSION,
      }
    } catch {
      // Timeout, DNS failure, TLS error, connection reset.
      if (tries === 0) {
        await sleep(500)
        continue
      }
      return emptyCapture(url, 'unreachable')
    }
  }

  return emptyCapture(url, 'unreachable')
}

function emptyCapture(
  url: string,
  outcome: LinkCapture['outcome'],
  response?: Response,
  httpStatus?: number,
): LinkCapture {
  return {
    url,
    finalUrl: response?.url || url,
    httpStatus: httpStatus ?? null,
    contentType: response?.headers.get('content-type') ?? null,
    head: '',
    fetchedAt: Date.now(),
    outcome,
    captureVersion: CAPTURE_VERSION,
    deriveVersion: DERIVE_VERSION,
  }
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

/** Challenge titles are plain ASCII, so this reads the raw tag rather than parsing the head. */
function isChallengePage(head: string): boolean {
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return title !== undefined && CHALLENGE_TITLES.test(title)
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get('retry-after')
  const seconds = header ? Number.parseInt(header, 10) : Number.NaN
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS)
  return 1_000
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// -------------------------------------------------------------- reading heads

const CLOSE_HEAD = '</head>'

/**
 * Read only as far as `</head>`, capped. The rest of the document is never
 * metadata, and some pages we link to are megabytes of markup.
 *
 * Bytes are buffered rather than decoded incrementally because the charset can
 * only be known once `<meta charset>` has been seen — and a multi-byte
 * character split across two chunks would decode to nonsense either way.
 */
export async function readHead(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  const headerCharset = charsetFromContentType(response.headers.get('content-type'))

  if (!reader) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    return decodeHead(bytes.subarray(0, MAX_HEAD_BYTES), headerCharset)
  }

  const chunks: Uint8Array[] = []
  let total = 0
  let done = false
  // Carries the last few bytes of the previous chunk so a `</head>` split
  // across a chunk boundary is still found, without rescanning what we've read.
  let overlap: Uint8Array = new Uint8Array(0)

  while (total < MAX_HEAD_BYTES && !done) {
    const result = await reader.read()
    if (result.done) break
    const chunk = result.value.subarray(0, MAX_HEAD_BYTES - total)
    chunks.push(chunk)
    total += chunk.length

    const scannable = concat([overlap, chunk])
    done = asciiIndexOf(scannable, CLOSE_HEAD) !== -1
    overlap = scannable.subarray(Math.max(0, scannable.length - (CLOSE_HEAD.length - 1)))
  }

  await reader.cancel().catch(() => {})

  return decodeHead(concat(chunks), headerCharset)
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

/** ASCII-insensitive byte search — safe for every single-byte and UTF-8 encoding. */
function asciiIndexOf(bytes: Uint8Array, needle: string): number {
  const lower = needle.toLowerCase()
  outer: for (let i = 0; i <= bytes.length - lower.length; i++) {
    for (let j = 0; j < lower.length; j++) {
      const byte = bytes[i + j]
      const folded = byte >= 65 && byte <= 90 ? byte + 32 : byte
      if (folded !== lower.charCodeAt(j)) continue outer
    }
    return i
  }
  return -1
}

function decodeHead(bytes: Uint8Array, headerCharset: string | null): string {
  const charset = headerCharset ?? sniffCharset(bytes)
  const text = decodeWith(bytes, charset)
  const end = text.search(/<\/head\s*>/i)
  return end === -1 ? text : text.slice(0, end)
}

/**
 * windows-1252's 0x80–0x9F range, which is where it differs from latin1 — and
 * where the smart quotes and dashes that fill page titles live.
 *
 * We map it ourselves rather than trusting `new TextDecoder('windows-1252')`:
 * runtimes disagree (some decode 0x92 to U+0092, a control character, instead
 * of the right single quote), and a build's output shouldn't depend on which
 * one ran it. The five slots windows-1252 leaves undefined (0x81, 0x8D,
 * 0x8F, 0x90, 0x9D) keep their raw code point, as browsers do.
 */
// prettier-ignore
const CP1252_HIGH =
  '\u20AC\u0081\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u008D\u017D\u008F' +
  '\u0090\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u009D\u017E\u0178'

/** Labels the HTML spec says to decode as windows-1252, latin1 included. */
const CP1252_LABELS = /^(windows-1252|cp1252|x-cp1252|iso-8859-1|latin1|us-ascii|ascii)$/

function decodeWith(bytes: Uint8Array, charset: string | null): string {
  if (!charset || charset === 'utf-8' || charset === 'utf8') {
    return new TextDecoder('utf-8').decode(bytes)
  }

  if (CP1252_LABELS.test(charset)) {
    let text = ''
    for (const byte of bytes) {
      text += byte >= 0x80 && byte <= 0x9f ? CP1252_HIGH[byte - 0x80] : String.fromCharCode(byte)
    }
    return text
  }

  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    // Unknown label (or an encoding this runtime lacks) — UTF-8 is the best guess.
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function charsetFromContentType(contentType: string | null): string | null {
  const match = contentType?.match(/charset=["']?([\w-]+)/i)
  return match ? match[1].toLowerCase() : null
}

/** `<meta charset>` is ASCII in every encoding we're likely to meet. */
function sniffCharset(bytes: Uint8Array): string | null {
  const prefix = new TextDecoder('latin1').decode(bytes.subarray(0, 2048))
  const match =
    prefix.match(/<meta[^>]*charset=["']?([\w-]+)/i) ??
    prefix.match(/<meta[^>]*content=["'][^"']*charset=([\w-]+)/i)
  return match ? match[1].toLowerCase() : null
}

// -------------------------------------------------------------------- caching

function cachePath(url: string): string {
  const key = createHash('sha256').update(url).digest('hex').slice(0, 16)
  return path.join(CACHE_DIR, `${CAPTURE_VERSION}-${key}.json`)
}

async function readCache(url: string): Promise<LinkCapture | null> {
  try {
    const capture = JSON.parse(await fs.readFile(cachePath(url), 'utf-8')) as LinkCapture
    return capture.captureVersion === CAPTURE_VERSION ? capture : null
  } catch {
    return null
  }
}

async function writeCache(url: string, capture: LinkCapture): Promise<void> {
  // Best-effort: a cache we can't write is a slow build, not a broken one.
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cachePath(url), JSON.stringify(capture), 'utf-8')
  } catch (error) {
    console.warn(`Link cache write failed for ${url}:`, error)
  }
}

// ---------------------------------------------------------- concurrency limit

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

// ------------------------------------------------------------ health reporting

const problems = new Map<string, LinkCapture['outcome']>()

function warn(url: string, capture: LinkCapture): void {
  problems.set(url, capture.outcome)
  const detail = capture.httpStatus ? ` (${capture.httpStatus})` : ''
  // Leading newline: these land mid-render, in the middle of Astro's progress lines.
  console.warn(`\nLink ${capture.outcome}${detail}: ${url}`)
}

// One summary at the end of the build beats scrolling back through per-page
// warnings. Registered on import; harmless when nothing failed.
process.on('exit', () => {
  if (problems.size === 0) return
  console.warn(`\nLink health: ${problems.size} link(s) did not resolve cleanly.`)
  for (const [url, outcome] of problems) console.warn(`  ${outcome}: ${url}`)
})
