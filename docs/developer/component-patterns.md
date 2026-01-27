# Component Patterns

TypeScript patterns, component structure, error handling, and organization for building Astro components.

## Import Patterns

**Always use path aliases** — see [architecture-guide.md § TypeScript Path Aliases](./architecture-guide.md#typescript-path-aliases) for complete reference.

Never use relative imports unless importing a component in the same directory.

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

// 4. Component logic (data fetching, calculations, etc.)
const processedData = transformData(required);
---

<!-- 5. Template -->
<div class="component">
  <slot />
</div>

<!-- 6. Styles -->
<style>
  .component {
    /* Use semantic tokens from global.css */
    background: var(--surface-raised);
    color: var(--color-text);
    padding: var(--space-m);
  }
</style>
```

For data fetching with error handling, see [Error Handling Strategies](#error-handling-strategies) below.

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

### Component Variants Pattern

Use `data-*` attributes for variants, with private `--_` prefixed variables for internal state:

```astro
---
interface Props {
  variant?: 'primary' | 'secondary';
}
const { variant = 'primary' } = Astro.props;
---

<button class="button" data-variant={variant}>
  <slot />
</button>

<style>
  .button {
    --_bg: var(--color-accent);
    --_text: var(--color-text);

    background: var(--_bg);
    color: var(--_text);
  }

  .button[data-variant='secondary'] {
    --_bg: transparent;
    --_text: var(--color-accent);
  }
</style>
```

### When to Use `.content-trim`

Apply to any container that:
1. Has padding
2. Receives slotted content (`<slot />`) with margins

```astro
<!-- ✅ Padded container with slot -->
<div class="panel-content content-trim">
  <slot />
</div>

<!-- ❌ No slot, fixed content - don't need it -->
<div class="card-header">
  <h2>{title}</h2>
</div>
```

### Scoped vs Global Styles

**Use scoped `<style>`** (default) for component-specific styles.

**Use `<style is:global>`** when:
- Contributing to a CSS layer (`@layer longform`)
- Styling deeply nested/slotted MDX content

```astro
<!-- Adding to a layer requires is:global -->
<style is:global>
  @layer longform {
    .longform-prose { ... }
  }
</style>
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

See [architecture-guide.md § Component Organization](./architecture-guide.md#component-organization) for the directory structure. Each category uses barrel exports for clean imports.

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
5. Add examples to the styleguide (`src/pages/styleguide/`, viewable at `/styleguide`)
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

## Demo Components

The `demos/` directory is for **one-off interactive components** that accompany specific articles or notes. This is the only place where React and `client:*` directives are permitted.

### When to Use `demos/`

- Demonstrating a React library you've built or are writing about
- Interactive examples that genuinely require client-side state
- One-off experiments that don't fit the site's zero-JS philosophy

### Guidelines

1. **Keep it isolated** - Demo components should be self-contained. Don't import them elsewhere.
2. **Inline styles preferred** - For small demos, inline styles keep everything in one file.
3. **Use `client:load`** - For demos that need to be interactive immediately.
4. **No barrel exports** - These are one-offs, not reusable components.

### Example

```tsx
// src/components/demos/MyDemo.tsx
import { useState } from 'react';
import { SomeLibrary } from 'some-library';

export function MyDemo() {
  const [value, setValue] = useState('');
  return <SomeLibrary value={value} onChange={setValue} />;
}
```

```mdx
// In your article/note
import { MyDemo } from '@components/demos/MyDemo';

<MyDemo client:load />
```

### What NOT to Use `demos/` For

- Site-wide interactive features (use inline `<script>` tags instead)
- Reusable UI components (use `ui/` with Astro components)
- Anything that should work without JavaScript

## Quick Reference

Key principles when building components:

- **TypeScript**: Define clear Props interfaces with sensible defaults (see Component Structure Pattern)
- **Error Handling**: Wrap external API calls in try-catch with fallbacks (see Error Handling Strategies)
- **Styling**: Use semantic CSS variables from `design.md`, test both themes (see Styling Integration)
- **Organization**: Group by function (layout/navigation/ui/mdx), use barrel exports (see Component Organization)
- **Imports**: Always use path aliases (@components/*), never relative imports (see Import Patterns)
