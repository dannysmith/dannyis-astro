# Core Design Token Implementation & Component Migration

**Type:** Implementation
**Goal:** Implement the comprehensive design token system from Task 2 and migrate all components to use it
**Prerequisites:** Task 2 (Design Token System Architecture) must be reviewed and approved

## Overview

This task implements the token architecture designed in Task 2, migrating all components from hardcoded values to systematic design tokens. This is the "big effort" implementation that consolidates the visual language and reduces CSS complexity.

## Implementation Phases

### Phase 1: Token Definition & Foundation

**Deliverable:** Updated `src/styles/global.css` with comprehensive token system

#### 1.1 Add Spacing Scale Tokens

```css
/* Replace current --spacer-* tokens with comprehensive scale */
:root {
  /* Spacing scale - 8px base grid */
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
}
```

**Action items:**
- [ ] Add spacing tokens to `:root` in global.css
- [ ] Keep deprecated `--spacer-*` for backward compatibility (remove in Phase 3)
- [ ] Document mapping: `--spacer-xs` → `--space-2`, `--spacer-sm` → `--space-4`, etc.

#### 1.2 Add Typography Scale Tokens

```css
:root {
  /* Font size scale with fluid clamp() */
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
}
```

**Action items:**
- [ ] Add all typography tokens to `:root`
- [ ] Review clamp() ranges for each size against actual usage
- [ ] Test typography scale across breakpoints (mobile, tablet, desktop, ultrawide)

#### 1.3 Add Border & Radius Tokens

```css
:root {
  /* Border widths - the "coral rule" system */
  --border-width-hairline: 1px;
  --border-width-thin: 1.5px;
  --border-width-base: 2px;
  --border-width-thick: 4px;
  --border-width-heavy: 6px;

  /* Border radius */
  --radius-xs: 0.125rem;  /* 2px */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;  /* Pills */
}
```

**Action items:**
- [ ] Add border/radius tokens to `:root`
- [ ] Audit current border-width usage: map `1px` → `--border-width-hairline`, `2px` → `--border-width-base`
- [ ] Audit current border-radius usage: `0.18rem` → `--radius-xs`, `4px` → `--radius-sm`, `12px` → `--radius-lg`

#### 1.4 Add Animation/Transition Tokens

```css
:root {
  /* Duration scale */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Easing functions */
  --ease-default: ease;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Action items:**
- [ ] Add transition tokens to `:root`
- [ ] Map `0.15s` → `--duration-fast`, `0.2s` → `--duration-normal`

#### 1.5 Add Surface Elevation System

```css
/* Surface colors for layering */
:root[data-theme='light'] {
  --surface-base: var(--color-bg-primary);
  --surface-raised: var(--color-brand-white);
  --surface-inset: var(--color-bg-secondary);
  --surface-overlay: color-mix(in srgb, var(--color-bg-primary) 95%, black);
}

:root[data-theme='dark'] {
  --surface-base: var(--color-bg-dark-200);
  --surface-raised: var(--color-bg-secondary);
  --surface-inset: color-mix(in srgb, var(--color-bg-primary) 70%, black);
  --surface-overlay: var(--color-bg-dark-300);
}

/* Elevation - combining shadow + surface treatment */
:root {
  --elevation-flat: none;
  --elevation-low: var(--shadow-small);
  --elevation-medium: var(--shadow-medium);
  --elevation-high: var(--shadow-large);
  --elevation-highest: var(--shadow-xlarge);
}
```

**Action items:**
- [ ] Add surface color tokens to `@layer theme`
- [ ] Add elevation tokens to `:root`
- [ ] Consider dark mode contrast: should raised surfaces be lighter or darker than base?

### Phase 2: Component Migration (Category by Category)

#### 2.1 Typography Migration (Highest Visual Impact)

**Components to migrate:**
- `src/components/layout/NoteCard.astro` (line 84: font-size clamp)
- `src/components/ui/Pill.astro` (line 32: 0.75rem, line 35: 0.08em)
- All typography components in `src/components/mdx/typography/`

**Example migration:**

```diff
  /* BEFORE */
  h1 {
-   font-size: clamp(1.5rem, 4vw, 2.5rem);
+   font-size: var(--font-size-lg);
-   line-height: 1.2;
+   line-height: var(--leading-snug);
    font-weight: 600;
  }

  .pill {
-   font-size: 0.75rem;
+   font-size: var(--font-size-xs);
-   letter-spacing: 0.08em;
+   letter-spacing: var(--tracking-wide);
  }
```

**Action items:**
- [ ] Create migration spreadsheet: map all current font-size values to tokens
- [ ] Migrate all heading styles (h1-h5) to use `--font-size-*` and `--leading-*`
- [ ] Migrate all small text (dates, labels, metadata) to use `--font-size-xs` or `--font-size-sm`
- [ ] Migrate letter-spacing to `--tracking-*` tokens
- [ ] Test typography across all page templates in both themes

#### 2.2 Spacing Migration (Most Instances - 54 hardcoded values)

**Components with most hardcoded spacing:**
- `src/components/layout/NoteCard.astro` (padding, gaps, margins)
- `src/components/mdx/Callout.astro` (padding, margins)
- `src/components/mdx/ButtonLink.astro` (padding, margins)
- All page layouts in `src/pages/`

**Example migration:**

```diff
  .note {
-   padding: var(--line-height);
+   padding: var(--space-6);
  }

  .note-header {
    display: flex;
    flex-direction: column;
-   gap: 0.5rem;
+   gap: var(--space-2);
  }

  .callout {
-   padding: 1rem;
+   padding: var(--space-4);
-   margin: 1rem 0;
+   margin: var(--space-4) 0;
  }
```

**Action items:**
- [ ] Audit all spacing: create spreadsheet mapping hardcoded values to tokens
- [ ] Migrate component internal spacing (padding, gap)
- [ ] Migrate component external spacing (margin)
- [ ] Migrate layout spacing in pages
- [ ] Verify spacing scale feels harmonious across all breakpoints

#### 2.3 Border & Radius Migration

**Key migrations:**
- Coral rules/dividers: `1px` or `2px` → `--border-width-base` (standardize on 2px)
- Card borders: `1px solid` → `--border-width-hairline solid`
- Border radius: `0.18rem` → `--radius-xs`, `4px` → `--radius-sm`, `12px` → `--radius-lg`

**Example migration:**

```diff
  h1 {
-   border-bottom: 2px solid var(--color-notecard-title-underline);
+   border-bottom: var(--border-width-base) solid var(--color-notecard-title-underline);
  }

  .pill {
-   border-radius: 0.18rem;
+   border-radius: var(--radius-xs);
  }

  .button-link {
-   border-radius: 12px;
+   border-radius: var(--radius-lg);
  }
```

**Action items:**
- [ ] Migrate all border widths to tokens
- [ ] Migrate all border-radius values to tokens
- [ ] Consider: should all "coral rules" use the same width for consistency?
- [ ] Test borders in both themes for visibility

#### 2.4 Transition Migration

**Example migration:**

```diff
  a {
-   transition: all 0.15s;
+   transition: all var(--duration-fast) var(--ease-default);
  }

  .card {
-   transition: box-shadow 0.2s ease;
+   transition: box-shadow var(--duration-normal) var(--ease-out);
  }
```

**Action items:**
- [ ] Migrate all `transition` declarations to use duration and easing tokens
- [ ] Consider: should hover transitions be `--duration-fast` and state changes be `--duration-normal`?

### Phase 3: Semantic Color Consolidation (Optional Beauty Enhancement)

**Goal:** Reduce redundant component-specific color tokens by using semantic surface tiers

**Example consolidation:**

```diff
  /* In global.css @layer theme */
  :root[data-theme='light'] {
-   --color-notecard-bg: var(--color-brand-white);
-   --color-contentcard-bg: var(--color-brand-white);
+   --surface-raised: var(--color-brand-white);
  }

  /* In components */
  .note {
-   background: var(--color-notecard-bg);
+   background: var(--surface-raised);
  }

  .content-card {
-   background: var(--color-contentcard-bg);
+   background: var(--surface-raised);
  }
```

**Action items:**
- [ ] Identify truly redundant color tokens (same value in both themes)
- [ ] Create semantic surface tokens: `--surface-raised`, `--surface-inset`, `--surface-overlay`
- [ ] Migrate components to use surface tokens where appropriate
- [ ] Keep component-specific tokens when accent colors vary (e.g., contentcard article vs note accent)
- [ ] **Goal:** Reduce from ~130 to ~100-120 total variables

### Phase 4: Cleanup & Documentation

**Action items:**
- [ ] Remove deprecated `--spacer-*` tokens (once all components migrated)
- [ ] Remove any other deprecated/unused tokens
- [ ] Run `pnpm run check:knip` to verify no dead CSS
- [ ] Create `docs/developer/design-tokens.md` with comprehensive token reference
- [ ] Update `docs/developer/design.md` with token system overview
- [ ] Add token examples to `/styleguide` page

## Testing Requirements

**For each phase, test:**
- [ ] Light theme across all pages
- [ ] Dark theme across all pages
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1280px width)
- [ ] Ultrawide (1920px+ width)

**Specific checks:**
- [ ] Hero masthead doesn't overflow on ultrawide
- [ ] Typography scales smoothly across breakpoints
- [ ] Spacing feels harmonious (not too tight or too loose)
- [ ] Coral rules are consistent thickness throughout
- [ ] Cards have consistent elevation/shadows
- [ ] All interactive elements have smooth transitions
- [ ] Dark mode surfaces have sufficient contrast

## Quality Gates

Before marking this task complete:

- [ ] Zero hardcoded spacing values in components (allow exceptions in pages if justified)
- [ ] Zero hardcoded typography values (font-size, line-height, letter-spacing)
- [ ] Zero hardcoded border-width or border-radius values
- [ ] Zero hardcoded transition durations
- [ ] Total CSS variables: 100-120 (down from ~130)
- [ ] All tokens documented in `design-tokens.md`
- [ ] `pnpm run check:all` passes
- [ ] Visual regression test: site looks as good or better than before
- [ ] Both themes tested across all breakpoints

## Migration Tracking Spreadsheet

Create a spreadsheet to track progress:

| Component | Spacing | Typography | Borders | Transitions | Status |
|-----------|---------|------------|---------|-------------|--------|
| NoteCard.astro | ✅ | ✅ | ✅ | ✅ | Complete |
| Pill.astro | ✅ | ✅ | ✅ | - | Complete |
| ... | | | | | |

## Notes

- **Order matters:** Typography first (highest visual impact), then spacing (most instances), then borders/transitions
- **Test continuously:** Don't wait until everything is migrated to test
- **Beauty opportunities:** If a token change improves visual harmony, embrace it (per user preference for "optimize for beauty")
- **Document decisions:** If you deviate from the planned tokens, document why

## Related Tasks

- **Task 2:** Design Token System Architecture (defines the token system)
- **Task 4:** Visual Refinement & Beauty Optimization (uses these tokens to enhance beauty)
