# Architecture Guide

This document covers the core architectural patterns and principles for Danny's personal website. It focuses on the **essential patterns you need daily**. For specialized topics, consult the [specialized guides](./README.md#tier-3-specialized-references).

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
// In article/note page templates
const components = {
  a: SmartLink,    // Auto-detects internal/external, adds icons/attributes
  img: BasicImage, // Responsive images with optimization
};

<Content components={components} />
```

**Location:**

- `src/pages/writing/[...slug]/index.astro:23-27`
- `src/pages/notes/[...slug]/index.astro` (similar pattern)

**How to extend:**

- Add more mappings to the `components` object (e.g., `code: CustomCode`)
- Available for any HTML element rendered from markdown
- Components must accept standard HTML element props

**Benefits:**

- Consistency across all content
- No need to import components in every MDX file
- Content authors don't need to know about component enhancements
- Changes to SmartLink/BasicImage automatically apply to all content

### 3. CSS Layers & Theme System ⭐⭐⭐

**CSS Layers Architecture:**

- Seven-layer cascade system: `reset` → `base` → `typography` → `layout` → `utilities` → `longform` → `theme`
- Prose typography is the **default** - use `.ui-style` to opt-out for UI areas
- `.dark-surface` utility for always-dark components (nav, footer)
- Eliminates need for `!important` or complex specificity battles
- Location: `src/styles/global.css:2`

**Color System with `light-dark()`:**

- Colors use `light-dark()` function for automatic theme switching
- Semantic tokens: `--color-accent`, `--color-text`, `--color-background`, etc.
- Adaptive palette: `--color-coral`, `--color-purple`, etc. auto-switch for theme
- Derive variants with relative color syntax: `oklch(from var(--color-accent) calc(l - 0.1) c h)`

**Theme Management:**

- Three modes: `auto` (follows system via `color-scheme`), `light`, `dark`
- Global `window.theme` API for programmatic access
- Inline script in `BaseHead.astro` prevents FOUC
- Custom `theme-changed` event for component updates
- localStorage persistence across sessions
- Tab synchronization via `storage` event

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

The site uses the View Transitions API for smooth page navigation. Key elements have named transitions:

**CSS Setup (in global.css or component styles):**

```css
/* Footer stays stable during navigation */
footer {
  view-transition-name: site-footer;
}

/* Note cards morph between list and detail views */
.note {
  view-transition-name: var(--vt-name, none);
  view-transition-class: note-card;
}

/* Animation configuration (in global.css) */
::view-transition-group(site-footer) {
  animation-duration: 250ms;
  animation-timing-function: ease-in-out;
}
```

**Dynamic transition names via CSS variable:**

```astro
<!-- Pass unique ID via inline style -->
<div class="note-container" style={`--vt-name: note-${note.id}`}>
  <NoteCard ... />
</div>
```

**Scripts must handle transitions:**

All interactive components re-initialize on `astro:after-swap`:

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
- `styleguide/` - Styleguide page helpers (not for general use)
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

// In .mdx files - /index suffix is optional
import { Callout, Embed } from '@components/mdx';

// Direct imports (when not in barrel export)
import InlineFootnotes from '@components/layout/InlineFootnotes.astro';

// Config, utilities, layouts, assets
import { AUTHOR } from '@config/seo';
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
│   ├── mdx/         # Available in MDX content (Callout, Embed, etc.)
│   ├── styleguide/  # Styleguide page helpers (not for general use)
│   └── demos/       # One-off interactive demos (React OK here)
├── config/          # Constants and configuration (data only)
├── lib/             # Build-time plugins and scripts (runs independently)
├── utils/           # Shared helper functions (imported throughout codebase)
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

## External Documentation

### Using Context7 for Astro Documentation

**Always check Context7 first** before web searching for Astro-specific questions:

```
mcp__context7__get-library-docs with context7CompatibleLibraryID: /withastro/docs
```

This provides access to 2400+ code snippets and comprehensive Astro documentation.

### Key External Resources

**CSS Layers** - Central to our styling architecture:

- See [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) for specification
- Our layer order: reset → base → typography → layout → utilities → longform → theme

### General Principle

1. Check Context7 for framework/library docs (`mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`)
2. Use web search if Context7 lacks the specific information
3. Reference codebase examples when documentation is unclear

## Quick Start for New Sessions

1. **Read** `docs/tasks.md` for current work
2. **Check** git status and recent commits
3. **Reference** this guide for core patterns
4. **Consult** specialized guides when working on specific features
5. **Follow** established patterns - don't reinvent
6. **Test** changes thoroughly
7. **Run** `bun run check:all` before committing
