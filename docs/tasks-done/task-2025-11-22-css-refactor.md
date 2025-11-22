# Task: CSS Refactor

Okay, so the way the site is currently set up is that we have a bunch of reset styles in the reset layer, which generally just provide some sensible defaults.

Then we have the base layer, which provides a bunch of slightly more opinionated settings. So it sets up a bunch of CSS variables for various things.

By default, we use the UI font that's used for navigation and the footer and basically everything that isn't content. That's always been the default base thing.

Then, when we want to display prose, we either wrap the prose in one of two wrapper components: `LongFormProseTypography.astro` Which is currently only used for articles. This sets up a whole bunch of article specific stuff. Now this currently seems to include a mixture of typographic treatment and also article specific layout stuff.

We also have `SimpleProseTypography` Which is used to provide a nice typographic treatment to prose anywhere other than articles. That includes note cards, notes and a few other places inside other components.

## Why did we do this?

When building new UI type components or pages, don't want to have any of this prose treatment. We almost want to be treating this like we were designing a web app.

When rendering prose we want to be applying some much nicer typographical features that are more suited to displaying content.

And then when rendering articles, which are long form content, we wanted to do an even more better job of that kind of typographic style.

We initially made the decision to default to kind of non-prose stuff because I thought that I would be adding a bunch of different pages and, you know, lots of custom stuff to this site that wasn't going to be prose. However, it turns out that the vast majority of the things I want to add to this site are some version of "writing" (eg `pages/now.astro`)

## The Problem

This whole system feels overly complex. There is surely some repetition between simple prose, long-form prose. And it almost feels like we've got this the wrong way round.

Our default base should probably be using the prose typeface and generally have sensible defaults, which is probably a lot of the stuff that is in SimpleProseTypography. This stuff should possibly either be in the CSS base, or perhaps it makes sense to have another CSS layer called typography that is above base, which sets a bunch of this stuff.

Then we could conceivably have a utility class, something like `.ui-style` Which we can apply to areas like the footer and the navigation and page titles and certain other items which we want to almost have UI type styles. And then that can unset any of the necessary prose things that we definitely don't want. And it can switch to use the UI font and all of that kind of stuff. One obvious thing it would probably want to do here is change the link style so that all anchor elements within it don't get underlines. They get a sensible style for hovering and changing the colour and stuff.

And then the LongFormProseTypography.astro wrapper can build on defaults set in the typography layer (which is can also use) by adding to or overriding rules where necessary to provide the more advanced typographic treatments we want for articles.

While we are looking at this, we should also think carefully about making sure that longformprosetypography.astro doesn't include stuff that is specific to the actual layout of article pages. Because that probably should be done in the `Article.astro` layout?

When creating new pages we shouldn't have to include boilerplate CSS to do things like set the background colour etc. But we should easily be able to override them on a page-by-page basis.

## What I want practically speaking

1. Set up a sensible reset and base in global.css (maybe all with zero specificity?) This should just make everything look kinda nice, whether it's "prose" or "ui" stuff.
2. An organised set of reusable CSS variables on :root for things like fluid type/spacing system, colour system, borders, surfaces and the like.
3. Set some lovely typography, colours, borders, margins etc etc which is the "default", but much of which can be "swapped out" for more UI-ish default styles by applying `.ui-style` to a parent. Pages and components will look fairly nice by default, and "ui-ish" components will have appropriate "default" styles for their job. Components and pages can mostly rely on their inherited styles
3. Components can use their inherited styles and the system of global custom properties alongside intelligent use of colour-mix, currentColor, calc, max, container queries etc etc to ensure they're stylesd appropriately regardless of where and how they're used.
4. The `LongFormProseTypography` wrapper just applies the extra styles ontop of the inherited "not-UI" typography. Thisis used to wrap articles, but could just as easily be used to wrap some long-form about page or similar.

---

# Implementation Plan

## New Layer Structure

```css
@layer reset, base, typography, layout, utilities, components, longform, theme;
```

| Layer | Purpose |
|-------|---------|
| `reset` | Browser normalization (keep as-is) |
| `base` | Foundation: colors, @property, element defaults (no typography opinion) |
| `typography` | **NEW** - Prose-first defaults: serif font, links, lists, blockquotes, heading borders |
| `layout` | **NEW** - Reusable patterns: `.flow`, wrappers |
| `utilities` | **NEW** - `.ui-style`, `.sr-only`, `.cq` |
| `components` | Component-specific styles |
| `longform` | Article-only enhancements: end marks, footnotes, oldstyle numerals |
| `theme` | Semantic color tokens with light-dark() (keep as-is) |

### Key Decisions

1. **Layout in Article.astro** - Grid layout moves from `LongFormProseTypography` to the `Article.astro` layout file
2. **Heading borders are default** - Typography layer includes heading borders, `.ui-style` removes them
3. **now.astro uses inherited typography** - No wrapper needed, just inherits prose defaults
4. **Mermaid stays separate** - Don't integrate with design token system

---

## Additional Simplifications

While doing this refactor, we should also clean up these issues:

### 1. Reduce Component Color Token Explosion

**Problem:** 50+ component-specific color tokens that mostly alias semantic tokens:
```css
--color-homepage-link-border: var(--color-accent);
--color-homepage-link-hover: var(--color-accent);
--color-writinglist-title-hover: var(--color-accent);
--color-notelist-title-hover: var(--color-accent);
/* All the same value! */
```

**Action:** Delete most component color tokens and use semantic tokens directly. Keep only when the value is genuinely different.

### 2. Fix Duplicate Primitive Values

```css
--color-grey-300: oklch(93% 0 0);
--color-grey-400: oklch(93% 0 0);  /* identical! */
--color-grey-500: oklch(65% 0 0);
--color-grey-600: oklch(65% 0 0);  /* identical! */
```

**Action:** Either differentiate these or consolidate to fewer grey steps.

### 3. Move Background Color to Global Default

**Problem:** Every page unnecessarily sets the same background:
```css
/* index.astro, writing/index.astro, notes/index.astro all have: */
body { background-color: var(--color-bg-primary); }
```

**Action:** Set this once in base layer. Pages only override when different.

### 4. Create Reusable UI Patterns

**Problem:** These patterns repeat in nav, footer, homepage, writing, notes:
```css
/* List reset - appears 5+ times */
ul { list-style: none; margin: 0; padding: 0; }

/* Uppercase tracking - appears 6+ times */
text-transform: uppercase;
letter-spacing: var(--tracking-wider);
```

**Action:** Create layout utilities: `.list-reset`, `.all-caps`. The `.ui-style` class will include these behaviors.

### 5. Handle "Dark Always" Components

**Problem:** Nav and Footer are always dark regardless of theme.

**Action:** Create `.dark-surface` utility that combines with `.ui-style`:
```css
.dark-surface {
  background-color: var(--color-bg-dark-200);
  color: var(--color-brand-white);
}
```
Nav/Footer use: `class="ui-style dark-surface"`

### 6. Consolidate Writing/Notes List Patterns

**Problem:** Nearly identical styles in `writing/index.astro` and `notes/index.astro`.

**Action:** Extract common patterns to layout layer or shared component.

### 7. Remove Deprecated Spacer Aliases

```css
/* These are deprecated but still exist */
--spacer-xs: var(--space-2);
--spacer-sm: var(--space-4);
```

**Action:** Find/replace all `--spacer-*` with `--space-*`, then delete aliases.

### 8. Reduce Font-Family Declarations

**Problem:** 13 places explicitly set `font-family`.

**After refactor:** With prose as default and `.ui-style` for UI font:
- Most components inherit from parent
- Only code blocks need explicit `font-family: var(--font-code)`

---

## Implementation Phases

### Phase 1: Foundation (global.css restructure)

1. Update layer declaration to new structure
2. Move `body { background-color: var(--color-bg-primary); }` to base layer
3. Create `typography` layer with prose defaults:
   - `font-family: var(--font-prose)` on body
   - Nice link styling (underlines, visited, hover)
   - Heading styles with borders
   - List marker colors
   - Blockquote styling
   - Prose spacing rhythm
   - Inline code styling
4. Create `layout` layer with utilities:
   - `.flow` for vertical rhythm
   - `.list-reset` for navigation lists
   - `.all-caps` for uppercase + tracking
5. Create `utilities` layer:
   - `.ui-style` - Switch to UI font, remove link underlines, remove heading borders, tighter spacing
   - `.dark-surface` - Dark background/text for nav/footer
   - Move `.cq`, `.sr-only` here (document as highest priority)

### Phase 2: Remove SimpleProseTypography

1. Delete `SimpleProseTypography.astro`
2. Update `Callout.astro` - remove wrapper
3. Update `NoteCard.astro` - remove wrapper
4. Update `styleguide.astro` - remove wrapper
5. Update barrel exports

### Phase 3: Simplify LongFormProseTypography

1. Remove grid layout (moves to Article.astro)
2. Remove inherited styles (font-family, base links, base lists)
3. Keep article-specific features:
   - End mark pseudo-element
   - Fancy footnotes
   - Oldstyle numerals
   - Hyphenation on narrow viewports
   - Any article-specific link/list enhancements

### Phase 4: Update Article.astro Layout

1. Move grid layout from LongFormProseTypography
2. Ensure proper structure for article pages

### Phase 5: Add .ui-style Where Needed

1. `MainNavigation.astro` - add `ui-style dark-surface`, simplify overrides, remove redundant background/color
2. `Footer.astro` - add `ui-style dark-surface`, simplify overrides, remove redundant background/color
3. `index.astro` - add `ui-style` to main, remove redundant `background-color` on body
4. `writing/index.astro` - add `ui-style` to list section, remove redundant `background-color`
5. `notes/index.astro` - add `ui-style` to list section, remove redundant `background-color`
6. UI components - remove explicit `font-family` declarations where inheriting from `.ui-style` parent

### Phase 6: Update Page Files

1. `now.astro` - remove LongFormProseTypography wrapper
2. Other pages as needed

### Phase 7: Cleanup and Token Audit

1. Fix undefined CSS properties:
   - `--color-highlight-bg` (Highlight.astro)
2. Remove deprecated `--spacer-*`:
   - Find/replace all `--spacer-*` with `--space-*`
   - Delete deprecated aliases from global.css
3. Fix duplicate grey primitives:
   - Differentiate or consolidate `--color-grey-300`/`--color-grey-400`
   - Differentiate or consolidate `--color-grey-500`/`--color-grey-600`
4. Audit and reduce component color tokens:
   - Remove `--color-homepage-*` (use `--color-accent` directly)
   - Remove `--color-writinglist-*` (use semantic tokens directly)
   - Remove `--color-notelist-*` (use semantic tokens directly)
   - Keep only tokens with genuinely different values
5. Remove unnecessary `font-family` declarations from components
6. Consider extracting shared writing/notes list pattern to component (optional)
7. Visual regression testing

---

## Files to Modify

### Delete
- `src/components/layout/SimpleProseTypography.astro`

### Major Changes
- `src/styles/global.css` - restructure layers, add typography/utilities
- `src/components/layout/LongFormProseTypography.astro` - simplify
- `src/layouts/Article.astro` - add grid layout

### Add .ui-style
- `src/components/layout/MainNavigation.astro`
- `src/components/layout/Footer.astro`
- `src/pages/index.astro`
- `src/pages/writing/index.astro`
- `src/pages/notes/index.astro`

### Remove Wrapper Usage
- `src/components/mdx/Callout.astro`
- `src/components/layout/NoteCard.astro`
- `src/pages/styleguide.astro`
- `src/pages/now.astro`

### Minor Updates
- `src/components/layout/index.ts` - update exports
- Various components to remove redundant font declarations

---

## Success Criteria

### Core Goals
- [ ] New pages inherit nice prose typography without any wrapper
- [ ] Navigation and footer look correct with `.ui-style dark-surface`
- [ ] Articles still have all their fancy features (end marks, footnotes, etc.)
- [ ] No visual regressions on existing pages

### Simplification Goals
- [ ] Simpler mental model: prose is default, UI is opt-in
- [ ] Less boilerplate in components (no wrapper components needed for prose)
- [ ] Fewer font-family declarations (most inherit)
- [ ] Fewer component color tokens (use semantic tokens directly)
- [ ] No deprecated `--spacer-*` tokens
- [ ] No duplicate grey primitive values
- [ ] Pages don't set redundant `background-color`

### Documentation
- [ ] Layer structure is clear and documented
- [ ] Utility classes (`.ui-style`, `.dark-surface`, `.flow`, etc.) are documented
