import { describe, it, expect } from 'vitest'
import { markdownToHtml } from 'satteri'
import { satteriUnwrapImages } from '../../src/lib/satteri-unwrap-images.mjs'

/** Render markdown through the real pipeline with the plugin registered. */
async function render(source: string): Promise<string> {
  const result = await markdownToHtml(source, {
    hastPlugins: [satteriUnwrapImages()],
  })
  return result.html
}

describe('satteriUnwrapImages', () => {
  it('unwraps a paragraph whose only child is an image', async () => {
    const html = await render('![alt](https://example.com/a.jpg)\n')
    expect(html).toContain('<img')
    expect(html).not.toContain('<p>')
  })

  it('unwraps a paragraph containing only multiple images (a gallery)', async () => {
    const html = await render(
      '![one](https://example.com/a.jpg)\n![two](https://example.com/b.jpg)\n',
    )
    expect(html.match(/<img/g)).toHaveLength(2)
    expect(html).not.toContain('<p>')
  })

  it('unwraps a paragraph whose only child is a link wrapping an image', async () => {
    const html = await render('[![alt](https://example.com/a.jpg)](https://example.com)\n')
    expect(html).toContain('<a')
    expect(html).toContain('<img')
    expect(html).not.toContain('<p>')
  })

  it('does NOT unwrap a paragraph mixing text and an image', async () => {
    const html = await render('See ![alt](https://example.com/a.jpg) here\n')
    expect(html).toContain('<p>')
    expect(html).toContain('<img')
  })

  it('does NOT unwrap a paragraph with a link containing text and an image', async () => {
    const html = await render('[click ![alt](https://example.com/a.jpg)](https://example.com)\n')
    expect(html).toContain('<p>')
  })

  it('does NOT unwrap a text-only paragraph', async () => {
    const html = await render('just words\n')
    expect(html).toContain('<p>just words</p>')
  })

  it('leaves prose around an unwrapped image untouched', async () => {
    const html = await render(
      'Before paragraph.\n\n![alt](https://example.com/a.jpg)\n\nAfter paragraph.\n',
    )
    expect(html).toContain('<p>Before paragraph.</p>')
    expect(html).toContain('<p>After paragraph.</p>')
    expect(html).not.toMatch(/<p>\s*<img/)
  })
})
