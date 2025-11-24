# Component Patterns

TypeScript patterns, component structure, error handling, and organization for building Astro components.

## Import Patterns

```typescript
// ✅ Correct: Category-specific barrel imports
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';

// ✅ Correct: Direct imports when not in barrel
import Callout from '@components/mdx/Callout.astro';

// ✅ Correct: Config and utilities
import { AUTHOR } from '@config/seo';
import { generatePageTitle } from '@utils/seo';
```

**Never use relative imports unless you are importing a component which is in the same directory as the current component**

## Component Structure Pattern

**Standard structure for all Astro components:**

```astro
---
// 1. Imports
import { Image } from 'astro:assets';

// 2. Props Interface
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
}

// 3. Props destructuring with defaults
const { required, optional, withDefault = true } = Astro.props;

// 4. Data fetching with error handling (if needed)
try {
  const data = await fetchData();
} catch (error) {
  console.warn('Failed to fetch data:', error);
  // Implement fallback behavior
}
---

<!-- 5. Template with accessibility attributes -->
<div class="component" role="region" aria-label="Component description">
  <!-- Content -->
</div>

<!-- 6. Styles -->
<style>
  .component {
    /* Use semantic tokens from global.css */
    background: var(--surface-raised);
    color: var(--color-text);
    border: var(--border-width-hairline) solid var(--color-border);
    padding: var(--space-m);
  }
</style>
```

## Error Handling Strategies

### Network Requests

**Always wrap external API calls** in try-catch with fallback:

```typescript
try {
  const result = await externalAPI(url);
  data = result.data;
} catch (error) {
  console.warn(`Failed to fetch data from ${url}:`, error);
  data = fallbackData; // Always provide fallback
}
```

### Graceful Degradation

Principles:

- Provide optional props for manual overrides
- Use sensible defaults
- Ensure components work when external services fail

```typescript
export interface Props {
  url: string;
  title?: string; // Manual override to skip expensive title fetching
  className?: string;
}

const { url, title, className } = Astro.props;

// Use manual title if provided, otherwise fetch
let displayTitle = title;
if (!title) {
  try {
    displayTitle = await fetchTitle(url);
  } catch (error) {
    console.warn('Failed to fetch title, using URL as fallback:', error);
    displayTitle = url;
  }
}
```

## Styling Integration

### CSS Variables and Theming

See `design.md` for complete theming architecture. Key principle:

**Use semantic variables from global.css:**

```css
/* ✅ Correct: Using semantic tokens */
.component {
  background: var(--surface-raised);
  color: var(--color-text);
  border-color: var(--color-accent);
}

/* ✅ Correct: Deriving variants with relative color syntax */
.component:hover {
  background: oklch(from var(--color-accent) calc(l - 0.1) c h);
}

/* ✅ Correct: Using light-dark() for theme-specific values */
.component {
  background: light-dark(var(--color-beige), var(--color-charcoal));
}
```

### Modern CSS Patterns

```css
.component {
  /* Inline flex for alignment control */
  display: inline-flex;
  align-items: baseline;

  /* Smooth transitions using motion tokens */
  transition: opacity var(--duration-fast) var(--ease-in-out);

  /* currentColor for inherited color */
  border-color: currentColor;
}

.component:hover {
  opacity: 0.8;
}

/* Responsive with container queries */
@container (width > 400px) {
  .component {
    /* Wider layout styles */
  }
}

/* Use fluid typography tokens instead of custom clamp() */
.title {
  font-size: var(--font-size-lg);
}
```

### Container Queries vs Media Queries

**Use container queries (`@container`)** for component-level responsiveness:

- Component behavior that depends on its container size
- Cards, panels, or layouts that might appear in different contexts
- Components that need to adapt independently of viewport

```css
/* Parent enables container queries */
.cq {
  container-type: inline-size;
}

/* Component responds to its container, not viewport */
@container (width > 400px) {
  .card {
    grid-template-columns: 1fr 2fr;
  }
}
```

**Use media queries (`@media`)** for page-level layout:

- Overall page structure and column counts
- Navigation breakpoints
- Changes that affect the entire page layout

```css
/* Page layout changes at breakpoints */
@media (min-width: 800px) {
  .page-layout {
    grid-template-columns: 1fr 3fr;
  }
}
```

**General Rule:** If you're styling a component that might appear in different contexts (main content area, sidebar, card grid), use container queries. If you're styling page-level layout structure, use media queries.

## Component Organization

### Directory Structure

```
components/
├── layout/           # Layout and structural components
│   └── index.ts     # Barrel exports
├── navigation/       # Navigation-specific components
│   └── index.ts     # Barrel exports
├── ui/              # Small, reusable UI utilities
│   └── index.ts     # Barrel exports
├── mdx/             # Components for MDX content
│   └── index.ts     # Barrel exports
└── index.ts         # Main component barrel
```

Each category includes barrel exports for clean imports.

### Layout Components vs UI Components

Understanding the distinction between `layout/` and `ui/` components:

**NoteCard (in layout/):**
- Used specifically for notes listings
- Part of the page layout structure
- Tightly coupled to notes display patterns
- Contains rendering logic for MDX content

**ContentCard (in ui/):**
- Generic reusable card component
- Can be used for any content type (articles, notes, toolbox)
- More flexible, accepts arbitrary content
- Focused on presentation over content-specific logic

Both serve similar visual purposes but have different architectural roles. When creating a new card-like component, ask:
- Is it tied to a specific content type or page layout? → `layout/`
- Is it a reusable UI pattern for multiple contexts? → `ui/`

### Barrel Export Pattern

```typescript
// src/components/layout/index.ts
export { default as BaseHead } from './BaseHead.astro';
export { default as Footer } from './Footer.astro';
export { default as MainNavigation } from './MainNavigation.astro';
export { default as NoteCard } from './NoteCard.astro';
```

### Adding New Components

1. Create component in appropriate subdirectory
2. Add TypeScript interface for props
3. Export from subdirectory's `index.ts`
4. Add to main `index.ts` if needed
5. Add examples to `/styleguide`
6. Document in `design.md` if visually significant
7. Run `pnpm run check:all` to verify

## Common Patterns

### Accessible Interactive Component

```astro
---
export interface Props {
  label: string;
  pressed?: boolean;
}

const { label, pressed = false } = Astro.props;
---

<button
  aria-label={label}
  aria-pressed={pressed}
  class="interactive"
>
  <slot />
</button>

<style>
  .interactive {
    /* Visible focus indicators */
    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }

    /* Smooth transitions using motion tokens */
    transition: all var(--duration-normal) var(--ease-in-out);
  }
</style>
```

## Quick Reference

Key principles when building components:

- **TypeScript**: Define clear Props interfaces with sensible defaults (see Component Structure Pattern)
- **Error Handling**: Wrap external API calls in try-catch with fallbacks (see Error Handling Strategies)
- **Styling**: Use semantic CSS variables from `design.md`, test both themes (see Styling Integration)
- **Organization**: Group by function (layout/navigation/ui/mdx), use barrel exports (see Component Organization)
- **Imports**: Always use path aliases (@components/*), never relative imports (see Import Patterns)
