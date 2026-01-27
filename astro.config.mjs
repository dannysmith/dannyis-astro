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
import icon from 'astro-icon';

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
    ],
    remarkPlugins: [remarkReadingTime, remarkFootnoteDetector],
  },
  // Avoid using a trailing slash in redirect URLs
  redirects: {
    '/meeting': 'https://cal.com/dannysmith',
    '/toolbox': 'https://betterat.work/toolbox',
    '/linkedin': 'https://www.linkedin.com/in/dannyasmith',
    '/cv': '/cv-danny-smith.pdf',
    '/working': 'https://betterat.work',
    '/remote':
      'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
    '/rtotd': 'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
    '/using': 'https://www.notion.so/dannysmith/Danny-Uses-72544bdecd144ca5ab3864d92dcd119b',
    '/music': 'https://youtube.com/dannysmithblues',
    '/singing': 'https://youtube.com/dannysmithblues',
    '/youtube': 'https://www.youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA',
  },
});
