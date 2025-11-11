# Content System

Documentation for content collections, MDX components, SEO, and publishing workflows.

## Content Collections

The site uses Astro's content collections with **inline-commented schemas** in `src/content.config.ts`.

### Articles (Long-form Content)

- **Location**: `src/content/articles/`
- **Assets**: `src/assets/articles/`
- **URL**: `https://danny.is/writing/[slug]/`
- **Formats**: `.md` or `.mdx`
- **Naming**: `YYYY-MM-DD-descriptive-slug.mdx`

**Required frontmatter:**

```yaml
---
title: 'Article Title in Title Case'
pubDate: 2025-01-15
draft: true # Set false to publish
---
```

**Full schema with explanations:** See `src/content.config.ts`

### Notes (Short-form Content)

- **Location**: `src/content/notes/`
- **Assets**: `src/assets/notes/`
- **URL**: `https://danny.is/notes/[slug]/`
- **Formats**: `.md` or `.mdx`
- **Naming**: `YYYY-MM-DD-descriptive-slug.md`

**Required frontmatter:**

```yaml
---
title: 'Note Title'
pubDate: 2025-01-15
---
```

**Full schema with explanations:** See `src/content.config.ts`

### Reading Time

**Automatically calculated** via remark plugin:

- Injected as `minutesRead` in frontmatter
- Based on 200 words per minute
- Available as `entry.data.minutesRead`

No manual configuration needed.

## File Naming Conventions

```
YYYY-MM-DD-descriptive-slug.{md,mdx}
```

### Guidelines

- Use today's date unless specified otherwise
- Keep slugs concise but descriptive (3-6 words)
- Use kebab-case for consistency
- Match filename slug with frontmatter `slug` if provided

### Examples

```
✅ 2025-01-15-remote-work-tips.mdx
✅ 2024-12-01-quick-thought.md

❌ my-article.mdx (missing date)
❌ 01-15-2025-article.mdx (wrong date format)
❌ 2025-1-5-note.md (single-digit month/day)
```

## MDX Components

Both articles and notes support rich MDX components. Import from `@components/mdx`.

### Available Components

**Universal Embed** - Multi-platform embed with intelligent fallbacks:

```mdx
import { Embed } from '@components/mdx';

<Embed url="https://youtube.com/watch?v=example" />
<Embed url="https://twitter.com/user/status/123" />
<Embed url="https://vimeo.com/123456" />
<Embed url="https://loom.com/share/example" />
```

Supported: YouTube, Twitter/X, Vimeo, Loom. Falls back to BookmarkCard for other URLs.

**BookmarkCard** - Rich URL previews with Open Graph data:

```mdx
import { BookmarkCard } from '@components/mdx';

<BookmarkCard url="https://example.com/article" />
```

Features: Auto-fetches OG data, rich previews (title/description/image), fallback handling, external link security.

**Callout** - Highlighted information boxes:

```mdx
import { Callout } from '@components/mdx';

<Callout type="blue" emoji="💡" title="Pro Tip">
  Important information here
</Callout>

<Callout type="red" icon="heroicons:exclamation-triangle" title="Warning">
  Cautionary information
</Callout>
```

Types: `default`, `red`, `blue`, `green`, `orange`, `yellow`, `purple`

Icons: Use `emoji` for plain text emoji or `icon` for astro-icon names. astro-icon takes priority.

**Notion** - Notion page links with auto title fetching:

```mdx
import { Notion } from '@components/mdx';

<Notion>https://notion.so/page-id</Notion>
```

Fetches title from Notion API automatically. Manual title override supported.

**Grid** - Layout component for organizing content:

```mdx
import { Grid } from '@components/mdx';

<Grid>
  <div>Content block 1</div>
  <div>Content block 2</div>
</Grid>
```

**BasicImage** - Optimized image component with bleed options:

```mdx
import { BasicImage } from '@components/mdx';
import coverImage from '@assets/articles/my-article/cover.jpg';

<BasicImage src={coverImage} alt="Descriptive alt text" />
<BasicImage src={coverImage} alt="Full width" bleed="full" />
```

**Typography Components** - Specialized text styling:

```mdx
import { IntroParagraph, SmallCaps } from '@components/mdx';
import { Title1, Title2 } from '@components/mdx/typography';

<IntroParagraph>Opening paragraph with special styling</IntroParagraph>
<SmallCaps>Formatted in small capitals</SmallCaps>
<Title1>Large display title</Title1>
```

**Other Components:**

- `Accordion` - Expandable content sections
- `BlockQuoteCitation` - Styled quote attributions
- `ButtonLink` - Call-to-action button links
- `Loom` - Dedicated Loom video embeds
- `SmartLink` - Enhanced anchor links
- `Spacer` - Vertical spacing control

### Complete List

All MDX components exported from `@components/mdx/index.ts`. See that file for the canonical list.

## Image Optimization

### Recommended: BasicImage Component

For content images, use `BasicImage` (wraps Astro's Picture component):

```mdx
import { BasicImage } from '@components/mdx';
import photo from '@assets/articles/my-article/photo.jpg';

<BasicImage src={photo} alt="Descriptive alt text" />
```

Options:

- `bleed="full"` - Extend image to full viewport width
- Automatic format optimization (WebP, AVIF)
- Responsive srcset generation

### Alternative: Astro Image Component

For layout-specific images:

```astro
import { Image } from 'astro:assets';
import photo from '@assets/articles/my-article/photo.jpg';

<Image
  src={photo}
  alt="Descriptive alt text"
  width={800}
  height={600}
  loading="lazy"
/>
```

### Image Organization

**Location:**

- Article images: `src/assets/articles/[article-slug]/`
- Note images: `src/assets/notes/[note-slug]/`
- General images: `src/assets/`

**Cover images** (frontmatter):

```yaml
---
cover: ./path/to/cover-image.jpg
coverAlt: 'Descriptive alt text for accessibility'
---
```

### Best Practices

- Always provide width and height to prevent layout shift
- Use descriptive alt text for accessibility
- Leverage Astro's automatic optimization
- Use appropriate formats (WebP preferred, AVIF as progressive enhancement)
- Implement lazy loading for below-fold images

## SEO Implementation

Centralized SEO configuration prevents inconsistencies and makes updates easy.

### Configuration Files

**Personal branding and templates:** `src/config/seo.ts`

- Author information (name, job title, email, bio)
- Organization details
- Social profiles
- Title templates for different page types
- Schema.org configuration

**Site constants:** `src/consts.ts`

- Site title and description
- Site URL

### SEO Utility Functions

Available in `src/utils/seo.ts`:

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

Unified HTML head management with SEO integration:

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

BaseHead handles:

- Meta tags (title, description, canonical URL)
- OpenGraph tags (og:title, og:image, og:type, etc.)
- Twitter Card tags
- JSON-LD structured data
- Theme management (theme color, initial theme)
- Font imports (@fontsource-variable)

### OpenGraph Image Generation

**Automatic generation** for all content at build time:

- Dynamic generation using `@vercel/og` + `satori` + `@resvg/resvg-js`
- Build-time creation via TypeScript endpoints
- Located: `src/pages/writing/[...slug]/og-image.png.ts` (articles)
- Located: `src/pages/notes/[...slug]/og-image.png.ts` (notes)
- Fallback to default `/og-default.png` if generation fails
- Proper sizing for social platforms (1200x630)

No manual configuration needed per article/note.

### Schema.org Structured Data

**Automatically included** via BaseHead component:

- Person schema (author information)
- Organization schema (business/brand)
- Website schema (site metadata)
- BlogPosting schema (for articles only)

All schemas pull from `src/config/seo.ts` for consistency.

## Publishing Workflow

### Content Creation Steps

1. **Create file** with proper naming (`YYYY-MM-DD-slug.mdx`)
2. **Add frontmatter** with required fields (title, pubDate)
3. **Set `draft: true`** initially
4. **Write content** using MDX components
5. **Add images** to assets directory
6. **Test locally** with `pnpm run dev`
7. **Run quality checks** with `pnpm run check:all`
8. **Set `draft: false`** to publish
9. **Commit and push** to deploy

### Pre-Publishing Checklist

**For Articles:**

- [ ] Compelling description under 160 characters
- [ ] Proper heading hierarchy (H1 → H2 → H3, no skipping)
- [ ] Cover image with descriptive alt text
- [ ] Tags are relevant and not excessive (3-5 recommended)
- [ ] All images have alt text
- [ ] External links open in new tabs (automatic for markdown)
- [ ] Reading time appears (auto-calculated)
- [ ] `draft: false` set in frontmatter

**For Notes:**

- [ ] Clear, concise title
- [ ] `sourceURL` included if commenting on external content
- [ ] Relevant tags (3-5 maximum)
- [ ] Any images have alt text
- [ ] `draft: false` set in frontmatter

**All Content:**

- [ ] `pnpm run check:all` passes (types, format, lint, tests)
- [ ] Content renders correctly in dev mode
- [ ] Links work as expected
- [ ] MDX components render properly

### Quality Gates

**Always run before publishing:**

```bash
pnpm run check:all
```

This runs:

1. TypeScript type checking
2. Prettier format validation
3. ESLint linting
4. Unit tests (Vitest)
5. E2E tests (Playwright)

All must pass before deploying.

### Creating Notes via CLI

```bash
pnpm run newnote "Note Title"
# Creates note with today's date and proper frontmatter

pnpm run newnote "https://example.com/article"
# Creates note with sourceURL set
```

Articles are created manually (no CLI command).

## RSS Feeds

Three RSS feeds generated using Astro's Container API:

- `/rss.xml` - Combined articles + notes
- `/rss/articles.xml` - Articles only
- `/rss/notes.xml` - Notes only

### Feed Features

- **Full content rendering** - MDX components work in RSS feeds
- **Automatic filtering** - Drafts and styleguide content excluded in production
- **Proper sorting** - Newest content first
- **Error resilience** - Graceful handling of failed renders
- **External link security** - Automatic attributes via rehype plugin

### Technical Implementation

See `critical-patterns.md` for RSS Container API details.

### Feed Validation

Feeds are automatically validated by RSS readers. Test with:

- Feed validators (feedvalidator.org)
- RSS readers (Feedly, NewsBlur, etc.)
- Browser RSS preview

## Content Summary Generation

**Automatic summaries** for content cards and previews.

### Summary Priority

1. Frontmatter `description` (if provided)
2. Extracted first meaningful paragraph
3. Title as fallback

### Utility Functions

Available in `src/utils/content-summary.ts`:

- `generateSummary(entry, maxLength=200)` - Smart summary generation
- `stripMDXElements(content)` - Removes MDX/HTML from content
- `extractFirstMeaningfulParagraph(text)` - Filters structural content
- `truncateAtSentence(text, maxLength)` - Smart truncation at sentence/word boundaries
- `validateSummary(summary)` - Quality check (min 10 chars)

Used by `ContentCard` component for consistent previews.

## External Link Security

All external links include security attributes to prevent vulnerabilities.

**Automatic (Markdown/MDX):** Links in markdown content get automatic `target="_blank" rel="noopener noreferrer"` via rehype plugin.

**Manual (Components):** See `critical-patterns.md` for HTML link requirements.

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

## Development Commands

```bash
# Development
pnpm run dev          # Dev server at localhost:4321
pnpm run build        # Production build with optimizations
pnpm run preview      # Preview production build locally

# Content creation
pnpm run newnote "<title>"    # Create new note
pnpm run newnote "<url>"      # Create note with source URL

# Quality assurance
pnpm run check:all    # Full quality check (required before publishing)
pnpm run lint         # ESLint only
pnpm run check:types  # TypeScript + Astro check only
pnpm run format:check # Prettier check only
```

Always run `pnpm run check:all` before publishing content.
