import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { PageMetadata } from '@utils/linkPreview/parse'

// The cache directory is read once, when the module first loads — so it has to
// be redirected at a temp dir before anything imports it. Static imports would
// hoist above this and quietly point the whole suite at the real cache.
const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-cache-'))
process.env.LINK_CACHE_DIR = cacheDir
afterAll(() => fs.rmSync(cacheDir, { recursive: true, force: true }))

const { readMetadata, titleFromUrl } = await import('@utils/linkPreview/parse')
const { normaliseUrl, unwrapArchiveUrl } = await import('@utils/linkPreview/fetch')
const { classifyShape } = await import('@utils/linkPreview/image')

/**
 * Fixtures are real `<head>`s from the pages listed on /scratchpad, trimmed to
 * their metadata but left byte-for-byte as served — entities, attribute order
 * and quoting intact. That's the point: this is markup nobody would think to
 * write by hand.
 */
const fixture = (name: string) =>
  fs.readFileSync(path.join('tests/fixtures/link-heads', `${name}.html`), 'utf-8')

const BASE = 'https://example.com/blog/post'
const read = (head: string, base = BASE): PageMetadata => readMetadata(head, base)

describe('readMetadata — real captured heads', () => {
  it('reads a GitHub repo page, capping a very long title', () => {
    const meta = read(fixture('github-repo'), 'https://github.com/dannysmith/tauri-template')
    expect(meta.title?.startsWith('GitHub - dannysmith/tauri-template:')).toBe(true)
    expect(meta.title!.length).toBeLessThanOrEqual(121)
    expect(meta.title!.endsWith('…')).toBe(true)
    expect(meta.description).toContain('production-ready template')
    expect(meta.imageUrl).toContain('opengraph.githubassets.com')
  })

  it('keeps escaped quotes and a raw apostrophe in one title, and drops the site suffix', () => {
    // og:title is `… &#34;Junior Developers.&#34; They're Monkey Paws. | Pere Villega`.
    // The old parser stopped dead at the apostrophe.
    const meta = read(
      fixture('perevillega-entity-quotes'),
      'https://perevillega.com/posts/2026-02-24-llms-are-monkey-paws/',
    )
    expect(meta.title).toBe('Stop Calling LLMs "Junior Developers." They\'re Monkey Paws.')
  })

  it('falls back to <title>, keeping a suffix that does not name the site', () => {
    const meta = read(fixture('ntietz-no-og'), 'https://ntietz.com/blog/that-boolean')
    expect(meta.title).toBe('That boolean should probably be something else | nicole@web')
    expect(meta.description).toBeNull()
    expect(meta.imageUrl).toBeNull()
  })

  it('makes a root-relative og:image absolute', () => {
    const meta = read(fixture('oilwell-relative-image'), 'https://oilwell.app/')
    expect(meta.title).toBe('Oilwell - Meditate through the meltdown')
    expect(meta.imageUrl).toBe('https://oilwell.app/preview/Oilwell-OG-5.jpg')
  })
})

describe('readMetadata — selection rules', () => {
  it('reads tags whatever the attribute order or quoting', () => {
    const meta = read(`
      <meta content="Ordered last" property="og:title">
      <meta name='og:description' content='Single quoted'>
      <meta property=og:image content=https://example.com/bare.png>`)
    expect(meta.title).toBe('Ordered last')
    expect(meta.description).toBe('Single quoted')
    expect(meta.imageUrl).toBe('https://example.com/bare.png')
  })

  it('keeps the first of a repeated tag, ignoring empty ones', () => {
    const meta = read(`<meta property="og:image" content="">
      <meta property="og:image" content="https://example.com/first.png">
      <meta property="og:image" content="https://example.com/second.png">`)
    expect(meta.imageUrl).toBe('https://example.com/first.png')
  })

  it('decodes entities and strips markup out of values', () => {
    const meta = read(
      `<title>Tom &amp; Jerry &#8212; a &#x201C;story&#x201D;</title>
       <meta property="og:description" content="A &lt;b&gt;bold&lt;/b&gt;\n   claim">`,
    )
    expect(meta.title).toBe('Tom & Jerry — a “story”')
    expect(meta.description).toBe('A bold claim')
  })

  it('prefers the specific <title> when og:title is just the site name', () => {
    const meta = read(`
      <meta property="og:site_name" content="Example Blog">
      <meta property="og:title" content="Example Blog">
      <title>A specific post | Example Blog</title>`)
    expect(meta.title).toBe('A specific post')
  })

  it('takes the fuller of two descriptions', () => {
    const meta = read(`<title>T</title>
      <meta property="og:description" content="The quick brown fox jumps over the…">
      <meta name="description" content="The quick brown fox jumps over the lazy dog, at length.">`)
    expect(meta.description).toBe('The quick brown fox jumps over the lazy dog, at length.')
  })

  it('drops a description that just restates the title', () => {
    const meta = read(`<title>Same words</title>
      <meta property="og:description" content="Same words">`)
    expect(meta.description).toBeNull()
  })

  it('caps a very long description at a word boundary', () => {
    const meta = read(`<title>T</title>
      <meta property="og:description" content="${'word '.repeat(200)}">`)
    expect(meta.description!.length).toBeLessThanOrEqual(301)
    expect(meta.description!.endsWith('…')).toBe(true)
  })

  it('falls through the image candidates and rejects unfetchable ones', () => {
    expect(read(`<meta property="og:image:secure_url" content="/secure.png">`).imageUrl).toBe(
      'https://example.com/secure.png',
    )
    expect(
      read(`<meta property="og:image" content="data:image/png;base64,AAA">`).imageUrl,
    ).toBeNull()
  })

  it('resolves favicons, including a later fallback', () => {
    expect(read(`<link rel="icon" href="/favicon.png">`).favicon).toBe(
      'https://example.com/favicon.png',
    )
    expect(
      read(`<link rel="icon"><link rel="shortcut icon" href="https://example.com/b.png">`).favicon,
    ).toBe('https://example.com/b.png')
  })
})

describe('readMetadata — what else the page tells us', () => {
  it('reads the site name, author, date and image alt text', () => {
    const meta = read(`
      <meta property="og:site_name" content="Example Blog">
      <meta name="author" content="A Writer">
      <meta property="article:published_time" content="2026-03-12T09:00:00Z">
      <meta property="og:image" content="/og.png">
      <meta property="og:image:alt" content="A chart of something">`)
    expect(meta.siteName).toBe('Example Blog')
    expect(meta.author).toBe('A Writer')
    expect(meta.published?.toISOString()).toBe('2026-03-12T09:00:00.000Z')
    expect(meta.imageAlt).toBe('A chart of something')
  })

  it('ignores an author that is a profile link rather than a name', () => {
    // article:author is as often a URL as a name.
    const meta = read(`<meta property="article:author" content="https://example.com/team/jo">`)
    expect(meta.author).toBeNull()
  })

  it('ignores an unparseable or future publish date', () => {
    expect(
      read(`<meta property="article:published_time" content="not a date">`).published,
    ).toBeNull()
    expect(
      read(`<meta property="article:published_time" content="3026-01-01">`).published,
    ).toBeNull()
  })

  it('skips .ico favicons, which cannot be re-encoded', () => {
    // sharp reads PNG and SVG but not ICO, and a third of sites still link one.
    expect(read(`<link rel="icon" href="/favicon.ico">`).favicon).toBeNull()
    expect(
      read(`<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/touch.png">`)
        .favicon,
    ).toBe('https://example.com/touch.png')
  })
})

describe('titleFromUrl — the title when the page gives us none', () => {
  it.each([
    [
      'https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing',
      'How to spot ai writing',
    ],
    ['https://example.com/2026-02-24-llms-are-monkey-paws.html', 'Llms are monkey paws'],
    ['https://example.com/posts/1234-some-thoughts', 'Some thoughts'],
    // A long Medium slug with the ID it staples on the end.
    [
      'https://medium.com/@dannysmith/breaking-down-problems-its-hard-when-you-re-learning-to-code-f10269f4ccd5',
      'Breaking down problems its hard when you re learning to code',
    ],
  ])('%s → %s', (url, expected) => {
    expect(titleFromUrl(url)).toBe(expected)
  })

  it('skips segments that name a route or an address, not a page', () => {
    // Boilerplate segments, and lore.kernel.org's message-ID paths.
    expect(titleFromUrl('https://example.com/writing/index.html')).toBe('Writing')
    expect(
      titleFromUrl('https://lore.kernel.org/linux-media/CAHk-=wi4z+Ze8e@mail.gmail.com/'),
    ).toBe('Linux media')
  })

  it('is null when the path says nothing', () => {
    expect(titleFromUrl('https://example.com/')).toBeNull()
    expect(titleFromUrl('not-a-url')).toBeNull()
  })
})

describe('normaliseUrl — the cache key', () => {
  it('strips campaign params and the fragment', () => {
    expect(normaliseUrl('https://example.com/post?utm_source=x&fbclid=y#section')).toBe(
      'https://example.com/post',
    )
  })

  it('keeps params that mean something to the site', () => {
    // ?s= is WordPress search and ?ref= identifies real pages: collapsing these
    // would serve one page's card for another.
    expect(normaliseUrl('https://example.com/?s=cats')).not.toBe(
      normaliseUrl('https://example.com/?s=dogs'),
    )
    expect(normaliseUrl('https://example.com/x?ref=a')).not.toBe(
      normaliseUrl('https://example.com/x?ref=b'),
    )
  })

  it('returns malformed input unchanged', () => {
    expect(normaliseUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('unwrapArchiveUrl', () => {
  it.each([
    [
      'https://archive.ph/20260811223012/https://www.economist.com/culture/how-to-spot-ai-writing',
      'https://www.economist.com/culture/how-to-spot-ai-writing',
    ],
    ['https://web.archive.org/web/2026id_/https://example.com/a', 'https://example.com/a'],
    ['https://archive.is/20260101/example.com/a', 'https://example.com/a'],
  ])('unwraps %s', (url, expected) => {
    expect(unwrapArchiveUrl(url)).toBe(expected)
  })

  it('leaves ordinary URLs and archive home pages alone', () => {
    expect(unwrapArchiveUrl('https://example.com/a')).toBeNull()
    expect(unwrapArchiveUrl('https://archive.ph/')).toBeNull()
  })
})

describe('classifyShape', () => {
  it.each([
    [1200, 630, 'banner'],
    [1200, 900, 'banner'], // a 4:3 photo still wants the crop
    [1080, 900, 'banner'], // exactly 1.2, the boundary
    [1070, 900, 'logo'],
    [400, 400, 'logo'],
    [600, 800, 'logo'],
  ])('%i×%i is a %s', (width, height, shape) => {
    expect(classifyShape(width, height)).toBe(shape)
  })
})

// ---------------------------------------------------------------------------
// The network paths, which decide what a card shows when a page won't load.

const cacheFiles = () => fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'))

/** A page response; `body` is served as HTML. */
const page = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'text/html' } })

describe('fetchLinkPreview — what it does with the network', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('treats a 200 challenge page as blocked, not as a page called "Just a moment…"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('<title>Just a moment...</title>')),
    )
    const { fetchLinkPreview } = await import('@utils/linkPreview/index')

    const link = await fetchLinkPreview('https://challenge.test/an-article')
    expect(link.status).toBe('blocked')
    expect(link.title).toBeNull()
    expect(link.displayTitle).toBe('An article')
  })

  it('reads no metadata from a 404, however convincing its head', async () => {
    // GitHub's 404 advertises "Build software better, together".
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page(fixture('github-404-page'), 404)),
    )
    const { fetchLinkPreview } = await import('@utils/linkPreview/index')

    const link = await fetchLinkPreview('https://github.test/dannysmith/this-repo-does-not-exist')
    expect(link.status).toBe('dead')
    expect(link.title).toBeNull()
    expect(link.image).toBeNull()
    expect(link.displayTitle).toBe('This repo does not exist')
  })

  it('does not cache a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('nope', 500)),
    )
    const { fetchLinkPreview } = await import('@utils/linkPreview/index')

    const before = cacheFiles().length
    const link = await fetchLinkPreview('https://flaky.test/a-page')
    expect(link.status).toBe('unreachable')
    expect(cacheFiles()).toHaveLength(before)
  })

  it('shares one fetch between links differing only by a campaign param', async () => {
    const stub = vi.fn(async () => page('<title>One page</title>'))
    vi.stubGlobal('fetch', stub)
    const { fetchLinkPreview } = await import('@utils/linkPreview/index')

    const [a, b] = await Promise.all([
      fetchLinkPreview('https://dedupe.test/post'),
      fetchLinkPreview('https://dedupe.test/post?utm_source=newsletter'),
    ])
    expect(stub).toHaveBeenCalledTimes(1)
    expect(a.title).toBe('One page')
    expect(b.title).toBe('One page')
  })

  it('names the file type behind a non-HTML link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response('%PDF-1.4', { headers: { 'content-type': 'application/pdf' } }),
      ),
    )
    const { fetchLinkPreview } = await import('@utils/linkPreview/index')

    const link = await fetchLinkPreview('https://files.test/cv-danny-smith.pdf')
    expect(link.status).toBe('non-html')
    expect(link.fileType).toBe('PDF')
    expect(link.displayTitle).toBe('Cv danny smith')
  })

  it('keeps showing a dead page as it last worked, marked dead', async () => {
    const url = 'https://rots.test/an-old-post'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('<title>While it worked</title>')),
    )
    const first = await (await import('@utils/linkPreview/index')).fetchLinkPreview(url)
    expect(first.title).toBe('While it worked')

    // Age the capture past its TTL, and give the module a fresh in-flight map.
    for (const file of cacheFiles()) {
      const full = path.join(cacheDir, file)
      const stored = JSON.parse(fs.readFileSync(full, 'utf-8'))
      if (stored.head.includes('While it worked')) {
        fs.writeFileSync(full, JSON.stringify({ ...stored, fetchedAt: 0 }))
      }
    }
    vi.resetModules()

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => page('<title>404 Not Found</title>', 404)),
    )
    const later = await (await import('@utils/linkPreview/index')).fetchLinkPreview(url)
    expect(later.status).toBe('dead')
    expect(later.title).toBe('While it worked')
  })
})
