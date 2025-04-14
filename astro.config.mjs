import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { remarkReadingTime } from './remark-reading-time.mjs'

// https://astro.build/config
export default defineConfig({
  site: 'https://danny.is',
  prefetch: true,
  image: {
    // Used for all Markdown images; not configurable per-image
    // Used for all `<Image />` and `<Picture />` components unless overridden with a prop
    experimentalLayout: 'responsive',
  },
  experimental: {
    svg: true,
    headingIdCompat: true,
    responsiveImages: true,
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [
      [rehypeHeadingIds, { headingIdCompat: true }],
      rehypeAutolinkHeadings,
    ],
    remarkPlugins: [remarkReadingTime],
  },
  // Avoid using a trailing slash in redirect URLs
  redirects: {
    '/meeting': 'https://cal.com/dannysmith',
    '/tools': 'https://betterat.work/toolbox',
    '/linkedin': 'https://www.linkedin.com/in/dannyasmith',
    '/cv': '/cv-danny-smith.pdf',
    '/working': 'https://betterat.work',
    '/remote':
      'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
    '/rtotd':
      'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
    '/using':
      'https://www.notion.so/dannysmith/Danny-Uses-72544bdecd144ca5ab3864d92dcd119b',
    '/music': 'https://youtube.com/dannysmithblues',
    '/singing': 'https://youtube.com/dannysmithblues',
    '/youtube': 'https://www.youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA',
  },
})
