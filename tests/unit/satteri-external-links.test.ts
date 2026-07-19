import { describe, it, expect } from 'vitest'
import { markdownToHtml } from 'satteri'
import { satteriExternalLinks } from '../../src/lib/satteri-external-links.mjs'

/** Render markdown through the real pipeline with the plugin registered. */
async function render(source: string): Promise<string> {
  const result = markdownToHtml(source, {
    hastPlugins: [satteriExternalLinks()],
  })
  return result.html
}

describe('satteriExternalLinks', () => {
  it('adds target and rel to an external http link', async () => {
    const html = await render('[example](http://example.com)\n')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('adds target and rel to an external https link', async () => {
    const html = await render('[example](https://example.com/page)\n')
    expect(html).toContain('target="_blank"')
  })

  it('leaves absolute danny.is links alone (SmartLink semantics)', async () => {
    const html = await render('[me](https://danny.is/writing)\n')
    expect(html).not.toContain('target=')
    expect(html).not.toContain('rel=')
  })

  it('leaves danny.is subdomain links alone', async () => {
    const html = await render('[video](https://v.danny.is/some-video)\n')
    expect(html).not.toContain('target=')
  })

  it('treats an external host with danny.is in the path as external', async () => {
    const html = await render('[ext](https://example.com/danny.is-article)\n')
    expect(html).toContain('target="_blank"')
  })

  it('leaves relative internal links alone', async () => {
    const html = await render('[writing](/writing)\n')
    expect(html).not.toContain('target=')
  })

  it('leaves same-page anchor links alone', async () => {
    const html = await render('[section](#section)\n')
    expect(html).not.toContain('target=')
  })

  it('leaves mailto links alone', async () => {
    const html = await render('[email](mailto:hi@danny.is)\n')
    expect(html).not.toContain('target=')
  })

  it('handles multiple links independently', async () => {
    const html = await render('[ext](https://example.com) and [int](/notes)\n')
    const ext = html.match(/<a[^>]*href="https:\/\/example\.com"[^>]*>/)?.[0]
    const int = html.match(/<a[^>]*href="\/notes"[^>]*>/)?.[0]
    expect(ext).toContain('target="_blank"')
    expect(int).not.toContain('target=')
  })
})
