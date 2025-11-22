# Modernize CSS Reset & Base Layers

**Type:** Foundation / Technical Debt
**Goal:** Upgrade reset and base layers with modern CSS best practices and defensive patterns
**Prerequisites:** None - this is the foundation
**Effort:** Small (1-2 hours)

## Context

The current reset and base layers are good but missing several modern CSS improvements that provide better accessibility, performance, and developer experience. This task modernizes the foundation before implementing the comprehensive design token system.

## Current State Analysis

### ✅ What's Already Good

- Box-sizing border-box on all elements
- Text-size-adjust prevention (mobile font inflation)
- Margin removal on common elements
- Media element defaults (img, picture, video)
- Font inheritance for form controls
- `text-wrap: balance` on headings
- `text-wrap: pretty` on paragraphs
- Smooth scroll behavior

### ❌ Modern Features Missing

**Reset Layer:**
- `:where()` selector for zero-specificity (easier overrides)
- `outline-offset: 3px` for better focus visibility
- `interpolate-size: allow-keywords` (animate to/from auto)
- `scrollbar-gutter: stable` (prevent layout shift)
- `-webkit-font-smoothing: antialiased` (better text rendering)
- `field-sizing: content` for auto-growing textareas
- `min-inline-size: 0` for fieldset in flex/grid
- RTL handling for input types (tel, url, email, number)
- `:target` scroll-margin for anchor links
- `pre` white-space handling
- `[hidden]` attribute strengthening
- `isolation: isolate` for root stacking context

**Base Layer:**
- `hanging-punctuation` on html (better typography)
- `color-scheme: light dark` in proper location
- Better link underline defaults
- Modern form defaults with logical properties
- High contrast mode support

## Implementation

### 1. Update Reset Layer

Replace the current `@layer reset` block with modern patterns:

```css
@layer reset {
  /* Use a more-intuitive box-sizing model with :where() for zero specificity */
  :where(*, *::before, *::after) {
    box-sizing: border-box;
  }

  /* Remove default margin */
  :where(*) {
    margin: 0;
  }

  /* Better focus outline spacing */
  :where(:focus-visible) {
    outline-offset: 3px;
  }

  /* Enable keyword animations (animate to/from 'auto') */
  @media (prefers-reduced-motion: no-preference) {
    :where(html) {
      interpolate-size: allow-keywords;
    }
  }

  /* Prevent font size inflation on mobile */
  :where(html) {
    -moz-text-size-adjust: none;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;

    /* Prevent layout shift when scrollbars appear */
    scrollbar-gutter: stable;
  }

  :where(body) {
    /* Add accessible line-height */
    line-height: 1.5;

    /* Improve text rendering */
    -webkit-font-smoothing: antialiased;

    /* Sensible min-height */
    min-height: 100vh;

    /* Position relative for absolutely positioned children */
    position: relative;

    /* Remove default padding */
    padding: 0;
  }

  /* Improve media defaults */
  :where(img, picture, video, canvas, svg) {
    display: block;
    max-width: 100%;
  }

  :where(img, picture) {
    height: auto;
  }

  /* Remove default img border */
  :where(img) {
    border: 0;
  }

  /* Inherit fonts for form controls */
  :where(input, button, textarea, select) {
    font: inherit;
  }

  /* Auto-growing textarea */
  :where(textarea) {
    field-sizing: content;
  }

  /* Fix fieldset sizing in flexbox/grid */
  :where(fieldset) {
    min-inline-size: 0;
  }

  /* Normalize search input appearance */
  :where([type="search"]) {
    -webkit-appearance: textfield;
  }

  /* Keep specific input types LTR in RTL layouts */
  :where(input:is([type="tel"], [type="url"], [type="email"], [type="number"]):not(:placeholder-shown)) {
    direction: ltr;
  }

  /* Sensible defaults for iframes */
  :where(iframe) {
    border: 0;
    overflow: hidden;
  }

  /* Avoid text overflows */
  :where(p, h1, h2, h3, h4, h5, h6) {
    overflow-wrap: break-word;
  }

  /* Improve line wrapping */
  :where(h1, h2, h3, h4, h5, h6) {
    text-wrap: balance;
  }

  /* Prevent widows and orphans in body text */
  :where(p, blockquote) {
    text-wrap: pretty;
  }

  /* Anything that has been anchored to should have extra scroll margin */
  :where(:target) {
    scroll-margin-block: 5ex;
  }

  /* Sensible wrapping for code blocks */
  :where(pre) {
    white-space: pre-wrap;
  }

  /* Strengthen hidden attribute */
  :where([hidden]:not([hidden="until-found"])) {
    display: none !important;
  }

  /* Remove list styles on ul, ol elements with a list role */
  :where(ul[role='list'], ol[role='list']) {
    list-style: none;
  }
}
```

**Key Changes:**
- Wrapped selectors in `:where()` for zero specificity (easier overrides)
- Added `outline-offset: 3px` for better focus indicators
- Added `interpolate-size: allow-keywords` for modern animations
- Added `scrollbar-gutter: stable` to prevent layout shift
- Added `-webkit-font-smoothing: antialiased` for better text
- Added `field-sizing: content` for auto-growing textareas
- Added `min-inline-size: 0` for fieldset fix
- Added RTL handling for input types
- Added `:target` scroll margin for anchor links
- Added `pre` white-space handling
- Strengthened `[hidden]` attribute
- Moved `text-wrap: pretty` from base to reset

### 2. Update Base Layer

Enhance the base layer with modern typography and accessibility:

```css
@layer base {
  html {
    /* Typography - moved from body */
    font-variant-ligatures: common-ligatures;
    hanging-punctuation: first allow-end last;

    /* Set the typeface */
    font-family: var(--font-ui);
    font-weight: 300;

    /* Colors - support both light/dark */
    color-scheme: light dark;
    accent-color: var(--color-accent);
    color: var(--color-text-primary);
  }

  body {
    /* Background color */
    background-color: var(--color-bg-primary);
  }

  /* Set shorter line heights on headings and interactive elements */
  h1, h2, h3, h4, h5, h6,
  button, input, label {
    line-height: 1.1;
  }

  /* Default Links */
  a {
    transition: all 0.15s;

    &,
    &:visited {
      text-decoration: none;
      color: var(--color-text-primary);
    }

    &:hover,
    &:focus,
    &:active {
      color: var(--color-accent);
    }
  }

  /* Better link underlines for links without classes */
  a:not([class]) {
    text-decoration: underline;
    text-decoration-thickness: max(0.08em, 1px);
    text-underline-offset: 0.15em;
    text-decoration-skip-ink: auto;
    color: currentColor;
  }

  /* Subtle underlines when not interacting */
  a:not([class]):not(:is(:hover, :focus)) {
    text-decoration-color: color-mix(in srgb, currentColor, transparent 75%);
  }

  /* Abbreviations */
  abbr {
    font-variant: all-small-caps;
    text-decoration: underline;
    text-decoration-style: dashed;
    text-decoration-color: var(--color-grey-500);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
    text-decoration-skip-ink: none;
  }

  abbr[title] {
    cursor: help;
  }

  /* Superscript and subscript */
  sup, sub {
    font-size: 0.7em;
    line-height: 1;
  }

  /* Strikethrough */
  del {
    text-decoration: line-through;
    text-decoration-color: var(--color-strikethrough);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
  }

  /* Highlight */
  mark {
    background-color: var(--color-mark-bg);
    border-radius: 0.05em;
  }

  /* High contrast mode support for mark */
  @media (forced-colors: active) {
    mark {
      color: HighlightText;
      background-color: Highlight;
    }
  }

  /* Simple, attractive global table styles */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 2em 0;
    font-size: 1em;
    background-color: var(--color-table-bg);
    caption-side: bottom;
  }

  th, td {
    border: 1px solid var(--color-table-border);
    padding: 0.2em 0.5em;
    text-align: left;
    vertical-align: baseline;
  }

  th {
    font-weight: 600;
    text-transform: uppercase;
    background: var(--color-table-header-bg);
    border-bottom-width: 2px;
  }

  /* Better cursor for summary */
  summary {
    cursor: default;
  }

  /* Smooth scrolling for user-initiated navigation */
  @media (prefers-reduced-motion: no-preference) {
    html:focus-within {
      scroll-behavior: smooth;
    }
  }
}
```

**Key Changes:**
- Moved typography settings to `html` instead of `body`
- Added `hanging-punctuation` to html
- Moved `color-scheme` to proper location
- Added better link underline defaults for unstyled links
- Added `color-mix()` for subtle underlines
- Added high contrast mode support for `mark`
- Added `summary` cursor improvement
- Improved table defaults with logical properties
- Consolidated smooth scrolling in base layer

### 3. Add Root Isolation (Optional)

If your Astro app uses a specific root element, add isolation:

```css
@layer reset {
  /* Create a root stacking context - prevents z-index issues */
  :where(#root, #__next, body > main) {
    isolation: isolate;
  }
}
```

## Benefits of These Changes

### Accessibility
- ✅ Better focus indicators (`outline-offset`)
- ✅ Anchor link scroll margin (`:target`)
- ✅ High contrast mode support
- ✅ Better text rendering (antialiasing)

### Performance
- ✅ Prevent layout shift (`scrollbar-gutter`)
- ✅ Auto-growing textareas reduce reflows

### Developer Experience
- ✅ Zero-specificity selectors (`:where()`) = easier overrides
- ✅ Modern animations (`interpolate-size`)
- ✅ Better form defaults
- ✅ RTL support built-in

### Typography
- ✅ `hanging-punctuation` for better text flow
- ✅ Better link underlines
- ✅ Text wrapping improvements

## Testing Checklist

After implementation:

- [ ] **Focus states** - Tab through interactive elements, verify outline visibility
- [ ] **Scrollbar behavior** - Check layout doesn't shift when scrollbars appear
- [ ] **Text rendering** - Verify antialiasing looks good in both themes
- [ ] **Links** - Test link underlines in light/dark mode
- [ ] **Forms** - Test textarea auto-growth, input appearance
- [ ] **Anchor links** - Test `:target` scroll margin with hash links
- [ ] **Code blocks** - Verify `pre` wrapping
- [ ] **Both themes** - Test everything in light and dark mode
- [ ] **Mobile** - Test on actual devices (text inflation, scrollbar gutter)

## Migration Notes

**Breaking Changes:** None! These are additive improvements.

**Specificity Note:** `:where()` has zero specificity, so your existing component styles will override these defaults easily.

**Browser Support:** All features used are Baseline (widely supported). The only newer feature is:
- `field-sizing: content` - Safari 18+, Chrome 123+, Firefox 134+ (progressive enhancement)
- `interpolate-size` - Safari 18+, Chrome 129+, Firefox (in progress) (progressive enhancement)

Both are safe to include as they gracefully degrade.

## Files to Modify

- `src/styles/global.css` - Update `@layer reset` and `@layer base` blocks

## Related Tasks

- **Task 2:** Design Token Architecture (builds on this foundation)
- **Task 3:** Token Implementation (uses modernized base)

## Success Criteria

- [ ] All modern reset patterns implemented
- [ ] All modern base patterns implemented
- [ ] `:where()` used for zero specificity
- [ ] Focus indicators improved
- [ ] Text rendering enhanced
- [ ] Forms modernized
- [ ] No visual regressions
- [ ] Both themes tested
- [ ] Mobile tested

---

**Note:** This is a quick, high-value task that modernizes the foundation. Do this FIRST before the token system work.
