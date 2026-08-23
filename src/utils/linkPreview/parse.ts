/**
 * What an external page says about itself.
 *
 * Everything here is pure: give it a captured `<head>` and the URL it came
 * from, get back the fields a preview card can show. The rules are heuristics
 * about how people actually mark up pages, so each one notes the kind of page
 * that motivated it.
 */

import { decodeHTML } from 'entities'

export interface PageMetadata {
  title: string | null
  description: string | null
  /** Absolute; relative paths are resolved against the page's own URL. */
  imageUrl: string | null
  /** The author's own alt text for that image, when they wrote one. */
  imageAlt: string | null
  favicon: string | null
  /** What the site calls itself, which is often friendlier than its domain. */
  siteName: string | null
  author: string | null
  published: Date | null
}

/** Long enough for a real headline, short enough not to swamp the card. */
const MAX_TITLE = 120
/** A byline, not a list of contributors. */
const MAX_AUTHOR = 60
/** Clamped to two lines in CSS, but the full text still ships in the HTML. */
const MAX_DESCRIPTION = 300

export function readMetadata(head: string, baseUrl: string): PageMetadata {
  const tags = parseHead(head)
  const siteName = clean(tags.metas.get('og:site_name') ?? '')
  const domain = hostname(baseUrl)

  const title = selectTitle(tags, siteName, domain)

  return {
    title,
    description: selectDescription(tags, title),
    imageUrl: selectImage(tags, baseUrl),
    imageAlt: clean(tags.metas.get('og:image:alt') ?? ''),
    favicon: selectFavicon(tags, baseUrl),
    siteName,
    author: selectAuthor(tags),
    published: selectPublished(tags),
  }
}

/**
 * `article:author` is as often a link to a profile as a name, so a URL there is
 * no use on a card — `meta[name=author]` is the reliable one.
 */
function selectAuthor(tags: HeadTags): string | null {
  for (const name of ['author', 'article:author']) {
    const value = clean(tags.metas.get(name) ?? '')
    if (value && !/^https?:\/\//i.test(value)) return truncate(value, MAX_AUTHOR)
  }
  return null
}

function selectPublished(tags: HeadTags): Date | null {
  const raw = tags.metas.get('article:published_time') ?? tags.metas.get('article:published')
  if (!raw) return null
  const date = new Date(raw)
  // Dates in the future are a mis-set clock or a parse artefact, not news.
  return Number.isNaN(date.valueOf()) || date > new Date() ? null : date
}

export function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- tokenising

interface HeadTags {
  /** Keyed by lowercased `property` or `name`; first occurrence wins. */
  metas: Map<string, string>
  links: Array<{ rel: string; href: string }>
  title: string | null
}

/** A tag, allowing `>` to appear inside a quoted attribute value. */
const tagPattern = (name: string) => new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi')

/**
 * Tokenise the head once, rather than running a regex per field per candidate.
 *
 * The quoting is the fiddly part, and getting it wrong is silent. A value is
 * read with the closing quote required to match the opening one, so a title
 * like `They're Monkey Paws.` survives inside double quotes; and a tag runs to
 * the first `>` *outside* quotes, so `content="A > B"` isn't cut in half.
 */
function parseHead(head: string): HeadTags {
  // Inline scripts and styles can hold anything that looks like markup — a
  // `<title>` inside a JSON string would otherwise become the page's title.
  let markup = head
  let previous: string
  do {
    previous = markup
    markup = markup.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
  } while (markup !== previous)

  const metas = new Map<string, string>()
  for (const tag of markup.matchAll(tagPattern('meta'))) {
    const key = attr(tag[0], 'property') ?? attr(tag[0], 'name')
    const content = attr(tag[0], 'content')
    if (!key || !content?.trim()) continue
    // First wins: pages that repeat og:image list the primary first.
    if (!metas.has(key.trim().toLowerCase())) metas.set(key.trim().toLowerCase(), content.trim())
  }

  const links: Array<{ rel: string; href: string }> = []
  for (const tag of markup.matchAll(tagPattern('link'))) {
    const rel = attr(tag[0], 'rel')
    const href = attr(tag[0], 'href')
    if (rel && href) links.push({ rel: rel.trim().toLowerCase(), href: href.trim() })
  }

  // Element text, not an attribute, so it arrives encoded and undecoded.
  const title = markup.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  return { metas, links, title: title ? clean(decodeHTML(title[1])) : null }
}

/** Read one attribute, tolerating single, double, and unquoted values. */
function attr(tag: string, name: string): string | null {
  // The name has to follow whitespace rather than any word boundary: `\b`
  // would let a `data-content=` decoy answer a search for `content=`.
  const quoted = tag.match(new RegExp(`[\\s/]${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))
  if (quoted) return decodeHTML(quoted[2])
  const bare = tag.match(new RegExp(`[\\s/]${name}\\s*=\\s*([^\\s"'>]+)`, 'i'))
  return bare ? decodeHTML(bare[1]) : null
}

/**
 * Metadata routinely arrives tag-laden or wrapped across lines in the source.
 *
 * Values reach here already entity-decoded, and decoding again would be worse
 * than pointless: a page that escapes its markup twice — `&amp;lt;b&amp;gt;` —
 * would have it decoded into real tags and then stripped, losing the text.
 */
function clean(value: string): string | null {
  let text = value

  // Strip tags repeatedly rather than once: a single pass over `<scr<script>ipt>`
  // removes the inner match and leaves a working tag behind. Astro escapes
  // whatever we return, so this is about not printing junk as much as safety.
  let previous
  do {
    previous = text
    text = text.replace(/<[^>]*>/g, '')
  } while (text !== previous)

  text = text.replace(/\s+/g, ' ').trim()
  return text || null
}

/** Cut at a word boundary when there is one nearby, so text doesn't end mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// -------------------------------------------------------------------- titles

/** Separators sites put between a page title and their own name. */
const TITLE_SEPARATORS = ['|', '–', '—', '·', '»', '::', '-', ':']

/**
 * Drop a trailing site name from a page title: "Aha! | Seth's Blog" → "Aha!".
 *
 * Only strips when the removed part actually names the site (per og:site_name
 * or the domain), so "That boolean should probably be something else |
 * nicole@web" keeps its suffix — we have no evidence that's the site's name.
 *
 * Leading site names ("GitHub - foo") are deliberately left alone: whether the
 * prefix is noise or the most useful word on the card can't be told apart
 * reliably, and guessing wrong reads worse than doing nothing.
 */
function stripSiteSuffix(title: string, siteName: string | null, domain: string | null): string {
  for (const separator of TITLE_SEPARATORS) {
    const at = title.lastIndexOf(` ${separator} `)
    if (at <= 0) continue
    const head = title.slice(0, at).trim()
    const tail = title.slice(at + separator.length + 2).trim()
    if (head && namesSite(tail, siteName, domain)) return head
  }
  return title
}

/** True when this text is the site's own name, by og:site_name or by domain. */
function namesSite(text: string, siteName: string | null, domain: string | null): boolean {
  const candidate = simplify(text)
  if (!candidate) return false
  // "github.com" → "github": the label a site is most likely to call itself.
  const label = domain?.split('.')[0]
  return [siteName, domain, label]
    .filter((name): name is string => Boolean(name))
    .some(name => simplify(name).length > 2 && simplify(name) === candidate)
}

function simplify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Prefer the page's own og:title, except when that's just the site's name —
 * some sites set og:title site-wide, and then `<title>` is the specific one.
 */
function selectTitle(
  tags: HeadTags,
  siteName: string | null,
  domain: string | null,
): string | null {
  const declared = clean(tags.metas.get('og:title') ?? tags.metas.get('twitter:title') ?? '')
  const specific = declared && !namesSite(declared, siteName, domain) ? declared : null
  const chosen = specific ?? tags.title ?? declared
  if (!chosen) return null

  const title = stripSiteSuffix(chosen, siteName, domain)
  return title.length > 1 ? truncate(title, MAX_TITLE) : null
}

/** Boilerplate path segments that name a route, not a page. */
const BORING_SEGMENTS = /^(index|home|default|page|post|posts|blog|en|amp)$/i

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

  for (const raw of parsed.pathname.split('/').filter(Boolean).reverse()) {
    let segment: string
    try {
      segment = decodeURIComponent(raw)
    } catch {
      segment = raw
    }

    // Message IDs are addresses, not names: lore.kernel.org's
    // `CAHk-=wi4zC+Ze8e…@mail.gmail.com` reads as noise however it's split up.
    if (segment.includes('@')) continue

    const words = segment
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      // Date and ID prefixes: `2026-07-30-slug`, `1234-slug`.
      .replace(/^\d{4}-\d{2}-\d{2}-/, '')
      .replace(/^\d+[-_]/, '')
      // Trailing IDs: Medium, Ghost and Notion all staple one onto the slug.
      .replace(/[-_][0-9a-f]{8,}$/i, '')
      .replace(/[-_+]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (words.length < 3 || !/[a-z]{3}/i.test(words) || BORING_SEGMENTS.test(words)) continue
    return truncate(words.charAt(0).toUpperCase() + words.slice(1), MAX_TITLE)
  }

  return null
}

// -------------------------------------------------------------- descriptions

/**
 * Sites often publish two descriptions, one a trimmed version of the other.
 * Take whichever says more, and drop it when it just repeats the title.
 */
function selectDescription(tags: HeadTags, title: string | null): string | null {
  const candidates = ['og:description', 'twitter:description', 'description']
    .map(name => clean(tags.metas.get(name) ?? ''))
    .filter((text): text is string => Boolean(text))

  if (candidates.length === 0) return null
  const best = candidates.reduce((chosen, text) => (text.length > chosen.length ? text : chosen))

  // A description that restates the title is noise. Compare loosely: a title
  // trimmed of its site name often reappears verbatim as the description.
  // A title that simplifies to almost nothing — a CJK headline, or `C++` — is
  // a prefix of everything, so it can't be used to judge this.
  const stem = title ? simplify(title) : ''
  if (stem.length > 2 && simplify(best).startsWith(stem)) return null
  return truncate(best, MAX_DESCRIPTION)
}

// --------------------------------------------------------------------- media

/**
 * `og:image` is usually a full URL, but plenty of sites publish a root-relative
 * path (oilwell.app serves `/preview/Oilwell-OG-5.jpg`), which means nothing
 * except against the page's own URL.
 */
function selectImage(tags: HeadTags, base: string): string | null {
  const candidates = [
    'og:image',
    'og:image:secure_url',
    'og:image:url',
    'twitter:image',
    'twitter:image:src',
  ]
  for (const name of candidates) {
    const resolved = absoluteUrl(tags.metas.get(name), base)
    if (resolved) return resolved
  }
  return absoluteUrl(tags.links.find(link => link.rel === 'image_src')?.href, base)
}

/**
 * Prefer an icon we can re-encode: sharp reads PNG and SVG but not ICO, and a
 * third of the sites here still link a bare `/favicon.ico`. Apple's touch icon
 * is always a PNG, which makes it a good second choice.
 */
function selectFavicon(tags: HeadTags, base: string): string | null {
  const icons = tags.links
    .filter(link =>
      /(^|\s)(shortcut\s+)?(icon|apple-touch-icon(-precomposed)?)(\s|$)/.test(link.rel),
    )
    .map(link => absoluteUrl(link.href, base))
    .filter((href): href is string => Boolean(href))
    .filter(href => !/\.ico(\?|$)/i.test(href))

  return icons[0] ?? null
}

/** Resolve against the page URL, rejecting anything that isn't fetchable http(s). */
function absoluteUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null
  try {
    const resolved = new URL(value.trim(), base)
    return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.href : null
  } catch {
    return null
  }
}
