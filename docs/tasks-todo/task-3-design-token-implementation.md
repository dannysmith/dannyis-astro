# Core Design Token Implementation & Component Migration

**Type:** Implementation
**Goal:** Implement the comprehensive design token system from Task 2 and migrate all components using modern CSS patterns
**Prerequisites:** Task 2 (Architecture) reviewed and approved

## Overview

This task implements the token architecture designed in Task 2, migrating all components from hardcoded values to systematic design tokens using modern CSS features.

**Key Modern CSS Features:**
- OKLCH colors for perceptual uniformity
- `light-dark()` for automatic theming
- Relative colors for systematic variants
- **Utopia fluid typography** for mathematically coherent type scale
- Container query units (`cqi`) for component-relative sizing
- Logical properties for internationalization
- `@property` for type-safe custom properties

---

## Implementation Phases

### Phase 1: Token Definition & Foundation

**Deliverable:** Updated `src/styles/global.css` with comprehensive modern token system

#### 1.1 Add @property Definitions (Top of File)

```css
/* ============================================
   TYPE-SAFE CUSTOM PROPERTIES
   Enables animation and type checking
   ============================================ */

@property --color-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(62% 0.19 15);
}

@property --space-4 {
  syntax: '<length>';
  inherits: true;
  initial-value: 1rem;
}

@property --font-size-base {
  syntax: '<length>';
  inherits: true;
  initial-value: 1rem;
}

/* Add for other frequently animated/critical tokens */
```

#### 1.2 Convert Color Palette to OKLCH

```css
:root {
  /* ============================================
     BRAND COLORS - OKLCH
     ============================================ */

  /* Convert existing hex to OKLCH */
  --color-brand-primary: oklch(62% 0.19 15);        /* was #ff7369 */
  --color-brand-beige: oklch(95% 0.02 75);          /* was #f6f3ea */
  --color-brand-grey: oklch(28% 0.01 0);            /* was #2f3437 */
  --color-brand-dark-grey: oklch(15% 0.01 0);       /* was #191919 */
  --color-brand-white: oklch(100% 0 0);             /* was #ffffff */

  /* Color palettes - systematic lightness steps */
  --color-red-300: oklch(90% 0.1 15);
  --color-red-400: oklch(85% 0.13 15);
  --color-red-500: oklch(62% 0.19 15);
  --color-red-600: oklch(50% 0.18 15);
  --color-red-700: oklch(40% 0.15 15);
  --color-red-800: oklch(30% 0.1 15);

  /* Repeat for other color families: blue, green, purple, yellow, orange, pink, grey */
  /* Maintain consistent lightness steps: 90%, 85%, 62%, 50%, 40%, 30% */
}
```

**Action items:**
- [ ] Convert all hex colors to OKLCH using conversion tool
- [ ] Test all colors in both themes for visual parity
- [ ] Verify color contrast still meets WCAG AA (4.5:1)

#### 1.3 Implement light-dark() for Semantic Colors

```css
:root {
  /* Enable automatic theme switching */
  color-scheme: light dark;

  /* ============================================
     SEMANTIC COLORS - Automatic Light/Dark
     ============================================ */

  --color-bg-primary: light-dark(
    oklch(95% 0.02 75),       /* Light mode */
    oklch(15% 0.01 0)          /* Dark mode */
  );

  --color-bg-secondary: light-dark(
    oklch(98% 0.01 75),
    oklch(12% 0.01 0)
  );

  --color-text-primary: light-dark(
    oklch(28% 0.01 0),
    oklch(95% 0.02 75)
  );

  --color-text-secondary: light-dark(
    oklch(50% 0.01 0),
    oklch(70% 0.02 0)
  );

  --color-accent: oklch(62% 0.19 15);  /* Same in both */

  /* Borders using relative colors */
  --color-border: light-dark(
    oklch(from var(--color-bg-primary) calc(l - 0.1) c h),
    oklch(from var(--color-bg-primary) calc(l + 0.05) c h)
  );
}

/* Manual theme override */
:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;
}
```

**Action items:**
- [ ] Replace all theme-specific blocks with `light-dark()`
- [ ] Remove duplicate `:root[data-theme='dark']` and `@media (prefers-color-scheme: dark)` blocks
- [ ] Test theme switching (auto, manual light, manual dark)
- [ ] Verify CSS reduction (should drop from ~700 lines to ~400 lines)

#### 1.4 Add Surface Elevation System

```css
:root {
  /* ============================================
     SURFACE ELEVATION - Z-Axis Hierarchy
     ============================================ */

  --surface-base: light-dark(
    oklch(95% 0.02 75),         /* Light: beige background */
    oklch(15% 0.01 0)            /* Dark: charcoal */
  );

  --surface-raised: light-dark(
    oklch(100% 0 0),             /* Light: white */
    oklch(18% 0.01 0)            /* Dark: +3% lighter (critical for visibility) */
  );

  --surface-inset: light-dark(
    oklch(92% 0.02 75),          /* Light: darker beige */
    oklch(12% 0.01 0)            /* Dark: deeper */
  );

  --surface-overlay: light-dark(
    oklch(98% 0.01 75),
    oklch(20% 0.01 0)
  );

  /* Elevation levels */
  --elevation-flat: none;
  --elevation-low: var(--shadow-small);
  --elevation-medium: var(--shadow-medium);
  --elevation-high: var(--shadow-large);
  --elevation-highest: var(--shadow-xlarge);
}
```

**Action items:**
- [ ] Add surface tier tokens
- [ ] Test dark mode: raised surfaces must be *lighter* than base
- [ ] Verify contrast: `--surface-raised` vs `--surface-base` must be visible (at least 3% difference in OKLCH lightness)

#### 1.5 Add Complete Token System

```css
:root {
  /* ============================================
     SPACING - Static 8px Grid
     ============================================ */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 2.5rem;   /* 40px */
  --space-10: 3rem;    /* 48px */
  --space-12: 4rem;    /* 64px */
  --space-16: 5rem;    /* 80px */
  --space-20: 6rem;    /* 96px */

  /* Fluid spacing for large responsive gaps */
  --space-fluid-s-l: clamp(1.125rem, 0.5rem + 2.5vw, 2.5rem);
  --space-fluid-m-xl: clamp(1.5rem, 0.75rem + 3vw, 3.75rem);

  /* DEPRECATED - keep for now, remove in cleanup */
  --spacer-xs: var(--space-2);
  --spacer-sm: var(--space-4);
  --spacer-md: var(--space-6);
  --spacer-lg: var(--space-10);
  --spacer-xl: var(--space-12);
  --spacer-xxl: var(--space-20);

  /* ============================================
     TYPOGRAPHY - Utopia Fluid Type Scale
     https://utopia.fyi/type/calculator?c=375,18,1.2,1280,20,1.333,5,2
     ============================================ */
  /* Raw Utopia steps */
  --step--2: clamp(0.78rem, 0.77rem + 0.03vw, 0.80rem);
  --step--1: clamp(0.94rem, 0.91rem + 0.11vw, 1.00rem);
  --step-0:  clamp(1.13rem, 1.07rem + 0.23vw, 1.25rem);
  --step-1:  clamp(1.35rem, 1.26rem + 0.39vw, 1.67rem);
  --step-2:  clamp(1.62rem, 1.48rem + 0.61vw, 2.22rem);
  --step-3:  clamp(1.94rem, 1.74rem + 0.90vw, 2.96rem);
  --step-4:  clamp(2.33rem, 2.04rem + 1.31vw, 3.95rem);
  --step-5:  clamp(2.80rem, 2.38rem + 1.85vw, 5.26rem);

  /* Semantic aliases - use these in components */
  --font-size-xs: var(--step--2);
  --font-size-sm: var(--step--1);
  --font-size-base: var(--step-0);
  --font-size-md: var(--step-1);
  --font-size-lg: var(--step-2);
  --font-size-xl: var(--step-3);
  --font-size-2xl: var(--step-4);
  --font-size-3xl: var(--step-5);

  /* Line heights */
  --leading-none: 0.9;
  --leading-tight: 1.1;
  --leading-snug: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  --leading-loose: 1.8;

  /* Letter spacing */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.08em;
  --tracking-wider: 0.1ch;

  /* Font weights */
  --font-weight-light: 300;
  --font-weight-normal: 350;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* ============================================
     BORDERS & RADIUS
     ============================================ */
  --border-width-hairline: 1px;
  --border-width-thin: 1.5px;
  --border-width-base: 2px;       /* THE CORAL RULE */
  --border-width-thick: 4px;
  --border-width-heavy: 6px;

  --radius-xs: 0.125rem;  /* 2px */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;

  /* Composite dividers */
  --divider-subtle: var(--border-width-hairline) solid var(--color-accent);
  --divider-default: var(--border-width-base) solid var(--color-accent);
  --divider-bold: var(--border-width-thick) solid var(--color-accent);

  /* ============================================
     MOTION
     ============================================ */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  --ease-default: ease;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Action items:**
- [ ] Add all token categories to `:root`
- [ ] Keep deprecated `--spacer-*` for backward compatibility
- [ ] Document mapping in code comments

---

### Phase 2: Component Migration (Modern CSS Patterns)

#### 2.1 Prose Typography Simplification & Token Migration

**Priority components:** `LongFormProseTypography.astro` and `SimpleProseTypography.astro`

These components have significant opportunities for simplification now that Task 0 has modernized the base layer.

**Redundant styles to remove (now in base/reset layers):**
- `hanging-punctuation: first allow-end last` — now on `html` in base layer
- `font-variant-ligatures` — now on `html` in base layer
- `text-wrap: balance/pretty` — now in reset layer

**Hardcoded values to migrate to Utopia tokens:**

| Component | Current | Should Be |
|-----------|---------|-----------|
| LongFormProse base | `clamp(1rem, calc(0.6rem + 1vw), 1.3rem)` | `var(--font-size-base)` or `var(--step-0)` |
| LongFormProse h1.title | `2.4em` | `var(--font-size-2xl)` |
| LongFormProse h1 | `1.93em` | `var(--font-size-xl)` |
| LongFormProse h2 | `1.56em` | `var(--font-size-lg)` |
| LongFormProse h3 | `1.25em` | `var(--font-size-md)` |
| SimpleProse base | `1rem` | `var(--font-size-base)` |
| SimpleProse headings line-height | `1.2` | `var(--leading-snug)` |

**Spacing to migrate:**
- `--side-space: 2rem` → `var(--space-6)` or `var(--space-fluid-s-l)`
- `margin-top: 2.5em`, `1.5em`, `1.7em` → appropriate `--space-*` tokens
- `margin: 4rem 0` (hr) → `var(--space-12) 0`

**Borders to migrate:**
- `border-bottom: 1px solid` → `var(--border-width-hairline)`
- `border-left: 2px solid` → `var(--border-width-base)` (coral rule)
- `border-left: 4px solid` (SimpleProse blockquote) → `var(--border-width-thick)`

**Action items:**
- [ ] Remove redundant `hanging-punctuation` declarations
- [ ] Remove redundant `font-variant-ligatures` declarations
- [ ] Migrate LongFormProse font-size to `--font-size-base`
- [ ] Migrate heading sizes to Utopia tokens
- [ ] Migrate spacing values to `--space-*` tokens
- [ ] Migrate border widths to `--border-width-*` tokens
- [ ] Test both prose components in light/dark mode

---

#### 2.2 Typography Migration (Other Components)

**Example: NoteCard.astro**

```css
/* BEFORE */
.note {
  font-size: clamp(1.5rem, 4vw, 2.5rem);  /* Hand-crafted, arbitrary */
  line-height: 1.2;
  letter-spacing: 0.1ch;
}

/* AFTER - Utopia tokens */
.note h1 {
  font-size: var(--font-size-lg);        /* Utopia step-2 */
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-wider);
  font-weight: var(--font-weight-semibold);
}

.note .date {
  font-size: var(--font-size-xs);        /* Utopia step--2 */
  letter-spacing: var(--tracking-wider);
}

.note p {
  font-size: var(--font-size-base);      /* Utopia step-0 */
  line-height: var(--leading-normal);
}
```

**Why Utopia tokens?**
- All sizes mathematically related (same formula)
- No hand-crafting clamp values
- Change config once, regenerate, done
- Harmonious progression across the scale

**Action items:**
- [ ] Replace all hardcoded font-size with `--font-size-*` tokens
- [ ] Replace all hardcoded line-height with `--leading-*` tokens
- [ ] Replace all hardcoded letter-spacing with `--tracking-*` tokens
- [ ] Replace all hardcoded font-weight with `--font-weight-*` tokens
- [ ] Use semantic aliases (`--font-size-lg`) not raw steps (`--step-2`)

#### 2.3 Spacing Migration + Logical Properties

**Example: NoteCard.astro**

```css
/* BEFORE - Physical properties */
.note-header {
  margin-left: 1rem;
  padding-top: 0.5rem;
  gap: 0.5rem;
}

/* AFTER - Logical properties + tokens */
.note-header {
  margin-inline-start: var(--space-4);  /* RTL-aware */
  padding-block-start: var(--space-2);  /* Direction-agnostic */
  gap: var(--space-2);
  min-width: 0;           /* Allow shrinking */
}
```

**Why logical properties?**
- RTL language support built-in
- Future-proof internationalization
- More semantic

**Logical property mappings:**
```
margin-left   → margin-inline-start
margin-right  → margin-inline-end
margin-top    → margin-block-start
margin-bottom → margin-block-end
padding-left  → padding-inline-start
(etc.)
```

**Action items:**
- [ ] Migrate all spacing to tokens
- [ ] Convert to logical properties where appropriate
- [ ] Add defensive CSS: `min-width: 0`, `flex-wrap: wrap`, `overflow-wrap: break-word`

#### 2.4 Surface Elevation Migration

**Example: NoteCard.astro**

```css
/* BEFORE */
.note {
  background: var(--color-notecard-bg);
  filter: var(--shadow-medium);
}

/* AFTER */
.note {
  background: var(--surface-raised);
  box-shadow: var(--elevation-medium);  /* or filter if needed */
}
```

**Action items:**
- [ ] Replace `--color-notecard-bg`, `--color-contentcard-bg` with `--surface-raised`
- [ ] Replace `--color-table-bg` with `--surface-inset`
- [ ] Use `--elevation-*` tokens instead of direct shadow references
- [ ] Test dark mode visibility

#### 2.5 Border & Radius Migration

**Example: Multiple Components**

```css
/* BEFORE */
h1 {
  border-bottom: 2px solid var(--color-notecard-title-underline);
}

.pill {
  border-radius: 0.18rem;
}

.button-link {
  border-radius: 12px;
}

/* AFTER */
h1 {
  border-bottom: var(--divider-default);  /* or var(--border-width-base) solid var(--color-accent) */
}

.pill {
  border-radius: var(--radius-xs);
}

.button-link {
  border-radius: var(--radius-lg);
}
```

**Action items:**
- [ ] Migrate all border-width to tokens
- [ ] Migrate all border-radius to tokens
- [ ] Use composite `--divider-*` tokens for coral rules where appropriate

#### 2.6 Transition Migration

```css
/* BEFORE */
a {
  transition: all 0.15s;
}

.card {
  transition: box-shadow 0.2s ease;
}

/* AFTER */
a {
  transition: all var(--duration-fast) var(--ease-default);
}

.card {
  transition: box-shadow var(--duration-normal) var(--ease-out);
}
```

**Action items:**
- [ ] Migrate all transition durations to tokens
- [ ] Add easing functions to transitions

---

### Phase 3: Component-Specific Modern Patterns

#### 3.1 Add Defensive CSS Patterns

**Every component should have:**

```css
.component {
  /* Prevent overflow */
  min-width: 0;              /* Allow shrinking in flex/grid */
  overflow-wrap: break-word; /* Handle long text */
}

.flex-container {
  display: flex;
  flex-wrap: wrap;           /* Prevent overflow */
  gap: var(--space-4);       /* Use gap, not margins */
}

.button {
  min-width: 44px;           /* Touch target */
  min-height: 44px;          /* Touch target */
}
```

**Action items:**
- [ ] Add `min-width: 0` to flex/grid children
- [ ] Add `flex-wrap: wrap` to all flex containers
- [ ] Add `overflow-wrap: break-word` to text containers
- [ ] Ensure 44px minimum touch targets for interactive elements

#### 3.2 Container Query Setup

**For components that should adapt to container width:**

```css
.component {
  container-type: inline-size;
  container-name: component;  /* Optional, for named queries */
}

@container (min-width: 500px) {
  .component-child {
    display: grid;
  }
}

@container (min-width: 700px) {
  .component-child {
    grid-template-columns: 1fr 2fr;
  }
}
```

**Action items:**
- [ ] Add container-type to components with responsive behavior
- [ ] Convert media queries to container queries where appropriate
- [ ] Test in narrow containers (sidebars, grids)

---

### Phase 4: Cleanup & Optimization

#### 4.1 Remove Deprecated Tokens

Once all components migrated:

```css
/* DELETE THESE */
--spacer-xs: var(--space-2);  /* DELETE */
--spacer-sm: var(--space-4);  /* DELETE */
/* etc. */

/* DELETE component-specific backgrounds that use --surface-* now */
--color-notecard-bg: ...;  /* DELETE */
--color-contentcard-bg: ...;  /* DELETE */
```

**Action items:**
- [ ] Search codebase for deprecated token usage
- [ ] Remove deprecated tokens from global.css
- [ ] Run `pnpm run check:knip` to find unused CSS

#### 4.2 Consolidate Theme Blocks

After `light-dark()` migration, theme blocks should be minimal:

```css
/* Should ONLY need this for manual override */
:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;
}

/* All color definitions in :root with light-dark() */
```

**Action items:**
- [ ] Remove old theme blocks
- [ ] Verify CSS file size reduced by ~40-50%

---

## Testing Requirements

**For each phase, test:**

- [ ] **Both themes** - Light and dark mode
- [ ] **All breakpoints** - 375px, 768px, 1280px, 1920px+
- [ ] **Container queries** - Components in narrow containers (sidebars)
- [ ] **Typography scaling** - Verify clamp() ranges feel good
- [ ] **Surface elevation** - Cards visible in both themes
- [ ] **Coral rules** - Consistent thickness throughout
- [ ] **Touch targets** - 44px minimum for interactive elements
- [ ] **RTL support** - Test logical properties in RTL context (if applicable)

**Specific checks:**

- [ ] Hero masthead doesn't overflow on ultrawide
- [ ] Typography scales smoothly across breakpoints
- [ ] Spacing feels harmonious (8px grid)
- [ ] Dark mode surfaces have clear hierarchy
- [ ] All interactive elements have smooth transitions
- [ ] OKLCH colors look vibrant and consistent

---

## Quality Gates

Before marking complete:

- [ ] **Zero hardcoded spacing** (allow exceptions if justified)
- [ ] **Zero hardcoded typography** (font-size, line-height, letter-spacing)
- [ ] **Zero hardcoded border-width or border-radius**
- [ ] **Zero hardcoded transition durations**
- [ ] **Total CSS variables: 100-120** (down from ~130)
- [ ] **CSS file size reduced by 40-50%** (due to light-dark())
- [ ] **All OKLCH colors verified** for visual parity
- [ ] **Dark mode elevation visible**
- [ ] **`pnpm run check:all` passes**
- [ ] **Both themes tested across all breakpoints**
- [ ] **All tokens documented** in `design-tokens.md`

---

## Migration Tracking

Use this table to track progress:

| Component | Spacing | Typography | Borders | Surfaces | Cleanup | Status |
|-----------|---------|------------|---------|----------|---------|--------|
| global.css | - | - | - | - | - | ✅ Complete |
| **LongFormProseTypography.astro** | ⏳ | ⏳ | ⏳ | - | ⏳ | **Priority** |
| **SimpleProseTypography.astro** | ⏳ | ⏳ | ⏳ | - | ⏳ | **Priority** |
| NoteCard.astro | ⏳ | ⏳ | ⏳ | ⏳ | - | Pending |
| Pill.astro | ⏳ | ⏳ | ⏳ | - | - | Pending |
| ButtonLink.astro | ⏳ | ⏳ | ⏳ | - | - | Pending |
| Callout.astro | ⏳ | ⏳ | ⏳ | ⏳ | - | Pending |
| ContentCard.astro | ⏳ | ⏳ | ⏳ | ⏳ | - | Pending |
| ... | ... | ... | ... | ... | ... | ... |

**Cleanup column:** Remove redundant styles now covered by modernized base layer (hanging-punctuation, font-variant-ligatures, text-wrap)

---

## Modern CSS Cheat Sheet

**Quick reference for this task:**

```css
/* Utopia typography - use semantic aliases */
font-size: var(--font-size-lg);    /* NOT var(--step-2) */
line-height: var(--leading-snug);
letter-spacing: var(--tracking-wide);

/* Spacing - static for components, fluid for large gaps */
padding: var(--space-4);                    /* Static: 16px */
margin-block: var(--space-fluid-s-l);       /* Fluid: 18px → 40px */

/* OKLCH color */
--color: oklch(62% 0.19 15);

/* light-dark() */
--bg: light-dark(oklch(95% 0.02 75), oklch(15% 0.01 0));

/* Relative colors */
--hover: oklch(from var(--base) calc(l - 0.1) c h);

/* Logical properties */
margin-inline-start: var(--space-4);  /* instead of margin-left */
padding-block: var(--space-2);         /* instead of padding-top + padding-bottom */

/* @property (for animations) */
@property --my-color {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(50% 0.1 0);
}
```

---

## Related Tasks

- **Task 0:** Modernize Reset & Base (foundation) - PREREQUISITE
- **Task 2:** Design Token Architecture (defines this system) - PREREQUISITE
- **Task 4:** Visual Refinement (uses these tokens)
- **Task 5:** Component Documentation (documents patterns)

---

## Notes

- **Order matters:** Typography first (high impact), spacing (most instances), borders, transitions, cleanup
- **Test continuously:** Don't wait until end to test themes
- **Beauty opportunities:** If a token change improves visual harmony, embrace it
- **Document decisions:** If you deviate from planned tokens, note why
- **Utopia typography:** Use semantic aliases (`--font-size-lg`), not raw steps (`--step-2`)
- **OKLCH conversions:** Use online converters, verify visually
- **Logical properties:** Future-proofs for internationalization

**Utopia Reference:**
- Config: https://utopia.fyi/type/calculator?c=375,18,1.2,1280,20,1.333,5,2
- If scale feels wrong, adjust ratios and regenerate

This is the **big implementation effort** - systematic migration to a world-class modern CSS token system.
