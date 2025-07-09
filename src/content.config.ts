import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      draft: z.boolean().default(false),
      pubDate: z.coerce.date(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      description: z.string().optional(),
      platform: z.enum(['medium', 'external']).optional(),
      redirectURL: z.string().url().optional(),
      updatedDate: z.coerce.date().optional(),
      styleguide: z.boolean().optional(),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().optional(),
    sourceURL: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    styleguide: z.boolean().optional(),
  }),
});

const toolboxPages = defineCollection({
  loader: file('src/content/toolboxPages.json'),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
  }),
});

export const collections = { articles, notes, toolboxPages };
