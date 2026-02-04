# Design & Styling Guide

Visual philosophy, CSS architecture, and design patterns for Danny's personal website.

## Design Philosophy

### Core Aesthetic

**Clean, typographically-driven, experimental** - A personal zine-meets-manifesto with strong visual identity.

This site serves two purposes:

1. **Content Platform** - Share thoughts, experiences, and work
2. **Creative Playground** - Experiment with CSS, HTML, and AI-assisted development

### Design Values

- **Simplicity** - Minimal dependencies, clean code, straightforward UX
- **Content-First** - Design prioritizes readability and accessibility
- **Authenticity** - Reflects personal style and values
- **Performance** - Fast loading, optimal experience across devices
- **Fun** - Managing the site should be enjoyable, not a chore

### Visual Inspirations

- **Constructivist and modernist layouts** (El Lissitzky, Jan Tschichold, Paul Schuitema)
- **Mid-century grid systems** with asymmetric balance and bold diagonals
- **Monochrome/minimal colour palettes** with accent tones (red, coral, cream)
- **Notion-style simplicity** with expressive typographic play

---

## CSS Philosophy

### Core Principles

The CSS system is designed around these principles:

1. **Rely on global defaults** - Use the global styles (`global.css`) as a base
2. **Prose is the default** - Typography layer assumes article content; opt-out for UI
3. **Adaptive by default** - Colors auto-switch for light/dark via `light-dark()`
4. **Semantic tokens** - Use role-based variables, not hardcoded values
5. **Modern CSS features** - Nesting, container queries, `:has()`, relative colors
6. **Keep it simple** - Don't over-engineer; less CSS is better CSS

### The Opt-Out Pattern

**Key architectural decision:** The `@typography` layer sets prose defaults (serif font, underlined links, colored markers, heading borders). This means:

- **Articles and notes** - Just work, no styling needed
- **UI areas** (nav, footer, listing pages) - Apply `.ui-style` to opt-out

```css
/* ❌ Don't fight the defaults */
.my-nav a {
  text-decoration: none;  /* fighting @typography */
  color: inherit;         /* fighting @typography */
  font-family: var(--font-ui); /* changing font */
}

/* ✅ Use the utility */
<nav class="ui-style">
  <!-- Links automatically have no underline, inherit color, use UI font -->
</nav>
```

### What NOT to Write

Before adding CSS, check if it's already handled:

| Don't write this | It's already in... |
|------------------|-------------------|
| `font-family: serif` on body | `@typography` |
| Link underlines and colors | `@typography` |
| List marker colors | `@typography` |
| Heading sizes and borders | `@typography` |
| Body background color | `@base` |
| Button base styles | `@base` |
| Table styles | `@base` |
| Box-sizing border-box | `@reset` |
| Focus outline offset | `@reset` |

---

## CSS Architecture

### Layer System

Six layers control the cascade (defined in `src/styles/global.css`):

```css
@layer reset, base, typography, layout, utilities, longform;
```

Each layer has a specific purpose:

#### 1. Reset Layer (`@layer reset`)

**Purpose:** Browser normalization and sensible defaults with zero specificity via `:where()`.

Never modify directly without asking the user first. These are foundational defaults.

#### 2. Base Layer (`@layer base`)

**Purpose:** Site-wide foundations that apply everywhere, but are not about typography.

**When to add here:** Only for truly global element defaults that should apply site-wide regardless of context.

#### 3. Typography Layer (`@layer typography`)

**Purpose:** Default global typography.

Everything inherits these styles but UI areascan opt out of most of it using `.ui-style`.

#### 4. Layout Layer (`@layer layout`)

**Purpose:** Reusable layout utilities.

**Contains:** `.flow`, `.list-reset`

**When to add here:** Only for layout patterns used in 3+ places across the site.

#### 5. Utilities Layer (`@layer utilities`)

**Purpose:** Single-purpose helper classes.

**Contains:** `.ui-style`, `.dark-surface`, `.card-surface`, alignment utilities, and more. See `_utilities.css` for full list.

**When to add here:** For utilities that are genuinely reusable across many components. Don't add component-specific classes here.

#### 6. Longform Layer (`@layer longform`)

**Purpose:** Article-only enhancements.

Only for styles specific to long-form reading that shouldn't apply elsewhere. Stles should ONLY be added to this layer via the `LongformProseTypography.astro` component, or occasionally circumstances by other components which need to override their standard styles when used inside a longform container.

### Where Component Styles Go

**Most component styles go in the `.astro` file's `<style>` block**, not in a CSS file.

```astro
<!-- Component.astro -->
<div class="my-component">...</div>

<style>
  .my-component {
    /* Component-specific styles here - automatically scoped */
  }
</style>
```

#### Scoped vs Global Styles in Components

**Default (`<style>`)** - Astro scopes styles to the component. Use for most components.

**Global (`<style is:global>`)** - Styles apply globally. Use sparingly for:

1. **Layer contributions** - When adding to a CSS layer like `@layer longform`:
   ```astro
   <!-- LongFormProseTypography.astro -->
   <style is:global>
     @layer longform {
       .longform-prose { ... }
     }
   </style>
   ```

2. **Deeply nested content** - When styling slotted MDX content where scoping breaks:
   ```astro
   <style is:global>
     .prose-wrapper :is(h1, h2, h3) { ... }
   </style>
   ```

**Rule of thumb:** If your styles need to participate in the layer cascade or style content you don't directly render, use `is:global`. Otherwise, use scoped styles.

**Add to global.css only when:**

| Add to global if... | Layer |
|--------------------|-------|
| It's a site-wide element default (all tables, all buttons) | `@base` |
| It's prose typography that should apply to all articles | `@typography` |
| It's a layout pattern used in 3+ unrelated places | `@layout` |
| It's a utility class applicable to many components | `@utilities` |

### Extraction Guidelines

**When to extract component CSS to global layers:**

1. **Same styles appearing in 3+ components** → Consider a utility class in `@utilities`
2. **Repeatedly overriding `@typography` the same way** → Consider updating `@typography` or `.ui-style`
3. **A truly reusable layout pattern** → Consider adding to `@layout`

**When NOT to extract:**

- A pattern used in only 1-2 places
- Styles that might diverge between uses
- Component-specific overrides

---

## Utility Classes

Utilities are defined in `_utilities.css` and `_layout.css`. See the styleguide at `/styleguide` for the full list. Key utilities:

### `.ui-style` - Opt-Out of Prose Typography

**Use for:** Navigation, footers, listing pages, cards, any non-article UI.

Switches to `--font-ui`, removes link underlines, removes heading borders, resets list markers, tightens line-height.

```html
<nav class="ui-style">
  <a href="/">Home</a> <!-- No underline, inherits color -->
</nav>

<footer class="ui-style dark-surface">
  <!-- UI styling + dark background -->
</footer>
```

### `.dark-surface` - Always-Dark Areas

Forces dark background (`--color-charcoal`) with light text (`--color-beige`). Combine with `.ui-style` for dark UI areas.

### `.flow` - Vertical Rhythm (layout)

Adds `--space-m` between siblings, with larger margins before headings. Use for content areas needing consistent vertical spacing.

### `.list-reset` - Navigation Lists (layout)

Removes list-style, margin, padding, and marker colors. Use for navigation and UI lists.

### `.content-trim` - Margin Cleanup

Removes top margin from first child and bottom margin from last child. **Use on** containers with padding that receive slotted content (`<slot />`).

```html
<div class="callout-content content-trim">
  <slot />
</div>
```

---

## Design Tokens

Use semantic tokens from `_foundations.css`. Full reference in [design-tokens.md](./design-tokens.md).

### Quick Reference

```css
/* Colors - use semantic tokens */
color: var(--color-text);
color: var(--color-text-secondary);
color: var(--color-accent);
background: var(--color-background);
background: var(--surface-raised);
border-color: var(--color-border);

/* Spacing - fluid Utopia scale */
padding: var(--space-m);
gap: var(--space-s);
margin-top: var(--space-l);

/* Typography */
font-size: var(--font-size-lg);
font-weight: var(--font-weight-semibold);
line-height: var(--leading-tight);
letter-spacing: var(--tracking-wide);

/* Motion */
transition: color var(--duration-fast) var(--ease-in-out);

/* Borders */
border: var(--border-width-hairline) solid var(--color-border);
border-radius: var(--radius-sm);
```

### Deriving Variants

Don't create new tokens for every shade. Derive variants using relative color syntax or `color-mix()`:

```css
/* Darken for hover */
background: oklch(from var(--color-accent) calc(l - 0.1) c h);

/* Lighten with reduced saturation for backgrounds */
background: oklch(from var(--color-accent) 96% calc(c * 0.3) h);

/* Add transparency - two approaches */
background: oklch(from var(--color-accent) l c h / 0.1);
border-color: color-mix(in oklch, var(--color-text) 20%, transparent);

/* Mute currentColor */
color: color-mix(in oklch, currentColor 40%, transparent);

/* Theme-specific values */
background: light-dark(var(--color-beige), var(--color-charcoal));
```

---

## CSS Patterns & Best Practices

### Component CSS Conventions

#### Private Variables with `--_` Prefix

Use `--_` prefix for component-internal custom properties. This signals "private to this component":

```css
.callout {
  --_bg: var(--color-background-secondary);
  --_border: var(--color-text-secondary);

  background: var(--_bg);
  border-color: var(--_border);
}

/* Variants override the private vars */
[data-callout-color='red'] {
  --_bg: light-dark(oklch(94% 0.024 var(--hue-coral)), oklch(35% 0.036 var(--hue-coral)));
  --_border: var(--color-coral);
}
```

#### Variants with `data-*` Attributes

Use `data-*` attributes for component variants, not class modifiers:

```css
/* ✅ Preferred: data attributes */
.button[data-variant='primary'] { ... }
.button[data-variant='secondary'] { ... }
.callout[data-callout-color='blue'] { ... }
.accordion[data-plain] { ... }

/* ❌ Avoid: BEM-style modifiers */
.button--primary { ... }
.callout--blue { ... }
```

**Benefits:** Cleaner HTML, easier to set from props, works well with `class:list`.

#### Combining Utility Classes

Utilities are designed to combine. Common patterns:

```html
<!-- Dark UI areas -->
<footer class="ui-style dark-surface">

<!-- Content that needs flow spacing and container queries -->
<div class="longform-prose cq flow">

<!-- Slotted content in padded containers -->
<div class="accordion-content content-trim">

<!-- Cards with container query context -->
<article class="note-card ui-style cq">
```

### Modern Patterns to Use

```css
/* ✅ CSS nesting */
.card {
  padding: var(--space-m);

  & a {
    color: var(--color-accent);
  }

  &:hover {
    filter: var(--shadow-medium);
  }
}

/* ✅ Container queries for component responsiveness */
.cq {
  container-type: inline-size;
}

@container (width > 400px) {
  .card {
    grid-template-columns: 1fr 1fr;
  }
}

/* ✅ :is() and :where() for grouping */
.card :is(h1, h2, h3) {
  margin-top: 0;
}

/* ✅ :has() for parent selection */
.card:has(img) {
  grid-template-columns: 1fr 2fr;
}

/* ✅ Logical properties where clearer */
margin-block: var(--space-m);
padding-inline: var(--space-s);
```

### Patterns to Avoid

**Always use tokens instead of hardcoded values:**

```css
/* ❌ Hardcoded values */
color: #ff7369;
padding: 24px;
font-size: clamp(1rem, 2vw, 1.5rem);

/* ✅ Use design tokens */
color: var(--color-accent);
padding: var(--space-m);
font-size: var(--font-size-lg);
```

**Exception:** Hero/display text can use custom `clamp()` for dramatic viewport-based scaling.

**Fight the cascade with utilities, not overrides:**

```css
/* ❌ Fighting inherited prose styles */
.my-nav a {
  text-decoration: none;
  color: inherit;
}

/* ✅ Use utility class */
<nav class="ui-style">
```

**Use semantic tokens for muted states:**

```css
/* ❌ Opacity creates inconsistent results across backgrounds */
color: var(--color-text);
opacity: 0.6;

/* ✅ Use semantic token or derive with relative color */
color: var(--color-text-secondary);
```

**Use container queries for component responsiveness** — see [component-patterns.md § Container Queries vs Media Queries](./component-patterns.md#container-queries-vs-media-queries).

### Defensive CSS (For Reusable Components Only)

For components used in multiple contexts, add minimal defensive styles:

```css
.reusable-component {
  /* Prevent content overflow */
  overflow-wrap: break-word;

  /* Flexible images */
  & img {
    max-width: 100%;
    height: auto;
  }

  /* Trim margins from slotted content */
  & > :first-child { margin-top: 0; }
  & > :last-child { margin-bottom: 0; }
}
```

Don't over-engineer - only add defensive CSS to genuinely reusable components.

---

## Typography System

Typography is **central** - large, expressive, and layout-defining.

### Article Typography (Long-form)

- **Primary Font**: Literata - serif for bookish, elegant feel
- **Base Size**: Fluid 16px→20px via Utopia scale (`--font-size-base`)
- **Line Height**: 1.5 (`--leading-normal`)
- **Advanced Features**: Ligatures, hanging punctuation (oldstyle numerals enabled in long-form articles only)

### Implementation

```css
/* Typography tokens handle fluid sizing */
.title {
  font-size: var(--font-size-lg);
  line-height: var(--leading-tight);
}

/* Oversized display typography */
.display-huge {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
}
```

---

## Color System

### Theme Architecture

Three theme modes:

- **Auto** - Follows system preference via `color-scheme: light dark`
- **Light** - Warm, beige backgrounds
- **Dark** - Deep, rich backgrounds

Theme switching uses `color-scheme` property with `light-dark()` function for automatic adaptation.

### Using Colors

**Always use semantic tokens:**

```css
/* ✅ Semantic tokens */
color: var(--color-text);
color: var(--color-accent);
background: var(--color-background);
background: var(--surface-raised);

/* ❌ Never hardcode */
color: #2f3437;
background: oklch(96% 0.02 85);
```

**Derive variants when needed:**

```css
/* Hover states - darken */
background: oklch(from var(--color-accent) calc(l - 0.1) c h);

/* Subtle backgrounds - lighten and desaturate */
background: oklch(from var(--color-accent) 96% calc(c * 0.3) h);
```

---

## Layout Principles

### Grid System

- **Heavily grid-based** with permission to break conventions
- **Asymmetry encouraged** over rigid symmetry
- **Sharp, intentional whitespace** and strong alignment

### Responsive Approach

- **Mobile-first** design methodology
- **Fluid typography and spacing** — no breakpoints needed for size
- **Container queries** for component-level responsiveness
- **Media queries** only for page-level layout changes

See [component-patterns.md § Container Queries vs Media Queries](./component-patterns.md#container-queries-vs-media-queries) for detailed guidance on when to use each.

---

## Animation and Interaction

### Principles

- **Smooth, intentional animations** using motion tokens
- **Subtle transitions** that enhance, not distract
- **Keyboard navigation** support
- **Respect reduced motion** preferences (handled in `@reset`)

### Patterns

```css
/* Standard transitions */
.interactive {
  transition: all var(--duration-normal) var(--ease-in-out);
}

/* Specific property transitions */
.link {
  transition:
    color var(--duration-fast) var(--ease-in-out),
    text-decoration-color var(--duration-fast) var(--ease-in-out);
}

/* Focus states */
.focusable:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

---

## Key Requirements

**Visual Design:**

- Test both themes for every change
- Use semantic tokens and design tokens
- Maintain clear hierarchy with typography and spacing

**Performance:**

- Zero-JavaScript by default
- Keep CSS minimal - rely on global defaults

**Accessibility:**

- Semantic HTML and ARIA attributes where needed
- Keyboard navigation for all interactive elements
- Clear, visible focus indicators (already in `@reset`)
- Meet WCAG AA color contrast minimum

**Maintainability:**

- Keep component styles in `.astro` files
- Only extract to global when genuinely reusable (3+ uses)
- Update styleguide for new visual components
