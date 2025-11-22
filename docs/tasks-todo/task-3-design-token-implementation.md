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
- Container query units (`cqi`) for responsive typography
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
     SPACING - 8px Grid
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
  --space-24: 8rem;    /* 128px */

  /* DEPRECATED - keep for now, remove in cleanup */
  --spacer-xs: var(--space-2);
  --spacer-sm: var(--space-4);
  --spacer-md: var(--space-6);
  --spacer-lg: var(--space-10);
  --spacer-xl: var(--space-12);
  --spacer-xxl: var(--space-20);

  /* ============================================
     TYPOGRAPHY
     ============================================ */
  /* Font sizes with viewport units (will upgrade to cqi in components) */
  --font-size-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --font-size-md: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);
  --font-size-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
  --font-size-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  --font-size-2xl: clamp(3rem, 2rem + 5vw, 6rem);
  --font-size-3xl: clamp(4rem, 3rem + 5vw, 8rem);

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

#### 2.1 Typography Migration + Container Query Units

**Example: NoteCard.astro**

```css
/* BEFORE */
.note {
  font-size: clamp(1.5rem, 4vw, 2.5rem);  /* Viewport units */
  line-height: 1.2;
  letter-spacing: 0.1ch;
}

/* AFTER - Modern CSS */
.note {
  container-type: inline-size;  /* Make it a container */
  font-size: clamp(1.5rem, 4cqi, 2.5rem);  /* Container query units */
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-wider);
}

h1 {
  font-size: var(--font-size-lg);
  line-height: var(--leading-snug);
  font-weight: var(--font-weight-semibold);
}

.date {
  font-size: var(--font-size-xs);
  letter-spacing: var(--tracking-wider);
}
```

**Why container query units (`cqi`)?**
- Typography scales with component width, not viewport
- Works in sidebars, grids, any container
- More predictable than `vw`

**Action items:**
- [ ] Add `container-type: inline-size` to components that use fluid typography
- [ ] Replace `vw` with `cqi` in font-size clamp()
- [ ] Migrate all font-size to tokens
- [ ] Migrate all line-height to tokens
- [ ] Migrate all letter-spacing to tokens
- [ ] Migrate all font-weight to tokens

#### 2.2 Spacing Migration + Logical Properties

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

#### 2.3 Surface Elevation Migration

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

#### 2.4 Border & Radius Migration

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

#### 2.5 Transition Migration

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

| Component | Spacing | Typography | Borders | Surfaces | CQ Units | Logical Props | Status |
|-----------|---------|------------|---------|----------|----------|---------------|--------|
| global.css | - | - | - | - | - | - | ✅ Complete |
| NoteCard.astro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Complete |
| Pill.astro | ⏳ | ⏳ | ⏳ | - | - | ⏳ | In Progress |
| ButtonLink.astro | ⏳ | ⏳ | ⏳ | - | - | ⏳ | Pending |
| Callout.astro | ⏳ | ⏳ | ⏳ | ⏳ | - | ⏳ | Pending |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## Modern CSS Cheat Sheet

**Quick reference for this task:**

```css
/* OKLCH color */
--color: oklch(62% 0.19 15);

/* light-dark() */
--bg: light-dark(oklch(95% 0.02 75), oklch(15% 0.01 0));

/* Relative colors */
--hover: oklch(from var(--base) calc(l - 0.1) c h);

/* Container query units */
font-size: clamp(1rem, 3cqi, 2rem);

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
- **OKLCH conversions:** Use online converters, verify visually
- **Container queries:** Game-changer for responsive components
- **Logical properties:** Future-proofs for internationalization

This is the **big implementation effort** - systematic migration to a world-class modern CSS token system.
