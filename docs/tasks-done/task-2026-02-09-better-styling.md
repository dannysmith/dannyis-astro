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
- [x] FLOW - Rework in a sensble way alongside `@typography` and `LongformProseTypography` and decide if we should keep it.
[x] Review `LongFormProseTypography` — pull up anything that should be default
[x] Review `.ui-style` resets — may need to resetany vertical margins set in verticalflow.css?
[x] Apply `.content-trim` to components with slotted content (callouts, accordions, etc.) as needed.

## Content Components

These ones **clearly** need work:

- [x] InlineFootnotes.astro - style the popup thing
- [x] BasicImage
- [x] BookmarkCard
- [x] ButtonLink
- [x] Callout
- [x] Accordian
- [x] Grid

**Other MDX components to review:**

- [x] Center
- [x] Spacer
- [x] ColorSwatch
- [x] IntroParagraph
- [x] Embed
- [x] Loom
- [x] Notion
- [x] ResizableContainer
- [x] SmartLink
- [x] Tabs / TabItem

## UI Components

These ones **clearly** need work:

- [x] Pill
- [x] ContentCard
  - [x] Articles
  - [x] Notes

## Final Component Review

Review remaining components for opportunities to simplify/remove CSS after global style changes.

### Phase 1: Core Layout & Navigation
- [x] `MainNavigation.astro` + `NavLink.astro`
- [x] `Footer.astro`

### Phase 2: UI Components
- [x] `ThemeToggle.astro`
- [x] `SocialLinks.astro`
- [x] `PersonalLogo.astro`
- [x] `Spinner.astro`
- [x] `MarkdownContentActions.astro`

### Phase 3: Content-Adjacent
- [x] `TableOfContents.astro`
- [x] `NoteCard.astro`
- [x] `Lightbox.astro`

### Phase 4: MDX Typography
- [x] `SmallCaps.astro`

# Notes - Scratchpad
