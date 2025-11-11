# Component Patterns

TypeScript patterns, component structure, error handling, and organization for building Astro components.

## TypeScript Patterns

### Component Props Interface

All components define clear TypeScript interfaces:

```typescript
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
  title?: string; // Optional override for expensive operations
}

// Props destructuring with defaults
const { required, optional, withDefault = true, title } = Astro.props;
```

### Import Patterns

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

**Never use relative imports** - they will cause build failures.

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
  /* Component-specific CSS variables */
  :root {
    --component-background: var(--color-bg-dark-200);
    --component-foreground: var(--color-brand-white);
  }

  /* Component styles */
  .component {
    background: var(--component-background);
    color: var(--component-foreground);
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

**Never use base colors directly - always use semantic variables:**

```css
/* ❌ Wrong: Using base color directly */
.component {
  background: var(--color-red-500);
}

/* ✅ Correct: Using semantic variable */
.component {
  background: var(--color-component-bg);
}
```

### Modern CSS Patterns

```css
.component {
  /* Inline flex for alignment control */
  display: inline-flex;
  align-items: baseline;

  /* Smooth transitions */
  transition: opacity 0.2s ease;

  /* currentColor for inherited color */
  border-color: currentColor;
}

.component:hover {
  opacity: var(--component-hover-opacity);
}

/* Responsive with container queries */
@container (width > 400px) {
  .component {
    /* Desktop styles */
  }
}

/* Fluid typography */
.title {
  font-size: clamp(1rem, calc(0.6rem + 1vw), 1.5rem);
}
```

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

### Component with External Data

```astro
---
export interface Props {
  url: string;
  title?: string; // Optional override
}

const { url, title } = Astro.props;

let displayTitle = title;
if (!title) {
  try {
    displayTitle = await fetchTitle(url);
  } catch (error) {
    console.warn('Failed to fetch title:', error);
    displayTitle = new URL(url).hostname;
  }
}
---

<a href={url}>{displayTitle}</a>
```

### Theme-Aware Component

```astro
<div class="component">
  <!-- Content -->
</div>

<style>
  .component {
    /* Use semantic variables that change with theme */
    background: var(--color-component-bg);
    color: var(--color-component-text);
  }
</style>
```

### Responsive Component with Container Queries

```astro
<div class="cq">
  <div class="component">
    <!-- Content -->
  </div>
</div>

<style>
  .cq {
    container-type: inline-size;
  }

  @container (width > 400px) {
    .component {
      /* Wider styles */
    }
  }
</style>
```

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
    &:focus {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    /* Smooth transitions */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
```

## Best Practices

**TypeScript:**

- Define clear interfaces for all props
- Use optional props with sensible defaults
- Leverage TypeScript for type safety

**Error Handling:**

- Wrap external API calls in try-catch
- Always provide fallback behavior
- Log warnings for debugging
- Never let external failures break builds

**Styling:**

- Use semantic CSS variables, not base colors
- Reference `design.md` for theme architecture
- Test both light and dark themes
- Use container queries for component-level responsiveness

**Organization:**

- Group components by function (layout, navigation, ui, mdx)
