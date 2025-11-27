import { defineCollection, z } from 'astro:content';
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
      redirectURL: z
        .string()
        .url()
        .optional()
        .describe('Redirect destination for external articles'),
      styleguide: z.boolean().optional().describe('Styleguide page; excluded from RSS and indexes'),
    }),
});

// Short-form Notes, often about other people's content
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    sourceURL: z.string().url().optional().describe('Original URL for link posts'),
    slug: z.string().optional().describe('Custom URL slug (defaults to filename)'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    styleguide: z.boolean().optional().describe('Styleguide page; excluded from RSS and indexes'),
  }),
});

// Links to "Tool pages" pulled from http://betterat.work/toolbox
const toolboxPages = defineCollection({
  loader: file('src/content/toolboxPages.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
  }),
});

export const collections = { articles, notes, toolboxPages };
