# Critical Patterns

**These patterns will break the site if you get them wrong.** Read this before making structural changes.

## TypeScript Path Aliases

The project uses TypeScript path aliases for clean imports. **Using incorrect import paths will cause build failures.**

### Available Aliases

See `tsconfig.json` for the canonical list. Key aliases:

```typescript
// Component imports (RECOMMENDED)
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';
import { Callout, Embed, BookmarkCard } from '@components/mdx';

// Direct component imports (when barrel export doesn't include it)
import BaseHead from '@components/layout/BaseHead.astro';
import Callout from '@components/mdx/Callout.astro';

// Config and utilities
import { AUTHOR, TITLE_TEMPLATES } from '@config/seo';
import { generatePageTitle, validateSEOData } from '@utils/seo';

// Layouts and assets
import Article from '@layouts/Article.astro';
import coverImage from '@assets/articles/my-article/cover.jpg';
```

### Path Alias Rules

1. **Always use aliases** - Never use relative imports like `../../components/`
2. **Check barrel exports first** - Use category imports when available (`@components/ui` over direct paths)
3. **Direct imports for missing exports** - Some components aren't in barrel exports (see CODEBASE-ISSUES.md)

### Common Import Errors

**❌ Wrong:**
```typescript
import BaseHead from '../../components/layout/BaseHead.astro';
import { AUTHOR } from '../../config/seo';
```

**✅ Correct:**
```typescript
import { BaseHead } from '@components/layout';
import { AUTHOR } from '@config/seo';
```

## Critical Redirects

**14 redirects configured in `astro.config.mjs`** - Do not break these URLs:

### Personal Links
- `/meeting` → `https://cal.com/dannysmith` (booking link)
- `/cv` → `/cv-danny-smith.pdf` (resume)
- `/linkedin` → LinkedIn profile
- `/youtube` → YouTube channel

### External Projects
- `/working` → `https://betterat.work` (main project)
- `/toolbox` → `https://betterat.work/toolbox`
- `/tools` → `/toolbox` (internal redirect to toolbox page)

### Resource Pages
- `/using` → Notion doc (tools Danny uses)
- `/remote`, `/rtotd` → Notion doc (remote work tips)
- `/music`, `/singing` → YouTube channel

**Important:** No trailing slashes in redirect target URLs (causes redirect loops).

## Content Filtering Rules

Content is filtered in multiple places. **Keep these rules consistent:**

### Filtering Logic

```typescript
// Production filtering (applied in RSS feeds and dynamic routes)
const isPublishable = (entry) => {
  // In production: exclude drafts and styleguide content
  if (import.meta.env.PROD) {
    return entry.data.draft !== true && !entry.data.styleguide;
  }
  // In development: show everything
  return true;
};
```

### Where Filtering Applies

Filtering is used in:
- `/src/pages/rss.xml.js` (combined feed)
- `/src/pages/rss/articles.xml.js` (articles feed)
- `/src/pages/rss/notes.xml.js` (notes feed)
- `/src/pages/writing/[...slug].md.ts` (article markdown export)
- `/src/pages/notes/[...slug].md.ts` (note markdown export)
- Article/note index pages

**Gotcha:** Filtering logic is duplicated across files. Change in one place, update all places.

### Draft Content Rules

- `draft: true` in frontmatter → Hidden in production
- `styleguide: true` in frontmatter → Hidden in production (for styleguide examples)
- Development mode shows all content regardless of draft status

## RSS Feed Architecture

**Unique pattern:** Uses Astro's experimental Container API to render MDX components in RSS context.

### Container API Pattern

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';

export async function GET(context) {
  // Initialize container with MDX renderer
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  // Get and filter collection entries
  const entries = await getCollection('articles');
  const publishable = entries.filter(/* filtering rules */);

  // Render each entry to HTML string
  for (const entry of publishable) {
    const { Content } = await render(entry);
    const html = await container.renderToString(Content);
    // Add to RSS feed
  }
}
```

### Why This Matters

- Full MDX component rendering in RSS feeds
- All MDX components (Callout, Embed, etc.) work in RSS output
- Marked "experimental" - API could change in Astro updates
- Used identically in all 3 RSS files

### RSS Feed URLs

- `/rss.xml` - Combined articles + notes
- `/rss/articles.xml` - Articles only
- `/rss/notes.xml` - Notes only

## Dynamic API Endpoints

**TypeScript files generate dynamic content** - These aren't normal page files.

### .md.ts Files (Markdown Export)

```
src/pages/writing/[...slug].md.ts  → Exports markdown version of articles
src/pages/notes/[...slug].md.ts    → Exports markdown version of notes
```

These are **API route endpoints** that return `.md` files on request.

### .png.ts Files (Image Generation)

```
src/pages/writing/[...slug]/og-image.png.ts  → Generates OG images for articles
src/pages/notes/[...slug]/og-image.png.ts    → Generates OG images for notes
```

These generate PNG images dynamically using `@vercel/og` + `satori` + `@resvg/resvg-js`.

**Gotcha:** `@resvg/resvg-js` is excluded from Vite optimization (see `astro.config.mjs`).

## Reading Time Calculation

**Reading time is NOT from SEO utilities** - It's injected by a remark plugin.

### How It Works

1. `remark-reading-time.mjs` calculates reading time during markdown parsing
2. Plugin injects `minutesRead` into `data.astro.frontmatter`
3. Access via `entry.data.minutesRead` or directly from frontmatter
4. **NOT available** through `@utils/seo` functions

### Usage

```astro
---
import { getEntry } from 'astro:content';

const article = await getEntry('articles', 'my-article');
const readingTime = article.data.minutesRead; // Injected by remark plugin
---

<p>Reading time: {readingTime} min</p>
```

**Don't look for it in SEO utils** - it's frontmatter data only.

## External Link Security

All external links must include security attributes to prevent vulnerabilities.

### Automatic (Markdown/MDX)

Markdown links get automatic security via `rehype-external-links` plugin:

```mdx
[External Link](https://example.com)
<!-- Automatically becomes: -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External Link</a>
```

### Manual (Astro Components)

For HTML links in components, **always include** `target="_blank" rel="noopener noreferrer"`:

```astro
<!-- ✅ Correct -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Link
</a>

<!-- ✅ Also correct: Preserve rel="me" for identity links -->
<a href="https://mastodon.social/@user" rel="me" target="_blank">
  Social Profile
</a>

<!-- ❌ Wrong: Missing security attributes -->
<a href="https://example.com" target="_blank">External Link</a>
```

### Why This Matters

- Prevents `window.opener` vulnerabilities (tabnabbing attacks)
- Opens links in new tabs (better UX)
- Required for security best practices

## Toolbox Data Automation

**Automated scraping system** pulls tool data from external source.

### How It Works

1. **Script**: `scripts/get-toolbox-json.ts` (Puppeteer)
2. **Source**: `https://betterat.work/toolbox`
3. **Schedule**: GitHub Action runs daily at 2 AM UTC
4. **Storage**: Data saved to `src/content/toolboxPages.json`

### GitHub Action Details

File: `.github/workflows/update-toolbox.yml`

- **Change detection**: Only commits when data actually changes
- **Failure handling**: Auto-creates GitHub issue after 3 consecutive failures
- **Manual trigger**: Can run via workflow_dispatch
- **Auto-recovery**: Resets failure counter on successful runs

### Content Collection

```typescript
// src/content.config.ts
const toolboxPages = defineCollection({
  loader: file('src/content/toolboxPages.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
  }),
});
```

Access via: `await getCollection('toolboxPages')`

## Markdown Plugins Configuration

**Custom remark/rehype plugins** modify content during build.

### Active Plugins

Configured in `astro.config.mjs`:

**Remark plugins:**
- `remarkReadingTime` - Injects `minutesRead` into frontmatter
- Built-in Mermaid diagram support

**Rehype plugins:**
- `rehype-heading-ids` - Adds IDs to headings
- `rehype-autolink-headings` - Makes headings clickable
- `rehype-external-links` - Adds `target="_blank" rel="noopener noreferrer"` to external links

### Reading Time Plugin

File: `remark-reading-time.mjs` (root directory, not in src/)

```javascript
// Plugin directly modifies frontmatter AST
export function remarkReadingTime() {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);

    // Inject into frontmatter
    file.data.astro.frontmatter.minutesRead = readingTime.minutes;
  };
}
```

**Important:** This is why reading time isn't centralized - it happens during markdown parsing.

## Content File Naming

**Strict naming conventions** - Content won't be discovered if named incorrectly.

### Required Format

```
Articles: YYYY-MM-DD-descriptive-slug.{md,mdx}
Notes:    YYYY-MM-DD-descriptive-slug.{md,mdx}
```

### Ignored Files

Files starting with underscore are **ignored** by glob pattern:

```typescript
// src/content.config.ts
loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' })
```

Use `_draft-article.mdx` for work-in-progress that shouldn't be picked up.

### Examples

```
✅ 2025-01-15-my-article.mdx
✅ 2024-12-01-quick-note.md
❌ my-article.mdx (missing date)
❌ 01-15-2025-article.mdx (wrong date format)
❌ 2025-1-15-article.mdx (single digit month/day)
```

## Theme Management

**Global theme API** provides theme switching without page reloads.

### Theme System

```javascript
// Available globally as window.theme
window.theme = {
  current: 'auto' | 'light' | 'dark',
  set(theme) { /* switches theme */ },
  initialize() { /* sets up theme on page load */ }
};
```

### Theme Storage

- Persisted in `localStorage` as `'theme'`
- Applied via `data-theme` attribute on `:root` element
- Supports auto (system preference), light, and dark

### ViewTransitions Support

Theme system automatically handles Astro ViewTransitions:

```astro
<ViewTransitions />
<!-- Theme persists across page transitions -->
```

### Theme-Changed Events

Components can listen for theme changes:

```javascript
document.addEventListener('theme-changed', (event) => {
  console.log('New theme:', event.detail.theme);
});
```

## Configuration Files

**Single source of truth** for various settings.

### SEO Configuration

**File:** `src/config/seo.ts`

Change personal branding here:
- `AUTHOR` - Name, job title, email, website, image, description
- `ORGANIZATION` - Business info
- `SOCIAL_PROFILES` - Social media URLs
- `TITLE_TEMPLATES` - Page title formatting
- `PAGE_DESCRIPTIONS` - Default descriptions

All SEO utilities pull from this file.

### Site Constants

**File:** `src/consts.ts`

Generic site strings:
- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_URL`

**Gotcha:** Personal branding is in `seo.ts`, generic strings in `consts.ts`. Update both for rebranding.

## Build Configuration

**File:** `astro.config.mjs`

### Critical Settings

- **Redirects**: 14 redirects configured
- **Vite optimizations**: Excludes `@resvg/resvg-js`
- **Markdown plugins**: Remark + rehype configuration
- **Expressive Code**: Dracula-soft theme with no frame shadows
- **Compatibility**: `headingIdCompat: true` for heading ID generation

### When to Update

- Adding redirects (personal links, external projects)
- Changing markdown behavior (adding plugins)
- Modifying syntax highlighting (Expressive Code config)
- Adjusting Vite optimization (dependency exclusions)

## Error Patterns to Avoid

### 1. Using `pnpm run check`

**❌ Wrong:**
```bash
pnpm run check
```

**✅ Correct:**
```bash
pnpm run check:all  # Runs types, format, lint, tests
```

The `check` command doesn't exist. Use `check:all` for full quality gates.

### 2. Importing Components with Relative Paths

**❌ Wrong:**
```typescript
import BaseHead from '../../components/layout/BaseHead.astro';
```

**✅ Correct:**
```typescript
import { BaseHead } from '@components/layout';
```

Use path aliases to prevent import errors.

### 3. Forgetting External Link Security

**❌ Wrong:**
```astro
<a href="https://example.com">Link</a>
```

**✅ Correct:**
```astro
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>
```

Markdown links are handled automatically, but manual HTML needs explicit attributes.

### 4. Modifying Filtering Logic in One Place

Content filtering is duplicated in 5+ files. Change filtering rules everywhere, not just RSS feeds.

### 5. Looking for Reading Time in SEO Utils

Reading time comes from remark plugin (`minutesRead` in frontmatter), not `@utils/seo`.
