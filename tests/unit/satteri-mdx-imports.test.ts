import { describe, it, expect } from 'vitest';
import { mdxToJs, markdownToHtml } from 'satteri';
import { satteriMdxImports } from '../../src/lib/satteri-mdx-imports.mjs';

const NAMES = ['Callout', 'Grid'];

const BARREL_IMPORT = /import\s*\{\s*Callout,\s*Grid\s*\}\s*from\s*['"]@components\/mdx['"]/;
const REMAPPING_IMPORT =
  /import\s*\{\s*MDX_COMPONENT_REMAPPING\s*\}\s*from\s*['"]@config\/mdx-components['"]/;
const COMPONENTS_EXPORT = /export\s+const\s+components\s*=\s*MDX_COMPONENT_REMAPPING/;

/** The `data.astro` bag as `@astrojs/mdx` seeds it before plugins run. */
function astroData(frontmatter: Record<string, unknown> = {}) {
  return {
    astro: {
      frontmatter,
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };
}

/**
 * Compile MDX the way `@astrojs/mdx` does: parsed frontmatter seeded into
 * `data.astro` before plugins run.
 */
async function compile(
  source: string,
  {
    frontmatter = {},
    componentNames = NAMES,
  }: { frontmatter?: Record<string, unknown>; componentNames?: string[] } = {},
): Promise<string> {
  const result = await mdxToJs(source, {
    mdastPlugins: [satteriMdxImports({ componentNames })],
    data: astroData(frontmatter),
  });
  return result.code;
}

describe('satteriMdxImports', () => {
  describe('auto-imports', () => {
    it('injects the barrel import into MDX', async () => {
      const code = await compile('# Hi\n\nText with <Callout>x</Callout>\n');
      expect(code).toMatch(BARREL_IMPORT);
    });

    it('injects exactly once per document', async () => {
      const code = await compile('# One\n\nTwo\n\nThree\n\n- four\n');
      expect(code.match(/@components\/mdx/g)).toHaveLength(1);
    });

    it('injects regardless of the first node type', async () => {
      for (const source of [
        '# heading first\n',
        'paragraph first\n',
        '<Callout>jsx first</Callout>\n',
        '```js\ncode first\n```\n',
        '> blockquote first\n',
        '- list first\n',
        '---\n\nthematic break first\n',
        "import Something from 'somewhere';\n\nesm first\n",
      ]) {
        const code = await compile(source);
        expect(code, source).toMatch(BARREL_IMPORT);
      }
    });

    it('resets between documents (factory form)', async () => {
      const plugin = satteriMdxImports({ componentNames: NAMES });
      for (const source of ['# Doc one\n', '# Doc two\n']) {
        const result = await mdxToJs(source, {
          mdastPlugins: [plugin],
          data: astroData(),
        });
        expect(result.code, source).toMatch(BARREL_IMPORT);
      }
    });

    it('skips the barrel import when componentNames is empty', async () => {
      const code = await compile('# Hi\n', { componentNames: [] });
      expect(code).not.toMatch(/@components\/mdx/);
    });

    it('does not inject into plain markdown', async () => {
      const result = await markdownToHtml('# Hi\n\nSome text.\n', {
        mdastPlugins: [satteriMdxImports({ componentNames: NAMES })],
        data: astroData(),
      });
      expect(result.html).not.toMatch(/@components\/mdx/);
    });
  });

  describe('Page.astro components export', () => {
    it('injects the remapping export for Page.astro-layout pages', async () => {
      const code = await compile('# Hi\n', {
        frontmatter: { layout: '@layouts/Page.astro' },
      });
      expect(code).toMatch(REMAPPING_IMPORT);
      expect(code).toMatch(COMPONENTS_EXPORT);
    });

    it('matches the layout by basename', async () => {
      const code = await compile('# Hi\n', {
        frontmatter: { layout: '../../layouts/Page.astro' },
      });
      expect(code).toMatch(COMPONENTS_EXPORT);
    });

    it('does not inject the export for other layouts', async () => {
      const code = await compile('# Hi\n', {
        frontmatter: { layout: '@layouts/Article.astro' },
      });
      expect(code).toMatch(BARREL_IMPORT);
      expect(code).not.toMatch(COMPONENTS_EXPORT);
    });

    it('does not inject the export without a layout', async () => {
      const code = await compile('# Hi\n');
      expect(code).not.toMatch(COMPONENTS_EXPORT);
    });

    it('respects a page-declared `export const components`', async () => {
      const code = await compile('export const components = { a: "b" };\n\n# Hi\n', {
        frontmatter: { layout: '@layouts/Page.astro' },
      });
      expect(code).toMatch(BARREL_IMPORT);
      expect(code).not.toMatch(REMAPPING_IMPORT);
      expect(code.match(/export\s+const\s+components/g)).toHaveLength(1);
    });

    it('respects a components export declared after the first block', async () => {
      const code = await compile('# Hi\n\nSome text.\n\nexport const components = { a: "b" };\n', {
        frontmatter: { layout: '@layouts/Page.astro' },
      });
      expect(code).not.toMatch(REMAPPING_IMPORT);
      expect(code.match(/export\s+const\s+components/g)).toHaveLength(1);
    });
  });
});
