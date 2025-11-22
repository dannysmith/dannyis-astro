# Design Token System

This document specifies the modern CSS design token architecture for danny.is. It uses OKLCH colors for perceptual uniformity, `light-dark()` for automatic theming, Utopia fluid typography, and systematic tokens.

## Quick Reference

| Category | Token Prefix | Count | Example |
|----------|-------------|-------|---------|
| Colors (primitive) | `--color-{name}-{shade}` | 54 | `--color-red-500` |
| Colors (semantic) | `--color-{purpose}` | ~20 | `--color-text-primary` |
| Surfaces | `--surface-{tier}` | 4 | `--surface-raised` |
| Spacing | `--space-{scale}` | 14 | `--space-4` |
| Typography | `--font-size-{scale}` | 8 | `--font-size-xl` |
| Line Height | `--leading-{name}` | 6 | `--leading-normal` |
| Letter Spacing | `--tracking-{name}` | 5 | `--tracking-tight` |
| Font Weight | `--font-weight-{name}` | 7 | `--font-weight-bold` |
| Borders | `--border-width-{tier}` | 5 | `--border-width-base` |
| Radius | `--radius-{scale}` | 6 | `--radius-lg` |
| Shadows | `--shadow-{scale}` | 6 | `--shadow-medium` |
| Elevation | `--elevation-{tier}` | 5 | `--elevation-medium` |
| Motion | `--duration-{speed}` | 5 | `--duration-fast` |
| Easing | `--ease-{name}` | 4 | `--ease-out` |

**Total: ~105 core tokens** (reduced from ~130 with consolidation)

---

## Color System

### OKLCH Color Space

All colors use OKLCH for perceptual uniformity. OKLCH provides:
- **Perceptually uniform lightness** - 50% lightness looks equally bright across all hues
- **Wide color gamut** - Automatically uses Display P3 on modern displays
- **Easy manipulation** - Adjust lightness without hue shift
- **Smoother gradients** - No gray dead zones like HSL

**Syntax:** `oklch(lightness chroma hue)`
- Lightness: 0-100% (0 = black, 100 = white)
- Chroma: 0-0.4 (0 = gray, 0.4 = maximum saturation)
- Hue: 0-360 degrees

### Brand Colors (OKLCH)

| Name | Hex | OKLCH | Usage |
|------|-----|-------|-------|
| Coral (primary) | `#ff7369` | `oklch(70% 0.18 25)` | Accent, links, dividers |
| Beige | `#f6f3ea` | `oklch(96% 0.02 85)` | Light mode background |
| Charcoal | `#202020` | `oklch(18% 0.00 0)` | Dark mode background |
| Dark Grey | `#2f3437` | `oklch(28% 0.01 210)` | Light mode text |
| White | `#ffffff` | `oklch(100% 0 0)` | Cards, highlights |

### Primitive Color Palette (OKLCH)

All palette colors at consistent lightness steps for harmony:

```css
:root {
  /* Red/Coral - Brand accent (hue: 25) */
  --color-red-300: oklch(90% 0.08 25);
  --color-red-400: oklch(82% 0.12 25);
  --color-red-500: oklch(70% 0.18 25);   /* Primary accent */
  --color-red-600: oklch(58% 0.16 25);
  --color-red-700: oklch(48% 0.12 25);
  --color-red-800: oklch(35% 0.06 25);

  /* Blue (hue: 250) */
  --color-blue-300: oklch(90% 0.06 250);
  --color-blue-400: oklch(82% 0.10 250);
  --color-blue-500: oklch(62% 0.15 250);
  --color-blue-600: oklch(52% 0.18 250);
  --color-blue-700: oklch(42% 0.12 250);
  --color-blue-800: oklch(32% 0.06 250);

  /* Green (hue: 160) */
  --color-green-300: oklch(90% 0.06 160);
  --color-green-400: oklch(82% 0.10 160);
  --color-green-500: oklch(65% 0.14 160);
  --color-green-600: oklch(52% 0.14 160);
  --color-green-700: oklch(42% 0.10 160);
  --color-green-800: oklch(32% 0.06 160);

  /* Purple (hue: 300) */
  --color-purple-300: oklch(90% 0.06 300);
  --color-purple-400: oklch(82% 0.10 300);
  --color-purple-500: oklch(60% 0.16 300);
  --color-purple-600: oklch(50% 0.18 300);
  --color-purple-700: oklch(42% 0.12 300);
  --color-purple-800: oklch(32% 0.06 300);

  /* Yellow (hue: 85) */
  --color-yellow-300: oklch(95% 0.08 85);
  --color-yellow-400: oklch(92% 0.12 85);
  --color-yellow-500: oklch(88% 0.16 85);
  --color-yellow-600: oklch(78% 0.14 85);
  --color-yellow-700: oklch(55% 0.08 85);
  --color-yellow-800: oklch(42% 0.04 85);

  /* Orange (hue: 55) */
  --color-orange-300: oklch(92% 0.06 55);
  --color-orange-400: oklch(85% 0.12 55);
  --color-orange-500: oklch(78% 0.16 55);
  --color-orange-600: oklch(68% 0.16 55);
  --color-orange-700: oklch(52% 0.10 55);
  --color-orange-800: oklch(40% 0.05 55);

  /* Grey (neutral, chroma: 0) */
  --color-grey-300: oklch(92% 0 0);
  --color-grey-400: oklch(85% 0 0);
  --color-grey-500: oklch(65% 0 0);
  --color-grey-600: oklch(55% 0 0);
  --color-grey-700: oklch(40% 0 0);
  --color-grey-800: oklch(30% 0 0);
}
```

### Semantic Colors with `light-dark()`

The `light-dark()` function provides automatic theme switching based on `color-scheme`. This eliminates duplicate theme blocks and cuts CSS by ~50%.

```css
:root {
  color-scheme: light dark;

  /* ============================================
     SEMANTIC COLORS - Automatic Theme Switching
     ============================================ */

  /* Backgrounds */
  --color-bg-primary: light-dark(
    oklch(96% 0.02 85),    /* Light: warm beige */
    oklch(18% 0.00 0)      /* Dark: charcoal */
  );

  --color-bg-secondary: light-dark(
    oklch(98% 0.01 85),    /* Light: lighter beige */
    oklch(14% 0.00 0)      /* Dark: deeper charcoal */
  );

  /* Text */
  --color-text-primary: light-dark(
    oklch(28% 0.01 210),   /* Light: dark grey */
    oklch(96% 0.02 85)     /* Dark: beige */
  );

  --color-text-secondary: light-dark(
    oklch(50% 0.01 0),     /* Light: medium grey */
    oklch(65% 0.01 0)      /* Dark: light grey */
  );

  /* Accent - consistent across themes */
  --color-accent: oklch(70% 0.18 25);

  /* Links */
  --color-link: light-dark(
    oklch(70% 0.18 25),    /* Light: coral */
    oklch(75% 0.15 25)     /* Dark: lighter coral */
  );

  --color-link-hover: light-dark(
    oklch(58% 0.16 25),    /* Light: darker coral */
    oklch(70% 0.18 25)     /* Dark: standard coral */
  );

  --color-link-visited: light-dark(
    oklch(50% 0.18 300),   /* Light: purple */
    oklch(60% 0.16 300)    /* Dark: lighter purple */
  );

  /* Borders */
  --color-border: light-dark(
    oklch(0% 0 0 / 0.1),   /* Light: black 10% */
    oklch(100% 0 0 / 0.1)  /* Dark: white 10% */
  );

  /* Marks and highlights */
  --color-mark-bg: light-dark(
    oklch(88% 0.16 85),    /* Light: yellow */
    oklch(78% 0.14 85)     /* Dark: darker yellow */
  );
}

/* Manual theme override via data attribute */
:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;
}
```

### Surface Elevation System

Surfaces create z-axis hierarchy. In dark mode, raised surfaces are **lighter** (not darker) to maintain visual hierarchy.

```css
:root {
  /* Surface colors - z-axis hierarchy */
  --surface-base: light-dark(
    oklch(96% 0.02 85),    /* Light: beige */
    oklch(18% 0.00 0)      /* Dark: charcoal */
  );

  --surface-raised: light-dark(
    oklch(100% 0 0),       /* Light: white */
    oklch(22% 0.00 0)      /* Dark: lighter charcoal */
  );

  --surface-inset: light-dark(
    oklch(92% 0.02 85),    /* Light: darker beige */
    oklch(14% 0.00 0)      /* Dark: deeper charcoal */
  );

  --surface-overlay: light-dark(
    oklch(98% 0.01 85),    /* Light: very light */
    oklch(25% 0.00 0)      /* Dark: elevated */
  );

  /* Elevation tokens (shadow + surface combinations) */
  --elevation-flat: none;
  --elevation-low: var(--shadow-small);
  --elevation-medium: var(--shadow-medium);
  --elevation-high: var(--shadow-large);
  --elevation-highest: var(--shadow-xlarge);
}
```

### Relative Colors for Variants

Generate hover states and variants automatically:

```css
/* Hover states - reduce lightness by 10% */
.button:hover {
  background: oklch(from var(--color-accent) calc(l - 0.1) c h);
}

/* Subtle backgrounds - increase lightness, reduce chroma */
.subtle-bg {
  background: oklch(from var(--color-accent) calc(l + 0.25) calc(c * 0.3) h);
}

/* Transparency */
.overlay {
  background: oklch(from var(--color-accent) l c h / 0.1);
}
```

---

## Spacing System

### Static 8px Grid

Predictable spacing for component internals. Based on 8px base unit (0.5rem).

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /*  4px - micro adjustments */
  --space-2: 0.5rem;    /*  8px - tight spacing */
  --space-3: 0.75rem;   /* 12px - small gaps */
  --space-4: 1rem;      /* 16px - base unit */
  --space-5: 1.5rem;    /* 24px - comfortable */
  --space-6: 2rem;      /* 32px - breathing room */
  --space-8: 2.5rem;    /* 40px - section spacing */
  --space-10: 3rem;     /* 48px - major sections */
  --space-12: 4rem;     /* 64px - hero spacing */
  --space-16: 5rem;     /* 80px - dramatic spacing */
  --space-20: 6rem;     /* 96px - monumental */
}
```

### Fluid Spacing (Large Responsive Gaps)

For hero-to-nav gaps, section margins, and page padding:

```css
:root {
  /* Utopia generated: 375px → 1280px */
  --space-fluid-s-l: clamp(1.125rem, 0.5rem + 2.5vw, 2.5rem);   /* 18px → 40px */
  --space-fluid-m-xl: clamp(1.5rem, 0.75rem + 3vw, 3.75rem);    /* 24px → 60px */
}
```

### Usage Guidelines

| Context | Token | Example |
|---------|-------|---------|
| Component padding | `--space-3` to `--space-5` | Card padding |
| Component gaps | `--space-2` to `--space-4` | List item spacing |
| Section spacing | `--space-8` to `--space-12` | Between page sections |
| Large responsive gaps | `--space-fluid-*` | Hero to content |
| Micro adjustments | `--space-1` | Icon-to-text gaps |

---

## Typography System

### Utopia Fluid Type Scale

Generated with [Utopia](https://utopia.fyi/type/calculator):
- Min viewport: 375px @ 18px base, 1.2 ratio (Minor Third)
- Max viewport: 1280px @ 20px base, 1.333 ratio (Perfect Fourth)

```css
:root {
  /* Raw Utopia steps */
  --step--2: clamp(0.78rem, 0.77rem + 0.03vw, 0.80rem);   /* ~12.5px → 12.8px */
  --step--1: clamp(0.94rem, 0.91rem + 0.11vw, 1.00rem);   /* ~15px → 16px */
  --step-0:  clamp(1.13rem, 1.07rem + 0.23vw, 1.25rem);   /* ~18px → 20px (base) */
  --step-1:  clamp(1.35rem, 1.26rem + 0.39vw, 1.67rem);   /* ~21.6px → 26.7px */
  --step-2:  clamp(1.62rem, 1.48rem + 0.61vw, 2.22rem);   /* ~25.9px → 35.5px */
  --step-3:  clamp(1.94rem, 1.74rem + 0.90vw, 2.96rem);   /* ~31.1px → 47.4px */
  --step-4:  clamp(2.33rem, 2.04rem + 1.31vw, 3.95rem);   /* ~37.3px → 63.2px */
  --step-5:  clamp(2.80rem, 2.38rem + 1.85vw, 5.26rem);   /* ~44.8px → 84.2px */

  /* Semantic aliases */
  --font-size-xs: var(--step--2);    /* Small labels, captions */
  --font-size-sm: var(--step--1);    /* Secondary text, metadata */
  --font-size-base: var(--step-0);   /* Body text */
  --font-size-md: var(--step-1);     /* Large body, small headings */
  --font-size-lg: var(--step-2);     /* H3, card titles */
  --font-size-xl: var(--step-3);     /* H2, section titles */
  --font-size-2xl: var(--step-4);    /* H1, page titles */
  --font-size-3xl: var(--step-5);    /* Hero masthead */
}
```

### Line Heights

```css
:root {
  --leading-none: 0.9;     /* Hero text, large display */
  --leading-tight: 1.1;    /* Headings */
  --leading-snug: 1.2;     /* Subheadings */
  --leading-normal: 1.5;   /* Body text */
  --leading-relaxed: 1.7;  /* Long-form prose */
  --leading-loose: 1.8;    /* Extra breathing room */
}
```

### Letter Spacing

```css
:root {
  --tracking-tighter: -0.02em;  /* Large display text */
  --tracking-tight: -0.01em;    /* Headings */
  --tracking-normal: 0;         /* Body text */
  --tracking-wide: 0.08em;      /* All-caps labels */
  --tracking-wider: 0.1ch;      /* Small all-caps */
}
```

### Font Weights

Matched to Literata (prose) and League Spartan (UI):

```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 350;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
}
```

### Usage Guidelines

| Context | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero masthead | `--font-size-3xl` | `--font-weight-black` | `--leading-none` |
| Page title (H1) | `--font-size-2xl` | `--font-weight-bold` | `--leading-tight` |
| Section title (H2) | `--font-size-xl` | `--font-weight-bold` | `--leading-tight` |
| Card title (H3) | `--font-size-lg` | `--font-weight-semibold` | `--leading-snug` |
| Body prose | `--font-size-base` | `--font-weight-normal` | `--leading-relaxed` |
| Metadata | `--font-size-sm` | `--font-weight-regular` | `--leading-normal` |
| Captions | `--font-size-xs` | `--font-weight-regular` | `--leading-normal` |

---

## Border System

### The Coral Rule System

The coral underline is the site's signature motif. Systematize with tiered widths:

```css
:root {
  /* Border widths */
  --border-width-hairline: 1px;    /* Subtle dividers */
  --border-width-thin: 1.5px;      /* Default borders */
  --border-width-base: 2px;        /* THE CORAL RULE */
  --border-width-thick: 4px;       /* Heavy dividers */
  --border-width-heavy: 6px;       /* Blockquotes, footer */

  /* Border radius */
  --radius-xs: 0.125rem;   /* 2px */
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-full: 9999px;   /* Pills */

  /* Composite divider tokens */
  --divider-subtle: var(--border-width-hairline) solid var(--color-accent);
  --divider-default: var(--border-width-base) solid var(--color-accent);
  --divider-bold: var(--border-width-thick) solid var(--color-accent);
}
```

### Usage Guidelines

| Element | Width | Example |
|---------|-------|---------|
| Table cells | `--border-width-hairline` | `border: var(--border-width-hairline) solid var(--color-border)` |
| Card borders | `--border-width-thin` | Subtle containment |
| Nav underlines | `--border-width-base` | THE iconic coral rule |
| List dividers | `--border-width-base` | Writing/notes list rows |
| Blockquotes | `--border-width-heavy` | Left border accent |
| Footer top | `--border-width-heavy` | Section separator |

---

## Shadow System

```css
:root {
  --shadow-xsmall: 0 1px 2px oklch(0% 0 0 / 0.05);

  --shadow-small:
    0 1px 3px oklch(0% 0 0 / 0.1),
    0 1px 2px oklch(0% 0 0 / 0.06);

  --shadow-medium:
    0 4px 6px oklch(0% 0 0 / 0.1),
    0 2px 4px oklch(0% 0 0 / 0.06);

  --shadow-large:
    0 10px 15px oklch(0% 0 0 / 0.1),
    0 4px 6px oklch(0% 0 0 / 0.05);

  --shadow-xlarge:
    0 20px 25px oklch(0% 0 0 / 0.1),
    0 8px 10px oklch(0% 0 0 / 0.04);

  --shadow-xxlarge: 0 25px 50px oklch(0% 0 0 / 0.25);
}
```

---

## Motion System

```css
:root {
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;      /* Micro-interactions */
  --duration-normal: 200ms;    /* Standard transitions */
  --duration-slow: 300ms;      /* Emphasis */
  --duration-slower: 500ms;    /* Accordions, reveals */

  /* Easing functions */
  --ease-default: ease;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Usage Guidelines

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover color changes | `--duration-fast` | `--ease-default` |
| Button states | `--duration-normal` | `--ease-out` |
| Accordion expand | `--duration-slower` | `--ease-in-out` |
| Theme transitions | `--duration-slow` | `--ease-in-out` |

---

## Type-Safe Properties with `@property`

Use `@property` for key tokens to enable smooth animations:

```css
@property --color-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(70% 0.18 25);
}

@property --space-4 {
  syntax: '<length>';
  inherits: true;
  initial-value: 1rem;
}
```

---

## Token Naming Conventions

### Three-Tier Hierarchy

1. **Primitive tokens** (raw values, never use directly):
   - `--color-red-500`, `--color-grey-300`
   - `--step-0`, `--step-1`

2. **Semantic tokens** (use in components):
   - `--color-text-primary`, `--color-bg-secondary`
   - `--font-size-lg`, `--space-4`
   - `--surface-raised`, `--elevation-medium`

3. **Component tokens** (rare, only when semantics differ):
   - `--contentcard-article-accent` (red)
   - `--contentcard-note-accent` (blue)

### Naming Pattern

```
--{category}-{property}-{variant}

Examples:
--space-4
--font-size-xl
--border-width-base
--radius-lg
--duration-fast
--surface-raised
--elevation-medium
```

---

## Migration Guide

### Old Token → New Token Mapping

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--spacer-xs` | `--space-2` | 0.5rem |
| `--spacer-sm` | `--space-4` | 1rem |
| `--spacer-md` | `--space-6` | 2rem |
| `--spacer-lg` | `--space-10` | 3rem |
| `--spacer-xl` | `--space-12` | 4rem |
| `--spacer-xxl` | `--space-20` | 6rem |
| `--color-brand-primary` | `--color-accent` | OKLCH |
| `--color-brand-beige` | `--surface-base` (light) | Via light-dark() |
| `--color-bg-primary` | `--surface-base` | Via light-dark() |
| `--color-bg-secondary` | `--surface-inset` | Via light-dark() |

### Deprecated Tokens

During migration, old tokens remain but are marked deprecated:

```css
:root {
  /* DEPRECATED - use --space-2 instead */
  --spacer-xs: var(--space-2);

  /* DEPRECATED - use --space-4 instead */
  --spacer-sm: var(--space-4);
}
```

---

## Browser Support

All features are **Baseline** (widely available):

| Feature | Safari | Chrome | Firefox |
|---------|--------|--------|---------|
| OKLCH | 15.4+ | 111+ | 113+ |
| `light-dark()` | 17.5+ | 123+ | 120+ |
| Relative colors | 18+ | 122+ | 128+ |
| `@property` | 16.4+ | 85+ | 128+ |
| Container queries | 16+ | 105+ | 110+ |

---

## Utopia Resources

- **Type calculator:** https://utopia.fyi/type/calculator?c=375,18,1.2,1280,20,1.333,5,2
- **Space calculator:** https://utopia.fyi/space/calculator
- **Methodology:** https://utopia.fyi/blog/

---

## Implementation Checklist (Task 3)

- [ ] Add OKLCH primitive color tokens
- [ ] Implement `light-dark()` semantic colors
- [ ] Add surface elevation system
- [ ] Add Utopia typography scale
- [ ] Add spacing tokens (static + fluid)
- [ ] Add border/radius tokens
- [ ] Add motion tokens
- [ ] Add `@property` definitions
- [ ] Mark deprecated tokens
- [ ] Update components to use new tokens
- [ ] Test both themes at all breakpoints
- [ ] Verify OKLCH colors for visual parity

---

## Component Migration Audit

This table documents hardcoded values in each component that need migration to design tokens.
Priority is based on visual impact and complexity.

### High Priority (Core Layout Components)

| Component | Font-Size | Spacing | Border/Radius | Transitions | Status |
|-----------|-----------|---------|---------------|-------------|--------|
| `LongFormProseTypography.astro` | 9 values | 2 values | 2 values | 1 value | Needs migration |
| `SimpleProseTypography.astro` | 2 values | 1 value | 2 values | 1 value | Needs migration |
| `Footer.astro` | 1 value | 2 values | - | - | Needs migration |
| `MainNavigation.astro` | 1 value | 3 values | 1 value | 1 value | Needs migration |
| `NoteCard.astro` | 2 values | 2 values | 1 value | 1 value | Needs migration |

### Medium Priority (Content Components)

| Component | Font-Size | Spacing | Border/Radius | Transitions | Status |
|-----------|-----------|---------|---------------|-------------|--------|
| `ContentCard.astro` | 7 values | 4 values | - | 1 value | Needs migration |
| `Callout.astro` | 2 values | 2 values | 1 value | - | Needs migration |
| `Accordion.astro` | 2 values | 3 values | 1 value | 2 values | Needs migration |
| `BookmarkCard.astro` | 4 values | 2 values | 1 value | 2 values | Needs migration |
| `BlockQuoteCitation.astro` | 2 values | - | - | 1 value | Needs migration |

### Lower Priority (UI Components)

| Component | Font-Size | Spacing | Border/Radius | Transitions | Status |
|-----------|-----------|---------|---------------|-------------|--------|
| `ThemeToggle.astro` | 3 values | 3 values | 1 value | 3 values | Needs migration |
| `Pill.astro` | 1 value | 1 value | 1 value | - | Needs migration |
| `Notion.astro` | 2 values | - | 1 value | 1 value | Needs migration |
| `SmartLink.astro` | 3 values | - | - | - | Needs migration |
| `IntroParagraph.astro` | 1 value | - | - | - | Needs migration |
| `ButtonLink.astro` | - | 2 values | 1 value | - | Needs migration |
| `SocialLinks.astro` | - | 1 value | - | - | Needs migration |
| `MarkdownContentActions.astro` | - | 1 value | 1 value | - | Needs migration |
| `Lightbox.astro` | 1 value | - | - | - | Needs migration |
| `BasicImage.astro` | - | 1 value | 3 values | - | Needs migration |
| `PersonalLogo.astro` | - | 1 value | - | - | Needs migration |

### Page-Level CSS

| File | Font-Size | Spacing | Border/Radius | Transitions | Status |
|------|-----------|---------|---------------|-------------|--------|
| `pages/writing/index.astro` | 2 values | 2 values | - | 2 values | Needs migration |
| `pages/notes/index.astro` | 3 values | 4 values | - | 1 value | Needs migration |
| `pages/styleguide.astro` | 3 values | 16 values | 2 values | - | Needs migration |
| `layouts/Article.astro` | 1 value | 1 value | 1 value | - | Needs migration |
| `layouts/Note.astro` | - | 1 value | - | - | Needs migration |

### MDX Typography Components

| Component | Font-Size | Spacing | Border/Radius | Status |
|-----------|-----------|---------|---------------|--------|
| `Title1.astro` | - | - | - | Review needed |
| `Title2.astro` | - | - | - | Review needed |
| `Title3.astro` | - | - | - | Review needed |
| `Title4.astro` | - | - | - | Review needed |
| `SmallCaps.astro` | - | - | - | Review needed |
| `highlight.astro` | - | - | 1 value | Needs migration |

### Summary Statistics

| Category | Total Hardcoded Values |
|----------|------------------------|
| Font-size | ~64 occurrences |
| Padding/margin/gap | ~62 occurrences |
| Border-radius | ~25 occurrences |
| Transitions | ~19 occurrences |
| **Total** | **~170 values to migrate** |

### Migration Sequence (Recommended)

1. **Prose Typography** - `LongFormProseTypography.astro`, `SimpleProseTypography.astro`
   - Highest impact on content presentation
   - May have redundancy from Task 0 reset updates

2. **Layout Components** - `Footer.astro`, `MainNavigation.astro`, `NoteCard.astro`
   - Core site structure

3. **Content Cards** - `ContentCard.astro`, `BookmarkCard.astro`, `Callout.astro`
   - High visibility in content

4. **Interactive Components** - `Accordion.astro`, `ThemeToggle.astro`
   - Transition tokens most impactful

5. **UI Components** - `Pill.astro`, `ButtonLink.astro`, etc.
   - Lower complexity

6. **Page CSS** - Inline styles in pages and layouts
   - Final cleanup
