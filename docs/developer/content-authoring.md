# Content Authoring Guide

Guide for creating and editing the CONTENT of articles and notes. For technical implementation details, see `content-system.md`.

## Content Types

**Articles** (`/writing/`) - Long-form content

- Location: `src/content/articles/`
- Assets: `src/assets/articles/`
- URL pattern: `https://danny.is/writing/[slug]/`
- Formats: `.md` or `.mdx`

**Notes** (`/notes/`) - Short-form updates and links

- Location: `src/content/notes/`
- Assets: `src/assets/notes/`
- URL pattern: `https://danny.is/notes/[slug]/`
- Formats: `.md` or `.mdx`

## File Naming

**Required format:**

```
YYYY-MM-DD-descriptive-slug.{md,mdx}
```

### Guidelines

- Use today's date unless specified otherwise
- Keep slugs concise but descriptive (3-6 words)
- Use kebab-case for consistency
- Files starting with underscore are ignored (use for drafts: `_draft-article.mdx`)

### Examples

```
✅ 2025-01-15-remote-work-tips.mdx
✅ 2024-12-01-quick-thought.md
❌ my-article.mdx (missing date)
❌ 01-15-2025-article.mdx (wrong date format)
❌ 2025-1-5-note.md (single-digit month/day)
```

## Frontmatter

**Articles - Required fields:**

```yaml
---
title: 'Article Title in Title Case'
pubDate: 2025-01-15
draft: true # Set false to publish
---
```

**Notes - Required fields:**

```yaml
---
title: 'Note Title'
pubDate: 2025-01-15
---
```

**Optional fields for both:** See `src/content.config.ts` for complete schema with inline comments explaining each field.

**Common optional fields:**

- `description` - SEO description (under 160 characters)
- `tags` - Array of tags (3-5 recommended)
- `cover` - Cover image path
- `coverAlt` - Cover image alt text
- `sourceURL` - For notes commenting on external content

**Reading time** is automatically calculated (no frontmatter needed).

## MDX Components

Import components from `@components/mdx`. **Full list in `src/components/mdx/index.ts`** with TypeScript types.

### Common Components

**Embed** - Multi-platform embed (YouTube, Twitter, Vimeo, Loom):

```mdx
import { Embed } from '@components/mdx';

<Embed url="https://youtube.com/watch?v=example" />
```

**BookmarkCard** - Rich URL preview with Open Graph data:

```mdx
import { BookmarkCard } from '@components/mdx';

<BookmarkCard url="https://example.com/article" />
```

**Callout** - Highlighted information boxes:

```mdx
import { Callout } from '@components/mdx';

<Callout type="blue" emoji="💡" title="Pro Tip">
  Important information here
</Callout>
```

Types: `default`, `red`, `blue`, `green`, `orange`, `yellow`, `purple`

Icons: Use `emoji` for text emoji or `icon` for heroicons (e.g., `icon="heroicons:exclamation-triangle"`)

**BasicImage** - Optimized images with optional full-bleed:

```mdx
import { BasicImage } from '@components/mdx';
import photo from '@assets/articles/my-article/photo.jpg';

<BasicImage src={photo} alt="Descriptive alt text" />
<BasicImage src={photo} alt="Full width" bleed="full" />
```

**Typography components:**

```mdx
import { IntroParagraph, SmallCaps, Title1 } from '@components/mdx';

<IntroParagraph>Opening paragraph with special styling</IntroParagraph>
<SmallCaps>Formatted in small capitals</SmallCaps>
<Title1>Large display title</Title1>
```

**Other components:**

- `Accordion` - Expandable content sections
- `ButtonLink` - Call-to-action button links
- `Grid` - Layout component for organizing content
- `Loom` - Loom video embeds
- `Notion` - Notion page links with auto title fetching
- `Spacer` - Vertical spacing control

TypeScript will show available props. See `src/components/mdx/index.ts` for complete list and `src/components/mdx/[component].astro` for implementation details.

## Images

### Adding Images

**Article images:** `src/assets/articles/[article-slug]/photo.jpg`

**Note images:** `src/assets/notes/[note-slug]/photo.jpg`

**General images:** `src/assets/`

### Using Images

**Recommended: BasicImage component**

```mdx
import { BasicImage } from '@components/mdx';
import photo from '@assets/articles/my-article/photo.jpg';

<BasicImage src={photo} alt="Descriptive alt text" />
```

Options:

- `bleed="full"` - Extend to full viewport width
- Automatic format optimization (WebP, AVIF)
- Responsive srcset generation

**Alternative: Astro Image component**

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

### Cover Images

Add to frontmatter:

```yaml
---
cover: ./path/to/cover-image.jpg
coverAlt: 'Descriptive alt text for accessibility'
---
```

### Best Practices

- Always provide descriptive alt text
- Use appropriate image formats (WebP preferred)
- Implement lazy loading for below-fold images
- Leverage Astro's automatic optimization

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

### Creating Notes via CLI

```bash
pnpm run newnote "Note Title"
# Creates note with today's date and proper frontmatter

pnpm run newnote "https://example.com/article"
# Creates note with sourceURL set
```

Articles are created manually (no CLI command).

## External Links

External links in markdown automatically get `target="_blank" rel="noopener noreferrer"` via rehype plugin.

For HTML links in components, see [architecture-guide.md § External Link Security](./architecture-guide.md#external-link-security) for security requirements.
