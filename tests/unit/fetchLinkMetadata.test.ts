import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  derive,
  metaContent,
  titleTag,
  iconHref,
  decodeEntities,
  readHead,
  type LinkCapture,
} from '@utils/fetchLinkMetadata'

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

describe('metaContent', () => {
  it('reads a value regardless of attribute order', () => {
    expect(metaContent(`<meta property="og:title" content="A">`, ['og:title'])).toBe('A')
    expect(metaContent(`<meta content="B" property="og:title">`, ['og:title'])).toBe('B')
  })

  it('accepts both property= and name= for the same key', () => {
    expect(metaContent(`<meta name="og:title" content="named">`, ['og:title'])).toBe('named')
    expect(metaContent(`<meta property="twitter:title" content="prop">`, ['twitter:title'])).toBe(
      'prop',
    )
  })

  it('tolerates single and double quotes', () => {
    expect(metaContent(`<meta property='og:title' content='Single'>`, ['og:title'])).toBe('Single')
  })

  it('keeps values containing the other quote character', () => {
    // The old implementation matched content with ["']([^"']+)["'] and returned
    // "Wasn" for this input.
    expect(metaContent(`<meta property="og:title" content="Wasn't it great">`, ['og:title'])).toBe(
      "Wasn't it great",
    )
    expect(metaContent(`<meta property='og:title' content='He said "hi"'>`, ['og:title'])).toBe(
      'He said "hi"',
    )
  })

  it('tries names in order and skips empty values', () => {
    const head = `<meta property="og:title" content=""><meta name="twitter:title" content="fallback">`
    expect(metaContent(head, ['og:title', 'twitter:title'])).toBe('fallback')
  })

  it('returns null when no name matches', () => {
    expect(metaContent(`<meta property="og:site_name" content="X">`, ['og:title'])).toBeNull()
  })

  it('decodes entities in the value', () => {
    expect(
      metaContent(`<meta property="og:title" content="Wasn&#x27;t &amp; won&#39;t">`, ['og:title']),
    ).toBe("Wasn't & won't")
  })
})

describe('titleTag', () => {
  it('reads and decodes the title', () => {
    expect(titleTag(`<title>Tom &amp; Jerry &#8212; a &#x201C;story&#x201D;</title>`)).toBe(
      'Tom & Jerry — a “story”',
    )
  })

  it('does not double-decode', () => {
    expect(titleTag(`<title>&amp;amp;</title>`)).toBe('&amp;')
  })

  it('returns null for an empty or missing title', () => {
    expect(titleTag(`<title>   </title>`)).toBeNull()
    expect(titleTag(`<p>no head here</p>`)).toBeNull()
  })
})

describe('iconHref', () => {
  it('matches both rel="icon" and rel="shortcut icon"', () => {
    expect(
      iconHref(`<link rel="icon" href="https://example.com/a.ico">`, 'https://example.com/'),
    ).toBe('https://example.com/a.ico')
    expect(
      iconHref(
        `<link rel="shortcut icon" href="https://example.com/b.ico">`,
        'https://example.com/',
      ),
    ).toBe('https://example.com/b.ico')
  })

  it('resolves relative hrefs against the page URL', () => {
    expect(iconHref(`<link rel="icon" href="/favicon.ico">`, 'https://example.com/blog/post')).toBe(
      'https://example.com/favicon.ico',
    )
  })

  it('falls through to a later icon when an earlier one has no href', () => {
    const head = `<link rel="icon"><link rel="shortcut icon" href="https://example.com/good.ico">`
    expect(iconHref(head, 'https://example.com/')).toBe('https://example.com/good.ico')
  })

  it('returns null when there is no icon', () => {
    expect(iconHref(`<title>x</title>`, 'https://example.com/')).toBeNull()
  })
})

describe('decodeEntities', () => {
  it('decodes named, decimal and hex forms', () => {
    expect(decodeEntities('Tom &amp; Jerry &#39; &#34; &#x27; &lt;3')).toBe(`Tom & Jerry ' " ' <3`)
  })

  it('leaves unknown entities alone', () => {
    expect(decodeEntities('&notarealentity; &copy;')).toBe('&notarealentity; &copy;')
  })

  it('ignores out-of-range code points', () => {
    expect(decodeEntities('a&#1114112;b')).toBe('ab')
  })
})

describe('readHead', () => {
  /** A response whose body arrives in exactly these chunks. */
  function streamed(chunks: (string | Uint8Array)[], contentType = 'text/html'): Response {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
        }
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'content-type': contentType } })
  }

  it('stops at </head> and drops the body', async () => {
    const html = '<head><title>Keep</title></head><body><h1>Discard</h1></body>'
    const head = await readHead(streamed([html]))
    expect(head).toContain('Keep')
    expect(head).not.toContain('Discard')
  })

  it('finds a </head> split across two chunks', async () => {
    const head = await readHead(streamed(['<head><title>Split</title></he', 'ad><body>no</body>']))
    expect(titleTag(head)).toBe('Split')
    expect(head).not.toContain('body')
  })

  it('finds a </head> split one byte at a time', async () => {
    const html = '<head><title>Byte</title></head><body>no</body>'
    const head = await readHead(streamed([...html]))
    expect(titleTag(head)).toBe('Byte')
    expect(head).not.toContain('body')
  })

  it('matches a closing tag in any case, with whitespace', async () => {
    const head = await readHead(streamed(['<head><title>Loud</title></HEAD  ><body>no</body>']))
    expect(titleTag(head)).toBe('Loud')
    expect(head).not.toContain('body')
  })

  it('returns what it has when there is no </head> at all', async () => {
    const head = await readHead(streamed(['<title>Unclosed</title><p>rest of page</p>']))
    expect(titleTag(head)).toBe('Unclosed')
  })

  it('decodes a non-UTF-8 body using the Content-Type charset', async () => {
    // windows-1252 0x92 is a right single quote; as UTF-8 it is invalid.
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('<title>It'),
      0x92,
      ...new TextEncoder().encode('s here</title></head>'),
    ])
    const head = await readHead(streamed([bytes], 'text/html; charset=windows-1252'))
    expect(titleTag(head)).toBe('It’s here')
  })

  it('falls back to a <meta charset> when the header does not say', async () => {
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('<meta charset="windows-1252"><title>It'),
      0x92,
      ...new TextEncoder().encode('s here</title></head>'),
    ])
    const head = await readHead(streamed([bytes], 'text/html'))
    expect(titleTag(head)).toBe('It’s here')
  })
})

describe('derive — status', () => {
  it('is ok when a fetched page has a title', () => {
    expect(derive(capture({ head: '<title>Hello</title>' })).status).toBe('ok')
  })

  it('is thin when a fetched page has nothing usable', () => {
    expect(derive(capture({ head: '<p>hi</p>' })).status).toBe('thin')
  })

  it.each(['blocked', 'dead', 'unreachable', 'non-html'] as const)('passes %s through', outcome => {
    expect(derive(capture({ outcome })).status).toBe(outcome)
  })

  it('exposes contentType only for non-html captures', () => {
    expect(
      derive(capture({ outcome: 'non-html', contentType: 'application/pdf' })).contentType,
    ).toBe('application/pdf')
    expect(derive(capture({ contentType: 'text/html' })).contentType).toBeNull()
  })
})

describe('derive — domain', () => {
  it('strips a leading www. only', () => {
    expect(derive(capture({ finalUrl: 'https://www.example.com/a' })).domain).toBe('example.com')
    expect(derive(capture({ finalUrl: 'https://wwwibble.com/a' })).domain).toBe('wwwibble.com')
  })

  it('is null for a malformed URL', () => {
    expect(derive(capture({ url: 'not-a-url', finalUrl: 'not-a-url' })).domain).toBeNull()
  })

  it('reports the URL as authored alongside the final one', () => {
    const result = derive(
      capture({ url: 'https://a.test/x', finalUrl: 'https://b.test/y', head: '<title>T</title>' }),
    )
    expect(result.url).toBe('https://a.test/x')
    expect(result.finalUrl).toBe('https://b.test/y')
  })
})

describe('derive — real captured heads', () => {
  it('reads a GitHub repo page', () => {
    const result = derive(
      capture({
        head: fixture('github-repo'),
        finalUrl: 'https://github.com/dannysmith/tauri-template',
      }),
    )
    expect(result.status).toBe('ok')
    expect(result.title).toContain('dannysmith/tauri-template')
    expect(result.description).toContain('production-ready template')
    expect(result.image).toContain('opengraph.githubassets.com')
  })

  it('decodes a hex-escaped apostrophe (&#x27;)', () => {
    const result = derive(capture({ head: fixture('bricolage-entity-apostrophe') }))
    expect(result.title).toBe("Essential Until It Wasn't")
  })

  it('decodes escaped quotes and keeps a raw apostrophe in the same value', () => {
    const result = derive(capture({ head: fixture('perevillega-entity-quotes') }))
    expect(result.title).toBe(
      'Stop Calling LLMs "Junior Developers." They\'re Monkey Paws. | Pere Villega',
    )
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
    expect(result.image).toBeNull()
  })

  it('handles an uppercase <TITLE> in ancient HTML', () => {
    const result = derive(capture({ head: fixture('cern-ancient-html') }))
    expect(result.title).toBe('The World Wide Web project')
    expect(result.status).toBe('ok')
  })

  it('reads a page whose only image is a root-relative path', () => {
    const result = derive(capture({ head: fixture('oilwell-relative-image') }))
    expect(result.title).toBe('Oilwell - Meditate through the meltdown')
    expect(result.image).toBe('/preview/Oilwell-OG-5.jpg')
  })

  it('ignores metadata from a 404 error page', () => {
    // GitHub's 404 serves a full head advertising "Build software better,
    // together" — using it would produce a confident, wrong card.
    const result = derive(capture({ head: fixture('github-404-page'), outcome: 'dead' }))
    expect(result.status).toBe('dead')
    expect(result.title).toBeNull()
    expect(result.description).toBeNull()
    expect(result.image).toBeNull()
  })
})
