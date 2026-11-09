import { describe, it, expect } from 'vitest'
import { absoluteUrls, postMarkdown } from '../../src/utils/content-markdown'

type Entry = Parameters<typeof postMarkdown>[0]
const entry = (data: Record<string, unknown>, body = '', collection = 'articles') =>
  ({
    id: 'foo',
    collection,
    filePath: `src/content/${collection}/foo.mdx`,
    data: { title: 'Foo', pubDate: new Date('2026-06-18'), ...data },
    body,
  }) as unknown as Entry

describe('postMarkdown', () => {
  it('puts the byline and llms.txt pointer under the title, then the body without imports', () => {
    const body = "import { Callout } from '@components/mdx/index'\n\nHello [there](/notes/bar)."
    expect(postMarkdown(entry({ updatedDate: new Date('2026-07-01') }, body), '/writing/foo/'))
      .toBe(`# Foo

By Danny Smith · Published 2026-06-18 · Updated 2026-07-01 · <https://danny.is/writing/foo/>

> For the complete site index, see [llms.txt](https://danny.is/llms.txt)

Hello [there](https://danny.is/notes/bar).
`)
  })

  it("links a note's source and an external article's real home", () => {
    const note = postMarkdown(
      entry({ sourceURL: 'https://example.com/a' }, '', 'notes'),
      '/notes/foo/',
    )
    expect(note).toContain('\n\nSource: <https://example.com/a>\n')
    const medium = postMarkdown(entry({ redirectURL: 'https://medium.com/x' }), '/writing/foo/')
    expect(medium).toContain('\n\nPublished at <https://medium.com/x>\n')
  })
})

const SITE = 'https://danny.is'
const FILE = 'src/content/articles/2026-06-19-post.mdx'
const ASSETS: Record<string, string> = {
  'src/assets/articles/shot.png': '/_astro/shot.abc123.png',
}
const resolveAsset = (path: string) => ASSETS[path]
const rewrite = (body: string) => absoluteUrls(body, FILE, SITE, resolveAsset)

describe('absoluteUrls', () => {
  it('points relative images in src/assets at their built files', () => {
    expect(rewrite('![A shot](../../assets/articles/shot.png "Caption")')).toBe(
      '![A shot](https://danny.is/_astro/shot.abc123.png "Caption")',
    )
  })

  it('leaves relative URLs that are not known assets alone', () => {
    expect(rewrite('![Missing](./nope.png)')).toBe('![Missing](./nope.png)')
  })

  it('makes root-relative links absolute', () => {
    expect(rewrite('See [this](/writing/foo) and [that](/notes/bar/#x).')).toBe(
      'See [this](https://danny.is/writing/foo) and [that](https://danny.is/notes/bar/#x).',
    )
  })

  it('rewrites reference-style definitions', () => {
    expect(rewrite('[ref]: /uploads/a.png')).toBe('[ref]: https://danny.is/uploads/a.png')
  })

  it('leaves footnote definitions alone', () => {
    expect(rewrite('[^1]: /usr/bin is where it lives')).toBe('[^1]: /usr/bin is where it lives')
  })

  it('rewrites href and src attributes in HTML and JSX', () => {
    expect(rewrite('<a href="/toolbox">x</a> <img src=\'/uploads/a.png\' />')).toBe(
      '<a href="https://danny.is/toolbox">x</a> <img src=\'https://danny.is/uploads/a.png\' />',
    )
  })

  it('leaves absolute, protocol-relative and fragment URLs alone', () => {
    const body = '[a](https://example.com/x) [b](//cdn.example.com/y) [c](#heading)'
    expect(rewrite(body)).toBe(body)
  })

  it('leaves fenced and inline code exactly as written', () => {
    const body = [
      'Before [link](/a).',
      '',
      '```html',
      '<link rel="describedby" href="/llms.txt">',
      '[md](/b)',
      '```',
      '',
      'Inline `[c](/c)` and after [link](/d).',
    ].join('\n')
    expect(rewrite(body)).toBe(
      [
        'Before [link](https://danny.is/a).',
        '',
        '```html',
        '<link rel="describedby" href="/llms.txt">',
        '[md](/b)',
        '```',
        '',
        'Inline `[c](/c)` and after [link](https://danny.is/d).',
      ].join('\n'),
    )
  })

  it('handles longer fences that contain shorter ones', () => {
    const body = '````md\n```\n[x](/x)\n```\n````\n[y](/y)'
    expect(rewrite(body)).toBe('````md\n```\n[x](/x)\n```\n````\n[y](https://danny.is/y)')
  })
})
