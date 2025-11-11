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

**Unique pattern:** Uses Astro's experimental Container API to render MDX components in RSS feeds. This enables all MDX components (Callout, Embed, etc.) to work in RSS output.

📖 **See [content-system.md § RSS Feed Implementation](./content-system.md#rss-feed-implementation) for complete implementation details and code examples**

### Reading Time Injection

Reading time is automatically calculated by a remark plugin (`remark-reading-time.mjs`) and injected into frontmatter as `minutesRead`. Access via `entry.data.minutesRead` - it's **NOT available** through `@utils/seo` functions.

📖 **See [content-system.md § Reading Time Injection](./content-system.md#reading-time-injection) for implementation details**

### Dynamic API Endpoints

TypeScript files with special extensions (`.md.ts`, `.png.ts`) generate dynamic content like markdown exports and OpenGraph images. These are API routes, **not normal page files**.

📖 **See [content-system.md § Dynamic API Endpoints](./content-system.md#dynamic-api-endpoints) for file locations and implementation**

## Performance Essentials

📖 **See [accessibility-and-performance.md](./accessibility-and-performance.md) for detailed patterns and optimization strategies**

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
