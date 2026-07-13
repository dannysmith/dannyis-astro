import { defineConfig, svgoOptimizer } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { satteri } from '@astrojs/markdown-satteri';
import { satteriMdxImports } from './src/lib/satteri-mdx-imports.mjs';
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
        !page.startsWith('https://danny.is/toolboxtest') &&
        !page.startsWith('https://danny.is/redirects.json'),
    }),
    icon(),
    react(),
    pagefind(),
  ],
  markdown: {
    // syntaxHighlight stays at the markdown level; the processor reads it from
    // there (Sätteri wires it into its own highlight HAST plugin, respecting
    // excludeLangs). Heading IDs/slugs are native to @astrojs/markdown-satteri
    // (github-slugger), so no plugin is needed for them.
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    // Sätteri migration in progress (issue #132). The old unified() plugins in
    // src/lib/ are kept on disk (unloaded) for reference until the port is done.
    //
    // TODO — still to port to Sätteri:
    //   Task 4:
    //   - [ ] remark-markdown-preview  (```md preview fences → <markdown-preview>)
    //   - [ ] remark-tree-block        (```tree fences → <file-tree>)
    //   - [ ] remark-image-caption     (image title → caption prop on BasicImage)
    //   - [ ] rehype-unwrap-images     (strip <p> wrapper around lone images)
    //   - [ ] rehype-external-links    (target=_blank + rel on external links)
    //   - [ ] rehype-autolink-headings (append # anchor; must slug ids itself —
    //         the native heading-ids plugin always runs AFTER user hastPlugins)
    //   - [ ] rehype-list-density      (long-list-items class on prose-y lists)
    //   Task 5:
    //   - [ ] remark-reading-time      (minutesRead — approach TBD; mdx@7 DOES
    //         round-trip ctx.data.astro.frontmatter writes, unlike v6)
    //   - [ ] remark-footnote-detector (hasFootnotes — same)
    //   - [ ] mermaid                  (@xingwangzhe/satteri-mermaid)
    processor: satteri({
      mdastPlugins: [satteriMdxImports({ componentNames: mdxComponentNames })],
    }),
  },
  redirects,
});
