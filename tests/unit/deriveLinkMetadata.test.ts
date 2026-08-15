import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  derive,
  parseHead,
  clean,
  truncate,
  stripSiteName,
  titleFromUrl,
  normaliseUrl,
  displayUrl,
  unwrapArchiveUrl,
  type LinkCapture,
} from '@utils/deriveLinkMetadata'

/**
 * The fixtures are real `<head>`s captured from the pages listed on
 * /scratchpad, so these tests pin behaviour against markup sites actually
 * serve rather than markup we invented.
 */
function fixture(name: string): string {
  return fs.readFileSync(path.join('tests/fixtures/link-heads', `${name}.html`), 'utf-8')
}

function capture(overrides: Partial<LinkCapture> = {}): LinkCapture {
  return {
    url: 'https://example.com/post',
    finalUrl: 'https://example.com/post',
    httpStatus: 200,
    contentType: 'text/html',
    head: '',
    fetchedAt: Date.now(),
    outcome: 'fetched',
    captureVersion: 'v1',
    deriveVersion: 'v1',
    ...overrides,
  }
}

describe('parseHead', () => {
  it('reads meta tags regardless of attribute order or quoting', () => {
    const head = `
      <meta property="og:title" content="A">
      <meta content="B" property="og:description">
      <meta name='twitter:image' content='https://example.com/c.png'>
      <meta property=og:site_name content=Unquoted>`
    const { metas } = parseHead(head)
    expect(metas.get('og:title')).toBe('A')
    expect(metas.get('og:description')).toBe('B')
    expect(metas.get('twitter:image')).toBe('https://example.com/c.png')
    expect(metas.get('og:site_name')).toBe('Unquoted')
  })

  it('keeps values containing the other quote character', () => {
    // The original implementation matched content with ["']([^"']+)["'] and
    // returned "Wasn" for this input.
    const { metas } = parseHead(`<meta property="og:title" content="Wasn't it great">`)
    expect(metas.get('og:title')).toBe("Wasn't it great")
  })

  it('keeps the first of a repeated tag', () => {
    const head = `<meta property="og:image" content="first.png"><meta property="og:image" content="second.png">`
    expect(parseHead(head).metas.get('og:image')).toBe('first.png')
  })

  it('ignores empty content', () => {
    expect(parseHead(`<meta property="og:title" content="  ">`).metas.has('og:title')).toBe(false)
  })

  it('reads JSON-LD, including nodes inside an @graph', () => {
    const head = `
      <script type="application/ld+json">{"@graph":[{"headline":"From a graph"}]}</script>
      <script type="application/ld+json">{"description":"Plain"}</script>`
    const { jsonLd } = parseHead(head)
    expect(jsonLd).toHaveLength(2)
    expect(jsonLd[0].headline).toBe('From a graph')
  })

  it('survives invalid JSON-LD', () => {
    const head = `<script type="application/ld+json">{ not json }</script><title>Fine</title>`
    expect(() => parseHead(head)).not.toThrow()
    expect(parseHead(head).title).toBe('Fine')
  })
})

describe('clean', () => {
  it('decodes entities, strips tags and collapses whitespace', () => {
    expect(clean('A &lt;b&gt;bold&lt;/b&gt;\n   claim')).toBe('A bold claim')
  })

  it('decodes named, decimal and hex entities', () => {
    expect(clean('Tom &amp; Jerry &#8212; &#x201C;story&#x201D; &hellip;')).toBe(
      'Tom & Jerry — “story” …',
    )
  })

  it('returns null for empty input', () => {
    expect(clean('   ')).toBeNull()
  })
})

describe('truncate', () => {
  it('leaves short text alone', () => {
    expect(truncate('short', 20)).toBe('short')
  })

  it('cuts at a word boundary', () => {
    expect(truncate('one two three four five', 15)).toBe('one two three…')
  })

  it('cuts mid-word rather than losing most of the text', () => {
    // No space near the limit, so a word-boundary cut would throw most of it away.
    expect(truncate('supercalifragilistic', 10)).toBe('supercalif…')
    expect(truncate('one supercalifragilistic word', 20)).toBe('one supercalifragili…')
  })
})

describe('stripSiteName', () => {
  it('drops a suffix that names the site', () => {
    expect(stripSiteName("Aha! | Seth's Blog", "Seth's Blog", 'seths.blog')).toBe('Aha!')
  })

  it('drops a prefix that names the site', () => {
    expect(
      stripSiteName('GitHub - dannysmith/tauri-template: A template', 'GitHub', 'github.com'),
    ).toBe('dannysmith/tauri-template: A template')
  })

  it('keeps a suffix that does not name the site', () => {
    const title = 'That boolean should probably be something else | nicole@web'
    expect(stripSiteName(title, null, 'ntietz.com')).toBe(title)
  })

  it('matches the site name via the domain when og:site_name is absent', () => {
    expect(stripSiteName('A post — Interconnected', null, 'interconnected.org')).toBe('A post')
  })

  it('never strips down to nothing', () => {
    expect(stripSiteName('X | GitHub', 'GitHub', 'github.com')).toBe('X | GitHub')
  })
})

describe('titleFromUrl', () => {
  it('builds a title from the last path segment', () => {
    expect(
      titleFromUrl('https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing'),
    ).toBe('How to spot ai writing')
  })

  it('drops file extensions and date prefixes', () => {
    expect(titleFromUrl('https://example.com/2026-02-24-llms-are-monkey-paws.html')).toBe(
      'Llms are monkey paws',
    )
  })

  it('skips identifier-shaped segments', () => {
    expect(titleFromUrl('https://example.com/posts/a3f9b2c81d4e/2')).toBe('Posts')
  })

  it('skips message-ID segments and falls back to the path above them', () => {
    expect(
      titleFromUrl(
        'https://lore.kernel.org/linux-media/CAHk-=wi4zC+Ze8e+p3tMv8TtG_80KzsZ1syL9anBtmEh5Z40vg@mail.gmail.com/',
      ),
    ).toBe('Linux media')
  })

  it('drops document extensions too', () => {
    expect(titleFromUrl('https://danny.is/cv-danny-smith.pdf')).toBe('Cv danny smith')
  })

  it('is null when there is no usable path', () => {
    expect(titleFromUrl('https://example.com/')).toBeNull()
    expect(titleFromUrl('not-a-url')).toBeNull()
  })
})

describe('normaliseUrl', () => {
  it('strips tracking params and fragments but keeps real query params', () => {
    expect(normaliseUrl('https://example.com/post?utm_source=x&id=7&fbclid=abc#section')).toBe(
      'https://example.com/post?id=7',
    )
  })

  it('settles trailing-slash differences onto one key', () => {
    expect(normaliseUrl('https://example.com')).toBe(normaliseUrl('https://example.com/'))
  })

  it('keeps a path as-is', () => {
    expect(normaliseUrl('https://example.com/a/b')).toBe('https://example.com/a/b')
  })

  it('returns malformed input unchanged', () => {
    expect(normaliseUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('displayUrl', () => {
  it('drops the scheme, www and tracking params', () => {
    expect(displayUrl('https://www.karlbode.com/post/?utm_source=the-index')).toBe(
      'karlbode.com/post',
    )
  })

  it('shortens a long path but keeps the slug', () => {
    const result = displayUrl(
      'https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing',
      40,
    )
    expect(result?.startsWith('economist.com/…/')).toBe(true)
    expect(result?.length).toBeLessThanOrEqual(41)
  })

  it('is just the host for a root URL', () => {
    expect(displayUrl('https://example.com/')).toBe('example.com')
  })
})

describe('unwrapArchiveUrl', () => {
  it('unwraps archive.ph', () => {
    expect(
      unwrapArchiveUrl(
        'https://archive.ph/20260811223012/https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing',
      ),
    ).toBe('https://www.economist.com/culture/2026/07/30/how-to-spot-ai-writing')
  })

  it('unwraps the Wayback Machine, including flagged timestamps', () => {
    expect(unwrapArchiveUrl('https://web.archive.org/web/2026id_/https://example.com/a')).toBe(
      'https://example.com/a',
    )
  })

  it('restores a scheme the archive dropped', () => {
    expect(unwrapArchiveUrl('https://archive.is/20260101/example.com/a')).toBe(
      'https://example.com/a',
    )
  })

  it('is null for ordinary URLs and for archive home pages', () => {
    expect(unwrapArchiveUrl('https://example.com/a')).toBeNull()
    expect(unwrapArchiveUrl('https://archive.ph/')).toBeNull()
  })
})

describe('derive — status and fallbacks', () => {
  it('is ok when a fetched page has a title', () => {
    expect(derive(capture({ head: '<title>Hello</title>' })).status).toBe('ok')
  })

  it('is thin when a fetched page has nothing usable', () => {
    expect(derive(capture({ head: '<p>hi</p>' })).status).toBe('thin')
  })

  it.each(['blocked', 'dead', 'unreachable', 'non-html'] as const)('passes %s through', outcome => {
    expect(derive(capture({ outcome })).status).toBe(outcome)
  })

  it('falls back to a URL-derived displayTitle when blocked', () => {
    const result = derive(
      capture({
        outcome: 'blocked',
        url: 'https://medium.com/@dannysmith/breaking-down-problems-f10269f4ccd5',
        finalUrl: 'https://medium.com/@dannysmith/breaking-down-problems-f10269f4ccd5',
      }),
    )
    expect(result.title).toBeNull()
    expect(result.displayTitle).toBe('Breaking down problems f10269f4ccd5')
  })

  it('falls back to the domain when the URL has no usable path', () => {
    expect(
      derive(
        capture({ outcome: 'dead', url: 'https://example.com/', finalUrl: 'https://example.com/' }),
      ).displayTitle,
    ).toBe('example.com')
  })

  it('falls back to the raw string for a malformed URL', () => {
    expect(
      derive(capture({ outcome: 'unreachable', url: 'not-a-url', finalUrl: 'not-a-url' }))
        .displayTitle,
    ).toBe('not-a-url')
  })

  it('exposes contentType only for non-html captures', () => {
    expect(
      derive(capture({ outcome: 'non-html', contentType: 'application/pdf' })).contentType,
    ).toBe('application/pdf')
    expect(derive(capture({ contentType: 'text/html' })).contentType).toBeNull()
  })

  it('reports the URL as authored alongside the final one', () => {
    const result = derive(
      capture({ url: 'https://a.test/x', finalUrl: 'https://b.test/y', head: '<title>T</title>' }),
    )
    expect(result.url).toBe('https://a.test/x')
    expect(result.finalUrl).toBe('https://b.test/y')
    expect(result.domain).toBe('b.test')
  })

  it('strips a leading www. only', () => {
    expect(derive(capture({ finalUrl: 'https://www.example.com/a' })).domain).toBe('example.com')
    expect(derive(capture({ finalUrl: 'https://wwwibble.com/a' })).domain).toBe('wwwibble.com')
  })
})

describe('derive — selection rules', () => {
  it('prefers the specific <title> when og:title is just the site name', () => {
    const head = `
      <meta property="og:site_name" content="Example Blog">
      <meta property="og:title" content="Example Blog">
      <title>A specific post | Example Blog</title>`
    expect(derive(capture({ head })).title).toBe('A specific post')
  })

  it('prefers the fuller of two descriptions when one is a truncation', () => {
    const head = `
      <title>T</title>
      <meta property="og:description" content="The quick brown fox jumps over the lazy…">
      <meta name="description" content="The quick brown fox jumps over the lazy dog and keeps going.">`
    expect(derive(capture({ head })).description).toBe(
      'The quick brown fox jumps over the lazy dog and keeps going.',
    )
  })

  it('drops a description that merely repeats the title', () => {
    const head = `<title>Same words</title><meta property="og:description" content="Same words">`
    expect(derive(capture({ head })).description).toBeNull()
  })

  it('caps a very long description', () => {
    const head = `<title>T</title><meta property="og:description" content="${'word '.repeat(200)}">`
    const description = derive(capture({ head })).description
    expect(description?.length).toBeLessThanOrEqual(301)
    expect(description?.endsWith('…')).toBe(true)
  })

  it('resolves a relative og:image against the final URL', () => {
    const head = `<title>T</title><meta property="og:image" content="/static/og.png">`
    expect(derive(capture({ head, finalUrl: 'https://example.com/blog/post' })).image).toBe(
      'https://example.com/static/og.png',
    )
  })

  it('falls back through the image candidates', () => {
    const head = `<title>T</title><meta property="og:image:secure_url" content="https://example.com/secure.png">`
    expect(derive(capture({ head })).image).toBe('https://example.com/secure.png')
  })

  it('rejects an image with an unfetchable protocol', () => {
    const head = `<title>T</title><meta property="og:image" content="data:image/png;base64,AAA">`
    expect(derive(capture({ head })).image).toBeNull()
  })

  it('reads title, description and image from JSON-LD when there are no og: tags', () => {
    const head = `<script type="application/ld+json">
      {"headline":"From JSON-LD","description":"A description","image":{"url":"https://example.com/j.png"}}
    </script>`
    const result = derive(capture({ head }))
    expect(result.title).toBe('From JSON-LD')
    expect(result.description).toBe('A description')
    expect(result.image).toBe('https://example.com/j.png')
  })
})

describe('derive — real captured heads', () => {
  it('drops the redundant "GitHub - " prefix', () => {
    const result = derive(
      capture({
        head: fixture('github-repo'),
        finalUrl: 'https://github.com/dannysmith/tauri-template',
      }),
    )
    expect(result.title?.startsWith('dannysmith/tauri-template:')).toBe(true)
    expect(result.title).not.toContain('GitHub - ')
    expect(result.image).toContain('opengraph.githubassets.com')
    expect(result.status).toBe('ok')
  })

  it('decodes a hex-escaped apostrophe (&#x27;)', () => {
    expect(derive(capture({ head: fixture('bricolage-entity-apostrophe') })).title).toBe(
      "Essential Until It Wasn't",
    )
  })

  it('decodes escaped quotes and keeps a raw apostrophe in the same value', () => {
    const result = derive(
      capture({
        head: fixture('perevillega-entity-quotes'),
        finalUrl: 'https://perevillega.com/posts/2026-02-24-llms-are-monkey-paws/',
      }),
    )
    // The author's name is stripped as the site name, matched via the domain.
    expect(result.title).toBe('Stop Calling LLMs "Junior Developers." They\'re Monkey Paws.')
  })

  it('decodes a decimal-escaped apostrophe in a description', () => {
    const result = derive(capture({ head: fixture('seths-blog-entity-suffix') }))
    expect(result.title).toBe('Aha!')
    expect(result.description).toContain('It’s about the pedagogy')
  })

  it('falls back to <title> when there are no og: tags', () => {
    const result = derive(capture({ head: fixture('ntietz-no-og') }))
    expect(result.title).toBe('That boolean should probably be something else | nicole@web')
    expect(result.description).toBeNull()
  })

  it('handles an uppercase <TITLE> in ancient HTML', () => {
    const result = derive(capture({ head: fixture('cern-ancient-html') }))
    expect(result.title).toBe('The World Wide Web project')
  })

  it('makes a relative og:image absolute', () => {
    const result = derive(
      capture({ head: fixture('oilwell-relative-image'), finalUrl: 'https://oilwell.app/' }),
    )
    // "Oilwell - " goes the way of "GitHub - ": the domain line already says it.
    expect(result.title).toBe('Meditate through the meltdown')
    expect(result.image).toBe('https://oilwell.app/preview/Oilwell-OG-5.jpg')
  })

  it('ignores metadata from a 404 error page', () => {
    // GitHub's 404 serves a full head advertising "Build software better,
    // together" — using it would produce a confident, wrong card.
    const result = derive(
      capture({
        head: fixture('github-404-page'),
        outcome: 'dead',
        url: 'https://github.com/dannysmith/this-repo-does-not-exist',
        finalUrl: 'https://github.com/dannysmith/this-repo-does-not-exist',
      }),
    )
    expect(result.status).toBe('dead')
    expect(result.title).toBeNull()
    expect(result.image).toBeNull()
    expect(result.displayTitle).toBe('This repo does not exist')
  })
})
