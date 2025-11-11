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
- **Base Size**: 16px with fluid scaling using clamp()
- **Line Height**: 1.5 (24px baseline grid)
- **Advanced Features**: Drop caps, ligatures, small caps, old-style figures, optical margin alignment, hanging punctuation

### Expressive Typography

- **Oversized headlines** that define layout
- **Variable fonts** with advanced OpenType features
- **Rotated text** and **overlapping elements** where appropriate
- **Typographic banners** and announcements

### Implementation

```css
/* Fluid typography with clamp() */
.title {
  font-size: clamp(1rem, calc(0.6rem + 1vw), 1.5rem);
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
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.02em;
}
```

## Color System

### Theme Architecture

Three theme modes:

- **Auto** - Follows system preference (`prefers-color-scheme`)
- **Light** - Warm, beige backgrounds
- **Dark** - Deep, rich backgrounds

Theme switching via `data-theme` attribute on `:root` element.

### CSS Variable Structure

**Three-tier system:**

1. **Base Colors** (outside layers) - Raw color tokens, **never use directly**
2. **Semantic Variables** (@layer theme) - Theme-aware, component-specific
3. **Component Variables** (in components) - Component-specific overrides

```css
/* 1. Base color tokens (never use directly) */
:root {
  --color-red-500: #ff7369;
  --color-cream-500: #fef9ef;
}

/* 2. Semantic variables (use these) */
:root[data-theme='light'] {
  --color-nav-bg: var(--color-bg-dark-200);
  --prose-link-color: var(--color-coral-500);
}

:root[data-theme='dark'] {
  --color-nav-bg: var(--color-bg-light-200);
  --prose-link-color: var(--color-red-500);
}

/* 3. Component usage */
.component {
  background: var(--color-nav-bg);
}
```

### Rules

1. **Never use base colors directly** - Always use semantic variables
2. **Use descriptive names** - `--color-{component}-{property}`
3. **Test both themes** when adding new variables

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
  gap: var(--space-lg);
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

Organized by specificity (lowest to highest):

1. **Reset** (@layer reset) - Basic resets, box model
2. **Base** (@layer base) - Default element styles, typography
3. **Prose** (@layer prose) - Article and content styling
4. **Theme** (@layer theme) - Color schemes, dark/light mode

```css
@layer base {
  a {
    color: var(--prose-link-color);
  }
}

@layer prose {
  .prose a {
    text-decoration: underline;
  }
}
```

**Documentation:** See [MDN @layer reference](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) for specification details. Layer order is defined in `src/styles/global.css:2`.

### Modern CSS Features

```css
.component {
  /* currentColor to inherit text color */
  border-color: currentColor;

  /* Smooth transitions */
  transition: opacity 0.2s ease;
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
  gap: var(--space-lg);
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
  background: var(--color-notecard-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

### Navigation Elements

```css
.nav-link {
  display: inline-flex;
  align-items: center;
  color: var(--color-nav-text);
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: var(--color-nav-hover-bg);
}
```

### Content Callouts

```css
.callout {
  border-left: 4px solid var(--callout-accent-color);
  background: var(--callout-bg-color);
  padding: var(--space-md);
  margin: var(--space-lg) 0;
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
/* Smooth transitions */
.interactive {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover states */
.hoverable:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* Focus states for accessibility */
.focusable:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

## Technical Implementation

### Adding New Theme Variables

When a component needs different colors in light/dark modes:

1. **Add semantic variables to global.css:**

```css
/* In @layer theme section */
:root[data-theme='light'] {
  --color-your-component-bg: var(--color-bg-light-200);
}

:root[data-theme='dark'] {
  --color-your-component-bg: var(--color-bg-dark-200);
}
```

2. **Use in component:**

```css
.your-component {
  background: var(--color-your-component-bg);
}
```

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
- Use semantic variables, never base color tokens directly
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
