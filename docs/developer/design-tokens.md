# Design Token System

CSS custom properties defined in `src/styles/_foundation.css`. Uses OKLCH colors with `light-dark()` for automatic theming, and Utopia-generated fluid scales for spacing and typography.

## Quick Reference

| Category | Token Pattern | Example |
|----------|--------------|---------|
| Colors (adaptive) | `--color-{name}` | `--color-coral`, `--color-text` |
| Colors (semantic) | `--color-{purpose}` | `--color-accent`, `--color-background` |
| Surfaces | `--surface-{name}` | `--surface-raised` |
| Spacing | `--space-{size}` | `--space-m`, `--space-l` |
| Font Size | `--font-size-{size}` | `--font-size-base`, `--font-size-lg` |
| Line Height | `--leading-{name}` | `--leading-normal`, `--leading-tight` |
| Letter Spacing | `--tracking-{name}` | `--tracking-wide`, `--tracking-tight` |
| Font Weight | `--font-weight-{name}` | `--font-weight-bold`, `--font-weight-normal` |
| Border Width | `--border-width-{size}` | `--border-width-hairline`, `--border-width-thick` |
| Border Radius | `--radius-{size}` | `--radius-sm`, `--radius-md` |
| Duration | `--duration-{speed}` | `--duration-fast`, `--duration-normal` |
| Shadows | `--shadow-{size}` | `--shadow-small`, `--shadow-medium` |

---

## Color System

### OKLCH Color Space

All colors use OKLCH for perceptual uniformity and wide gamut support.

**Syntax:** `oklch(lightness chroma hue)`
- Lightness: 0-100% (0 = black, 100 = white)
- Chroma: 0-0.4 (0 = gray, higher = more saturated)
- Hue: 0-360 degrees

### Hue Variables

Base hues shared across light/dark modes. Used to derive the adaptive palette:

```css
--hue-coral: 25;
--hue-pink: 350;
--hue-orange: 55;
--hue-purple: 300;
--hue-yellow: 95;
--hue-green: 165;
--hue-blue: 250;
--hue-grey: 210;
```

### Adaptive Color Palette

Colors that auto-switch for light/dark mode via `light-dark()`:

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-coral` | 70% L, 0.18 C | 80% L, 0.14 C | Primary accent |
| `--color-pink` | 55% L | 70% L | Alternate accent |
| `--color-orange` | 78% L | 80% L | Warning states |
| `--color-purple` | 60% L | 72% L | Visited links |
| `--color-yellow` | 90% L | 82% L | Highlights |
| `--color-green` | 65% L | 72% L | Success states |
| `--color-blue` | 62% L | 70% L | Info states |

### Absolute Colors

Non-adaptive colors:

```css
--color-white: oklch(100% 0 0);
--color-black: oklch(0% 0 0);
--color-ink: oklch(28% 0.01 var(--hue-grey));      /* Dark text */
--color-charcoal: oklch(24.35% 0 0);               /* Dark background */
--color-beige: oklch(96% 0.02 85);                 /* Light background */
```

### Semantic Colors

Role-based tokens - **use these in components**:

| Token | Purpose |
|-------|---------|
| `--color-accent` | Primary brand color (coral) |
| `--color-visited` | Visited link color (purple) |
| `--color-highlight` | Text highlight/mark (yellow) |
| `--color-background` | Page background |
| `--color-background-secondary` | Subtle background variation |
| `--color-text` | Primary text color |
| `--color-text-secondary` | Muted/secondary text |
| `--color-border` | Default border color (10% opacity) |
| `--surface-raised` | Cards/panels (white in light, dark grey in dark) |

### Deriving Color Variants

Use relative color syntax to derive hover states and variants from tokens:

```css
/* Darken: oklch(from [token] calc(l - 0.1) c h) */
/* Lighten: oklch(from [token] calc(l + 0.1) c h) */
/* Transparency: oklch(from [token] l c h / 0.1) */
```

See [design.md § Deriving Variants](./design.md#deriving-variants) for full examples including `color-mix()` and `light-dark()`.

---

## Spacing System

Utopia-generated fluid spacing. Values scale smoothly between 375px and 1280px viewports.

### Base Scale

| Token | Clamp Value | ~Min | ~Max |
|-------|-------------|------|------|
| `--space-3xs` | `clamp(0.25rem, ...)` | 4px | 5px |
| `--space-2xs` | `clamp(0.5rem, ...)` | 8px | 10px |
| `--space-xs` | `clamp(0.75rem, ...)` | 12px | 15px |
| `--space-s` | `clamp(1rem, ...)` | 16px | 20px |
| `--space-m` | `clamp(1.5rem, ...)` | 24px | 30px |
| `--space-l` | `clamp(2rem, ...)` | 32px | 40px |
| `--space-xl` | `clamp(3rem, ...)` | 48px | 60px |
| `--space-2xl` | `clamp(4rem, ...)` | 64px | 80px |
| `--space-3xl` | `clamp(6rem, ...)` | 96px | 120px |

### One-Up Pairs

For responsive gaps that jump between sizes:

| Token | Range |
|-------|-------|
| `--space-3xs-2xs` | 3xs → 2xs |
| `--space-2xs-xs` | 2xs → xs |
| `--space-xs-s` | xs → s |
| `--space-s-m` | s → m |
| `--space-m-l` | m → l |
| `--space-l-xl` | l → xl |
| `--space-xl-2xl` | xl → 2xl |
| `--space-2xl-3xl` | 2xl → 3xl |

### Usage Guidelines

| Context | Recommended Token |
|---------|------------------|
| Micro adjustments (icon gaps) | `--space-3xs`, `--space-2xs` |
| Component padding | `--space-s`, `--space-m` |
| Component gaps | `--space-xs`, `--space-s` |
| Section spacing | `--space-l`, `--space-xl` |
| Page margins | `--space-m-l`, `--space-l-xl` |

---

## Typography System

### Font Families

```css
--font-ui: 'League Spartan Variable', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-prose: 'Literata', Georgia, 'Times New Roman', serif;
--font-code: 'Fira Code Variable', 'Fira Code', 'Inconsolata', monospace;
```

### Fluid Type Scale

Utopia-generated. Scales from 375px (1.2 ratio) to 1280px (1.333 ratio):

| Step Token | Semantic Alias | ~Min | ~Max | Usage |
|------------|----------------|------|------|-------|
| `--step--2` | `--font-size-xs` | 11px | 11px | Captions, labels |
| `--step--1` | `--font-size-sm` | 13px | 15px | Metadata, small text |
| `--step-0` | `--font-size-base` | 16px | 20px | Body text |
| `--step-1` | `--font-size-md` | 19px | 27px | Large body, small headings |
| `--step-2` | `--font-size-lg` | 23px | 36px | H3, card titles |
| `--step-3` | `--font-size-xl` | 28px | 47px | H2, section titles |
| `--step-4` | `--font-size-2xl` | 33px | 63px | H1, page titles |
| `--step-5` | `--font-size-3xl` | 40px | 84px | Hero masthead |

**Use semantic aliases** (`--font-size-base`) rather than step tokens (`--step-0`).

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-none` | 0.9 | Hero text, large display |
| `--leading-tight` | 1.1 | Headings |
| `--leading-snug` | 1.2 | Subheadings, UI text |
| `--leading-normal` | 1.5 | Body text (default) |
| `--leading-loose` | 1.7 | Long-form prose |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | -0.02ch | Large display text |
| `--tracking-normal` | 0 | Body text (default) |
| `--tracking-wide` | 0.05ch | All-caps labels |
| `--tracking-wider` | 0.1ch | Small all-caps |

### Font Weights

| Token | Value |
|-------|-------|
| `--font-weight-light` | 300 |
| `--font-weight-normal` | 350 |
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |

### Measure

```css
--measure-standard: 80ch;  /* Optimal line length for readability */
```

---

## Border System

### Border Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-hairline` | 1px | Subtle dividers, table cells |
| `--border-width-base` | 2px | Default borders |
| `--border-width-thick` | 4px | Emphasis, blockquotes |
| `--border-width-heavy` | 6px | Strong accents |
| `--border-width-accent` | 1rem | Decorative bars |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-xs` | 0.125rem (2px) |
| `--radius-sm` | 0.25rem (4px) |
| `--radius-md` | 0.5rem (8px) |
| `--radius-lg` | 0.75rem (12px) |
| `--radius-full` | 9999px (pills) |

---

## Motion System

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions, hover |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Emphasis, theme changes |

### Easing

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Usage Pattern

```css
.element {
  transition: color var(--duration-fast) var(--ease-in-out);
}
```

---

## Shadow System

Uses `drop-shadow` filter for better performance with rounded corners:

| Token | Usage |
|-------|-------|
| `--shadow-small` | Subtle elevation (cards at rest) |
| `--shadow-medium` | Moderate elevation (cards on hover) |

```css
.card {
  filter: var(--shadow-small);
}
.card:hover {
  filter: var(--shadow-medium);
}
```

---

## @property Declarations

Type-safe custom properties enabling smooth animations and type checking.

### Global Properties (in global.css)

```css
@property --color-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(70% 0.18 25);
}

@property --duration-fast {
  syntax: '<time>';
  inherits: true;
  initial-value: 150ms;
}
```

Hue properties (`--hue-coral`, etc.) are declared as `<number>` for smooth interpolation.

### Component-Scoped @property

Components can define their own typed properties for smooth transitions on internal state:

```css
/* ContentCard.astro - enables smooth color transitions on hover */
@property --_border-color {
  syntax: '<color>';
  inherits: false;           /* Scoped to this component */
  initial-value: oklch(70% 0.18 25);
}

.content-card {
  --_border-color: var(--color-accent);

  &::before {
    background: var(--_border-color);
    transition: background var(--duration-fast) var(--ease-in-out);
  }
}
```

**When to use component-scoped `@property`:**
- Animating between colors (CSS can't interpolate untyped custom properties)
- Ensuring type safety for component-internal values
- Use `inherits: false` to prevent leaking to children

---

## Browser Support

All features are Baseline (widely available):

| Feature | Safari | Chrome | Firefox |
|---------|--------|--------|---------|
| OKLCH | 15.4+ | 111+ | 113+ |
| `light-dark()` | 17.5+ | 123+ | 120+ |
| Relative colors | 18+ | 122+ | 128+ |
| `@property` | 16.4+ | 85+ | 128+ |
| Container queries | 16+ | 105+ | 110+ |

---

## When to Create New Tokens

**Don't create new tokens for:**

- One-off values used in a single component
- Derived values (use relative color syntax or `calc()` instead)
- Theme-specific variants (use `light-dark()` inline)
- Slight variations of existing tokens

**Do create new tokens when:**

- A value is used identically in 3+ unrelated places
- A semantic role doesn't have an existing token (e.g., new accent color)
- The value is foundational and likely to change site-wide

**Example: Deriving vs Creating**

```css
/* ❌ Don't create --color-accent-hover */
--color-accent-hover: oklch(60% 0.18 25);

/* ✅ Derive it inline */
.button:hover {
  background: oklch(from var(--color-accent) calc(l - 0.1) c h);
}

/* ❌ Don't create --space-card-padding */
--space-card-padding: 1.5rem;

/* ✅ Use existing token */
.card {
  padding: var(--space-m);
}
```

---

## Utopia Resources

- **Type calculator:** https://utopia.fyi/type/calculator
- **Space calculator:** https://utopia.fyi/space/calculator
- **Configuration used:** 375px min → 1280px max, 16px → 20px base, 1.2 → 1.333 ratio
