# Design Token System Architecture & Audit

**Type:** Planning + Documentation
**Goal:** Create a comprehensive, consolidated design token system that reduces CSS variables while increasing consistency and beauty

## Context

The visual review (task-1) identified inconsistencies in typography, spacing, borders, and elevation. However, audit of the codebase reveals we already have a strong foundation:

- ✅ Excellent semantic color token system
- ✅ CSS layers architecture
- ✅ Theme switching via data-theme
- ✅ Basic spacing and shadow tokens

**The real opportunity:** Consolidate and complete the token system, reducing overall CSS variables while systematizing everything from spacing to typography to transitions.

## Current State Analysis

### What Exists (Good Foundation)

**Color System** (`src/styles/global.css:22-142`)
- Base color palette (never used directly) ✓
- Semantic color variables by theme ✓
- Component-specific color tokens ✓
- **Count:** ~80 color variables (appropriate)

**Spacing Tokens** (`src/styles/global.css:135-142`)
```css
--spacer-xs: 0.5rem;   /* 8px */
--spacer-sm: 1rem;     /* 16px */
--spacer-md: 2rem;     /* 32px */
--spacer-lg: 3rem;     /* 48px */
--spacer-xl: 4rem;     /* 64px */
--spacer-xxl: 6rem;    /* 96px */
```
- **Issue:** Only 6 values, not comprehensive, doesn't follow 8px grid precisely
- **Impact:** 54 instances of hardcoded spacing in components

**Shadow Tokens** (`src/styles/global.css:117-129`)
- 6 shadow levels defined ✓
- **Issue:** Underutilized in components (most use filter: var(--shadow-*) which is good)

**Font Tokens** (`src/styles/global.css:130-134`)
- 3 font families defined ✓

### What's Missing (Critical Gaps)

**Typography Scale** - ❌ None
- Font sizes hardcoded everywhere: `0.7rem`, `0.75rem`, `0.8rem`, `1.5rem`, `2.5rem`, `clamp(...)`
- Line heights hardcoded: `1.1`, `1.2`, `1.5`, `1.7`, `1.8`
- Letter spacing hardcoded: `0.08em`, `0.1ch`, `-0.02em`
- Font weights scattered: `300`, `350`, `400`, `600`, `900`

**Border & Divider Tokens** - ❌ None
- Border widths hardcoded: `1px`, `2px` (the iconic "coral rule" has no token!)
- Border radius hardcoded: `0.18rem`, `0.2rem`, `4px`, `12px`, `0.05em`

**Spacing System** - ⚠️ Incomplete
- Current spacer-* tokens insufficient
- Need: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px scales
- Should follow 8px base grid but allow for typography-driven exceptions

**Animation/Transition Tokens** - ❌ None
- Durations hardcoded: `0.15s`, `0.2s`
- Easing hardcoded: `ease`, `cubic-bezier(0.4, 0, 0.2, 1)`

**Elevation/Surface Tiers** - ❌ Not Systematized
- Shadow tokens exist but no documented elevation system
- No surface color tiers (surface-0, surface-1, surface-2 for layering)

### Redundancy Analysis (Opportunities to Consolidate)

**Current:** ~80 color variables + ~50 component-specific semantic variables = **~130 total**

**Opportunity:** Many component-specific tokens could be consolidated into semantic tiers:
- `--color-notecard-bg`, `--color-contentcard-bg`, `--color-table-bg` → `--surface-elevated`
- `--color-notecard-border`, `--color-contentcard-border` → `--border-subtle`
- Multiple hover states → `--interactive-hover-opacity`

**Goal:** Comprehensive token system with **~100-120 total variables** (adding typography/spacing but removing redundancy)

## Proposed Token Architecture

### 1. Spacing Scale (8px base grid)

```css
/* Foundational spacing - 8px base grid */
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
--space-24: 8rem;    /* 128px - ultra-wide */
```

**Rationale:**
- Follows 8px grid for design tool compatibility
- Includes half-steps (4px, 12px) for typography fine-tuning
- Named by scale number (not xs/sm/md) for clarity
- Replaces current --spacer-* with more comprehensive system

### 2. Typography Scale (Modular scale with fluid sizing)

```css
/* Font size scale - fluid and responsive */
--font-size-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);      /* 11-12px */
--font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);       /* 14-16px */
--font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);     /* 16-18px */
--font-size-md: clamp(1.125rem, 1rem + 0.625vw, 1.5rem);       /* 18-24px */
--font-size-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);         /* 24-40px */
--font-size-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);             /* 32-64px */
--font-size-2xl: clamp(3rem, 2rem + 5vw, 6rem);                /* 48-96px */
--font-size-3xl: clamp(4rem, 3rem + 5vw, 8rem);                /* 64-128px */

/* Line height scale */
--leading-none: 0.9;    /* Ultra-tight display */
--leading-tight: 1.1;   /* Headlines */
--leading-snug: 1.2;    /* Subheads */
--leading-normal: 1.5;  /* UI elements */
--leading-relaxed: 1.7; /* Body prose */
--leading-loose: 1.8;   /* Dark mode prose */

/* Letter spacing scale */
--tracking-tighter: -0.02em;  /* Large display type */
--tracking-tight: -0.01em;    /* Headlines */
--tracking-normal: 0;         /* Body text */
--tracking-wide: 0.08em;      /* Small caps, pills */
--tracking-wider: 0.1ch;      /* Uppercase labels */

/* Font weight scale - matches Literata/League Spartan capabilities */
--font-weight-light: 300;
--font-weight-normal: 350;    /* Prose light mode */
--font-weight-prose-dark: 250; /* Prose dark mode (lighter) */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-black: 900;     /* Display headlines */
```

### 3. Border & Divider System

```css
/* Border width tokens - the "coral rule" systematized */
--border-width-hairline: 1px;   /* Subtle dividers, table borders */
--border-width-thin: 1.5px;     /* Default borders */
--border-width-base: 2px;       /* Emphasis borders, coral rules */
--border-width-thick: 4px;      /* Heavy dividers */
--border-width-heavy: 6px;      /* Blockquote borders, major separators */

/* Border radius scale */
--radius-xs: 0.125rem;   /* 2px - subtle rounding */
--radius-sm: 0.25rem;    /* 4px - cards, buttons */
--radius-md: 0.5rem;     /* 8px - larger cards */
--radius-lg: 0.75rem;    /* 12px - prominent elements */
--radius-xl: 1rem;       /* 16px - hero cards */
--radius-full: 9999px;   /* Pills, circular elements */
```

### 4. Elevation & Surface System

```css
/* Surface colors - layering system for both themes */
:root[data-theme='light'] {
  --surface-base: var(--color-bg-primary);           /* Page background */
  --surface-raised: var(--color-brand-white);        /* Cards, notecard */
  --surface-overlay: var(--color-bg-secondary);      /* Modals, popovers */
}

:root[data-theme='dark'] {
  --surface-base: var(--color-bg-dark-200);
  --surface-raised: var(--color-bg-secondary);
  --surface-overlay: var(--color-bg-dark-300);
}

/* Elevation system - consistent shadow + surface pairing */
--elevation-flat: none;
--elevation-low: var(--shadow-small);
--elevation-medium: var(--shadow-medium);
--elevation-high: var(--shadow-large);
--elevation-highest: var(--shadow-xlarge);
```

### 5. Animation & Transition Tokens

```css
/* Duration scale */
--duration-instant: 0ms;
--duration-fast: 150ms;        /* Micro-interactions */
--duration-normal: 200ms;      /* Standard transitions */
--duration-slow: 300ms;        /* Emphasis transitions */
--duration-slower: 500ms;      /* Accordions, reveals */

/* Easing functions */
--ease-default: ease;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Playful bounce */
```

### 6. Consolidated Semantic Color Tokens

**Current redundant tokens to consolidate:**

```css
/* BEFORE: Component-specific backgrounds */
--color-notecard-bg: var(--color-brand-white);
--color-contentcard-bg: var(--color-brand-white);
--color-table-bg: var(--color-bg-secondary);
--color-callout-default-bg: var(--color-grey-300);

/* AFTER: Semantic surface tiers */
--surface-raised: var(--color-brand-white);        /* Used by notecard, contentcard */
--surface-inset: var(--color-bg-secondary);        /* Used by tables */
--surface-accent: var(--color-grey-300);           /* Used by callouts */
```

**Keep component-specific tokens only when:**
- Component needs distinct color in different themes
- Accent color varies by content type (e.g., contentcard article vs note accent)

## Token Naming Conventions

### Hierarchy

1. **Primitive tokens** (never used directly): `--color-red-500`, `--color-bg-dark-200`
2. **Semantic tokens** (use these): `--space-4`, `--font-size-lg`, `--border-width-base`
3. **Component tokens** (rare, only when needed): `--color-contentcard-article-accent`

### Naming Pattern

```
--{category}-{property}-{variant}
--space-4
--font-size-xl
--border-width-base
--radius-lg
--duration-fast
```

## Migration Strategy

### Phase 1: Add New Tokens (Non-Breaking)
- Add all new token definitions to `src/styles/global.css`
- Keep existing tokens for backward compatibility
- Document new tokens in `docs/developer/design-tokens.md`

### Phase 2: Component Migration (Incremental)
- Migrate components one category at a time:
  1. Typography (highest visual impact)
  2. Spacing (most instances)
  3. Borders & radius
  4. Transitions
- Update components to use new tokens
- Test in both light and dark themes

### Phase 3: Cleanup (Once All Migrated)
- Remove deprecated `--spacer-*` tokens
- Remove redundant component-specific tokens
- Final audit and documentation

## Success Metrics

- [ ] Reduce total CSS variables from ~130 to ~100-120
- [ ] Zero hardcoded spacing values in components
- [ ] Zero hardcoded typography values in components
- [ ] Zero hardcoded border/radius values in components
- [ ] Comprehensive design token documentation
- [ ] All tokens follow naming conventions
- [ ] Both themes tested and refined

## Deliverables

1. **Design token specification** (`docs/developer/design-tokens.md`)
   - Complete token reference
   - Usage guidelines
   - Migration guide

2. **Updated `global.css`** with new token definitions

3. **Token audit spreadsheet** showing:
   - Current tokens
   - Proposed consolidation
   - Migration mapping

## Related Tasks

- **Task 3:** Core Design Token Implementation (implements this architecture)
- **Task 4:** Visual Refinement & Beauty Optimization (uses tokens to enhance beauty)

## Notes

This is the **planning and architecture** task. The actual implementation of tokens and component migration happens in Task 3. This task delivers the blueprint.
