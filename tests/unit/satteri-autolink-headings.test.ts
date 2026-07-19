import { describe, it, expect } from 'vitest'
import { markdownToHtml } from 'satteri'
import { satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri'
import { satteriAutolinkHeadings } from '../../src/lib/satteri-autolink-headings.mjs'
import { astroData } from './satteri-helpers'

type Heading = { depth: number; slug: string; text: string }

/**
 * Render with the production plugin order: heading-IDs (factory, as in our
 * config), then autolink, then the trailing built-in heading-IDs run that
 * `@astrojs/markdown-satteri` always appends after user plugins.
 */
async function render(source: string) {
  const data = astroData()
  const result = await markdownToHtml(source, {
    hastPlugins: [
      () => satteriHeadingIdsPlugin(),
      satteriAutolinkHeadings(),
      () => satteriHeadingIdsPlugin(),
    ],
    data,
  })
  return { html: result.html, headings: (result.data.astro as { headings: Heading[] }).headings }
}

describe('satteriAutolinkHeadings', () => {
  it('appends an empty anchor pointing at the heading id', async () => {
    const { html } = await render('## My Section\n')
    expect(html).toMatch(/<h2 id="my-section">My Section<a href="#my-section"[^>]*><\/a><\/h2>/)
  })

  it('labels the anchor for screen readers', async () => {
    const { html } = await render('## My Section\n')
    expect(html).toContain('aria-label="Link to “My Section”"')
  })

  it('anchors every heading level h1-h6', async () => {
    const { html } = await render('# A\n\n## B\n\n### C\n\n#### D\n\n##### E\n\n###### F\n')
    expect(html.match(/<a href="#/g)).toHaveLength(6)
  })

  it('contributes no text to the heading (TOC text stays clean)', async () => {
    const { headings } = await render('## My Section\n\nBody.\n\n### Another One\n')
    expect(headings).toHaveLength(2)
    expect(headings[0]).toMatchObject({ depth: 2, slug: 'my-section', text: 'My Section' })
    expect(headings[1]).toMatchObject({ depth: 3, slug: 'another-one', text: 'Another One' })
  })

  it('does not duplicate headings metadata despite the double heading-IDs run', async () => {
    const { headings } = await render('## Only Heading\n')
    expect(headings).toHaveLength(1)
  })

  it('dedupes repeated heading text within one document', async () => {
    const { html } = await render('## Same\n\n## Same\n')
    expect(html).toContain('href="#same"')
    expect(html).toContain('href="#same-1"')
  })

  it('does not leak slug deduplication across documents (factory form)', async () => {
    const first = await render('## Fresh Slug\n')
    const second = await render('## Fresh Slug\n')
    expect(first.html).toContain('href="#fresh-slug"')
    expect(second.html).toContain('href="#fresh-slug"')
    expect(second.html).not.toContain('fresh-slug-1')
  })

  it('leaves headings without an id untouched', async () => {
    const result = markdownToHtml('## No Ids Here\n', {
      hastPlugins: [satteriAutolinkHeadings()],
      data: astroData(),
    })
    expect(result.html).not.toContain('<a')
  })
})
