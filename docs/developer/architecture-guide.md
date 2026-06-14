# Architecture Guide

This document covers the core architectural patterns and principles for Danny's personal website. It focuses on the **essential patterns you need daily**. For specialized topics (content, SEO, design tokens, deployment, etc.), consult the other guides in `docs/developer/`.

## Core Architecture Principles

### 1. Static Site with Minimal Client-Side JavaScript ⭐⭐⭐

**Key Points:**

- This is a **statically generated site** - almost everything happens at build time
- Avoid client-side JavaScript wherever possible
- **Build-time JS is fine** (OG image generation, RSS rendering, content processing)
- **Client-side JS is acceptable** when it's genuinely the best solution for a feature
- Prefer modern CSS features over JS (container queries, `:has()`, layers, etc.)
- Progressive enhancement of browser-native features preferred
- NO `client:*` directives used anywhere in this codebase, **except** for one-off demo components in `demos/` (see [component-patterns.md § Demo Components](./component-patterns.md#demo-components))
- Interactive components use inline `<script>` tags (ThemeToggle, MainNavigation, Accordion, Lightbox, MarkdownContentActions)
- All scripts handle ViewTransitions (`astro:after-swap` events)

**Build-Time Generation Examples:**

- OG images (Satori + Resvg)
- RSS feeds with full MDX rendering (Container API)
- Markdown export endpoints
- Content summaries and reading time
- All dynamic routes via `getStaticPaths()`

**Cross-references:**

- See [component-patterns.md](./component-patterns.md) for interactive component patterns
- See [content-system.md](./content-system.md) for build-time content processing

### 2. MDX Component Remapping (Automatic Enhancement) ⭐⭐⭐

**CRITICAL: This pattern is not documented anywhere else**

**What it does:**

- All `<a>` tags in MDX automatically become `SmartLink` components
- All `<img>` tags in MDX automatically become `BasicImage` components
- Transparent to content authors - no imports needed
- Provides automatic enhancements (external icons, security attributes, optimization, responsive images)

**Implementation:**

```typescript
// src/config/mdx-components.ts — a single shared mapping
export const MDX_COMPONENT_REMAPPING = {
  a: SmartLink,               // Auto-detects internal/external, adds icons/attributes
  img: BasicImage,            // Responsive images with optimization
  table: WrappedTable,        // Adds horizontal-scroll wrapper
  'markdown-preview': MarkdownBlock,
  'file-tree': FileTree,
};

// In article/note page templates:
<Content components={MDX_COMPONENT_REMAPPING} />
```

**Location:**

- Mapping defined once in `src/config/mdx-components.ts`
- Used by `src/pages/writing/[...slug]/index.astro` and `src/pages/notes/[...slug]/index.astro`

**How to extend:**

- Add more mappings to `MDX_COMPONENT_REMAPPING` in `src/config/mdx-components.ts` (e.g., `code: CustomCode`)
- Available for any HTML element rendered from markdown
- Components must accept standard HTML element props

**Benefits:**

- Consistency across all content
- No need to import components in every MDX file
- Content authors don't need to know about component enhancements
- Changes to SmartLink/BasicImage automatically apply to all content

### 3. CSS Layers & Theme System ⭐⭐⭐

**CSS Layers Architecture:**

- Six-layer cascade: `reset` → `base` → `typography` → `layout` → `utilities` → `longform`
- Body defaults to `--font-ui` (Figtree) with prose-style links/markers/heading borders applied globally. Use `.ui-style` to opt out of those prose styles for nav/footer/listings; use `.longform-prose` (via `LongFormProseTypography.astro`) to opt **in** to Literata serif for long-form articles.
- `.dark-surface` utility for always-dark components (nav, footer)
- Eliminates need for `!important` or complex specificity battles

**File Structure (`src/styles/`):**

- `global.css` — Entry point: layer order declaration and imports
- `_foundation.css` — Design tokens, font faces, `@property` declarations
- `_reset.css` through `_utilities.css` — One file per layer
- `_verticalflow.css` — Vertical rhythm (part of typography layer, separate for maintainability)

**Colour system:** OKLCH tokens that auto-switch via `light-dark()`; style from semantic tokens and derive variants with relative colour syntax. Full reference in [design-tokens.md](./design-tokens.md).

**Theme Management:** Three modes — `auto` (follows system via `color-scheme`), `light`, `dark`. An inline script in `BaseHead.astro` applies the saved theme before paint (prevents FOUC), persists it in `localStorage` under `theme`, and exposes a small global API (types in `src/types/theme.d.ts`):

```js
window.theme.current; // 'auto' | 'light' | 'dark'
window.theme.set('dark'); // 'auto' | 'light' | 'dark'

// Components react to changes via the theme-changed event:
document.addEventListener('theme-changed', (e) => {
  e.detail.theme; // the chosen mode
  e.detail.resolvedTheme; // 'light' | 'dark' (after resolving 'auto')
});
```

**Why they're related:**

- `light-dark()` values switch automatically based on `color-scheme` property
- Manual override via `data-theme` attribute sets `color-scheme: light` or `dark`
- Allows entire site to re-theme without component changes
- Modern CSS approach (layers 2022+, light-dark() 2024+)

**Cross-references:**

- See [design.md](./design.md) for complete CSS architecture details
- See [design.md](./design.md) for color system specification
- See [component-patterns.md](./component-patterns.md) for theme-aware component patterns

### View Transitions

The site uses the View Transitions API for smooth navigation. Key elements get a `view-transition-name` (the footer is stable; note cards morph between list and detail via a per-id name passed through a CSS variable like `--vt-name: note-${id}`), with animation tuned in `global.css`.

**The one gotcha:** client JS doesn't survive a swap, so every interactive component must re-initialise on `astro:after-swap`:

```javascript
document.addEventListener('astro:after-swap', initComponent);
```

### 4. Centralized Organization with Clear Boundaries ⭐⭐

**Directory Rules:**

**`src/config/`** - Data only (no logic)

- Constants, configuration objects, schemas
- Exported with `as const` for type inference
- Example: `src/config/seo.ts` (AUTHOR, TITLE_TEMPLATES, SCHEMA_CONFIG)

**`src/lib/`** - Build-time plugins and scripts (runs independently)

- Remark/rehype plugins configured in `astro.config.mjs`
- Build scripts that run before Astro processes content
- Not imported by other files - configured externally
- Example: `src/lib/remark-reading-time.mjs` (remark plugin for reading time)

**`src/utils/`** - Shared helper functions (imported throughout codebase)

- Testable business logic
- Consume config from `src/config/`
- Imported by components, pages, and other files
- Called during Astro's component-to-HTML rendering
- Example: `src/utils/seo.ts` (generatePageTitle, generateJSONLD)

**`src/components/`** - Organized by category

- `layout/` - Structural (BaseHead, Footer, MainNavigation)
- `navigation/` - Navigation-specific (NavLink, ThemeToggle)
- `ui/` - Reusable utilities (ContentCard, FormattedDate, Pill)
- `mdx/` - Available in MDX content (Callout, Embed, BasicImage)
- `demos/` - One-off interactive demos for articles/notes (React allowed here)
- Use barrel exports (`index.ts`) for clean imports

**lib/ vs utils/ distinction:**

- ✅ `lib/` - Build-time plugins configured in astro.config.mjs
- ✅ `utils/` - Functions imported by components and pages
- ❌ Don't put importable utilities in `lib/`
- ❌ Don't put build plugins in `utils/`

**When to extract:**

- Config: When data is reused in 2+ places or needs single source of truth
- Utils: When logic is pure, testable, and reusable
- Components: When UI pattern is reused or complex enough to isolate

**Import Dependencies:**

- Pages → can import layouts, components, utils, config
- Layouts → can import components, utils, config
- Components → can import other components, utils, config
- Utils/config → leaf dependencies (no component/page imports)

**Cross-references:**

- See Path Aliases section for import patterns
- See [component-patterns.md](./component-patterns.md) for component organization details

### 5. Type Safety Everywhere ⭐

**Requirements:**

- Strict TypeScript configuration (`extends astro/tsconfigs/strict`)
- Zod schemas for all content collections
- Explicit Props interfaces for all components
- Global type declarations for runtime APIs (`src/types/`)

**Component Props Pattern:**

```typescript
export interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
```

**Content Validation:**

- All content validated at build time via Zod schemas
- See `src/content.config.ts` for schema definitions

**Cross-reference:** See [code-quality.md](./code-quality.md) for type safety best practices

## Critical Patterns

### TypeScript Path Aliases

**ALWAYS use path aliases** - Relative imports will cause build failures.

```typescript
// In .astro files - barrel imports require explicit /index suffix
import { BaseHead, Footer } from '@components/layout/index';
import { FormattedDate, Pill } from '@components/ui/index';
import { NavLink, ThemeToggle } from '@components/navigation/index';
import { Callout, Embed } from '@components/mdx/index';

// In .mdx content - mdx components are auto-imported; do NOT import them
// (an explicit import collides with the auto-injected one and breaks the build)

// Direct imports (when not in barrel export)
import InlineFootnotes from '@components/layout/InlineFootnotes.astro';

// Config, utilities, layouts, assets
import { getConfig } from '@config/config';
import { generatePageTitle } from '@utils/seo';
import Article from '@layouts/Article.astro';
import coverImage from '@assets/articles/my-article/cover.jpg';
```

See `tsconfig.json` for complete list.

1. Always use aliases, never relative imports (`../../components/`)
2. Prefer barrel exports over direct paths
3. In `.astro` files, barrel imports require `/index` suffix (e.g., `@components/layout/index`)
4. In `.mdx` files, `/index` suffix is optional
5. Use direct imports only when component isn't exported from barrel

**Common mistake:**

```typescript
// ❌ Wrong - relative imports will break builds
import BaseHead from '../../components/layout/BaseHead.astro';

// ❌ Wrong in .astro files - missing /index suffix
import { BaseHead } from '@components/layout';

// ✅ Correct in .astro files
import { BaseHead } from '@components/layout/index';
```

### Redirects

Redirects configured in `src/config/redirects.ts` - DO NOT BREAK THESE URLs:

- `/meeting` → `https://cal.com/dannysmith`
- `/cv` → `/cv-danny-smith.pdf`
- `/linkedin` → LinkedIn profile
- `/youtube` → YouTube channel
- `/working` → `https://betterat.work`
- `/toolbox` → `https://betterat.work/toolbox`
- `/using` → Notion doc (tools Danny uses)
- `/remote`, `/rtotd` → Notion doc (remote work tips)
- `/music`, `/singing` → music/singing YouTube (`youtube.com/dannysmithblues`)

**Important:** No trailing slashes in target URLs (causes redirect loops).

### Content Filtering Rules

✅ **Content filtering is centralized in `@utils/content`:**

- `filterContentForPage()` - For individual content pages (includes styleguide in dev)
- `filterContentForListing()` - For listings and RSS (always excludes styleguide)

All RSS feeds, markdown export endpoints, and page routes use these centralized functions.

**Rules:**

- `draft: true` → hidden in production (both individual pages and listings); visible in development
- `styleguide: true` → accessible by direct URL in any environment, but never appears in listings or RSS feeds

📖 **See [content-system.md § Content Filtering](./content-system.md#content-filtering) for implementation details**

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

## Component Organization

### Directory Structure

```
src/
├── components/       # Organized by type with barrel exports
│   ├── layout/      # Structural (BaseHead, Footer, etc.)
│   ├── navigation/  # Nav-specific
│   ├── ui/          # Reusable utilities (FormattedDate, Pill, etc.)
│   ├── mdx/         # Available in MDX content (Callout, Embed, etc.)
│   └── demos/       # One-off interactive demos (React OK here)
├── config/          # Constants and configuration (data only)
├── lib/             # Build-time plugins and scripts (runs independently)
├── utils/           # Shared helper functions (imported throughout codebase)
```

## Pages & Layouts

### Layouts

Four layouts in `src/layouts/`:

- **`Article.astro`** — articles only.
- **`Note.astro`** — notes only.
- **`Page.astro`** — any simple standalone MDX page (eg `/now`, `/ai`, `/colophon`, `/privacy`). Renders a display-font uppercase title (+ optional subtitle) then your content in a centred `.flow` column. Frontmatter props: `title` (required), `subtitle?`, `description?`, and `headingAlign?`.
- **`BasicPage.astro`** — the barebones: nav, footer, your content, nothing else. Used rarely, for when you want a real page shell without `Page.astro`'s heading.

### Creating one-off pages in `src/pages/`

**Simple content pages** (no real custom design) — write a routed `.mdx` like `now.mdx` / `ai.mdx`: frontmatter with `layout: '@layouts/Page.astro'` plus the props above, then markdown. All the usual MDX components are available (auto-imported via `astro-auto-import`) and the remark plugins apply — including `remarkPageComponents`, which wires up the same `a`/`img`/etc. remapping that collection content gets.

**Pages with bespoke designs** — make a `thing.astro` that duplicates the shell from `BasicPage.astro` and write the content/styling directly as HTML/Astro/CSS. If part of such a page is genuinely better as MDX, split it: `thing/index.astro` imports a sibling `thing/_thing.mdx` and renders its `<Content />`. Only do this when MDX really is the best tool for that content.

`BasicPage.astro` is for the occasional case between these two and should rarely be used.

## Styleguide

A multi-page visual styleguide lives in `src/pages/styleguide/` (public at `/styleguide`). It's where visual components, typography, tokens and raw HTML defaults are rendered together — update it as needed when you add or change anything visual. See `src/pages/styleguide/CLAUDE.md` for its directory structure and how to add a section.

## Testing Strategy

Test business logic, user interactions, and edge cases; don't test trivial UI rendering or third-party internals. See [testing.md](./testing.md) for the full strategy.

## External Documentation

Check Context7 first for framework/library docs (e.g. `/withastro/docs`), then web search. For our CSS layer architecture, [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) is the reference — our order is reset → base → typography → layout → utilities → longform.
