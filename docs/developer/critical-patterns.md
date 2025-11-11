# Critical Patterns

**Read this first** to avoid breaking the site. These patterns are critical because they either break builds, break important URLs, or represent unique/non-obvious implementations.

## TypeScript Path Aliases

**ALWAYS use path aliases** - Relative imports will cause build failures.

### Available Aliases

```typescript
// Component barrel imports (preferred)
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';
import { Callout, Embed } from '@components/mdx';

// Direct imports (when not in barrel export)
import BaseHead from '@components/layout/BaseHead.astro';

// Config, utilities, layouts, assets
import { AUTHOR } from '@config/seo';
import { generatePageTitle } from '@utils/seo';
import Article from '@layouts/Article.astro';
import coverImage from '@assets/articles/my-article/cover.jpg';
```

See `tsconfig.json` for complete list.

### Rules

1. Always use aliases, never relative imports (`../../components/`)
2. Prefer barrel exports (`@components/ui`) over direct paths
3. Use direct imports only when component isn't exported from barrel

**Common mistake:**

```typescript
// ❌ Wrong - will break builds
import BaseHead from '../../components/layout/BaseHead.astro';

// ✅ Correct
import { BaseHead } from '@components/layout';
```

## Critical Redirects

**14 redirects configured in `astro.config.mjs`** - DO NOT BREAK THESE URLs:

### Personal Links

- `/meeting` → `https://cal.com/dannysmith`
- `/cv` → `/cv-danny-smith.pdf`
- `/linkedin` → LinkedIn profile
- `/youtube` → YouTube channel

### External Projects

- `/working` → `https://betterat.work`
- `/toolbox` → `https://betterat.work/toolbox`
- `/tools` → `/toolbox`

### Resource Pages

- `/using` → Notion doc (tools Danny uses)
- `/remote`, `/rtotd` → Notion doc (remote work tips)
- `/music`, `/singing` → YouTube channel

**Important:** No trailing slashes in target URLs (causes redirect loops).

## Content Filtering Rules

**GOTCHA:** Content filtering logic is duplicated across multiple files. Change in one place, update everywhere.

### Filtering Logic

```typescript
const isPublishable = entry => {
  if (import.meta.env.PROD) {
    return entry.data.draft !== true && !entry.data.styleguide;
  }
  return true; // Development shows everything
};
```

### Where This Appears

- `/src/pages/rss.xml.js`
- `/src/pages/rss/articles.xml.js`
- `/src/pages/rss/notes.xml.js`
- `/src/pages/writing/[...slug].md.ts`
- `/src/pages/notes/[...slug].md.ts`
- Article/note index pages

**Rules:**

- `draft: true` → hidden in production
- `styleguide: true` → hidden in production
- Development mode shows all content

## Content File Naming

**Strict naming required** - Content won't be discovered if named incorrectly.

### Required Format

```
Articles: YYYY-MM-DD-descriptive-slug.{md,mdx}
Notes:    YYYY-MM-DD-descriptive-slug.{md,mdx}
```

### Ignored Files

Files starting with underscore are ignored:

```typescript
// src/content.config.ts
loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' });
```

Use `_draft-article.mdx` for work-in-progress.

### Examples

```
✅ 2025-01-15-my-article.mdx
✅ 2024-12-01-quick-note.md
❌ my-article.mdx (missing date)
❌ 01-15-2025-article.mdx (wrong date format)
❌ 2025-1-15-article.mdx (single-digit month/day)
```

## External Link Security

All external links must include security attributes.

### Automatic (Markdown/MDX)

Markdown links get automatic security via `rehype-external-links`:

```mdx
[External Link](https://example.com)

<!-- Automatically becomes: -->

<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Link
</a>
```

### Manual (Astro Components)

For HTML in components, **always include** security attributes:

```astro
<!-- ✅ Correct -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>

<!-- ✅ Preserve rel="me" for identity links -->
<a href="https://mastodon.social/@user" rel="me" target="_blank">Profile</a>

<!-- ❌ Wrong - missing security attributes -->
<a href="https://example.com" target="_blank">Link</a>
```

**Why:** Prevents `window.opener` vulnerabilities (tabnabbing attacks).

## RSS Container API

**Unique pattern:** Uses Astro's experimental Container API to render MDX components in RSS feeds.

### Implementation

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';

export async function GET(context) {
  // Initialize container with MDX renderer
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  // Get and filter entries
  const entries = await getCollection('articles');
  const publishable = entries.filter(/* filtering rules */);

  // Render each entry to HTML
  for (const entry of publishable) {
    const { Content } = await render(entry);
    const html = await container.renderToString(Content);
    // Add to RSS feed
  }
}
```

### Why This Matters

- Enables full MDX component rendering in RSS feeds
- All MDX components (Callout, Embed, etc.) work in RSS
- API is experimental - could change in Astro updates
- Used identically in all 3 RSS files (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`)

See `content-system.md` for full RSS architecture.

## Reading Time Injection

**NOT from SEO utilities** - Reading time is injected by a remark plugin during markdown parsing.

### How It Works

1. `remark-reading-time.mjs` (root directory) calculates reading time
2. Plugin injects `minutesRead` into `data.astro.frontmatter`
3. Access via `entry.data.minutesRead`
4. **NOT available** through `@utils/seo` functions

### Usage

```astro
---
import { getEntry } from 'astro:content';

const article = await getEntry('articles', 'my-article');
const readingTime = article.data.minutesRead; // From remark plugin
---

<p>Reading time: {readingTime} min</p>
```

**Don't look for it in SEO utils** - it's frontmatter data only.

## Dynamic API Endpoints

TypeScript files with special extensions generate dynamic content - **not normal page files**.

### Markdown Export (.md.ts)

```
src/pages/writing/[...slug].md.ts  → Exports markdown version of articles
src/pages/notes/[...slug].md.ts    → Exports markdown version of notes
```

These are API routes that return `.md` files on request.

### Image Generation (.png.ts)

```
src/pages/writing/[...slug]/og-image.png.ts  → OpenGraph images for articles
src/pages/notes/[...slug]/og-image.png.ts    → OpenGraph images for notes
```

Generate PNG images using `@vercel/og` + `satori` + `@resvg/resvg-js`.

**Gotcha:** `@resvg/resvg-js` is excluded from Vite optimization in `astro.config.mjs`.

## Common Mistakes

### Wrong Check Command

**❌ Wrong:**

```bash
pnpm run check
```

**✅ Correct:**

```bash
pnpm run check:all  # Runs types → format → lint → tests
```

The `check` command doesn't exist. Always use `check:all`.

### Relative Imports

**❌ Wrong:**

```typescript
import BaseHead from '../../components/layout/BaseHead.astro';
```

**✅ Correct:**

```typescript
import { BaseHead } from '@components/layout';
```

### Missing External Link Security

**❌ Wrong:**

```astro
<a href="https://example.com">Link</a>
```

**✅ Correct:**

```astro
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>
```

Markdown links are automatic, but manual HTML needs explicit attributes.

### Changing Filtering Logic Partially

Content filtering is duplicated in 5+ files. Update all occurrences, not just one.

### Looking for Reading Time in Wrong Place

Reading time comes from remark plugin (`minutesRead` in frontmatter), not `@utils/seo`.
