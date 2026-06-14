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

Every component exported from `src/components/mdx/index.ts` is **auto-imported** into all `.mdx` content (via `astro-auto-import`, configured in `astro.config.mjs`). Just use them — no `import` line needed.

> **Don't import these explicitly.** Adding `import { Callout } from '@components/mdx';` to an `.mdx` file collides with the auto-injected import and breaks the build (`Identifier "Callout" has already been declared`). Only import things that _aren't_ in that barrel (e.g. image assets, or a one-off component from elsewhere).

### Common Components

**Embed** - Multi-platform embed (YouTube, Twitter, Vimeo, Loom):

```mdx
<Embed url="https://youtube.com/watch?v=example" />
```

**BookmarkCard** - Rich URL preview with Open Graph data:

```mdx
<BookmarkCard url="https://example.com/article" />
```

**Callout** - Highlighted information boxes:

```mdx
<Callout type="blue" emoji="💡" title="Pro Tip">
  Important information here
</Callout>
```

Types: `default`, `red`, `blue`, `green`, `orange`, `yellow`, `purple`

Icons: Use `emoji` for text emoji or `icon` for heroicons (e.g., `icon="heroicons:exclamation-triangle"`)

**BasicImage** - Optimized images with optional full-bleed:

```mdx
import photo from '@assets/articles/my-article/photo.jpg';

<BasicImage src={photo} alt="Descriptive alt text" />
<BasicImage src={photo} alt="Full width" bleed="full" />
```

(The image asset still needs importing — only the `BasicImage` component is auto-imported.)

**FileTree** - File/directory trees from a plain-text `tree` fenced code block (no import — a build-time remark plugin renders it):

````md
```tree title="src/" {3}
src/
├── index.ts        # entry point
├── lib/
│   └── parse.ts
└── README.md
```
````

Write a standard `tree(1)`-style tree (Unicode, ASCII, or pipe-dash glyphs all work, so it stays readable on GitHub). Folders (trailing `/` or having children) collapse on click; icons are coloured by file type. Meta attributes: `title="..."`, `frame="none"`, and `{2,5-7}` to highlight rows. Comments after `#` render as inline markdown (links work), and a literal `...` row becomes an "and more" indicator.

**Typography components:**

```mdx
<IntroParagraph>Opening paragraph with special styling</IntroParagraph>
<SmallCaps>Formatted in small capitals</SmallCaps>
<Highlight>Inline highlighted text</Highlight>
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

Use the `BasicImage` component (shown under [MDX Components](#mdx-components) above) — import the asset at the top of the file, then `<BasicImage src={photo} alt="…" />`. It handles format optimisation and responsive `srcset`; add `bleed="full"` to extend an image to the full viewport width. Always provide descriptive alt text.

### Cover Images

Add to frontmatter — `cover` is resolved by Astro's image pipeline, so use a path relative to the file:

```yaml
---
cover: ./path/to/cover-image.jpg
coverAlt: 'Descriptive alt text for accessibility'
---
```

## Publishing Workflow

### Content Creation Steps

1. **Create file** with proper naming (`YYYY-MM-DD-slug.mdx`)
2. **Add frontmatter** with required fields (title, pubDate)
3. **Set `draft: true`** initially
4. **Write content** using MDX components
5. **Add images** to assets directory
6. **Test locally** with `bun run dev`
7. **Run quality checks** with `bun run check:all`
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

- [ ] `bun run check:all` passes (types, format, lint, tests)
- [ ] Content renders correctly in dev mode
- [ ] Links work as expected
- [ ] MDX components render properly

### Creating Content

Notes and articles are created manually — add a new `.md`/`.mdx` file under `src/content/notes/` or `src/content/articles/` following the naming and frontmatter conventions above. There is no CLI generator.

For standalone pages (like `/now` or `/colophon`) rather than articles or notes, see [architecture-guide.md § Pages & Layouts](./architecture-guide.md#pages--layouts).
