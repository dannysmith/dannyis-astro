# Content System Architecture

Technical implementation of content collections, RSS feeds, SEO, and build-time content generation.

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

See `critical-patterns.md` for file naming details and `content-authoring.md` for schema reference.

### Content Filtering

**IMPORTANT:** Filtering logic is duplicated across multiple files (see `critical-patterns.md`).

```typescript
const isPublishable = entry => {
  if (import.meta.env.PROD) {
    return entry.data.draft !== true && !entry.data.styleguide;
  }
  return true; // Development shows everything
};
```

**Where filtering applies:**

- RSS feed endpoints (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`)
- Markdown export endpoints (`/writing/[...slug].md.ts`, `/notes/[...slug].md.ts`)
- Index pages (articles/notes listings)

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

See `critical-patterns.md` for complete RSS Container API implementation details.

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

## SEO System Architecture

Centralized SEO configuration prevents inconsistencies and simplifies updates.

### Configuration Files

**Personal branding and templates:** `src/config/seo.ts`

- `AUTHOR` - Name, job title, email, website, image, description
- `ORGANIZATION` - Business info
- `SOCIAL_PROFILES` - Social media URLs
- `TITLE_TEMPLATES` - Page title formatting by page type
- `PAGE_DESCRIPTIONS` - Default descriptions
- Schema.org configuration

**Site constants:** `src/consts.ts`

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_URL`

**Note:** Personal branding in `seo.ts`, generic strings in `consts.ts`.

### SEO Utility Functions

**File:** `src/utils/seo.ts`

**Title generation:**

```typescript
import { generatePageTitle } from '@utils/seo';

const title = generatePageTitle('My Article', 'article');
// Result: "My Article | Danny Smith"
```

**Meta description:**

```typescript
import { generateMetaDescription } from '@utils/seo';

const description = generateMetaDescription('Article description');
// Appends author name for consistent branding
```

**JSON-LD structured data:**

```typescript
import { generateJSONLD } from '@utils/seo';

const jsonld = generateJSONLD(pageData, canonicalUrl, ogImageUrl);
// Returns schema.org Person + Organization + Website + optional BlogPosting
```

**Article metadata:**

```typescript
import { generateArticleMeta } from '@utils/seo';

const meta = generateArticleMeta(pageData);
// Returns OpenGraph article-specific tags (author, section, dates, tags)
```

**OG image URL:**

```typescript
import { generateOGImageUrl } from '@utils/seo';

const imageUrl = generateOGImageUrl(customImage, baseUrl);
// Returns custom image or defaults to /og-default.png
```

**Data validation:**

```typescript
import { validateSEOData } from '@utils/seo';

const validated = validateSEOData(rawData);
// Normalizes and validates SEO data with defaults
```

### BaseHead Component

Unified HTML head management with SEO integration.

**File:** `src/components/layout/BaseHead.astro`

```astro
import { BaseHead } from '@components/layout';

<BaseHead
  title="Page Title"
  description="Page description under 160 characters"
  type="article"        // 'website' (default) or 'article'
  pageType="article"    // 'article', 'note', or 'page' for title templates
  image="/custom-og.png" // Optional: custom OG image
  pubDate={new Date()}   // Optional: for articles/notes
  updatedDate={new Date()} // Optional: for articles/notes
  tags={['tag1', 'tag2']} // Optional: for articles/notes
/>
```

**BaseHead handles:**

- Meta tags (title, description, canonical URL)
- OpenGraph tags (og:title, og:image, og:type, etc.)
- Twitter Card tags
- JSON-LD structured data
- Theme management (theme color, initial theme)
- Font imports (@fontsource-variable)

### Schema.org Structured Data

**Automatically included** via BaseHead component:

- Person schema (author information)
- Organization schema (business/brand)
- Website schema (site metadata)
- BlogPosting schema (for articles only)

All schemas pull from `src/config/seo.ts` for consistency.

## OpenGraph Image Generation

**Automatic generation** for all content at build time.

### Implementation

Dynamic generation using `@vercel/og` + `satori` + `@resvg/resvg-js`.

**Files:**

- `src/pages/writing/[...slug]/og-image.png.ts` - Articles
- `src/pages/notes/[...slug]/og-image.png.ts` - Notes

**Note:** `@resvg/resvg-js` is excluded from Vite optimization in `astro.config.mjs` (see `critical-patterns.md`).

### Features

- Build-time creation via TypeScript endpoints
- Proper sizing for social platforms (1200x630)
- Fallback to `/og-default.png` if generation fails
- No manual configuration needed per article/note

### Dynamic API Endpoints

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

See `critical-patterns.md` for details on dynamic API endpoints.

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

## Performance Considerations

### Build Optimization

- Static generation by default
- Automatic image optimization (WebP, AVIF)
- Component-level code splitting
- Minimal client-side JavaScript

### Content Loading

- Lazy loading for below-fold images
- Proper preload directives for critical assets
- Optimized resource loading order
- Efficient content collection queries

### Error Handling

- Schema validation prevents invalid frontmatter
- Graceful handling of missing assets
- Meaningful error messages in development
- Failed MDX component renders don't break builds
- Custom 404 page for missing content

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
