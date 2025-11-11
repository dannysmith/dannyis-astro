# Architecture Guide

This document covers the core architectural patterns and principles used in Astro Editor. It focuses on the **essential patterns you need daily**. For specialized topics, see the [Specialized Guides](#specialized-guides) section.

## Core Architecture Principles

### 1. [TODO WILL FILL IN LATER]

### 2. [TODO WILL FILL IN LATER]

## Critical Patterns

### TypeScript Path Aliases

**ALWAYS use path aliases** - Relative imports will cause build failures.

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

### Redirects

Redirects configured in `astro.config.mjs` - DO NOT BREAK THESE URLs:

- `/meeting` → `https://cal.com/dannysmith`
- `/cv` → `/cv-danny-smith.pdf`
- `/linkedin` → LinkedIn profile
- `/youtube` → YouTube channel
- `/working` → `https://betterat.work`
- `/toolbox` → `https://betterat.work/toolbox`
- `/tools` → `/toolbox`
- `/using` → Notion doc (tools Danny uses)
- `/remote`, `/rtotd` → Notion doc (remote work tips)
- `/music`, `/singing` → YouTube channel

**Important:** No trailing slashes in target URLs (causes redirect loops).

### Content Filtering Rules

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

### External Link Security

All external links must include security attributes. Markdown links get automatic security via `rehype-external-links`:

For HTML in components, **always include** security attributes:

```astro
<!-- ✅ Correct -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>

<!-- ✅ Preserve rel="me" for identity links -->
<a href="https://mastodon.social/@user" rel="me" target="_blank">Profile</a>

<!-- ❌ Wrong - missing security attributes -->
<a href="https://example.com" target="_blank">Link</a>
```

### RSS Container API

**Unique pattern:** Uses Astro's experimental Container API to render MDX components in RSS feeds.

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

- Enables full MDX component rendering in RSS feeds
- All MDX components (Callout, Embed, etc.) work in RSS
- API is experimental - could change in Astro updates
- Used identically in all 3 RSS files (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`)

See `content-system.md` for full RSS architecture.

### Reading Time Injection

Reading time is injected by a remark plugin during markdown parsing.

1. `remark-reading-time.mjs` (root directory) calculates reading time
2. Plugin injects `minutesRead` into `data.astro.frontmatter`
3. Access via `entry.data.minutesRead`
4. **NOT available** through `@utils/seo` functions

```astro
---
import { getEntry } from 'astro:content';

const article = await getEntry('articles', 'my-article');
const readingTime = article.data.minutesRead; // From remark plugin
---

<p>Reading time: {readingTime} min</p>
```

### Dynamic API Endpoints

TypeScript files with special extensions generate dynamic content - **not normal page files**.

#### Markdown Export (.md.ts)

```
src/pages/writing/[...slug].md.ts  → Exports markdown version of articles
src/pages/notes/[...slug].md.ts    → Exports markdown version of notes
```

These are API routes that return `.md` files on request.

#### Image Generation (.png.ts)

```
src/pages/writing/[...slug]/og-image.png.ts  → OpenGraph images for articles
src/pages/notes/[...slug]/og-image.png.ts    → OpenGraph images for notes
```

Generate PNG images using `@vercel/og` + `satori` + `@resvg/resvg-js`.

**Gotcha:** `@resvg/resvg-js` is excluded from Vite optimization in `astro.config.mjs`.

## Performance Essentials

📖 **See [accessability-and-performance.md](./accessability-and-performance.md) for detailed patterns and optimization strategies**

## Component Organization

### Directory Structure

```
src/
├── components/       # Organized by type with barrel exports
│   ├── layout/      # Structural (BaseHead, Footer, etc.)
│   ├── navigation/  # Nav-specific
│   ├── ui/          # Reusable utilities (FormattedDate, Pill, etc.)
│   └── mdx/         # Available in MDX content (Callout, Embed, etc.)
```

## Testing Strategy

### What to Test

- ✅ Business logic and algorithms (unit tests)
- ✅ User interactions (component tests)
- ✅ Edge cases and error handling

### What NOT to Test

- ❌ Simple UI rendering
- ❌ Third-party library internals
- ❌ Trivial getters/setters

### Test Types

1. **Unit Tests**: Individual functions and modules in `lib/`
2. **Integration Tests**: How multiple units work together
3. **Component Tests**: User interactions and workflows

📖 **See [testing.md](./testing.md) for comprehensive testing strategies**

## Quick Start for New Sessions

1. **Read** `docs/TASKS.md` for current work
2. **Check** git status and recent commits
3. **Reference** this guide for core patterns
4. **Consult** specialized guides when working on specific features
5. **Follow** established patterns - don't reinvent
6. **Test** changes thoroughly
7. **Run** `pnpm run check:all` before committing
