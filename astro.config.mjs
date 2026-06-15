import { defineConfig, svgoOptimizer } from 'astro/config';
import AutoImport from 'astro-auto-import';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeMermaid from 'rehype-mermaid';
import { mermaidConfig } from './src/config/mermaid.js';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkFootnoteDetector } from './src/lib/remark-footnote-detector.mjs';
import { remarkMarkdownPreview } from './src/lib/remark-markdown-preview.mjs';
import { remarkTreeBlock } from './src/lib/remark-tree-block.mjs';
import { remarkPageComponents } from './src/lib/remark-page-components.mjs';
import { rehypeListDensity } from './src/lib/rehype-list-density.mjs';
import icon from 'astro-icon';
import { redirects } from './src/config/redirects.ts';

import { readFileSync } from 'fs';
import expressiveCode, { ExpressiveCodeTheme } from 'astro-expressive-code';

import react from '@astrojs/react';

// Load custom code theme
const codeThemeJson = readFileSync(
  new URL('./src/config/code-theme.json', import.meta.url),
  'utf-8'
);
const codeTheme = ExpressiveCodeTheme.fromJSONString(codeThemeJson);

// Auto-import every component the MDX barrel exports, so none of them ever
// need an explicit import in content. We derive the list from the barrel
// itself (single source of truth) and keep only PascalCase exports — this
// naturally excludes anything not meant to be hand-written as a `<Component>`.
// Consequence: never explicitly import from `@components/mdx` in .mdx files —
// the auto-injected import would collide (duplicate declaration).
const mdxBarrelPath = './src/components/mdx/index.ts';
const mdxComponentNames = readFileSync(new URL(mdxBarrelPath, import.meta.url), 'utf-8')
  .match(/export\s*\{([^}]*)\}/)[1]
  .replace(/\/\/[^\n]*/g, '') // strip line comments (e.g. `// Typography`)
  .split(/[,\n]/)
  .map(name => name.trim())
  .filter(name => /^[A-Z][A-Za-z0-9]*$/.test(name));

// https://astro.build/config
export default defineConfig({
  site: 'https://danny.is',
  prefetch: true,
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
  },
  image: {
    // Used for all Markdown images; not configurable per-image
    // Used for all `<Image />` and `<Picture />` components unless overridden with a prop
    layout: 'constrained',
    responsiveStyles: true,
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  integrations: [
    expressiveCode({
      themes: [codeTheme],
      styleOverrides: {
        borderRadius: '0.2rem',
        frames: {
          frameBoxShadowCssValue: 'none',
        },
      },
    }),
    // Auto-import every MDX component (derived from the barrel above) so none
    // need an explicit import in content. MUST come before mdx() below.
    AutoImport({
      imports: [{ [mdxBarrelPath]: mdxComponentNames }],
    }),
    mdx({ gfm: true, smartypants: true }),
    sitemap({
      filter: page =>
        !page.startsWith('https://danny.is/scratchpad') &&
        !page.startsWith('https://danny.is/toolboxtest') &&
        !page.startsWith('https://danny.is/redirects.json'),
    }),
    icon(),
    react(),
  ],
  markdown: {
    // syntaxHighlight stays at the markdown level — `unified()` does not accept
    // it. The processor passes it through untouched. MDX v6 extends this
    // processor automatically (unlike v5, which only read the legacy arrays).
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    processor: unified({
      remarkPlugins: [
        remarkReadingTime,
        remarkFootnoteDetector,
        remarkMarkdownPreview,
        remarkTreeBlock,
        remarkPageComponents,
      ],
      rehypePlugins: [
        rehypeHeadingIds,
        rehypeAutolinkHeadings,
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
        [rehypeMermaid, { mermaidConfig }],
        rehypeListDensity,
      ],
    }),
  },
  redirects,
});
