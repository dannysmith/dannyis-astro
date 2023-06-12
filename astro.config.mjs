import { defineConfig } from 'astro/config';

import mdx from "@astrojs/mdx";
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";


// https://astro.build/config
export default defineConfig({
  site: "https://danny.is",
  integrations: [
    mdx(),
    image({
      serviceEntryPoint: '@astrojs/image/sharp'
    }),
    prefetch(),
    sitemap()
  ],
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
    ],
  },
  experimental: {
      redirects: true,
    },
  redirects: {
    '/meeting': 'https://dannysmith.notion.site/Book-a-Meeting-with-Danny-e39fc8def5514b67b559b2e5a51934ae?pvs=4'
  }
});
