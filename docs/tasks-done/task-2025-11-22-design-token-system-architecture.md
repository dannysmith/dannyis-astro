# Design Token System Architecture & Audit

**Type:** Planning + Documentation
**Goal:** Create a comprehensive, modern design token system using OKLCH colors, `light-dark()`, Utopia fluid typography, and systematic tokens
**Prerequisites:** Task 0 (Modernize Reset & Base) complete

## Context

The visual review (task-1) identified inconsistencies in typography, spacing, borders, and elevation. We have a strong foundation but need to:

1. **Complete the token system** - Add typography, spacing, border, transition tokens
2. **Modernize color system** - Migrate to OKLCH for perceptual uniformity
3. **Simplify theming** - Use `light-dark()` to reduce CSS duplication
4. **Systematize elevation** - Create clear surface tiers for z-axis hierarchy
5. **Fluid typography** - Use Utopia-generated type scale for mathematical coherence

**Current State:**
- ✅ Good semantic color system (but hex-based, duplicated light/dark)
- ✅ CSS layers architecture
- ✅ Theme switching via data-theme
- ⚠️ Incomplete spacing tokens (6 values, not comprehensive)
- ❌ No typography tokens (54+ hardcoded values)
- ❌ No border/radius tokens
- ❌ No transition tokens
- ❌ No surface elevation system

**Goal:** World-class token system with **~100-120 total variables** (comprehensive coverage, reduced redundancy)

---

## 🎨 Modern CSS Upgrades

### 1. **OKLCH Color Space** (CRITICAL for Beauty)

**Current:** Using hex colors (`#ff7369`, `#f6f3ea`)
**Problem:** Not perceptually uniform, can't access wide gamut, hard to manipulate

**✅ UPGRADE TO OKLCH:**

```css
:root {
  /* ============================================
     BRAND COLORS - OKLCH for Perceptual Uniformity
     ============================================ */

  /* Coral/Red accent - your signature color */
  --color-brand-primary: oklch(62% 0.19 15);

  /* Beige - warm neutral */
  --color-brand-beige: oklch(95% 0.02 75);

  /* Dark greys */
  --color-brand-grey: oklch(28% 0.01 0);
  --color-brand-dark-grey: oklch(15% 0.01 0);

  /* White */
  --color-brand-white: oklch(100% 0 0);

  /* Color palette - systematically generated */
  --color-red-300: oklch(90% 0.1 15);
  --color-red-400: oklch(85% 0.13 15);
  --color-red-500: oklch(62% 0.19 15);   /* Primary */
  --color-red-600: oklch(50% 0.18 15);
  --color-red-700: oklch(40% 0.15 15);
  --color-red-800: oklch(30% 0.1 15);

  /* Repeat for blue, green, purple, yellow, orange palettes */
  /* All at consistent lightness steps: 90%, 85%, 62%, 50%, 40%, 30% */
}
```

**Why OKLCH?**
- Perceptually uniform lightness (62% red looks same brightness as 62% blue)
- Wide color gamut (more vibrant on modern displays)
- Easy manipulation (adjust lightness without hue shift)
- Future-proof (industry standard)

**Browser Support:** ✅ Baseline (Safari 15.4+, Chrome 111+, Firefox 113+)

### 2. **`light-dark()` Function** (Reduces CSS by ~50%)

**Current:** Manual theme switching with duplicate blocks
**Problem:** 300+ lines of duplicated color definitions

**✅ UPGRADE TO `light-dark()`:**

```css
:root {
  /* Enable automatic theme switching */
  color-scheme: light dark;

  /* ============================================
     SEMANTIC COLORS - Automatic Light/Dark
     ============================================ */

  /* Backgrounds */
  --color-bg-primary: light-dark(
    oklch(95% 0.02 75),    /* Light: beige */
    oklch(15% 0.01 0)      /* Dark: charcoal */
  );

  --color-bg-secondary: light-dark(
    oklch(98% 0.01 75),    /* Light: lighter beige */
    oklch(12% 0.01 0)      /* Dark: deeper charcoal */
  );

  /* Text */
  --color-text-primary: light-dark(
    oklch(28% 0.01 0),     /* Light: dark grey */
    oklch(95% 0.02 75)     /* Dark: beige */
  );

  --color-text-secondary: light-dark(
    oklch(50% 0.01 0),     /* Light: medium grey */
    oklch(70% 0.02 0)      /* Dark: light grey */
  );

  /* Accent - same in both themes */
  --color-accent: oklch(62% 0.19 15);

  /* Borders */
  --color-border: light-dark(
    oklch(from var(--color-bg-primary) calc(l - 0.1) c h),
    oklch(from var(--color-bg-primary) calc(l + 0.05) c h)
  );
}

/* Override for manual theme selection */
:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;
}
```

**Benefits:**
- Cuts theme CSS from 300+ lines to ~50 lines
- Respects system preference automatically
- Still allows manual override
- Easier to maintain

**Browser Support:** ✅ Baseline (Safari 17.5+, Chrome 123+, Firefox 120+)

### 3. **Relative Colors** (Systematic Variants)

**Current:** Manual color variants in palette
**Problem:** Hard to maintain, not systematic

**✅ USE RELATIVE COLORS:**

```css
:root {
  /* Base color */
  --color-primary: oklch(62% 0.19 15);

  /* Auto-generate hover/active states */
  --color-primary-hover: oklch(from var(--color-primary) calc(l - 0.1) c h);
  --color-primary-active: oklch(from var(--color-primary) calc(l - 0.15) c h);

  /* Auto-generate tints/shades for theming */
  --color-primary-light: oklch(from var(--color-primary) calc(l + 0.25) calc(c * 0.5) h);
  --color-primary-lighter: oklch(from var(--color-primary) calc(l + 0.35) calc(c * 0.3) h);

  /* Border based on background */
  --color-border: oklch(from var(--color-bg-primary) calc(l - 0.1) c h);
}
```

**Benefits:**
- Systematically related colors
- One change updates all variants
- Reduces total variables

### 4. **Surface Elevation System** (Fixes Dark Mode Flattening)

**Current:** Cards flatten in dark mode (visual review finding)
**Root Cause:** No systematic surface elevation

**✅ ADD SURFACE TIERS:**

```css
:root {
  /* ============================================
     SURFACE ELEVATION - Z-Axis Hierarchy
     ============================================ */

  /* Surface colors */
  --surface-base: light-dark(
    oklch(95% 0.02 75),       /* Light: beige */
    oklch(15% 0.01 0)          /* Dark: charcoal */
  );

  --surface-raised: light-dark(
    oklch(100% 0 0),           /* Light: white */
    oklch(18% 0.01 0)          /* Dark: lighter charcoal +3% */
  );

  --surface-inset: light-dark(
    oklch(92% 0.02 75),        /* Light: darker beige */
    oklch(12% 0.01 0)          /* Dark: deeper charcoal */
  );

  --surface-overlay: light-dark(
    oklch(98% 0.01 75),        /* Light: very light beige */
    oklch(20% 0.01 0)          /* Dark: elevated charcoal */
  );

  /* Elevation tokens (combine with shadows) */
  --elevation-flat: none;
  --elevation-low: var(--shadow-small);
  --elevation-medium: var(--shadow-medium);
  --elevation-high: var(--shadow-large);
  --elevation-highest: var(--shadow-xlarge);
}
```

**Dark Mode Strategy:**
- Raised surfaces are *lighter* than base (not darker)
- Creates clear z-axis hierarchy
- Combine with shadows for depth

### 5. **Type-Safe Properties with `@property`**

**Current:** Untyped CSS variables
**Problem:** No validation, can't animate

**✅ ADD `@property` FOR KEY TOKENS:**

```css
/* ============================================
   TYPE-SAFE CUSTOM PROPERTIES
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

/* Now custom properties can ANIMATE smoothly! */
.element {
  --color-accent: oklch(62% 0.19 15);
  transition: --color-accent 300ms;
}

.element:hover {
  --color-accent: oklch(52% 0.19 15);  /* Smoothly animates! */
}
```

**Benefits:**
- Type safety (catches errors early)
- Smooth animations of custom properties
- Better developer experience

**Browser Support:** ✅ Baseline (Safari 16.4+, Chrome 85+, Firefox 128+)

---

## 📐 Complete Token Architecture

### 1. Spacing Scale (Static 8px Grid + Fluid Pairs)

**Philosophy:** Keep static spacing for predictable component internals. Add 1-2 fluid pairs for large responsive gaps (hero → content, section margins).

```css
:root {
  /* ============================================
     SPACING - Static 8px Grid
     ============================================ */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px - micro adjustments */
  --space-2: 0.5rem;   /* 8px - tight spacing */
  --space-3: 0.75rem;  /* 12px - small gaps */
  --space-4: 1rem;     /* 16px - base unit */
  --space-5: 1.5rem;   /* 24px - comfortable */
  --space-6: 2rem;     /* 32px - breathing room */
  --space-8: 2.5rem;   /* 40px - section spacing */
  --space-10: 3rem;    /* 48px - major sections */
  --space-12: 4rem;    /* 64px - hero spacing */
  --space-16: 5rem;    /* 80px - dramatic spacing */
  --space-20: 6rem;    /* 96px - monumental */

  /* ============================================
     FLUID SPACING - For Large Responsive Gaps
     Generated with Utopia: https://utopia.fyi/space/calculator
     Min: 375px, Max: 1280px
     ============================================ */
  --space-fluid-s-l: clamp(1.125rem, 0.5rem + 2.5vw, 2.5rem);   /* 18px → 40px */
  --space-fluid-m-xl: clamp(1.5rem, 0.75rem + 3vw, 3.75rem);    /* 24px → 60px */
}
```

**Static tokens:** Use for component padding, gaps, margins where predictability matters
**Fluid tokens:** Use for hero-to-nav gap, section margins, page padding

**Replaces:** Current `--spacer-xs` through `--spacer-xxl` (6 tokens → 14 tokens)

### 2. Typography Scale (Utopia Fluid Type)

**Philosophy:** Use Utopia-generated fluid type scale for mathematical coherence. All steps relate through modular ratios, scaling smoothly between viewports.

**Utopia Configuration:**
- **Min viewport:** 375px @ 18px base, 1.2 scale ratio (Minor Third)
- **Max viewport:** 1280px @ 20px base, 1.333 scale ratio (Perfect Fourth)
- **Steps:** -2 to +5 (8 sizes total)
- **Generator:** https://utopia.fyi/type/calculator

```css
:root {
  /* ============================================
     TYPOGRAPHY - Utopia Fluid Type Scale
     https://utopia.fyi/type/calculator?c=375,18,1.2,1280,20,1.333,5,2
     ============================================ */

  /* Raw Utopia steps */
  --step--2: clamp(0.78rem, 0.77rem + 0.03vw, 0.80rem);    /* ~12.5px → 12.8px */
  --step--1: clamp(0.94rem, 0.91rem + 0.11vw, 1.00rem);    /* ~15px → 16px */
  --step-0:  clamp(1.13rem, 1.07rem + 0.23vw, 1.25rem);    /* ~18px → 20px (base) */
  --step-1:  clamp(1.35rem, 1.26rem + 0.39vw, 1.67rem);    /* ~21.6px → 26.7px */
  --step-2:  clamp(1.62rem, 1.48rem + 0.61vw, 2.22rem);    /* ~25.9px → 35.5px */
  --step-3:  clamp(1.94rem, 1.74rem + 0.90vw, 2.96rem);    /* ~31.1px → 47.4px */
  --step-4:  clamp(2.33rem, 2.04rem + 1.31vw, 3.95rem);    /* ~37.3px → 63.2px */
  --step-5:  clamp(2.80rem, 2.38rem + 1.85vw, 5.26rem);    /* ~44.8px → 84.2px */

  /* Semantic aliases - use these in components */
  --font-size-xs: var(--step--2);     /* Small labels, captions */
  --font-size-sm: var(--step--1);     /* Secondary text, metadata */
  --font-size-base: var(--step-0);    /* Body text */
  --font-size-md: var(--step-1);      /* Large body, small headings */
  --font-size-lg: var(--step-2);      /* H3, card titles */
  --font-size-xl: var(--step-3);      /* H2, section titles */
  --font-size-2xl: var(--step-4);     /* H1, page titles */
  --font-size-3xl: var(--step-5);     /* Hero masthead */

  /* ============================================
     LINE HEIGHTS - Semantic naming
     ============================================ */
  --leading-none: 0.9;      /* Hero text, large display */
  --leading-tight: 1.1;     /* Headings */
  --leading-snug: 1.2;      /* Subheadings */
  --leading-normal: 1.5;    /* Body text */
  --leading-relaxed: 1.7;   /* Long-form prose */
  --leading-loose: 1.8;     /* Extra breathing room */

  /* ============================================
     LETTER SPACING
     ============================================ */
  --tracking-tighter: -0.02em;  /* Large display text */
  --tracking-tight: -0.01em;    /* Headings */
  --tracking-normal: 0;         /* Body text */
  --tracking-wide: 0.08em;      /* All-caps labels */
  --tracking-wider: 0.1ch;      /* Small all-caps */

  /* ============================================
     FONT WEIGHTS - Match Literata/League Spartan
     ============================================ */
  --font-weight-light: 300;
  --font-weight-normal: 350;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
}
```

**Why Utopia?**
- **Mathematical coherence:** All sizes derived from same formula, not arbitrary
- **Harmonious scaling:** 1.2 ratio at mobile, 1.333 at desktop creates natural progression
- **Single source of truth:** Change the config, regenerate, done
- **Simpler than hand-crafting:** No guessing clamp values

**Impact:** Eliminates all hardcoded font sizes with mathematically related scale

### 3. Border & Divider System (The Coral Rule!)

```css
:root {
  /* ============================================
     BORDERS - The Systematic "Coral Rule"
     ============================================ */

  /* Border widths */
  --border-width-hairline: 1px;   /* Subtle dividers */
  --border-width-thin: 1.5px;     /* Default borders */
  --border-width-base: 2px;       /* THE CORAL RULE */
  --border-width-thick: 4px;      /* Heavy dividers */
  --border-width-heavy: 6px;      /* Blockquotes, footer */

  /* Border radius */
  --radius-xs: 0.125rem;  /* 2px */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;  /* Pills */

  /* Composite divider tokens (shorthand) */
  --divider-subtle: var(--border-width-hairline) solid var(--color-accent);
  --divider-default: var(--border-width-base) solid var(--color-accent);
  --divider-bold: var(--border-width-thick) solid var(--color-accent);
}
```

**Impact:** Systematizes the iconic coral underline across all components

### 4. Transitions & Animations

```css
:root {
  /* ============================================
     MOTION - Durations & Easing
     ============================================ */

  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;     /* Micro-interactions */
  --duration-normal: 200ms;   /* Standard transitions */
  --duration-slow: 300ms;     /* Emphasis */
  --duration-slower: 500ms;   /* Accordions, reveals */

  /* Easing functions */
  --ease-default: ease;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Impact:** Consistent motion throughout, eliminates hardcoded durations

---

## 🎯 Token Naming Conventions

### Three-Tier Hierarchy

1. **Primitive tokens** (never use directly in components):
   - `--color-red-500`, `--color-bg-dark-200`
   - Raw OKLCH values

2. **Semantic tokens** (use these in components):
   - `--space-4`, `--font-size-lg`, `--border-width-base`
   - `--color-bg-primary`, `--color-text-primary`
   - `--surface-raised`, `--elevation-medium`

3. **Component tokens** (rare, only when semantics differ):
   - `--color-contentcard-article-accent` (red)
   - `--color-contentcard-note-accent` (blue)

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

## 📊 Consolidation Opportunities

### Current Redundancies

**Component-specific backgrounds (all use same value):**
```css
/* BEFORE (5 separate tokens) */
--color-notecard-bg: var(--color-brand-white);
--color-contentcard-bg: var(--color-brand-white);
--color-table-bg: var(--color-bg-secondary);

/* AFTER (2 semantic tokens) */
--surface-raised: light-dark(oklch(100% 0 0), oklch(18% 0.01 0));
--surface-inset: light-dark(oklch(92% 0.02 75), oklch(12% 0.01 0));
```

**Keep separate ONLY when:**
- Accent colors differ (contentcard article vs note)
- Semantic meaning differs by theme

**Goal:** ~130 variables → ~100-120 variables (comprehensive but consolidated)

---

## 📝 Migration Strategy

### Phase 1: Add Tokens (Non-Breaking)

**Action:** Add ALL new tokens to `src/styles/global.css`

```css
:root {
  /* Keep existing tokens for backward compatibility */
  --spacer-xs: 0.5rem;   /* DEPRECATED - use --space-2 */
  --spacer-sm: 1rem;     /* DEPRECATED - use --space-4 */

  /* Add new tokens */
  --space-0: 0;
  --space-1: 0.25rem;
  /* ... etc ... */
}
```

### Phase 2: Documentation

**Create:** `docs/developer/design-tokens.md`

**Contents:**
- Complete token reference with examples
- OKLCH color conversion table (hex → OKLCH)
- Usage guidelines (when to use which token)
- Migration guide (old token → new token mapping)
- `light-dark()` usage examples

### Phase 3: Audit & Planning

**Create migration spreadsheet:**

| Component | Spacing | Typography | Borders | Colors | Status |
|-----------|---------|------------|---------|--------|--------|
| NoteCard.astro | 8 values | 5 values | 3 values | Good | Needs migration |
| Pill.astro | 2 values | 3 values | 1 value | Good | Needs migration |
| ... | ... | ... | ... | ... | ... |

---

## ✅ Success Metrics

- [ ] Utopia type scale generated and documented (8 steps: -2 to +5)
- [ ] Semantic font-size aliases defined (xs through 3xl)
- [ ] All spacing tokens defined (12 static + 2 fluid pairs)
- [ ] All typography support tokens defined (6 line heights, 5 tracking, 8 weights)
- [ ] All border/radius tokens defined (5 widths, 6 radii)
- [ ] All transition tokens defined (5 durations, 4 easing)
- [ ] Surface elevation system defined (4 surface tiers, 5 elevation levels)
- [ ] OKLCH color system documented
- [ ] `light-dark()` implementation planned
- [ ] Relative color usage documented
- [ ] `@property` definitions for key tokens
- [ ] Token naming conventions established
- [ ] Migration guide created
- [ ] Total variables: ~100-120 (comprehensive, consolidated)

---

## 📦 Deliverables

1. **Updated `src/styles/global.css`** with:
   - All new token definitions
   - OKLCH color system
   - `light-dark()` for theming
   - `@property` definitions
   - Surface elevation tokens
   - Deprecated tokens marked

2. **Documentation:** `docs/developer/design-tokens.md`
   - Complete token reference
   - OKLCH conversion table
   - Usage guidelines
   - Migration mapping

3. **Migration spreadsheet** (can be markdown table)
   - Component audit
   - Hardcoded values → tokens mapping
   - Priority order

---

## 🔗 Related Tasks

- **Task 0:** Modernize Reset & Base (foundation) - PREREQUISITE
- **Task 3:** Token Implementation (executes this plan)
- **Task 4:** Visual Refinement (uses tokens for beauty)

---

## 📌 Notes

- This is **planning and architecture** - no code changes yet
- Task 3 implements this architecture
- **Utopia** provides mathematically coherent fluid typography - no hand-crafting clamp values
- OKLCH is a game-changer for color quality
- `light-dark()` cuts theme CSS by 50%
- Surface elevation fixes dark mode flattening
- Keep spacing mostly static (8px grid) for predictability; fluid only for large responsive gaps
- This will be a world-class design system

**Utopia Resources:**
- Type calculator: https://utopia.fyi/type/calculator
- Space calculator: https://utopia.fyi/space/calculator
- Blog/methodology: https://utopia.fyi/blog/

---

## ❓ Decision Points for Review

Before Task 3 implementation, confirm:

- [ ] OKLCH color conversions accurate?
- [ ] Surface elevation contrast sufficient in dark mode?
- [ ] Utopia type scale feels right? (Test: hero at 375px and 1280px)
- [ ] Utopia config correct? (375px/18px/1.2 → 1280px/20px/1.333)
- [ ] Spacing scale comprehensive enough?
- [ ] Fluid spacing pairs needed beyond s-l and m-xl?
- [ ] Border width tiers make sense (1px, 1.5px, 2px, 4px, 6px)?
- [ ] Ready to deprecate `--spacer-*` tokens?

**To test Utopia scale:**
1. Visit https://utopia.fyi/type/calculator?c=375,18,1.2,1280,20,1.333,5,2
2. Preview at different viewport widths
3. Adjust ratios if hero feels too large/small at extremes
