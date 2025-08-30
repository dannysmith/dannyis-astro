# Content System Documentation

This document provides comprehensive technical documentation for the content system architecture, schemas, components, and workflows used in this Astro-based site.

## Content Collections Overview

The site uses Astro's content collections for type-safe content management with two primary content types:

1. **Articles** (`/writing/`) - Long-form articles in `src/content/articles/`
2. **Notes** (`/notes/`) - Shorter thoughts and links in `src/content/notes/`

Both collections support MDX with custom components and follow a content-first, zero-JavaScript-by-default approach.

## Content Schema Definitions

### Articles Collection

Located in `src/content/articles/`, articles use the following schema:

```typescript
const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // Required: Article title
      slug: z.string().optional(), // Optional: Custom URL slug
      draft: z.boolean().default(false), // Draft status (filters in production)
      description: z.string().optional(), // SEO meta description
      pubDate: z.coerce.date(), // Required: Publication date
      updatedDate: z.coerce.date().optional(), // Optional: Last updated date
      cover: image().optional(), // Optional: Header image (Astro Image)
      coverAlt: z.string().optional(), // Alt text for cover image
      tags: z.array(z.string()).optional(), // Content tags for categorization
      platform: z.enum(['medium', 'external']).optional(), // External platform indicator
      redirectURL: z.string().url().optional(), // For external content redirects
      styleguide: z.boolean().optional(), // Excludes from RSS/indexes
    }),
});
```

**Required Frontmatter:**

```yaml
---
title: 'Article Title in Title Case'
pubDate: 2025-01-15
draft: true
---
```

**Optional Frontmatter:**

```yaml
---
slug: 'custom-url-slug'
description: 'SEO-optimized description under 160 characters'
updatedDate: 2025-01-20
cover: ./path/to/cover-image.jpg
coverAlt: 'Descriptive alt text for cover image'
tags: ['development', 'astro', 'web-performance']
platform: 'medium'
redirectURL: 'https://external-site.com/article'
styleguide: true
---
```

### Notes Collection

Located in `src/content/notes/`, notes use this schema:

```typescript
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(), // Required: Note title
    sourceURL: z.string().url().optional(), // Optional: Original URL for link posts
    slug: z.string().optional(), // Optional: Custom URL slug
    draft: z.boolean().default(false), // Draft status
    description: z.string().optional(), // Optional: SEO description
    pubDate: z.coerce.date(), // Required: Publication date
    tags: z.array(z.string()).optional(), // Content tags
    styleguide: z.boolean().optional(), // Excludes from RSS/indexes
  }),
});
```

**Required Frontmatter:**

```yaml
---
title: 'Note Title'
pubDate: 2025-01-15
---
```

**Optional Frontmatter:**

```yaml
---
sourceURL: 'https://source-link.com'
tags: ['link-post', 'technology']
description: 'Brief description for SEO'
styleguide: true
---
```

## File Naming Conventions

### Articles

- Format: `YYYY-MM-DD-descriptive-slug.mdx`
- Location: `src/content/articles/`
- Example: `2025-01-15-building-with-astro.mdx`

### Notes

- Format: `YYYY-MM-DD-descriptive-slug.md`
- Location: `src/content/notes/`
- Example: `2025-01-15-interesting-astro-feature.md`

**Naming Guidelines:**

- Use today's date unless specified otherwise
- Keep slugs concise but descriptive
- Use kebab-case for consistency
- Match filename slug with frontmatter slug when provided

## MDX Components

Both content types support rich MDX components with automatic imports:

```mdx
---
title: 'Example Article'
pubDate: 2025-01-15
---

import { Image, Picture } from 'astro:assets';
import { Notion, Grid, BookmarkCard, Callout, Embed, Loom } from '@components/mdx';

;
```

### Available MDX Components

#### Universal Embed (`<Embed>`)

Handles multiple embed types with intelligent fallbacks:

```mdx
<Embed url="https://youtube.com/watch?v=example" />
<Embed url="https://twitter.com/user/status/123" />
<Embed url="https://vimeo.com/123456" />
```

**Supported Platforms:**

- YouTube videos
- Twitter/X posts
- Vimeo videos
- Loom recordings
- Falls back to BookmarkCard for other URLs

#### BookmarkCard (`<BookmarkCard>`)

Rich URL previews using Open Graph data:

```mdx
<BookmarkCard url="https://example.com/interesting-article" />
```

**Features:**

- Automatic Open Graph data fetching
- Rich previews with title, description, image
- Fallback handling for missing metadata
- External link security attributes

#### Callout (`<Callout>`)

Highlighted information boxes:

```mdx
<!-- Using emojis -->

<Callout type="blue" emoji="💡" title="Pro Tip">
  Important information here
</Callout>

<Callout type="red" emoji="⚠️" title="Warning">
  Cautionary information
</Callout>

<!-- Using astro-icons -->

<Callout type="green" icon="heroicons:check-circle" title="Success">
  Task completed successfully
</Callout>

<Callout type="orange" icon="heroicons:exclamation-triangle" title="Caution">
  Proceed with caution
</Callout>
```

**Available Types:** `default`, `red`, `blue`, `green`, `orange`, `yellow`, `purple`

**Icon Options:**

- `emoji` - Plain text emoji (e.g., `emoji="💡"`)
- `icon` - Astro-icon name (e.g., `icon="heroicons:check-circle"`)
- Priority: astro-icon > emoji

#### Notion (`<Notion>`)

Notion page references with automatic title fetching:

```mdx
<Notion>https://notion.so/page-id</Notion>
```

**Features:**

- Automatic title fetching from Notion API
- Manual title override support
- Proper external link handling

#### Grid (`<Grid>`)

Layout component for organizing content:

```mdx
<Grid>
  <div>Content block 1</div>
  <div>Content block 2</div>
</Grid>
```

## Image Optimization

### BasicImage Component (Recommended)

For content images, use the custom BasicImage component which wraps Astro's Picture component:

```mdx
import { BasicImage } from '@components/mdx';
import coverImage from '../assets/articles/cover-image.jpg';

<BasicImage src={coverImage} alt="Descriptive alt text" />
<BasicImage src={coverImage} alt="Descriptive alt text" bleed="full" />
```

### Astro Image Component (For Layouts)

For layout-specific images, use Astro's built-in Image component:

```mdx
import { Image } from 'astro:assets';
import coverImage from '../assets/articles/cover-image.jpg';

<Image src={coverImage} alt="Descriptive alt text" width={800} height={600} loading="lazy" />
```

### Image Best Practices

**Technical Requirements:**

- Always provide width and height
- Use descriptive alt text
- Leverage Astro's automatic optimization
- Use appropriate formats (WebP, AVIF)
- Implement responsive images with srcset

**Organization:**

- Articles: `src/assets/articles/[article-slug]/`
- Notes: `src/assets/notes/[note-slug]/`
- General: `src/assets/`

**Cover Images:**

```yaml
---
cover: ./path/to/cover-image.jpg
coverAlt: 'Descriptive alt text for accessibility'
---
```

## SEO Implementation

### Centralized Configuration

SEO settings are centralized in `src/config/seo.ts`:

- Personal branding and job titles
- Title templates for different page types
- Schema.org structured data configuration
- OpenGraph and Twitter card settings

### SEO Utility Functions

Available in `src/utils/seo.ts`:

- `generatePageTitle()` - Template-based title generation
- `generateMetaDescription()` - Consistent description branding
- `generateJSONLD()` - Schema.org structured data
- `generateArticleMeta()` - Article-specific OpenGraph meta
- `generateOGImageUrl()` - Image URL generation with fallbacks
- `validateSEOData()` - Data validation and sanitization

### BaseHead Component Usage

```astro
<BaseHead
  title="Page Title"
  description="Page description under 160 characters"
  type="article"        // 'website' (default) or 'article'
  pageType="article"    // 'article', 'note', or 'page' for title templates
  image="/custom-og.png" // Optional: custom OpenGraph image
  pubDate={new Date()}   // Optional: for articles/notes
  updatedDate={new Date()} // Optional: for articles/notes
  tags={['tag1', 'tag2']} // Optional: for articles/notes
/>
```

### OpenGraph Image Generation

- Automatic generation for all content
- Build-time creation using dynamic templates
- Fallback to default site image
- Proper sizing for social platforms

## RSS Feed System

### Feed Architecture

The site generates three RSS feeds using Astro's Container API:

1. **Combined Feed** (`/rss.xml`) - All articles and notes
2. **Articles Only** (`/rss/articles.xml`) - Long-form content only
3. **Notes Only** (`/rss/notes.xml`) - Short-form content only

### Implementation Details

- Uses Astro's experimental Container API for full MDX component rendering
- Enables rich content in RSS feeds with proper component rendering
- All MDX components work correctly in RSS output

### Content Filtering Rules

**Production Filtering:**

- Draft content (`draft: true`) excluded
- Styleguide content (`styleguide: true`) excluded
- External redirects handled appropriately

**Development Environment:**

- Draft content included for testing
- All filtering rules visible for verification

**Sorting:**

- All feeds sorted by publication date (newest first)
- Consistent ordering across RSS feeds

### Key Features

- **Rich Content**: Full MDX component rendering in RSS feeds
- **Error Resilience**: Graceful handling of failed renders
- **Security**: Automatic external link attributes

## Publishing Workflow

### Content Creation

1. Create file with proper naming conventions
2. Set `draft: true` initially
3. Write content using MDX components
4. Validate with quality checks (`pnpm run lint`, `pnpm run check`, `pnpm run build`)
5. Set `draft: false` to publish

### Content Standards

**Articles:**

- Compelling description under 160 characters
- Proper heading hierarchy (H1 → H2 → H3)
- Appropriate cover image with alt text

**Notes:**

- Clear, concise title
- Include sourceURL for link posts
- Use relevant tags (3-5 maximum)

## External Link Security

### Automatic Security

All external links in markdown content automatically include `target="_blank" rel="noopener noreferrer"` via the `rehype-external-links` plugin.

### Manual Implementation

For HTML links in components:

```astro
<a href="https://external-site.com" target="_blank" rel="noopener noreferrer">
  External Link
</a>
```

**Security Benefits:**

- Prevents `window.opener` vulnerabilities
- Opens links in new tabs for better UX
- Protects against tabnabbing attacks

## Performance Considerations

### Build Optimization

- Static generation by default
- Automatic image optimization
- Component-level code splitting
- Minimal client-side JavaScript

### Content Loading

- Lazy loading for below-fold images
- Proper preload directives
- Optimized resource loading order
- Efficient content collection queries

## Error Handling

- Schema validation prevents invalid frontmatter
- Graceful handling of missing assets and failed component renders
- Meaningful error messages in development
- Custom 404 page for missing content

## Development Commands

```bash
# Development
pnpm run dev          # Start development server at localhost:4321
pnpm run build        # Production build with optimizations
pnpm run preview      # Preview production build locally

# Content creation
pnpm run newnote "<title>"    # Create new note template
pnpm run newnote "<url>"      # Create note with source URL

# Quality assurance
pnpm run lint         # ESLint validation
pnpm run check        # Astro/TypeScript checking
pnpm run build        # Production build test
```
