import { describe, it, expect } from 'vitest';
import { markdownToHtml, mdxToJs } from 'satteri';
import { satteriMermaid } from '../../src/lib/satteri-mermaid.mjs';
import { mermaidConfig } from '../../src/config/mermaid.js';

const DIAGRAM = '```mermaid\ngraph TD;\n  A-->B;\n  A-->C;\n```\n';

/**
 * Render through the real pipeline. Rendering spins up a headless browser via
 * mermaid-isomorphic, so these tests are slower than the other plugin suites.
 */
async function render(source: string): Promise<string> {
  const result = await markdownToHtml(source, {
    hastPlugins: [satteriMermaid({ mermaidConfig })],
  });
  return result.html;
}

describe('satteriMermaid', () => {
  it('renders a mermaid fence to inline SVG at build time', { timeout: 30_000 }, async () => {
    const html = await render(DIAGRAM);
    expect(html).toContain('<svg');
    expect(html).not.toContain('<pre');
    // The site's CSS hooks onto the default mermaid id prefix.
    expect(html).toMatch(/<svg[^>]*id="mermaid-/);
  });

  it(
    'preserves SVG presentation attributes verbatim (raw splice)',
    { timeout: 30_000 },
    async () => {
      const html = await render(DIAGRAM);
      // The flowchart has arrowheads: marker-end must survive as a real SVG
      // attribute, not a camelCased hast round-trip casualty.
      expect(html).toContain('marker-end=');
      expect(html).not.toContain('markerEnd');
    },
  );

  it('leaves other code fences alone', { timeout: 30_000 }, async () => {
    const html = await render('```js\nconst a = 1;\n```\n');
    expect(html).toContain('<pre');
    expect(html).not.toContain('<svg');
  });

  it(
    'compiles to a Fragment with set:html in MDX (raw nodes would escape)',
    { timeout: 30_000 },
    async () => {
      const result = await mdxToJs(DIAGRAM, {
        hastPlugins: [satteriMermaid({ mermaidConfig })],
        data: {
          astro: {
            frontmatter: {},
            headings: [],
            localImagePaths: new Set<string>(),
            remoteImagePaths: new Set<string>(),
          },
        },
      });
      expect(result.code).toContain('"set:html"');
      expect(result.code).toContain('marker-end=');
      expect(result.code).not.toContain('<pre');
    },
  );

  it('fails the build on an invalid diagram', { timeout: 30_000 }, async () => {
    await expect(render('```mermaid\nnot a valid diagram %%%{\n```\n')).rejects.toThrow(
      /Mermaid rendering failed/,
    );
  });
});
