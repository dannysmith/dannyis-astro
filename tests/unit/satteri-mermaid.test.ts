import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { markdownToHtml, mdxToJs } from 'satteri'
import { satteriMermaid } from '../../src/lib/satteri-mermaid.mjs'
import {
  mermaidConfig,
  mermaidColorReplacements,
  mermaidFontCss,
} from '../../src/config/mermaid.js'
import { astroData } from './satteri-helpers'

const DIAGRAM = '```mermaid\ngraph TD;\n  A-->B;\n  A-->C;\n```\n'

const pluginOptions = {
  mermaidConfig,
  colorReplacements: mermaidColorReplacements,
  css: mermaidFontCss,
}

/**
 * Render through the real pipeline with the production options. Rendering
 * spins up a headless browser via mermaid-isomorphic, so these tests are
 * slower than the other plugin suites.
 */
async function render(source: string): Promise<string> {
  const result = await markdownToHtml(source, {
    hastPlugins: [satteriMermaid(pluginOptions)],
  })
  return result.html
}

describe('satteriMermaid', () => {
  it('has a _mermaid.css definition for every replacement variable', () => {
    const css = readFileSync(new URL('../../src/styles/_mermaid.css', import.meta.url), 'utf8')
    for (const [, replacement] of mermaidColorReplacements) {
      const [, name] = replacement.match(/^var\((--mermaid-[a-z-]+),/)!
      expect(css, `${name} is missing from _mermaid.css`).toContain(`${name}:`)
    }
  })

  it('renders a mermaid fence to inline SVG at build time', { timeout: 30_000 }, async () => {
    const html = await render(DIAGRAM)
    expect(html).toContain('<svg')
    expect(html).not.toContain('<pre')
    // The site's CSS hooks onto the default mermaid id prefix.
    expect(html).toMatch(/<svg[^>]*id="mermaid-/)
  })

  it(
    'preserves SVG presentation attributes verbatim (raw splice)',
    { timeout: 30_000 },
    async () => {
      const html = await render(DIAGRAM)
      // The flowchart has arrowheads: marker-end must survive as a real SVG
      // attribute, not a camelCased hast round-trip casualty.
      expect(html).toContain('marker-end=')
      expect(html).not.toContain('markerEnd')
    },
  )

  it(
    'rewrites baked sentinel colors to --mermaid-* CSS variables',
    { timeout: 30_000 },
    async () => {
      const html = await render(DIAGRAM)
      expect(html).toContain('var(--mermaid-')
      // Every sentinel must be gone from the SVG — except as a var() fallback.
      // The fallback may itself contain one paren pair (e.g. an rgba() value).
      const withoutVars = html.replace(/var\(--mermaid-(?:[^()]|\([^()]*\))*\)/g, '')
      for (const [sentinel] of mermaidColorReplacements) {
        expect(withoutVars).not.toContain(sentinel)
      }
    },
  )

  it('renders labels in the site UI font, not arial', { timeout: 30_000 }, async () => {
    const html = await render(DIAGRAM)
    expect(html).toContain('Figtree')
    expect(html).not.toMatch(/font-family:\s*arial/i)
  })

  it('leaves other code fences alone', { timeout: 30_000 }, async () => {
    const html = await render('```js\nconst a = 1;\n```\n')
    expect(html).toContain('<pre')
    expect(html).not.toContain('<svg')
  })

  it(
    'compiles to a Fragment with set:html in MDX (raw nodes would escape)',
    { timeout: 30_000 },
    async () => {
      const result = await mdxToJs(DIAGRAM, {
        hastPlugins: [satteriMermaid({ mermaidConfig })],
        data: astroData(),
      })
      expect(result.code).toContain('"set:html"')
      expect(result.code).toContain('marker-end=')
      expect(result.code).not.toContain('<pre')
    },
  )

  it('fails the build on an invalid diagram', { timeout: 30_000 }, async () => {
    await expect(render('```mermaid\nnot a valid diagram %%%{\n```\n')).rejects.toThrow(
      /Mermaid rendering failed/,
    )
  })
})
