/**
 * Turning a captured `<head>` into the fields a BookmarkCard renders.
 *
 * Everything here is pure: capture (network, cache, retries) lives in
 * fetchLinkMetadata.ts, and this module never touches either. That split is
 * what lets the extraction rules below be tested against real captured HTML,
 * and improved later without refetching anything.
 *
 * The rules are heuristics about how people actually mark up pages, so each one
 * says which real page motivated it.
 */

import { decodeHTML } from 'entities'

/**
 * What happened when we asked for this URL.
 *
 * `blocked` and `dead` are deliberately distinct: sites 403, rate-limit and
 * challenge us for temporary reasons all the time, so only 404/410 is treated
 * as a link that has actually rotted.
 */
export type LinkStatus = 'ok' | 'thin' | 'blocked' | 'dead' | 'unreachable' | 'non-html'

export interface LinkMetadata {
  /** The URL as authored. Always what we link to. */
  url: string
  /** Where the fetch landed, after redirects and archive unwrapping. */
  finalUrl: string
  /** Hostname without `www.`, for display. */
  domain: string | null
  /** Host plus a trimmed path, for when the domain alone is too little. */
  displayUrl: string | null
  status: LinkStatus
  /** The page's own title, or null when we never got one. */
  title: string | null
  /** Always renderable: the title, else derived from the URL, else the domain. */
  displayTitle: string
  description: string | null
  /** Absolute image URL. */
  image: string | null
  favicon: string | null
  /** Set for `non-html` captures, e.g. `application/pdf`. */
  contentType: string | null
  /** True when the authored URL was an archive link we resolved through. */
  archived: boolean
}

/** A stored fetch. `outcome` is what the network said; `status` is derived from it. */
export interface LinkCapture {
  url: string
  finalUrl: string
  httpStatus: number | null
  contentType: string | null
  /** Captured `<head>`, or '' when we never got usable HTML. */
  head: string
  fetchedAt: number
  outcome: 'fetched' | 'blocked' | 'dead' | 'unreachable' | 'non-html'
  captureVersion: string
  deriveVersion: string
  archived?: boolean
}

/** Descriptions are clamped in CSS, but a whole page of text in the HTML helps nobody. */
const MAX_DESCRIPTION = 300
/** Below this, a "title" is a label rather than a title, and the URL reads better. */
const MIN_TITLE_LENGTH = 2

// ------------------------------------------------------------------- head parsing

interface ParsedHead {
  /** Keyed by lowercased `property` or `name`; first occurrence wins. */
  metas: Map<string, string>
  /** Every `<link>`, in document order. */
  links: Array<{ rel: string; href: string }>
  title: string | null
  /** Parsed `application/ld+json` blocks, flattened out of any @graph. */
  jsonLd: Record<string, unknown>[]
}

/**
 * Tokenise the head once, rather than running a regex per field per candidate.
 *
 * Attribute values are read with the closing quote required to match the
 * opening one. Matching `content` directly with `["']([^"']+)["']` — as this
 * code used to — silently truncates any value containing the other quote
 * character, so perevillega.com's `content="… They're Monkey Paws."` became
 * "… They".
 */
export function parseHead(head: string): ParsedHead {
  const metas = new Map<string, string>()
  for (const tag of head.matchAll(/<meta\b[^>]*>/gi)) {
    const key = attr(tag[0], 'property') ?? attr(tag[0], 'name')
    const content = attr(tag[0], 'content')
    if (!key || content === null) continue
    const normalised = key.trim().toLowerCase()
    // First occurrence wins: pages that repeat og:image list the primary first.
    if (!metas.has(normalised) && content.trim()) metas.set(normalised, content.trim())
  }

  const links: Array<{ rel: string; href: string }> = []
  for (const tag of head.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(tag[0], 'rel')
    const href = attr(tag[0], 'href')
    if (rel && href) links.push({ rel: rel.trim().toLowerCase(), href: href.trim() })
  }

  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  return {
    metas,
    links,
    title: titleMatch ? clean(titleMatch[1]) : null,
    jsonLd: parseJsonLd(head),
  }
}

/** Read one attribute, tolerating single, double, and unquoted values. */
function attr(tag: string, name: string): string | null {
  const quoted = tag.match(new RegExp(`\\b${name}=(["'])([\\s\\S]*?)\\1`, 'i'))
  if (quoted) return decodeHTML(quoted[2])
  const bare = tag.match(new RegExp(`\\b${name}=([^\\s"'>]+)`, 'i'))
  return bare ? decodeHTML(bare[1]) : null
}

/**
 * JSON-LD is the one place a blog reliably states its own headline and image
 * when it has no Open Graph tags at all. Anything malformed is skipped —
 * hand-rolled JSON-LD in the wild is frequently invalid.
 */
function parseJsonLd(head: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = []
  for (const tag of head.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed: unknown = JSON.parse(tag[1])
      for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
        if (!entry || typeof entry !== 'object') continue
        const record = entry as Record<string, unknown>
        const graph = record['@graph']
        if (Array.isArray(graph)) {
          for (const node of graph) {
            if (node && typeof node === 'object') blocks.push(node as Record<string, unknown>)
          }
        } else {
          blocks.push(record)
        }
      }
    } catch {
      // Invalid JSON-LD is common; the og: tags are usually still fine.
    }
  }
  return blocks
}

function jsonLdString(blocks: Record<string, unknown>[], key: string): string | null {
  for (const block of blocks) {
    const value = block[key]
    if (typeof value === 'string' && value.trim()) return clean(value)
    // `image` is often an ImageObject or an array of them.
    if (Array.isArray(value) && typeof value[0] === 'string') return clean(value[0])
    if (value && typeof value === 'object') {
      const url = (value as Record<string, unknown>).url
      if (typeof url === 'string' && url.trim()) return clean(url)
    }
  }
  return null
}

// ---------------------------------------------------------------------- cleaning

/**
 * Metadata routinely arrives entity-encoded, tag-laden, or wrapped across
 * lines in the source. Decode first, then strip tags — the other order would
 * leave `&lt;b&gt;` as literal markup on the card.
 */
export function clean(value: string): string | null {
  const text = decodeHTML(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

/** Cut at a word boundary so a clamped description doesn't end mid-word. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// ------------------------------------------------------------------------- titles

/** Separators sites put between a page title and their own name. */
const TITLE_SEPARATORS = ['|', '–', '—', '·', '»', '::', '-', ':']

/**
 * Drop a site's own name from its page title: "Aha! | Seth's Blog" → "Aha!",
 * "GitHub - dannysmith/tauri-template: …" → "dannysmith/tauri-template: …".
 *
 * Only strips when the removed part actually names the site (per og:site_name
 * or the domain), so "That boolean should probably be something else |
 * nicole@web" keeps its suffix — we have no evidence that's the site's name.
 */
export function stripSiteName(
  title: string,
  siteName: string | null,
  domain: string | null,
): string {
  const names = [siteName, domainLabel(domain)].filter((name): name is string => Boolean(name))
  if (names.length === 0) return title

  for (const separator of TITLE_SEPARATORS) {
    const suffixAt = title.lastIndexOf(` ${separator} `)
    if (suffixAt > 0) {
      const head = title.slice(0, suffixAt).trim()
      const tail = title.slice(suffixAt + separator.length + 2).trim()
      if (matchesSite(tail, names) && head.length >= MIN_TITLE_LENGTH) return head
    }

    const prefixAt = title.indexOf(` ${separator} `)
    if (prefixAt > 0) {
      const head = title.slice(0, prefixAt).trim()
      const tail = title.slice(prefixAt + separator.length + 2).trim()
      if (matchesSite(head, names) && tail.length >= MIN_TITLE_LENGTH) return tail
    }
  }

  return title
}

/** "github.com" → "github"; the label a site is most likely to call itself. */
function domainLabel(domain: string | null): string | null {
  if (!domain) return null
  const label = domain.split('.')[0]
  return label && label.length > 2 ? label : null
}

function matchesSite(candidate: string, names: string[]): boolean {
  const normalised = candidate.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalised) return false
  return names.some(name => {
    const target = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    return target.length > 2 && normalised === target
  })
}

/**
 * A last-resort title from the URL itself, which beats showing a bare URL:
 * `…/how-to-spot-ai-writing#selection-1279` → "How to spot ai writing".
 *
 * Deliberately only capitalises the first letter — title-casing other people's
 * words guesses wrong (acronyms, names, deliberate lowercase).
 */
export function titleFromUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const segments = parsed.pathname.split('/').filter(Boolean)
  for (const rawSegment of segments.reverse()) {
    let segment: string
    try {
      segment = decodeURIComponent(rawSegment)
    } catch {
      segment = rawSegment
    }

    // Message IDs and the like are addresses, not names: lore.kernel.org's
    // `CAHk-=wi4zC+Ze8e…@mail.gmail.com` reads as noise however it's split up.
    if (segment.includes('@') || segment.length > 70) continue

    const words = segment
      // Drop a file extension, and date or ID prefixes like `2026-07-30-` or `1234-`.
      .replace(/\.(html?|php|aspx?|md|txt|pdf|epub|zip|docx?|csv|json|xml)$/i, '')
      .replace(/^\d{4}-\d{2}-\d{2}-/, '')
      .replace(/^\d+[-_]/, '')
      .replace(/[-_+]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // A slug of digits or a hash is an identifier, not a title.
    if (words.length < 3 || !/[a-z]{3}/i.test(words) || /^[0-9a-f]{8,}$/i.test(words)) continue
    return words.charAt(0).toUpperCase() + words.slice(1)
  }

  return null
}

// --------------------------------------------------------------------------- URLs

/** Params that identify a campaign rather than a page. */
const TRACKING_PARAMS =
  /^(utm_|fbclid$|gclid$|mc_(cid|eid)$|_hs(enc|mi)$|igshid$|ref$|ref_src$|si$|s$|source$|__s$)/i

/**
 * Strip tracking params and the fragment. Used for the cache key (so two links
 * to the same page share one capture) and for display — never for the href we
 * link to, which stays exactly as authored.
 */
export function normaliseUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) parsed.searchParams.delete(key)
  }
  parsed.hash = ''

  // `new URL` already settles trailing-slash and case differences, so
  // example.com and example.com/ resolve to one key.
  return parsed.toString().replace(/\?$/, '')
}

/**
 * A readable version of the URL: no scheme, no `www.`, no tracking, and a path
 * trimmed to its ends. Long paths get an ellipsis in the middle so the start
 * and the page's own slug both survive.
 */
export function displayUrl(url: string, maxLength = 60): string | null {
  let parsed: URL
  try {
    parsed = new URL(normaliseUrl(url))
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '')
  const path = decodeURIComponent(parsed.pathname).replace(/\/$/, '')
  if (!path) return host

  const full = `${host}${path}`
  if (full.length <= maxLength) return full

  const segments = path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  const room = maxLength - host.length - 4
  return room > 8 ? `${host}/…/${truncateMiddle(last, room)}` : `${host}/…`
}

function truncateMiddle(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
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
  const isArchiveToday = /^archive\.(ph|today|is|li|vn|fo|md)$/.test(host)
  const isWayback = host === 'web.archive.org'
  if (!isArchiveToday && !isWayback) return null

  // Wayback paths carry flags on the timestamp (`/web/2026id_/https://…`).
  const match = parsed.pathname.match(/^\/(?:web\/)?[0-9]{4,14}[a-z_]*\/(.+)$/i)
  if (!match) return null

  const inner = match[1] + parsed.search + parsed.hash
  const restored = /^https?:\/\//i.test(inner) ? inner : `https://${inner}`
  try {
    return new URL(restored).href
  } catch {
    return null
  }
}

// ------------------------------------------------------------------------ derive

/**
 * Capture → renderable fields.
 *
 * A failed fetch's HTML is never read: a 404 page usually still has a full
 * head — GitHub's advertises "Build software better, together" — and using it
 * would produce a confident, wrong card.
 */
export function derive(capture: LinkCapture): LinkMetadata {
  const base = capture.finalUrl || capture.url
  const domain = hostname(base)
  const head = capture.outcome === 'fetched' ? parseHead(capture.head) : null

  const siteName = head?.metas.get('og:site_name') ?? null
  const title = head ? selectTitle(head, siteName, domain) : null
  const description = head ? selectDescription(head, title) : null

  return {
    url: capture.url,
    finalUrl: base,
    domain,
    displayUrl: displayUrl(base),
    status: capture.outcome === 'fetched' ? (title ? 'ok' : 'thin') : capture.outcome,
    title,
    displayTitle: title ?? titleFromUrl(base) ?? domain ?? capture.url,
    description,
    image: head ? selectImage(head, base) : null,
    favicon: head ? selectFavicon(head, base) : null,
    contentType: capture.outcome === 'non-html' ? capture.contentType : null,
    archived: capture.archived ?? false,
  }
}

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Prefer the page's own og:title, but not when it's just the site's name —
 * some sites set og:title site-wide, and then `<title>` is the specific one.
 */
function selectTitle(
  head: ParsedHead,
  siteName: string | null,
  domain: string | null,
): string | null {
  const candidates = [
    head.metas.get('og:title'),
    head.metas.get('twitter:title'),
    jsonLdString(head.jsonLd, 'headline'),
    head.title,
  ]

  const cleaned = candidates
    .map(candidate => (candidate ? clean(candidate) : null))
    .filter((candidate): candidate is string => Boolean(candidate))
    .map(candidate => stripSiteName(candidate, siteName, domain))
    .filter(candidate => candidate.length >= MIN_TITLE_LENGTH)

  const specific = cleaned.find(candidate => !matchesSite(candidate, siteNames(siteName, domain)))
  return specific ?? cleaned[0] ?? null
}

function siteNames(siteName: string | null, domain: string | null): string[] {
  return [siteName, domain, domainLabel(domain)].filter((name): name is string => Boolean(name))
}

/**
 * Sites often publish two descriptions, one a truncated version of the other
 * (og:description trimmed for social, `<meta name=description>` in full).
 * Prefer whichever says more, and drop it entirely when it just repeats the
 * title.
 */
function selectDescription(head: ParsedHead, title: string | null): string | null {
  const candidates = [
    head.metas.get('og:description'),
    head.metas.get('twitter:description'),
    head.metas.get('description'),
    jsonLdString(head.jsonLd, 'description'),
  ]
    .map(candidate => (candidate ? clean(candidate) : null))
    .filter((candidate): candidate is string => Boolean(candidate))

  if (candidates.length === 0) return null

  const best = candidates.reduce((chosen, candidate) =>
    isExtensionOf(candidate, chosen) ? candidate : chosen,
  )

  if (title && normaliseForCompare(best) === normaliseForCompare(title)) return null
  return truncate(best, MAX_DESCRIPTION)
}

/** True when `candidate` is the same text as `chosen`, but longer. */
function isExtensionOf(candidate: string, chosen: string): boolean {
  if (candidate.length <= chosen.length) return false
  const stem = normaliseForCompare(chosen).replace(/…$|\.\.\.$/, '')
  return stem.length > 20 && normaliseForCompare(candidate).startsWith(stem)
}

function normaliseForCompare(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * `og:image` is usually a full URL but plenty of sites publish a root-relative
 * path (oilwell.app serves `/preview/Oilwell-OG-5.jpg`), which is only valid
 * against the page's own URL — hotlinking it as-is is what put broken images
 * on the site.
 */
function selectImage(head: ParsedHead, base: string): string | null {
  const candidates = [
    head.metas.get('og:image'),
    head.metas.get('og:image:secure_url'),
    head.metas.get('og:image:url'),
    head.metas.get('twitter:image'),
    head.metas.get('twitter:image:src'),
    jsonLdString(head.jsonLd, 'image'),
    head.links.find(link => link.rel === 'image_src')?.href,
  ]

  for (const candidate of candidates) {
    const resolved = absoluteUrl(candidate, base)
    if (resolved) return resolved
  }
  return null
}

function selectFavicon(head: ParsedHead, base: string): string | null {
  const icons = head.links.filter(link => /(^|\s)(shortcut\s+)?icon(\s|$)/.test(link.rel))
  for (const icon of icons) {
    const resolved = absoluteUrl(icon.href, base)
    if (resolved) return resolved
  }
  return null
}

/** Resolve against the page URL, rejecting anything that isn't fetchable http(s). */
function absoluteUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null
  try {
    const resolved = new URL(value.trim(), base)
    if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') return null
    return resolved.href
  } catch {
    return null
  }
}
