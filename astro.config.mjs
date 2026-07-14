import { defineConfig, svgoOptimizer } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import { satteriMdxImports } from './src/lib/satteri-mdx-imports.mjs';
import { satteriReadingTime } from './src/lib/satteri-reading-time.mjs';
import { satteriFootnoteDetector } from './src/lib/satteri-footnote-detector.mjs';
import { satteriMarkdownPreview } from './src/lib/satteri-markdown-preview.mjs';
import { satteriTreeBlock } from './src/lib/satteri-tree-block.mjs';
import { satteriImageCaption } from './src/lib/satteri-image-caption.mjs';
import { satteriUnwrapImages } from './src/lib/satteri-unwrap-images.mjs';
import { satteriAutolinkHeadings } from './src/lib/satteri-autolink-headings.mjs';
import { satteriExternalLinks } from './src/lib/satteri-external-links.mjs';
import { satteriListDensity } from './src/lib/satteri-list-density.mjs';
import { satteriMermaid } from './src/lib/satteri-mermaid.mjs';
import { mermaidConfig, mermaidColorReplacements, mermaidFontCss } from './src/config/mermaid.js';
import { pagefind } from './src/lib/pagefind-integration.mjs';
import icon from 'astro-icon';
import { redirects } from './src/config/redirects.ts';

import { readFileSync } from 'fs';
import expressiveCode, { ExpressiveCodeTheme } from 'astro-expressive-code';

import react from '@astrojs/react';

// Load custom code theme
const codeThemeJson = readFileSync(
  new URL('./src/config/code-theme.json', import.meta.url),
  'utf-8',
);
const codeTheme = ExpressiveCodeTheme.fromJSONString(codeThemeJson);

// Auto-import every component the MDX barrel exports, so none of them ever
// need an explicit import in content. We derive the list from the barrel
// itself (single source of truth) and keep only PascalCase exports — this
// naturally excludes anything not meant to be hand-written as a `<Component>`.
// The list feeds the satteriMdxImports plugin registered in `markdown` below.
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
    mdx({ gfm: true, smartypants: true }),
    sitemap({
      filter: page =>
        !page.startsWith('https://danny.is/scratchpad') &&
        !page.startsWith('https://danny.is/redirects.json'),
    }),
    icon(),
    react(),
    pagefind(),
  ],
  markdown: {
    // syntaxHighlight stays at the markdown level; the processor reads it from
    // there (Sätteri wires it into its own highlight HAST plugin, respecting
    // excludeLangs).
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    // The full Sätteri plugin suite — every plugin lives in
    // src/lib/satteri-*.mjs with a unit suite in tests/unit. MDAST plugins run
    // first (array order), then MDAST→HAST conversion, then HAST plugins.
    // Expressive Code hooks in via its own Sätteri-aware HAST plugin, and the
    // built-in image-collection/heading-IDs passes run after ours.
    processor: satteri({
      mdastPlugins: [
        // Reading time first: it measures the document as parsed, before
        // satteriMdxImports queues its injected import statements.
        satteriReadingTime(),
        satteriFootnoteDetector(),
        satteriMdxImports({ componentNames: mdxComponentNames }),
        satteriMarkdownPreview(),
        satteriTreeBlock(),
      ],
      hastPlugins: [
        // Heading IDs must exist before the autolink plugin reads them. The
        // built-in heading-IDs pass runs AFTER user plugins (hardcoded), so we
        // register it here too — the officially supported idempotent pattern
        // (withastro/astro#17165); the trailing run respects our ids. MUST be
        // a factory: the plugin builds its slugger at construction, so a
        // shared instance would leak slug dedup across documents.
        () => satteriHeadingIdsPlugin(),
        satteriAutolinkHeadings(),
        satteriUnwrapImages(),
        satteriImageCaption(),
        satteriExternalLinks(),
        satteriListDensity(),
        satteriMermaid({
          mermaidConfig,
          colorReplacements: mermaidColorReplacements,
          css: mermaidFontCss,
        }),
      ],
    }),
  },
  redirects,
});
