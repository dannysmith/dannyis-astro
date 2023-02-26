import { defineConfig } from 'astro/config';

import mdx from "@astrojs/mdx";
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import rehypeSlug from "rehype-slug";
import rehypeTOC from "rehype-toc";
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
      // [rehypeTOC, { headings: ['h1', 'h2', 'h3'] }],
    ],
  },

});
