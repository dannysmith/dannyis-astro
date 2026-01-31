import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeMermaid from 'rehype-mermaid';
import { mermaidConfig } from './src/config/mermaid.js';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkFootnoteDetector } from './src/lib/remark-footnote-detector.mjs';
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
    headingIdCompat: true,
    csp: false,
    svgo: true,
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
    mdx(),
    sitemap(),
    icon(),
    react(),
  ],
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    rehypePlugins: [
      [rehypeHeadingIds, { headingIdCompat: true }],
      rehypeAutolinkHeadings,
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      [rehypeMermaid, { mermaidConfig }],
      rehypeListDensity,
    ],
    remarkPlugins: [remarkReadingTime, remarkFootnoteDetector],
  },
  redirects,
});
