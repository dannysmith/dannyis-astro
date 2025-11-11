import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

// Long-form Articles
const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(), // Custom URL slug
      draft: z.boolean().default(false),
      description: z.string().optional(), // SEO meta description
      pubDate: z.coerce.date(), // Publication date
      updatedDate: z.coerce.date().optional(), // Last updated date
      cover: image().optional(), // Header image
      coverAlt: z.string().optional(), // Alt text for header image
      tags: z.array(z.string()).optional(),
      platform: z.enum(['medium', 'external']).optional(), // For articles published elsewhere (Medium, etc.)
      redirectURL: z.string().url().optional(), // For articles published elsewhere – where to redirect to
      styleguide: z.boolean().optional(), // Flag for the article styleguide. Excludes from RSS/indexes etc in prod
    }),
});

// Short-form Notes, often about other people's content
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    sourceURL: z.string().url().optional(), // Original URL for link posts
    slug: z.string().optional(), // Custom URL slug
    draft: z.boolean().default(false),
    description: z.string().optional(), // SEO description
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    styleguide: z.boolean().optional(), // Flag for the article styleguide. Excludes from RSS/indexes etc in prod
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
