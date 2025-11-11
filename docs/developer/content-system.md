# Content System Architecture

Technical implementation of content collections, RSS feeds and build-time content generation.

## Content Collections

The site uses Astro's content collections with **glob loaders** and **inline-commented schemas** in `src/content.config.ts`.

### Collection Configuration

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Articles collection
const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    draft: z.boolean().optional(),
    // ... see src/content.config.ts for complete schema with comments
  }),
});

// Notes collection
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    // ... see src/content.config.ts for complete schema
  }),
});

export const collections = { articles, notes };
```

### Glob Loader Behavior

- **Pattern:** `**/[^_]*.{md,mdx}` - Matches all `.md` and `.mdx` files except those starting with underscore
- **Ignored files:** Anything starting with `_` (use for drafts/work-in-progress)
- **Naming requirement:** `YYYY-MM-DD-descriptive-slug.{md,mdx}` format

See `content-authoring.md` for file naming conventions and schema reference.

### Content Filtering

Content is filtered based on `draft` and `styleguide` frontmatter flags in production builds. Development mode shows all content.

**IMPORTANT:** Filtering logic is duplicated across multiple files - see [architecture-guide.md § Content Filtering Rules](./architecture-guide.md#content-filtering-rules) for the complete list of affected files and the gotcha details.

### Reading Time Injection

Reading time is **NOT from SEO utilities** - it's injected by a remark plugin.

**File:** `remark-reading-time.mjs` (root directory)

```javascript
export function remarkReadingTime() {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage); // 200 words per minute

    // Inject into frontmatter
    file.data.astro.frontmatter.minutesRead = readingTime.minutes;
  };
}
```

Access via `entry.data.minutesRead` - it's frontmatter data, not from `@utils/seo`.

## RSS Feed Implementation

Three RSS feeds generated using Astro's experimental Container API:

- `/rss.xml` - Combined articles + notes
- `/rss/articles.xml` - Articles only
- `/rss/notes.xml` - Notes only

### Container API Pattern

See [architecture-guide.md § RSS Container API](./architecture-guide.md#rss-container-api) for complete RSS Container API implementation details.

**Key features:**

- Full MDX component rendering in RSS feeds
- All MDX components (Callout, Embed, etc.) work in RSS output
- Automatic content filtering (drafts/styleguide excluded in production)
- Error-resilient rendering (failed items are skipped with warning)

### Implementation Files

- `src/pages/rss.xml.js` - Combined feed
- `src/pages/rss/articles.xml.js` - Articles only
- `src/pages/rss/notes.xml.js` - Notes only

All three use identical pattern with different collection sources.

## SEO

See `seo.md`

## OpenGraph Image Generation

**Automatic generation** for all content at build time.

### Implementation

Dynamic generation using `@vercel/og` + `satori` + `@resvg/resvg-js`.

**Files:**

- `src/pages/writing/[...slug]/og-image.png.ts` - Articles
- `src/pages/notes/[...slug]/og-image.png.ts` - Notes

**Note:** `@resvg/resvg-js` is excluded from Vite optimization in `astro.config.mjs` (see [architecture-guide.md § Dynamic API Endpoints](./architecture-guide.md#dynamic-api-endpoints)).

### Features

- Build-time creation via TypeScript endpoints
- Proper sizing for social platforms (1200x630)
- Fallback to `/og-default.png` if generation fails
- No manual configuration needed per article/note

## Dynamic API Endpoints

TypeScript files with special extensions generate dynamic content:

**Markdown Export (.md.ts):**

```
src/pages/writing/[...slug].md.ts  → Markdown version of articles
src/pages/notes/[...slug].md.ts    → Markdown version of notes
```

These are API routes that return `.md` files on request.

**Image Generation (.png.ts):**

```
src/pages/writing/[...slug]/og-image.png.ts  → OG images for articles
src/pages/notes/[...slug]/og-image.png.ts    → OG images for notes
```

See [architecture-guide.md § Dynamic API Endpoints](./architecture-guide.md#dynamic-api-endpoints) for details.

## Content Summary Generation

**Automatic summaries** for content cards and previews.

### Summary Priority

1. Frontmatter `description` (if provided)
2. Extracted first meaningful paragraph
3. Title as fallback

### Utility Functions

**File:** `src/utils/content-summary.ts`

```typescript
import { generateSummary } from '@utils/content-summary';

const summary = generateSummary(entry, maxLength);
// Smart summary generation with fallback logic
```

**Available functions:**

- `generateSummary(entry, maxLength=200)` - Smart summary generation
- `stripMDXElements(content)` - Removes MDX/HTML from content
- `extractFirstMeaningfulParagraph(text)` - Filters structural content
- `truncateAtSentence(text, maxLength)` - Smart truncation at sentence/word boundaries
- `validateSummary(summary)` - Quality check (min 10 chars)

**Used by:** `ContentCard` component for consistent previews.

## Markdown Plugins Configuration

Custom remark/rehype plugins modify content during build.

**File:** `astro.config.mjs`

### Active Plugins

**Remark plugins:**

- `remarkReadingTime` (custom) - Injects `minutesRead` into frontmatter
- Built-in Mermaid diagram support

**Rehype plugins:**

- `rehype-heading-ids` - Adds IDs to headings
- `rehype-autolink-headings` - Makes headings clickable
- `rehype-external-links` - Adds `target="_blank" rel="noopener noreferrer"` to external links

### Reading Time Plugin

**File:** `remark-reading-time.mjs` (root directory, not in src/)

This is why reading time isn't centralized - it happens during markdown parsing, not via SEO utilities.

## Build Configuration

**File:** `astro.config.mjs`

### Critical Settings

- **Redirects:** 14 redirects configured (see `critical-patterns.md`)
- **Vite optimizations:** Excludes `@resvg/resvg-js`
- **Markdown plugins:** Remark + rehype configuration
- **Expressive Code:** Dracula-soft theme with no frame shadows
- **Compatibility:** `headingIdCompat: true` for heading ID generation

## External Dependencies

### Content Processing

- **@astrojs/mdx** - MDX support
- **remark-reading-time** (custom) - Reading time calculation
- **rehype-external-links** - External link security
- **rehype-heading-ids** - Heading IDs
- **rehype-autolink-headings** - Clickable headings

### Image Generation

- **@vercel/og** - OpenGraph image generation
- **satori** - HTML to SVG rendering
- **@resvg/resvg-js** - SVG to PNG conversion

### RSS Generation

- **Astro Container API** (experimental) - MDX rendering in RSS

See `package.json` for complete dependency list.
