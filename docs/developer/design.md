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

### Design Tone

- **Personal, experimental, intentional**
- Space for ideas and design play, not just a portfolio
- **Design as authorship** over "professional blandness"
- **Sharp, beautiful, text-first, minimal**

## Typography System

Typography is **central** - large, expressive, and layout-defining.

### Article Typography (Long-form)

- **Primary Font**: Literata (variable font) - serif for bookish, elegant feel
- **Base Size**: Fluid 16px→20px via Utopia scale (`--font-size-base`)
- **Line Height**: 1.5 (`--leading-normal`)
- **Advanced Features**: Drop caps, ligatures, small caps, old-style figures, optical margin alignment, hanging punctuation

### Expressive Typography

- **Oversized headlines** that define layout
- **Variable fonts** with advanced OpenType features
- **Rotated text** and **overlapping elements** where appropriate
- **Typographic banners** and announcements

### Implementation

```css
/* Use fluid typography tokens (Utopia-generated) */
.title {
  font-size: var(--font-size-lg);
  line-height: var(--leading-tight);
}

/* Advanced typography features */
.article-content {
  font-feature-settings:
    'liga' 1,
    'onum' 1,
    'kern' 1;
  hanging-punctuation: first last;
}

/* Oversized display typography */
.display-huge {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
}
```

## Color System

### Theme Architecture

Three theme modes:

- **Auto** - Follows system preference via `color-scheme: light dark`
- **Light** - Warm, beige backgrounds
- **Dark** - Deep, rich backgrounds

Theme switching uses `color-scheme` property with `light-dark()` function for automatic adaptation. Manual overrides via `data-theme` attribute on `:root` element.

### CSS Variable Structure

**Two-tier system using `light-dark()`:**

1. **Adaptive Palette** - Colors that auto-switch based on color-scheme (e.g., `--color-coral`, `--color-text`)
2. **Semantic Variables** - Role-based tokens referencing the palette (e.g., `--color-accent`, `--color-background`)

```css
/* Adaptive colors switch automatically via light-dark() */
:root {
  color-scheme: light dark;

  /* Adaptive palette - auto-switches for theme */
  --color-coral: light-dark(
    oklch(70% 0.18 var(--hue-coral)),
    oklch(80% 0.14 var(--hue-coral))
  );

  /* Semantic variables reference the adaptive palette */
  --color-accent: var(--color-coral);
  --color-background: light-dark(var(--color-beige), var(--color-charcoal));
  --color-text: light-dark(var(--color-ink), var(--color-beige));
}

/* Component usage */
.component {
  background: var(--color-background);
  color: var(--color-text);
  border-color: var(--color-accent);
}
```

### Rules

1. **Use semantic variables** - `--color-accent`, `--color-text`, `--color-background`, etc.
2. **Test both themes** when making visual changes
3. **Derive variants with relative color syntax** when needed: `oklch(from var(--color-accent) calc(l - 0.1) c h)`

### Primary Palette

- **Red/Coral** - Accent colors for links, highlights
- **Cream/Beige** - Warm backgrounds (light mode)
- **Deep backgrounds** - Rich, dark tones (dark mode)
- **Monochrome base** - Black/white for primary text/backgrounds

## Layout Principles

### Grid System

- **Heavily grid-based** with permission to break conventions
- **20px base grid** with flexible application
- **Asymmetry encouraged** over rigid symmetry
- **Sharp, intentional whitespace** and strong alignment

### Layout Patterns

- **Diagonal lines** and **rotated elements** where appropriate
- **Overlapping text/image elements** for visual interest
- **Content sections may break grid** for impact
- **Full-bleed images** when needed

### Responsive Approach

- **Mobile-first** design methodology
- **Fluid typography** using clamp() functions
- **Container queries** for component-level responsiveness

### Implementation

```css
/* Grid-based layouts */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-l);
}

/* Container queries for component responsiveness */
.cq {
  container-type: inline-size;
}

@container (width > 400px) {
  .component {
    grid-template-columns: 1fr 1fr;
  }
}
```

## CSS Architecture

### CSS Layers

**Core architectural pattern** - Controls specificity without relying on selector complexity or `!important`.

Seven-layer cascade system (lowest to highest specificity):

1. **Reset** (@layer reset) - Browser normalization with `:where()` for zero specificity
2. **Base** (@layer base) - Foundation: color-scheme, accent-color, body background, tables, buttons
3. **Typography** (@layer typography) - Prose-first defaults: serif font, links, lists, blockquotes, heading borders
4. **Layout** (@layer layout) - Reusable patterns: `.flow`, `.list-reset`, `.all-caps`
5. **Utilities** (@layer utilities) - `.ui-style`, `.dark-surface`, `.card-surface`, `.cq`, `.img-cover`, `.content-trim`, `.sr-only`
6. **Longform** (@layer longform) - Article-only enhancements: end marks, footnotes, oldstyle numerals
7. **Theme** (@layer theme) - Component-scoped styles (when needed)

**Key Design Decision:** Prose typography is the default. Use `.ui-style` to opt-out for UI areas (nav, footer, list pages).

```css
/* Typography layer sets prose defaults */
@layer typography {
  body {
    font-family: var(--font-prose);
  }
  a {
    text-decoration: underline;
    color: var(--color-accent);
  }
}

/* Utilities layer provides opt-out */
@layer utilities {
  .ui-style {
    font-family: var(--font-ui);
    & a { text-decoration: none; color: inherit; }
  }
  .dark-surface {
    background-color: var(--color-charcoal);
    color: var(--color-beige);
  }
}
```

**Documentation:** See [MDN @layer reference](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) for specification details. Layer order is defined in `src/styles/global.css:2`.

<!-- TODO: Pass Two - Add guidance on when to use each layer, and when component styles should go in .astro files vs global layers -->

### Modern CSS Features

```css
.component {
  /* currentColor to inherit text color */
  border-color: currentColor;

  /* Smooth transitions using motion tokens */
  transition: opacity var(--duration-normal) var(--ease-in-out);
}

/* object-fit for image sizing */
.image {
  object-fit: cover;
}
```

Prefer CSS Grid over Flexbox for complex layouts.

## Constructivist/Modernist Influences

### Visual Elements

- **Bold geometric shapes** and **strong diagonal lines**
- **High contrast** between elements
- **Asymmetric balance** over symmetrical layouts
- **Limited color palette** with strategic accent usage
- **Typography as visual element**, not just content delivery

### Implementation Examples

```css
/* Diagonal design elements */
.diagonal-accent::before {
  content: '';
  position: absolute;
  width: 4px;
  height: 100%;
  background: var(--color-accent);
  transform: skew(-15deg);
}

/* Asymmetric grid with golden ratio */
.modernist-grid {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  gap: var(--space-l);
}

/* Overlapping elements */
.overlap-container {
  position: relative;
  z-index: 1;
}

.overlap-element {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 2;
}

/* Rotated text */
.rotated-text {
  transform: rotate(-5deg);
}

/* Mixed typography weights */
.typographic-hierarchy {
  font-weight: 300;
}

.typographic-hierarchy strong {
  font-weight: 900;
  font-size: 1.2em;
}
```

## Component Patterns

### Cards and Containers

```css
.card {
  background: var(--surface-raised);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-m);
  filter: var(--shadow-small);
  transition: filter var(--duration-fast) var(--ease-in-out);
}

.card:hover {
  filter: var(--shadow-medium);
}
```

<!-- TODO: Pass Two - Document the `.card-surface` utility class as alternative -->

### Navigation Elements

```css
/* Navigation typically uses .ui-style .dark-surface utilities */
.nav-link {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.nav-link:hover {
  color: var(--color-accent);
}
```

### Content Callouts

```css
.callout {
  /* Callouts define local --accent for variant colors */
  --accent: var(--color-coral);
  border-left: var(--border-width-thick) solid var(--accent);
  background: oklch(from var(--accent) 96% calc(c * 0.3) h);
  padding: var(--space-m);
  margin: var(--space-l) 0;
}
```

## Animation and Interaction

### Principles

- **Smooth, intentional animations**
- **Touch-friendly** interface elements
- **Keyboard navigation** support
- **Subtle transitions** that enhance, not distract

### Patterns

```css
/* Smooth transitions using motion tokens */
.interactive {
  transition: all var(--duration-normal) var(--ease-in-out);
}

/* Hover states */
.hoverable:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* Focus states for accessibility */
.focusable:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

## Technical Implementation

### Adding Theme-Aware Colors

When a component needs different colors in light/dark modes, use `light-dark()`:

1. **Define in the component's `<style>` block or in global.css:**

```css
.your-component {
  /* light-dark() auto-switches based on color-scheme */
  background: light-dark(
    var(--color-beige),      /* Light mode */
    var(--color-charcoal)    /* Dark mode */
  );
}
```

2. **Or derive from existing semantic variables:**

```css
.your-component {
  /* Use relative color syntax to derive variants */
  background: oklch(from var(--color-background) calc(l - 0.05) c h);
}
```

<!-- TODO: Pass Two - Document when to add new global tokens vs use local light-dark() -->

### Container Queries

Use container queries for **component-level** responsiveness (vs media queries for **page-level** layout):

```css
/* Component wrapper with container query context */
.cq {
  container-type: inline-size;
}

/* Responsive component behavior */
@container (width > 400px) {
  .component {
    grid-template-columns: 1fr 1fr;
  }
}
```

## Styleguide Maintenance

**Location:** `/styleguide` page

When creating or significantly updating components:

1. Add visual examples to styleguide
2. Show different variants/states
3. Test examples in both themes

The styleguide serves as living documentation and QA tool.

## Key Requirements

**Visual Design:**

- Test both themes for every change
- Use semantic variables (`--color-accent`, `--color-text`, etc.) and design tokens
- Maintain clear hierarchy with typography and spacing
- Keep it experimental - bold choices aligned with site character

**Performance:**

- Zero-JavaScript by default
- Optimize images (proper dimensions, lazy loading)
- Keep CSS minimal

**Accessibility:**

- Semantic HTML and ARIA attributes where needed
- Keyboard navigation for all interactive elements
- Clear, visible focus indicators
- Meet WCAG AA color contrast minimum

**Maintainability:**

- Clear, semantic CSS with consistent naming
- Update styleguide for new components
- Document complex patterns

## Design System Evolution

This design system is a **living document** that evolves while maintaining core philosophy: **bold, personal expression** with **technical excellence** and **user accessibility**.
