# Task: Styleguide rework

We are reworking the **main** styleguide at `src/pages/styleguide/` (not the article/note styleguides, which are just markdown-rendering examples). The styleguide is a hidden-but-findable reference whose primary job is to help Danny build new components and visual features, and secondarily to let curious visitors see how the site is put together.

## Initial State

The styleguide is a single page at `/styleguide` rendered from a set of partials. It uses 

## Goals

We want to end up with a set of seperate public-facing styleguide pages with a shared navigation to switch between them. These pages should:

- Be well organised from an "information architecture" point of view so they're easy for a user to understand and navigate.
- Include proper explanatory text written by Danny (rather than the current AI-generated text).
- Include proper examples of components in the manner of good developer documentation, as well as some more "real-life" examples of certain components and features working together. More on this below.
- Be primarily written as plain HTML, except where there's a good reason not to, and only include styleguide-specific CSS and components where nececarry.

## End State

We'll end up with the following pages:

### `/styleguide`

A simple general overview written by Danny with pointers to the article and notes styleguides and the navigation links to the other styleguide pages...

### `/styleguide/foundations`

This is a **reference** page which explains the fundamentals of the design system. Unlike the other pages it doesn't include proper examples or specemins. While Danny might reference this occasionally while designing, it's mainly for other people to read as the kinda "intro documentation" to the mini-design system of this site. Expected to include:

- Intro
- Colour System
  - Swatches for absolute colours
  - Swatches for adaptive colours
  - Table of semantic colours
- Design tokens
  - Table of Borders
  - Table of Radii
  - Table of Shadows
- Typography & Spacing Tokens
  - Intro explaining the general approach to typography
  - Typefaces <a completely reworked section coveging the Font Families>
  - Font Sizes Scale Table
  - Spacing Scale Table
  - Font Weights Table
  - Line Height Table
  - Letter Spacings Table
- Utility classes Table

### `/styleguide/typography`

Specimins of inline elements, headings, lists, tables, blockquotes and other typographic features. This page should only include specimins of stuff which *happens by default* in this site when writing standard markdown or HTML. So SmartLinks belong here because they are *automatically* rendered from markdown, but NotionLinks don't because they are a component the user has to include with a `<NotionLink>` tag. Probable structure:

- Reference table for inline elements. Eg
  | Element | You write | Renders | Notes |
  | --- | --- | --- | --- |
  | Strike | `` `<del>…</del>` `` | <del>…</del> | … |
- Similar reference table for block-level typographic elements like headings or blockquotes. Might end up needing to not be a table.
- Composite reference samples of related block-level typography (eg headings with paragraphs between).
- Footnotes Demo showing whole thing (marker + inline popup + end section) as it is now.
- Realistic Composite examples showing multiple elements worthing together in a realistic context.
- Demo of `list-reset`

### `/styleguide/components`

Content Components like Callout, Embed family, BookmarkCard, Accordion, FileTree, ButtonLink, Image/Picture, IntroParagraph, MarkdownBlock, code blocks, ContentCard/NoteCard, layout helpers (Center/Grid) etc. Each component gets the full component-library treatment:

  - What it is and (briefly) how it works.
  - **Props table** for anything with non-trivial props.
  - **"You write this" (MDX/code block) + rendered output**, the repeated unit.
  - One or more examples, in different typographic contexts and/or `ResizableContainer` where width-response matters.
  - **Badges** for components that auto-replace standard markdown or support special markdown syntax (fenced code → code block, filetree, markdownpreview, etc.).

### `/styleguide/ui`

Code-only building blocks like Pill, Spinner, PersonalLogo, SocialLinks, ThemeToggle, MarkdownContentActions, Footer etc. Very similar structure to above.

### `/styleguide/html`

Reference specimins of native HTML elements which haven't been demoed in other pages, framed explicitly as "raw native element defaults under our CSS". Native elements that have a natural component home (native HTML video/audio → embeds, `<details>` → accordion) should be colocated with the relevant components. This is for stuff like forms, `<dl>`, `<figure>` which have no obvious home in `/styleguide/typography` or `/styleguide/components` or `/styleguide/ui`.

> NOTE: we may end up deciding that form elements like inputs, buttons and so on actually belong in `/styleguide/ui`, In which case we may find this page becomes small enough that we can remove it entirely.

### Probable End File structure

```
src/pages/styleguide/
  index.astro            # Overview
  foundations.astro
  typography.astro
  components.astro
  ui.astro
  html.astro
  _layout/               # co-located shared layout + nav
  _components/           # SGSwitcher, SGSpecimen, SGNav etc
  _snippets/             # MDX snippets (existing pattern, extended as needed)
```

## Implementation Rules & Guidance

- Do not delete or remove content from the existing styleguide partials until the end. Once we have a *new* working styleguide we can remove them en-mass.
- Do not attempt to write explanatory prose like intro paragraphs unless the user specifically asks you to. 
- Do not run linters and checks after simple HTML or CSS changes unless asked.
- When porting content from the old styleguide pages, start by directly porting what's there and *then* look for opportunities to:
  1. Replace complex code which maps over JS objects to generate simple tables for plain old HTML tables, unless the former is genuinely simpler code to read.
  2. Simplify the HTML structure/classes
  3. Simplify styleguide-specific CSS by using modern CSS and/or leaning on our global default styling and utilities.

## Implementation Plan

### Phase 0 — Scaffolding [✅ DONE]

- [x] New structure with stub docs.
- [x] New responsive `StyleguideLayout.astro` with cross-page navigation and in-page TOC. Check this works properly with the user.
- [x] New `SGSwitcher.astro` based on `SGTypographySwitcher` with "UI Flow" removed.
- [x] New `SGSpecimin.astro` for rendering the "you write this" code block + live output as one consistent unit. The core repeated element across Components/UI pages.

### Phase 1 — Foundations

- [x] Intro
- [x] Colour System
  - [x] Swatches for absolute colours
  - [x] Swatches for adaptive colours
  - [x] Table of semantic colours
- [x] Design tokens
  - [x] Table of Borders
  - [x] Table of Radii
  - [x] Table of Shadows
- [ ] Typography & Spacing Tokens
  - [ ] Intro explaining the general approach to typography
  - [ ] Typefaces <a completely reworked section coveging the Font Families>
  - [ ] Font Sizes Scale Table
  - [ ] Spacing Scale Table
  - [ ] Font Weights Table
  - [ ] Line Height Table
  - [ ] Letter Spacings Table
- [ ] Utility classes Table

### Phase 2 — Typography


### Phase 3 — Content Components


### Phase 4 — UI Components

### Phase 5 — HTML


### Phase 6 — Full Edit

- [ ] Convert `index.astro` from the monolith into the slim hub 
- [ ] Full spelling and error check across all files
- [ ] Full user-review in the browser to address working etc

### Phase 7 - Final Cleanup

- [ ] Remove the old single-page partials
- [ ] Remove the now-unused `src/components/styleguide/` helpers (`SGTOC`, `SGTypographySwitcher`) and their barrel once nothing references them (check `scratchpad.astro`)
- [ ] Update `docs/developer/` if any patterns changed
- [ ] TBC
