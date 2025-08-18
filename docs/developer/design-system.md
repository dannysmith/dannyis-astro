# Design System

This design system document consolidates the visual philosophy, technical implementation, and component patterns that define Danny's personal website. It serves as both creative manifesto and practical reference for maintaining the site's distinct aesthetic and technical architecture.

## Design Philosophy

### Core Aesthetic

The site evokes a **clean, typographically-driven, experimental feel** — blending personal expression with classic graphic design influences. It's intentionally **not generic or safe**; it should feel like a **personal zine-meets-manifesto** with strong visual identity.

This is Danny's corner of the web with two main purposes:

1. **Content Platform**: A place to share thoughts, experiences, and work through articles and notes
2. **Creative Playground**: A space to experiment with code, especially CSS, HTML, JavaScript, and AI-assisted coding tools

### Design Values

- **Simplicity**: Minimal dependencies, clean code, straightforward user experience
- **Content-First**: Design decisions prioritize content readability and accessibility
- **Authenticity**: The site reflects personal style and values
- **Performance**: Fast loading times and optimal user experience across devices
- **Maintainability**: Easy to update and extend without unnecessary complexity
- **Fun**: Managing and evolving the site should be enjoyable, not a chore

### Visual Inspirations

- **Current site** (`danny.is`) and its stark, oversized typography
- **Constructivist and modernist layouts** (El Lissitzky, Jan Tschichold, Paul Schuitema)
- **Mid-century grid design systems** with asymmetric balance and bold diagonals
- **Monochrome/minimal colour palettes** with accent tones (red, coral, cream)
- **Notion-style simplicity** combined with expressive typographic play

### Design Tone

- Feels **personal**, **experimental**, and **intentional**
- A space for ideas and design play — not just a portfolio
- Leans into **design as authorship** rather than "professional blandness"
- **Sharp, beautiful, text-first, and minimal**

## Typography System

Typography is **central** — large, expressive, and layout-defining.

### Article Typography (Long-form Content)

- **Primary Font**: Literata (variable font) - serif for bookish, elegant feel
- **Base Size**: 16px with fluid scaling using clamp()
- **Line Height**: 1.5 (24px baseline grid)
- **Advanced Features**:
  - **Drop caps** for article openings
  - **Ligatures** and **small caps**
  - **Old-style figures** and **fractions**
  - **Optical margin alignment**
  - **Hanging punctuation**

### UI Typography (Navigation, Interface)

- **Focus**: Readability and versatility
- **Usage**: Navigation, metadata, UI elements

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
```

## Color System

### Theme Architecture

The site implements a comprehensive theme system with three modes:

- **Auto**: Follows user's system preference (`prefers-color-scheme`)
- **Light**: Explicit light theme with warm, beige backgrounds
- **Dark**: Explicit dark theme with deep, rich backgrounds

Theme switching is handled via `data-theme` attributes on the `:root` element, managed by the global theme system.

### CSS Variable Structure

#### 1. Base Color Palette

```css
:root {
  /* Base color tokens - never used directly in components */
  --color-red-500: #ff7369;
  --color-blue-500: #529cca;
  --color-coral-500: #f97068;
  --color-cream-500: #fef9ef;
  /* ... other base colors */
}
```

#### 2. Semantic Variables

```css
/* Light theme colors */
:root[data-theme='light'] {
  --color-nav-bg: var(--color-bg-dark-200);
  --color-nav-text: var(--color-brand-white);
  --color-notecard-bg: var(--color-brand-white);
  --prose-link-color: var(--color-coral-500);
}

/* Dark theme colors */
:root[data-theme='dark'] {
  --color-nav-bg: var(--color-bg-light-200);
  --color-nav-text: var(--color-brand-black);
  --color-notecard-bg: var(--color-bg-secondary);
  --prose-link-color: var(--color-red-500);
}
```

### Color Usage Principles

- **Never use base colors directly** in components - always use semantic variables
- **Group related variables** together in global.css (e.g., all nav variables together)
- **Use descriptive names** that indicate the component and property
- **Test both themes** when adding new variables
- **Follow the naming convention**: `--color-{component}-{property}`

### Primary Palette

Based on the established personal brand palette, the site uses a **reduced, focused selection**:

- **Red/Coral**: Accent colors for links, highlights, and visual interest
- **Cream/Beige**: Warm backgrounds in light mode
- **Deep backgrounds**: Rich, dark tones for dark mode
- **Monochrome base**: Black and white for primary text and backgrounds

## Layout Principles

### Grid System

- **Heavily grid-based** but with **permission to break conventions**
- **20px base grid** with flexible application
- **Asymmetry is encouraged** over rigid symmetry
- **Sharp, intentional whitespace** and strong alignment cues

### Layout Patterns

- **Diagonal lines** and **rotated elements** where appropriate
- **Overlapping text/image elements** for visual interest
- **Content sections may break conventional grid layouts**
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

Our CSS is organized into layers (in order of increasing specificity):

1. **Reset** (`@layer reset`): Basic resets, box model, margins
2. **Base** (`@layer base`): Default element styles, typography
3. **Prose** (`@layer prose`): Article and content styling
4. **Theme** (`@layer theme`): Color schemes, dark/light mode

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

- Use `inline-flex` for better alignment control
- Implement smooth transitions for interactions
- Use `currentColor` to inherit text color
- Prefer `object-fit` for image sizing
- Leverage CSS Grid over Flexbox for complex layouts

```css
.component {
  display: inline-flex;
  align-items: baseline;
  transition: opacity 0.2s ease;
}

.component:hover {
  opacity: var(--component-hover-opacity);
}
```

## Component Visual Patterns

### Design Philosophy

- **Component-driven** with consistent design language
- **Navigation lists** resembling homepage style
- **Clean, card-style embeds** for external content
- **Typographic banners** and announcements

### Content Presentation

- **Articles**: Bookish, elegant, focused reading experience
- **Notes**: Card-like, snippet feel in feed format
- **Visual hierarchy** distinguishes content types clearly

### Key Visual Patterns

#### Cards and Containers

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

#### Navigation Elements

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

#### Content Callouts

```css
.callout {
  border-left: 4px solid var(--callout-accent-color);
  background: var(--callout-bg-color);
  padding: var(--space-md);
  margin: var(--space-lg) 0;
}
```

## Animation and Interaction Design

### Interaction Principles

- **Smooth, intentional animations**
- **Touch-friendly** interface elements
- **Keyboard navigation** support
- **Subtle transitions** that enhance rather than distract

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
```

### Theme Toggle Animation

```css
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

### Implementation Patterns

```css
/* Diagonal design elements */
.diagonal-accent {
  position: relative;
}

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

/* Asymmetric grid layouts */
.modernist-grid {
  display: grid;
  grid-template-columns: 1.618fr 1fr; /* Golden ratio */
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
```

### Typography Experiments

```css
/* Oversized display typography */
.display-huge {
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.02em;
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

## Technical Implementation Guidelines

### CSS Variable Organization

1. **Base Colors** (outside layers): Raw color tokens
2. **Semantic Variables** (`@layer theme`): Component-specific variables that change between themes
3. **Component Variables** (in components): Component-specific overrides when needed

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

Use container queries for component-level responsiveness (vs media queries for page-level layout):

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

### Best Practices

1. **Performance**
   - Minimize JavaScript
   - Optimize images with proper dimensions
   - Lazy load when appropriate
   - Monitor bundle size

2. **Accessibility**
   - Use semantic HTML elements
   - Include ARIA attributes when needed
   - Support keyboard navigation
   - Maintain focus management
   - Test with screen readers

3. **Maintainability**
   - Write clear, semantic CSS
   - Use consistent naming conventions
   - Group related styles logically
   - Document complex interactions
   - Test across different themes

## Design System Evolution

This design system is a living document that should evolve with the site while maintaining its core philosophy of **personal expression through intentional design**. The system provides structure without constraining creativity, allowing for experimentation within a coherent visual framework.

### Maintaining Design Consistency

- **Regular design audits** to ensure visual coherence
- **Component documentation** in styleguide pages
- **Cross-theme testing** for new features
- **Performance monitoring** for visual enhancements
- **Accessibility validation** for all interactive elements

The ultimate goal is a design system that enables **bold, personal expression** while maintaining **technical excellence** and **user accessibility**. It should feel like Danny's authentic creative space while providing an exceptional experience for all visitors.
