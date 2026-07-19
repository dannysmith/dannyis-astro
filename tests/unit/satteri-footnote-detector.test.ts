import { describe, it, expect } from 'vitest'
import { markdownToHtml, mdxToJs } from 'satteri'
import { satteriFootnoteDetector } from '../../src/lib/satteri-footnote-detector.mjs'
import { astroData } from './satteri-helpers'

type Frontmatter = Record<string, unknown>

async function readMd(source: string): Promise<Frontmatter> {
  const data = astroData()
  markdownToHtml(source, { mdastPlugins: [satteriFootnoteDetector()], data })
  return data.astro.frontmatter
}

describe('satteriFootnoteDetector', () => {
  it('sets hasFootnotes true when a footnote definition exists', async () => {
    const frontmatter = await readMd('Text with a note.[^1]\n\n[^1]: The note itself.\n')
    expect(frontmatter.hasFootnotes).toBe(true)
  })

  it('sets hasFootnotes false (not undefined) when there are none', async () => {
    const frontmatter = await readMd('Just plain text.\n')
    expect(frontmatter.hasFootnotes).toBe(false)
  })

  it('ignores footnote-like syntax inside code blocks (AST-based)', async () => {
    const frontmatter = await readMd('```md\nText.[^1]\n\n[^1]: not a real footnote\n```\n')
    expect(frontmatter.hasFootnotes).toBe(false)
  })

  it('ignores footnote-like syntax inside inline code', async () => {
    const frontmatter = await readMd('Use `[^1]` for footnotes.\n')
    expect(frontmatter.hasFootnotes).toBe(false)
  })

  it('detects footnotes in MDX too', async () => {
    const data = astroData()
    mdxToJs('Text.[^a]\n\n[^a]: An MDX footnote.\n', {
      mdastPlugins: [satteriFootnoteDetector()],
      data,
    })
    expect(data.astro.frontmatter.hasFootnotes).toBe(true)
  })

  it('resets between documents (factory form)', async () => {
    const withNote = await readMd('Text.[^1]\n\n[^1]: Note.\n')
    const without = await readMd('No notes here.\n')
    expect(withNote.hasFootnotes).toBe(true)
    expect(without.hasFootnotes).toBe(false)
  })
})
