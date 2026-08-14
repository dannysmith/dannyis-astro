/**
 * Build-time fetcher for tweet data, via FxTwitter's unauthenticated API.
 *
 * X's own oEmbed endpoint returns nothing but a text blockquote — no avatar, no
 * images — and refuses datacenter IPs. FxTwitter answers a single unauthenticated
 * GET with structured JSON: author, avatar, media with alt text and dimensions,
 * and typed text facets.
 *
 * Responses are cached to disk keyed by tweet ID and never expire — a tweet's
 * content is fixed once posted, and a cached copy keeps rendering after the
 * tweet is deleted or the account goes private. The cache lives inside Astro's
 * own cache dir so the existing CI cache step covers it (see
 * docs/developer/deployment.md); a cold cache just re-fetches.
 *
 * We store the raw upstream payload rather than a normalised subset, so wanting
 * a new field later never forces a re-fetch of tweets that may no longer exist.
 * Bump CACHE_VERSION only if the upstream response shape changes.
 *
 * Failures return null rather than throwing: a deleted tweet is a real state,
 * not an authoring typo, so <Tweet> degrades to a plain link. This is the
 * opposite call to <LCVid>, which fails the build — that fetches Danny's own
 * videos from his own server, where a 404 always means a broken reference.
 */

/* global fetch */

import fs from 'node:fs/promises'
import path from 'node:path'

const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.astro', 'tweet-cache')
const CACHE_VERSION = 'v1'
const API_BASE = 'https://api.fxtwitter.com/i/status'
const FETCH_TIMEOUT_MS = 10_000

/**
 * Where tweet permalinks point. xcancel is a Nitter instance — readable without
 * an X account, but Nitter instances die often, so keep this swappable.
 */
export const MIRROR_BASE = 'https://xcancel.com'
export const ORIGIN_BASE = 'https://x.com'

/**
 * A span of `raw_text.text` carrying meaning — a link, mention, hashtag, the
 * trailing `pic.twitter.com` stub, or bold text in a long-form post.
 *
 * `indices` are Unicode *code point* offsets, not UTF-16 ones (FxEmbed's schema
 * comment says otherwise; the API disagrees with it). Slice with [...text].
 */
export interface TweetFacet {
  type: string
  indices: [number, number]
  original?: string
  replacement?: string
  display?: string
  id?: string
}

export interface TweetPhoto {
  type: 'photo' | 'gif'
  url: string
  width: number
  height: number
  altText?: string
}

export interface TweetVideo {
  type: 'video' | 'gif'
  url: string
  width: number
  height: number
  thumbnail_url?: string | null
  duration: number
}

export interface TweetAuthor {
  name: string
  screen_name: string
  avatar_url: string | null
}

export interface Tweet {
  id: string
  url: string
  /** Display text, already stripped of the trailing media link. */
  text: string
  raw_text: {
    text: string
    display_text_range?: [number, number]
    facets?: TweetFacet[]
  }
  created_at: string
  created_timestamp: number
  author: TweetAuthor
  media?: {
    photos?: TweetPhoto[]
    videos?: TweetVideo[]
  }
  lang: string | null
  possibly_sensitive: boolean
}

/**
 * Pull a tweet ID out of a twitter.com/x.com status URL, or pass a bare ID
 * through. The host must start the string, follow `//`, or follow a `.` (so
 * `mobile.x.com` matches but `notx.com` doesn't) — <Embed> dispatches on this,
 * and a false positive would route someone else's URL to <Tweet>.
 */
export function getTweetId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{5,25}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/(?:^|\/\/|\.)(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d+)/i)
  return match ? match[1] : null
}

/** Permalinks for a tweet: the readable mirror, and the original on X. */
export function tweetLinks(tweet: Tweet) {
  const permalink = `${tweet.author.screen_name}/status/${tweet.id}`
  return {
    mirror: `${MIRROR_BASE}/${permalink}`,
    origin: `${ORIGIN_BASE}/${permalink}`,
  }
}

const cachePath = (id: string) => path.join(CACHE_DIR, `${CACHE_VERSION}-${id}.json`)

async function readCache(id: string): Promise<Tweet | null> {
  try {
    return JSON.parse(await fs.readFile(cachePath(id), 'utf-8')) as Tweet
  } catch {
    return null
  }
}

async function writeCache(id: string, tweet: Tweet): Promise<void> {
  // Best-effort; a cache we can't write is a slow build, not a broken one.
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cachePath(id), JSON.stringify(tweet), 'utf-8')
  } catch (error) {
    console.warn(`Failed to cache tweet ${id}:`, error)
  }
}

async function load(id: string): Promise<Tweet | null> {
  const cached = await readCache(id)
  if (cached) return cached

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
      console.warn(`Tweet ${id}: FxTwitter returned ${response.status} ${response.statusText}`)
      return null
    }

    const body = (await response.json()) as { code?: number; message?: string; tweet?: Tweet }
    if (body.code !== 200 || !body.tweet) {
      console.warn(`Tweet ${id}: FxTwitter returned no tweet (${body.message ?? 'unknown'})`)
      return null
    }

    // Deliberately not caching failures — a transient outage shouldn't get
    // baked in and then restored on every subsequent build.
    await writeCache(id, body.tweet)
    return body.tweet
  } catch (error) {
    console.warn(`Failed to fetch tweet ${id}:`, error)
    return null
  }
}

// Deduplicate across the build: the same tweet embedded on several pages only
// hits the network (or the disk) once.
const inFlight = new Map<string, Promise<Tweet | null>>()

export function fetchTweet(id: string): Promise<Tweet | null> {
  let pending = inFlight.get(id)
  if (!pending) {
    pending = load(id)
    inFlight.set(id, pending)
  }
  return pending
}

export type TweetSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'bold'; text: string }
  | { kind: 'break' }

function toSegment(facet: TweetFacet, raw: string): TweetSegment {
  switch (facet.type) {
    case 'url':
      // `display` is the pretty form X shows ("astro.build/blog"), `replacement`
      // the resolved destination — both far better than the raw t.co link.
      return {
        kind: 'link',
        text: facet.display ?? raw,
        href: facet.replacement ?? facet.original ?? raw,
      }
    case 'mention':
      return { kind: 'link', text: raw, href: `${MIRROR_BASE}/${raw.replace(/^@/, '')}` }
    case 'bold':
      return { kind: 'bold', text: raw }
    default:
      // Hashtags and anything unrecognised render as plain text. Linking every
      // hashtag to a search page is noise in the middle of an article.
      return { kind: 'text', text: raw }
  }
}

/**
 * Split a tweet's text into renderable runs, resolving t.co links to their real
 * destinations and dropping the trailing `pic.twitter.com` stub that the media
 * grid already covers.
 *
 * Line breaks come out as explicit `break` segments rather than being left in
 * the text for `white-space: pre-wrap` to handle — pre-wrap would also preserve
 * the template's own indentation around the expression, printing a stray space
 * before the first word.
 */
export function toSegments(tweet: Tweet): TweetSegment[] {
  const chars = [...tweet.raw_text.text]
  const [start, end] = tweet.raw_text.display_text_range ?? [0, chars.length]

  const facets = (tweet.raw_text.facets ?? [])
    .filter(f => f.type !== 'media' && f.indices[0] >= start && f.indices[1] <= end)
    .sort((a, b) => a.indices[0] - b.indices[0])

  const segments: TweetSegment[] = []

  // Every text run goes through here, including the ones toSegment() hands back
  // for unrecognised facets — otherwise a trail of hashtags arrives as dozens of
  // one-word segments. Newlines become explicit breaks on the way in.
  const push = (segment: TweetSegment) => {
    if (segment.kind !== 'text') {
      segments.push(segment)
      return
    }
    segment.text.split('\n').forEach((line, index) => {
      if (index > 0) segments.push({ kind: 'break' })
      if (!line) return
      const previous = segments.at(-1)
      if (previous?.kind === 'text') previous.text += line
      else segments.push({ kind: 'text', text: line })
    })
  }

  let cursor = start
  for (const facet of facets) {
    const [from, to] = facet.indices
    if (from < cursor) continue // overlapping facets: the first one wins
    if (from > cursor) push({ kind: 'text', text: chars.slice(cursor, from).join('') })
    push(toSegment(facet, chars.slice(from, to).join('')))
    cursor = to
  }
  if (cursor < end) push({ kind: 'text', text: chars.slice(cursor, end).join('') })

  // Tweets often end in blank lines, which would render as stray <br>s.
  while (segments.length > 0) {
    const last = segments[segments.length - 1]
    if (last.kind === 'break') {
      segments.pop()
      continue
    }
    if (last.kind === 'text') {
      last.text = last.text.trimEnd()
      if (last.text === '') {
        segments.pop()
        continue
      }
    }
    break
  }

  return segments
}
