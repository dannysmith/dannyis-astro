import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

// Long-form Articles
const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional().describe('Custom URL slug (defaults to filename)'),
      draft: z.boolean().default(false),
      toc: z.boolean().default(false).describe('Show table of contents sidebar on wide viewports'),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      platform: z
        .enum(['medium', 'external'])
        .optional()
        .describe('For articles published elsewhere'),
      redirectURL: z.url().optional().describe('Redirect destination for external articles'),
      styleguide: z.boolean().optional().describe('Styleguide page; excluded from RSS and indexes'),
      series: reference('series')
        .optional()
        .describe('Series this article belongs to (id from series.json)'),
    }),
});

// Article series metadata (for the "part of a series" callout)
const series = defineCollection({
  loader: file('src/content/series.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    intro: z.string().optional(),
  }),
});

// Short-form Notes, often about other people's content
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    sourceURL: z.url().optional().describe('Original URL for link posts'),
    slug: z.string().optional().describe('Custom URL slug (defaults to filename)'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    styleguide: z.boolean().optional().describe('Styleguide page; excluded from RSS and indexes'),
  }),
});

// "Tool pages" from the Remote Working Toolbox — metadata scraped from betterat.work
// (super.so) and the underlying Notion database by `bun run scrape-toolbox`.
// See scripts/get-toolbox-json.ts and https://github.com/dannysmith/dannyis-astro/issues/47
const toolboxPages = defineCollection({
  loader: file('src/content/toolboxPages.json'),
  schema: z.object({
    id: z.string().describe('URL slug, e.g. "ask-channels-in-slack"'),
    title: z.string(),
    url: z.url().describe('Canonical public URL (betterat.work)'),
    notionId: z.string().describe('Notion page UUID (dashed)'),
    notionUrl: z.url().describe('Public notion.site URL for the same page'),
    emoji: z.string().optional().describe('Page icon when it is an emoji'),
    iconUrl: z.url().optional().describe('Page icon when it is an image'),
    coverImage: z.url().optional(),
    category: z.string().optional(),
    summary: z.string().optional(),
    created: z.coerce.date(),
    lastEdited: z.coerce.date(),
    displayOrder: z.number().describe('Gallery order on betterat.work'),
  }),
});

// Things I've made and am making — surfaced on /making
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      byline: z.string().describe('One-sentence description of what it is'),
      stage: z
        .enum(['active-development', 'actively-maintained', 'finished', 'paused', 'archived'])
        .describe('Lifecycle: am I still working on this?'),
      audience: z
        .enum(['public', 'public-with-dragons', 'personal-only'])
        .describe("Who's it for, can others use it?"),
      kind: z.enum(['proper', 'toy', 'experiment']).optional().describe('How seriously to take it'),
      icon: image().optional().describe('Square icon'),
      image: image().optional().describe('Main graphic'),
      website: z.url().optional(),
      github: z.url().optional(),
      featured: z.boolean().default(false),
      startDate: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles, notes, toolboxPages, series, projects };
