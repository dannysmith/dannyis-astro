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
import { remarkImageCaption } from './src/lib/remark-image-caption.mjs';
import { rehypeListDensity } from './src/lib/rehype-list-density.mjs';
import { rehypeUnwrapImages } from './src/lib/rehype-unwrap-images.mjs';
import icon from 'astro-icon';
import { redirects } from './src/config/redirects.ts';

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIndex } from 'pagefind';
import sirv from 'sirv';
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
// Consequence: never explicitly import from `@components/mdx` in .mdx files —
// the auto-injected import would collide (duplicate declaration).
const mdxBarrelPath = './src/components/mdx/index.ts';
const mdxComponentNames = readFileSync(new URL(mdxBarrelPath, import.meta.url), 'utf-8')
  .match(/export\s*\{([^}]*)\}/)[1]
  .replace(/\/\/[^\n]*/g, '') // strip line comments (e.g. `// Typography`)
  .split(/[,\n]/)
  .map(name => name.trim())
  .filter(name => /^[A-Z][A-Za-z0-9]*$/.test(name));

// Inline Pagefind integration (Phase 2 of the Cmd+K work). Rather than depend on
// `astro-pagefind`, we crib its two-hook pattern so the whole thing lives here:
//
//   • astro:build:done  — run Pagefind's Node indexer over the freshly-built `dist/`
//     and emit `dist/pagefind/` (the WASM + sharded index the browser fetches). This
//     travels with `astro build` on any host, so it works in our CI-then-Vercel-prebuilt
//     pipeline where the index must exist in `dist/` before CI copies it to the deploy.
//
//   • astro:server:setup — in `bun run dev` there is no build, so serve a *previously
//     built* `dist/pagefind/` at `/pagefind/*` (correct wasm mime types via sirv). No
//     prior build → 404s, and search simply returns nothing; nothing else breaks.
//
// We run static (no adapter), so the output dir is always `dist/`.
// See docs/tasks-todo/task-1-command-palette-and-search.md
function pagefind() {
  return {
    name: 'pagefind',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const outDir = path.join(server.config.root, server.config.build.outDir);
        const serve = sirv(outDir, { dev: true, etag: true });
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/pagefind/')) serve(req, res, next);
          else next();
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const { index, errors } = await createIndex();
        if (!index) {
          errors.forEach(e => logger.error(e));
          throw new Error('Pagefind failed to create index');
        }
        const { page_count, errors: addErrors } = await index.addDirectory({ path: outDir });
        if (addErrors.length) {
          addErrors.forEach(e => logger.error(e));
          throw new Error('Pagefind failed to index the built site');
        }
        const { errors: writeErrors } = await index.writeFiles({
          outputPath: path.join(outDir, 'pagefind'),
        });
        if (writeErrors.length) {
          writeErrors.forEach(e => logger.error(e));
          throw new Error('Pagefind failed to write the index');
        }
        logger.info(`Indexed ${page_count} pages → dist/pagefind/`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://danny.is',
  prefetch: true,
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
    build: {
      rollupOptions: {
        // @astrojs/mdx v6 ships a dynamically-imported satteri processor module
        // that statically imports `satteri` + `@astrojs/markdown-satteri` (an
        // optional peer dep we don't install). Rollup walks the dynamic import
        // and warns it can't resolve them; @astrojs/react's onwarn escalates
        // that to a build failure. We use the unified() processor, so the
        // satteri branch is dead code — marking these external is safe.
        external: ['satteri', '@astrojs/markdown-satteri'],
      },
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
    pagefind(),
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
        remarkImageCaption,
      ],
      rehypePlugins: [
        rehypeUnwrapImages,
        rehypeHeadingIds,
        [rehypeAutolinkHeadings, { behavior: 'append', content: { type: 'text', value: '#' } }],
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
        [rehypeMermaid, { mermaidConfig }],
        rehypeListDensity,
      ],
    }),
  },
  redirects,
});
