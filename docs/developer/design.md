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

1. **Rely on global defaults** - Don't redeclare what `global.css` already provides
2. **Prose is the default** - Typography layer assumes article content; opt-out for UI
3. **Fluid everything** - Use Utopia-generated spacing and type scales
4. **Adaptive by default** - Colors auto-switch for light/dark via `light-dark()`
5. **Semantic tokens** - Use role-based variables, not hardcoded values
6. **Modern CSS features** - Nesting, container queries, `:has()`, relative colors
7. **Keep it simple** - Don't over-engineer; less CSS is better CSS

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

Seven layers control the cascade (defined in `src/styles/global.css:2`):

```css
@layer reset, base, typography, layout, utilities, longform, theme;
```

Each layer has a specific purpose:

#### 1. Reset Layer (`@layer reset`)

**Purpose:** Browser normalization with zero specificity via `:where()`.

**Contains:** Box-sizing, margin removal, media defaults, focus outlines, text wrapping, reduced motion support.

**Never modify directly** - These are foundational defaults.

#### 2. Base Layer (`@layer base`)

**Purpose:** Site-wide foundations that apply everywhere.

**Contains:**
- `color-scheme: light dark` and `accent-color`
- Body background color
- Table styling
- Button defaults
- Mark/highlight styling

**When to add here:** Only for truly global element defaults that should apply site-wide regardless of context.

#### 3. Typography Layer (`@layer typography`)

**Purpose:** Prose-first defaults for article content.

**Contains:**
- Serif font family (`--font-prose`)
- Heading sizes, weights, borders
- Link styling (underlines, colors, visited state)
- List styling (padding, markers)
- Blockquote styling
- Prose spacing rhythm
- Inline code and kbd styling

**Key insight:** This layer assumes content is an article. Everything inherits these styles. UI areas opt-out using `.ui-style`.

#### 4. Layout Layer (`@layer layout`)

**Purpose:** Reusable layout utilities.

**Contains:** `.flow`, `.list-reset`, `.all-caps`

**When to add here:** Only for layout patterns used in 3+ places across the site.

#### 5. Utilities Layer (`@layer utilities`)

**Purpose:** Single-purpose helper classes.

**Contains:** `.ui-style`, `.dark-surface`, `.card-surface`, `.cq`, `.img-cover`, `.content-trim`, `.sr-only`

**When to add here:** For utilities that are genuinely reusable across many components. Don't add component-specific classes here.

#### 6. Longform Layer (`@layer longform`)

**Purpose:** Article-only enhancements.

**Contains:** End marks, footnotes, oldstyle numerals (all defined in `LongFormProseTypography.astro`).

**When to add here:** Only for styles specific to long-form reading that shouldn't apply elsewhere.

#### 7. Theme Layer (`@layer theme`)

**Purpose:** Reserved for future theme customization.

**Currently minimal** - Most theming is handled via `light-dark()` in token definitions.

### Where Component Styles Go

**Most component styles go in the `.astro` file's `<style>` block**, not in global.css.

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

### `.ui-style` - Opt-Out of Prose Typography

**Use for:** Navigation, footers, listing pages, cards, any non-article UI.

**What it does:**
- Switches to `--font-ui` (sans-serif)
- Removes link underlines, inherits color
- Removes heading borders
- Resets list marker colors
- Tightens line-height

```html
<nav class="ui-style">
  <a href="/">Home</a> <!-- No underline, inherits color -->
</nav>

<footer class="ui-style dark-surface">
  <!-- UI styling + dark background -->
</footer>
```

### `.dark-surface` - Always-Dark Areas

**Use for:** Navigation, footer, or any area that should stay dark regardless of theme.

**What it does:**
- Sets `--color-charcoal` background
- Sets `--color-beige` text

**Combine with `.ui-style`** for dark UI areas.

### `.card-surface` - Raised Card Styling

**Use for:** Cards, panels, callouts that need elevation.

**What it does:**
- Uses `--surface-raised` background
- Adds hairline border
- Applies small shadow
- Rounds corners

### `.cq` - Container Query Context

**Use on:** Parent elements of components that use `@container` queries.

```html
<div class="cq">
  <article class="my-card"><!-- Uses @container queries --></article>
</div>
```

### `.flow` - Vertical Rhythm

**Use for:** Content areas needing consistent vertical spacing.

**What it does:**
- Adds `--space-m` between siblings
- Larger margins before headings

### `.list-reset` - Navigation Lists

**Use for:** Navigation lists, UI lists without markers.

**What it does:**
- Removes list-style, margin, padding
- Removes marker colors
- Resets li padding/margin

### `.all-caps` - Label Styling

**Use for:** Category labels, metadata, small UI text.

**What it does:**
- Uppercase text
- Wide letter-spacing

### `.content-trim` - Margin Cleanup

**Use on:** Containers with padding that receive slotted/arbitrary content (like `<slot />`).

**When to apply:** Add to any element that:
1. Has padding (creating space from edges)
2. Receives content with margins (headings, paragraphs, lists)
3. Would otherwise have awkward double-spacing at top/bottom

```html
<!-- ✅ Callout with slotted content -->
<div class="callout-content content-trim">
  <slot />
</div>

<!-- ✅ Accordion body -->
<div class="accordion-content content-trim">
  <slot />
</div>

<!-- ❌ Don't need it - no slotted content -->
<div class="card-meta">
  <span>Fixed content here</span>
</div>
```

**What it does:**
- Removes top margin from first child
- Removes bottom margin from last child

### `.img-cover` - Full Container Images

**Use for:** Images that should fill their container.

### `.sr-only` / `.hidden-microformat` - Screen Reader Only

**Use for:** Text that should be accessible but visually hidden.

### `.external-arrow` - External Link Indicator

**Use for:** Indicating external/offsite links in UI contexts (nav, footer).

```html
<a href="/working">Work <span class="external-arrow">↗</span></a>
```

Note: Prose external links use a different mechanism in the longform layer.

---

## Design Tokens

Use semantic tokens from `global.css`. Full reference in [design-tokens.md](./design-tokens.md).

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

```css
/* ❌ Hardcoded colors */
color: #ff7369;
background: oklch(70% 0.18 25);

/* ✅ Use tokens */
color: var(--color-accent);
background: var(--color-background);

/* ❌ Hardcoded spacing */
padding: 24px;
gap: 1.5rem;

/* ✅ Use fluid tokens */
padding: var(--space-m);
gap: var(--space-s);

/* ❌ Custom clamp() for body/component font sizes */
font-size: clamp(1rem, 2vw, 1.5rem);

/* ✅ Use typography scale */
font-size: var(--font-size-lg);

/* ✅ EXCEPTION: Hero/display text can use custom clamp() for dramatic scaling */
.hero-title {
  font-size: clamp(3rem, 15vw, 22rem); /* Intentionally outside token system */
}

/* ❌ Fighting inherited styles */
.my-nav a {
  text-decoration: none;
  color: inherit;
}

/* ✅ Use utility class */
<nav class="ui-style">

/* ❌ Media queries for component layout */
@media (min-width: 600px) {
  .card { ... }
}

/* ✅ Container queries */
@container (width > 400px) {
  .card { ... }
}

/* ❌ Opacity for muted text */
color: var(--color-text);
opacity: 0.6;

/* ✅ Use secondary token or adjust lightness */
color: var(--color-text-secondary);
```

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
- **Fluid typography and spacing** - no breakpoints needed for size
- **Container queries** for component-level responsiveness
- **Media queries** only for page-level layout changes

```css
/* Container queries for components */
.cq { container-type: inline-size; }

@container (width > 400px) {
  .component { grid-template-columns: 1fr 1fr; }
}

/* Media queries for page layout only */
@media (min-width: 800px) {
  .page-layout { grid-template-columns: 1fr 3fr; }
}
```

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
