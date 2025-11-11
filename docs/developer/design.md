# Design System

Visual philosophy, CSS architecture, and design patterns for Danny's personal website.

## Design Philosophy

### Core Aesthetic

**Clean, typographically-driven, experimental** - A personal zine-meets-manifesto with strong visual identity.

This site serves two purposes:
1. **Content Platform** - Share thoughts, experiences, and work
2. **Creative Playground** - Experiment with CSS, HTML, JavaScript, and AI-assisted coding

### Design Values

- **Simplicity** - Minimal dependencies, clean code, straightforward UX
- **Content-First** - Design prioritizes readability and accessibility
- **Authenticity** - Reflects personal style and values
- **Performance** - Fast loading, optimal experience across devices
- **Maintainability** - Easy to update and extend
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
- **Advanced Features**:
  - Drop caps for article openings
  - Ligatures and small caps
  - Old-style figures and fractions
  - Optical margin alignment
  - Hanging punctuation

### Expressive Typography

- **Oversized headlines** that define layout
- **Variable fonts** with advanced OpenType features
- **Rotated text** and **overlapping elements** where appropriate
- **Typographic banners** and announcements

### Implementation Examples

```css
/* Fluid typography with clamp() */
.title {
  font-size: clamp(1rem, calc(0.6rem + 1vw), 1.5rem);
}

/* Advanced typography features */
.article-content {
  font-feature-settings:
    'liga' 1,    /* Ligatures */
    'onum' 1,    /* Old-style numbers */
    'kern' 1;    /* Kerning */
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

Theme switching via `data-theme` attributes on `:root` element.

### CSS Variable Structure

**Three-tier system:**

1. **Base Colors** (outside layers) - Raw color tokens, never used directly
2. **Semantic Variables** (@layer theme) - Component-specific, change between themes
3. **Component Variables** (in components) - Component-specific overrides

```css
/* 1. Base color tokens (never use directly) */
:root {
  --color-red-500: #ff7369;
  --color-blue-500: #529cca;
  --color-coral-500: #f97068;
  --color-cream-500: #fef9ef;
}

/* 2. Semantic variables (use these) */
:root[data-theme='light'] {
  --color-nav-bg: var(--color-bg-dark-200);
  --color-nav-text: var(--color-brand-white);
  --color-notecard-bg: var(--color-brand-white);
  --prose-link-color: var(--color-coral-500);
}

:root[data-theme='dark'] {
  --color-nav-bg: var(--color-bg-light-200);
  --color-nav-text: var(--color-brand-black);
  --color-notecard-bg: var(--color-bg-secondary);
  --prose-link-color: var(--color-red-500);
}

/* 3. Component usage */
.component {
  background: var(--color-nav-bg);
  color: var(--color-nav-text);
}
```

### Color Usage Rules

1. **Never use base colors directly** - Always use semantic variables
2. **Group related variables** together (all nav variables together)
3. **Use descriptive names** - `--color-{component}-{property}`
4. **Test both themes** when adding new variables

### Primary Palette

- **Red/Coral** - Accent colors for links, highlights, visual interest
- **Cream/Beige** - Warm backgrounds (light mode)
- **Deep backgrounds** - Rich, dark tones (dark mode)
- **Monochrome base** - Black and white for primary text/backgrounds

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
- **Full-bleed images** and content when needed

### Responsive Approach

- **Mobile-first** design methodology
- **Fluid typography** using clamp() functions
- **Container queries** for component-level responsiveness
- **Optimized for all screen sizes**

### Implementation

```css
/* Grid-based layouts */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
}

/* Asymmetric layouts */
.asymmetric-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-xl);
}

/* Container queries for responsive components */
@container (width > 400px) {
  .component {
    /* Wider container styles */
  }
}
```

## CSS Architecture

### CSS Layers

Organized by specificity (lowest to highest):

1. **Reset** (@layer reset) - Basic resets, box model, margins
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

### Modern CSS Features

```css
.component {
  /* Inline flex for better alignment control */
  display: inline-flex;
  align-items: baseline;

  /* Smooth transitions */
  transition: opacity 0.2s ease;

  /* currentColor to inherit text color */
  border-color: currentColor;
}

.component:hover {
  opacity: var(--component-hover-opacity);
}

/* object-fit for image sizing */
.image {
  object-fit: cover;
}
```

Prefer CSS Grid over Flexbox for complex layouts.

## Component Visual Patterns

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
  padding: var(--space-xs) var(--space-sm);
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

### Interaction Principles

- **Smooth, intentional animations**
- **Touch-friendly** interface elements
- **Keyboard navigation** support
- **Subtle transitions** that enhance, not distract

### Animation Patterns

```css
/* Smooth transitions for interactive elements */
.interactive {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover states with opacity changes */
.hoverable:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* Focus states for accessibility */
.focusable:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Theme toggle animation */
.theme-toggle {
  background: var(--color-nav-bg);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-xs);
  transition: background-color 0.2s ease;
}

.theme-toggle:hover {
  background-color: var(--color-nav-hover-bg);
}
```

## Constructivist/Modernist Influences

### Visual Elements

- **Bold geometric shapes** and **strong diagonal lines**
- **High contrast** between elements
- **Asymmetric balance** over symmetrical layouts
- **Limited color palette** with strategic accent usage
- **Typography as visual element** not just content delivery

### Implementation Examples

```css
/* Diagonal design elements */
.diagonal-accent::before {
  content: '';
  position: absolute;
  top: 0;
  left: -5px;
  width: 4px;
  height: 100%;
  background: var(--color-accent);
  transform: skew(-15deg);
}

/* Asymmetric grid with golden ratio */
.modernist-grid {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  grid-template-rows: auto auto 1fr;
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

/* Rotated text elements */
.rotated-text {
  transform: rotate(-5deg);
  transform-origin: center;
}

/* Mixed typography weights and sizes */
.typographic-hierarchy {
  font-size: var(--font-size-lg);
  font-weight: 300;
}

.typographic-hierarchy strong {
  font-weight: 900;
  font-size: 1.2em;
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
  --color-your-component-text: var(--color-text-primary);
}

:root[data-theme='dark'] {
  --color-your-component-bg: var(--color-bg-dark-200);
  --color-your-component-text: var(--color-text-primary);
}
```

2. **Use in component:**

```css
.your-component {
  background: var(--color-your-component-bg);
  color: var(--color-your-component-text);
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
    gap: var(--space-lg);
  }
}
```

## Best Practices

### For Visual Design

1. **Test both themes** - Light and dark mode for every change
2. **Use semantic variables** - Never use base color tokens directly
3. **Maintain hierarchy** - Typography and spacing create clear hierarchy
4. **Respect the grid** - Follow 20px base grid, break intentionally
5. **Keep it experimental** - Bold choices aligned with site character

### For Performance

1. **Minimize JavaScript** - Zero-JS by default
2. **Optimize images** - Proper dimensions, lazy loading
3. **Monitor bundle size** - Keep CSS minimal
4. **Use system fonts** where appropriate - Faster loading

### For Accessibility

1. **Semantic HTML** - Use appropriate elements
2. **ARIA attributes** - When semantic HTML isn't enough
3. **Keyboard navigation** - All interactive elements accessible
4. **Focus management** - Clear, visible focus indicators
5. **Screen reader testing** - Verify with actual assistive tech
6. **Color contrast** - Meet WCAG AA standards minimum

### For Maintainability

1. **Clear, semantic CSS** - Self-documenting code
2. **Consistent naming** - Follow established conventions
3. **Group related styles** - Logical organization
4. **Document complex patterns** - Explain non-obvious choices
5. **Update styleguide** - Add examples for new components

## Styleguide Maintenance

**Location:** `/styleguide` page

When creating or significantly updating components:

1. Add visual examples to styleguide
2. Show different variants/states
3. Include usage notes if non-obvious
4. Test examples in both themes

The styleguide serves as living documentation and QA tool.

## Design System Evolution

This design system is a **living document** that evolves with the site while maintaining core philosophy.

### Maintaining Consistency

- **Regular design audits** - Ensure visual coherence
- **Component documentation** - Keep styleguide updated
- **Cross-theme testing** - Verify all changes in light/dark
- **Performance monitoring** - Track impact of visual enhancements
- **Accessibility validation** - Test all interactive elements

The goal: **bold, personal expression** with **technical excellence** and **user accessibility**. A space that feels authentically creative while providing an exceptional experience for all visitors.
