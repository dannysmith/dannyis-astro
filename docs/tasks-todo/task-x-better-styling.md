# Task: Better Styling

## Overview

We're systematically working through the styleguide (`/styleguide`) and all CSS to ensure everything is as clean, robust, and as beautiful as possible. The approach is **general → specific**: foundations and resets first, then base element styles, then typography, then layout utilities, then specific components etc.

### Goals

1. **Visual quality** — Everything visible at `/styleguide` should look polished & intentional, and Just Work.
2. **Robustness** — Styles should work whether elements are rendered normally, inside `LongformProseTypography`, or in a `.ui-style` container. Likewise they should work in light/dark mode, and in containers of any size. The CSS generally shouldn't care what context it's used in. The `SGTypographySwitched` and `ResizablePanel` used throughout the styleguide helps us test this.
3. **Simplicity** — Modernise, consolidate, and remove unnecessary CSS. Use modern CSS features (nesting, `:has()`, `light-dark()`, logical properties) to keep things concise. Lean into inheritance and the cascade.
4. **Typeface independence** — Once complete, swapping typefaces should "just work" without extensive tweaks, because our spacing, sizing & structure are set up sensibly.

**Before starting work, read:**

- `src/styles/_foundation.css` — Design tokens
- `src/styles/_reset.css` — Reset layer
- `src/styles/_base.css` — Base element styles
- `src/styles/_typography.css` — Typography layer
- `src/styles/_layout.css` — Layout utilities
- `src/styles/_utilities.css` — Utility classes
- `src/styles/global.css` — Entry point and layer order
- `src/pages/styleguide/` — The styleguide partials (especially whichever section you're working on)

---

# Progress Checklist

- [x] Split CSS out into multiple files
- [x] Clean out unused CSS

## Base Layer

- [x] Tables
- [x] Details & Summary
- [x] Buttons
- [x] HR
- [x] Fieldset & Legend
- [x] Inputs & Labels
- [x] Selects
- [x] Textareas
- [x] Progress
- [x] Definition Lists
- [x] Audio & Video

## Typography Layer

- [x] Inline Code/Samp
- [x] Basics
- [x] Headings
- [x] Links
- [x] Strong, mark/highlight, var, small
- [x] Del/Strike
- [x] Kbd
- [x] Footnotes
- [x] Blockquotes
  - [x] Basic
  - [x] `BlockQuoteCitation.astro` 
- [x] Lists
  - [x] General
  - [x] UL
  - [x] OL
  - [x] Nested Lists
  - [x] Lists with .long-list-items
  - [x] Checklists/Task Lists
- [x] Review `LongFormTypography.astro` for anything to "pull up" into default typography.

## Layout & Utility Helpers

- [x] UI Style Reset - Unset/reset stuff introduced by `@typography` as appropriate
- [x] Small utilities
  - [x] layout.css - list-reset
- [ ] FLOW - Rework in a sensble way alongside `@typography` and `LongformProseTypography` and decide if we should keep it.

## Flow & Vertical Rhythm

**Goal:** Consolidate vertical spacing into `@typography` using `--space-*` tokens and adjacent sibling selectors.

### Plan

1. [x] Move `.flow` rules into `@typography` (leave `.flow` classes in HTML for now)
2. [x] Comment out all margin-top/bottom declarations to start fresh
3. [ ] Add new spacing rules using `--space-*` tokens:
   - Base prose elements: `margin-top: var(--space-s)`
   - Headings: `margin-top: var(--space-m)`
   - Section breaks (heading after content): `--space-xl` for h1/h2, `--space-l` for h3
   - Consecutive headings: `--space-s` (subheading pattern)
   - First-child: no top margin
   - List items: `--space-2xs`
   - HR: `margin-block: var(--space-l)`
4. [ ] Test and tune spacing values visually
5. [ ] Review `LongFormProseTypography` — pull up anything that should be default
6. [ ] Review `.ui-style` resets — may need to reset vertical margins
7. [ ] Apply `.content-trim` to components with slotted content (callouts, accordions, etc.)
8. [ ] Remove `.flow` class from HTML once everything looks good

### Notes

- Using `--space-*` tokens (not `em` or `rlh`) for simplicity and design system consistency
- Adjacent sibling selectors (`p + h2`) replace `.flow > * + *` pattern
- `:where()` for zero specificity — components can easily override
- Components with internal prose can override spacing or use `.content-trim`

## Content Components

These ones **clearly** need work:

- [ ] InlineFootnotes.astro - style the popup thing
- [ ] BasicImage
  - [ ] Framed
  - [ ] Framed with Caption
- [ ] BookmarkCard
- [ ] ButtonLink
  - [ ] Block
  - [ ] Inline
- [ ] Callout
- [ ] Accordian
- [ ] Grid

- [ ] Double-check all other components for opportunities to clean up CSS etc

## UI Components

These ones **clearly** need work:


- [ ] Pill
- [ ] ContentCard
  - [ ] Articles
  - [ ] Notes

- [ ] Double-check all other components for opportunities to clean up CSS etc

## Docs

- [ ] Update dev docs as needed

# Notes - Scratchpad
