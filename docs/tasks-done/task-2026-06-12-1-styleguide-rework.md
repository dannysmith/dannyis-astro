# Task: Styleguide rework

We are reworking the **main** styleguide at `src/pages/styleguide/` (not the article/note styleguides, which are just markdown-rendering examples). The styleguide is a hidden-but-findable reference whose primary job is to help Danny build new components and visual features, and secondarily to let curious visitors see how the site is put together.

## Initial State

The styleguide is a single page at `/styleguide` rendered from a set of partials.

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
  _components/           # SGSwitcher, SGSpecimen (the nav lives in _layout)
  _snippets/             # MDX snippets (existing pattern, extended as needed)
```

## Implementation Rules & Guidance

- Do not delete or remove content from the partials still used by the monolith `index.astro` (`_Typography`, `_ContentComponents`, `_UiComponents`, `_HtmlElements`, `_OtherStuff`) until the end — they keep `/styleguide` working. The **exception** is the foundations-only partials we're actively migrating (`_DesignTokens`, `_UtilityClasses`): gut/inline them as you port, then delete. Once we have a *new* working styleguide we can remove the rest en-masse.
- The finished **Colour System** and **Design tokens** sections in `foundations.astro` are the reference model for a ported section: `section[id] → h2 → intro → h3[id] sub-sections → plain HTML tables` (token tables use `Variable | Value | Preview | Notes`, where Value is the literal from `_foundation.css` and Notes is hand-written), with co-located `sg-`-prefixed CSS. Mirror them rather than inventing a new shape.
- Each page passes a `toc={[{ id, label }]}` to `StyleguideLayout`; the active-item highlight is a **CSS-only scrollspy** (`scroll-target-group` + `:target-current`, Chromium-only progressive enhancement — no JS, don't add any). Keep every `toc` id matched to a real heading `id` and in page order: an entry pointing at a missing id silently breaks (dead anchor, no highlight).
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
- [x] New `SGSpecimen.astro` for rendering the "you write this" code block + live output as one consistent unit. The core repeated element across Components/UI pages.

### Phase 1 — Foundations [✅ DONE]

> **Where the remaining source lives:** all source has now been ported inline into `foundations.astro` and both partials (`_DesignTokens.astro`, `_UtilityClasses.astro`) have been deleted. The token tables (font sizes, spacing, font weights, line height, letter spacing) were converted to plain-HTML `Variable | Value | Preview` tables per the reference model (Line Height + Letter Spacing converted from the old `<Tabs>` demos). The **Typefaces** section and the section **Intro** were ported verbatim and still need their planned rework; the section intro paragraph is stale.

- [x] Intro
- [x] Colour System
  - [x] Swatches for absolute colours
  - [x] Swatches for adaptive colours
  - [x] Table of semantic colours
- [x] Design tokens
  - [x] Table of Borders
  - [x] Table of Radii
  - [x] Table of Shadows
- [x] Typography & Spacing Tokens
  - [x] Intro explaining the general approach to typography <ported verbatim — stale, needs rework>
  - [x] Typefaces <ported verbatim — a completely reworked section covering the Font Families is still to do>
  - [x] Font Sizes Scale Table
  - [x] Spacing Scale Table
  - [x] Font Weights Table
  - [x] Line Height Table
  - [x] Letter Spacings Table
- [x] Utility classes Table

### Phase 2 — Typography [✅ DONE]

> **Source:** `_Typography.astro`, plus footnotes from `_OtherStuff.astro` and the `.list-reset` demo from `_UtilityClasses.astro`. These specimens are things that happen *by default* from markdown/HTML — `SmartLink` belongs here (auto from markdown links); `SmallCaps` and `Highlight` are kept here too as pure inline-text styling, while `BlockQuoteCitation` goes to Phase 3.
>
> **Where it landed:** all specimens live in `typography.astro`, restructured into reference tables (inline + manual-inline) plus full-width specimens for everything block-level. Each specimen is wrapped in `SGSwitcher` (Default / Default Flow / Long Form Prose / UI); headings, both lists, checklist, density, the basic + mixed-content tables and the realistic example are additionally wrapped in `ResizableContainer`. Intros and Notes-column copy written by Danny.
>
> **Two open decisions (flagged, not yet actioned):** (1) the inline Links row shows a plain *internal* `<a>` but not a plain *external* `<a>` (a raw external anchor wouldn't get SmartLink's arrow, since rehype-external-links only runs on MDX) — left out pending a call on whether it's worth showing. (2) `.list-reset` now appears on **both** Foundations (ported in Phase 1) and Typography — decide which page should own it.

- [x] Intro
- [x] Inline elements reference table (you write / renders / notes)
  - [x] Links — plain `<a>` (internal & external) <plain internal + SmartLink internal/external done; plain external not shown — see open decision>
  - [x] SmartLink (auto from markdown links)
  - [x] `em` / `strong`
  - [x] `b` / `i`
  - [x] inline `code`
  - [x] `mark`
  - [x] `del` / `s`
  - [x] `sub` / `sup`
  - [x] `kbd`
  - [x] `var` / `samp`
  - [x] `abbr` / `dfn`
  - [x] `cite` / `q`
  - [x] `small`
- [x] Manual inline typographic components (need an explicit tag, *not* auto from markdown — kept here because they're pure inline-text styling)
  - [x] SmallCaps (`<SmallCaps>`)
  - [x] Highlight (`<highlight>` — shares `.highlight` styling with `<mark>`)
- [x] Block-level elements reference (table or list) <ported as full-width specimens, not a table — headings/blockquote need real scale>
  - [x] Headings (h1–h6)
  - [x] Paragraphs
  - [x] Blockquote (plain markdown `>`)
  - [x] Horizontal rule (`hr`)
- [x] Composite block-level samples (headings + paragraphs together)
- [x] Lists
  - [x] Unordered (incl. nesting)
  - [x] Ordered (incl. nesting)
  - [x] Checklists (GFM task lists, from MDX)
  - [x] List density (`.long-list-items` auto-spacing, from MDX)
- [x] Tables
  - [x] Basic table (caption, thead, th/td)
  - [x] Mixed-content cells
  - [x] Wide / horizontally-scrolling tables (`.table-scroll`)
- [x] Footnotes demo (reference + inline popup + footnotes section)
- [x] `.list-reset` demo
- [x] Realistic composite example (multiple elements working together)

### Phase 3 — Content Components [✅ DONE]

> **Source:** `_ContentComponents.astro`. Each gets the full treatment: what it is, props table where non-trivial, "you write this" + rendered output, examples in different contexts / `ResizableContainer`, and badges for auto-replace components. Per the colocation rule, native `<details>` (→ Accordion) and native `<audio>`/`<video>` (→ Embeds) live here too, not in HTML.

- [x] Intro
- [x] IntroParagraph
- [x] Inline content components (manual, not auto from markdown)
  - [x] Notion (NotionLink)
  - [x] BlockQuoteCitation (author / title+url / `small`)
- [x] Images
  - [x] BasicImage — default / framed / caption / framed+caption / bleed variants
  - [x] Astro `<Image>` & `<Picture>`
- [x] Embeds
  - [x] Embed (auto-detect dispatch)
  - [x] YouTube
  - [x] Vimeo
  - [x] Loom
  - [x] LCVid (self-hosted v.danny.is — chrome / transcript / minimal / overrides)
  - [x] Native `<audio>` / `<video>` (colocated here)
  - [x] Tweet
  - [x] Gist
  - [x] BlueskyPost
  - [x] MastadonPost
  - [x] BaselineReady
- [x] BookmarkCard
- [x] ButtonLink (primary / secondary / inline) + standard HTML buttons
- [x] Callout (colour variants / title+icon+emoji / rich content)
- [x] Accordion (+ native `<details>` comparison, colocated here)
- [x] Code blocks (title / terminal / line highlight / ins+del / diff / wrap)
- [x] MarkdownBlock (rendered / source default)
- [x] FileTree
- [x] ColorSwatch
- [x] Tabs / TabItem
- [x] ContentCard (articles / notes / custom / compact)
- [x] NoteCard (with tags+sourceURL / minimal)
- [x] Layout helpers
  - [x] Center
  - [x] Grid
  - [x] ResizableContainer
  - [x] Spacer

### Phase 4 — UI Components [✅ DONE]

> **Source:** `_UiComponents.astro`. Code-only building blocks used outside content. Same component-library treatment as Phase 3. (ContentCard / NoteCard live in Phase 3 per the page split, even though they currently sit in this partial.)

- [x] Intro (Danny to write)
- [x] PersonalLogo
- [x] Pill (default / custom colour / `textColor` override)
- [x] Spinner (sizes)
- [x] SocialLinks
- [x] ThemeToggle
- [x] MarkdownContentActions
- [x] FormattedDate
- [x] Footer

### Phase 5 — HTML

> **Source:** `_HtmlElements.astro`. Raw native element defaults under our CSS, for elements with no component home. Native `<details>`, `<audio>` and `<video>` are *not* here — they're colocated with Accordion / Embeds in Phase 3.
>
> **Open decision:** if form controls end up moving to `/styleguide/ui`, this page may shrink enough to delete entirely (see End State note).

- [x] Intro
- [x] Forms
  - [x] Text inputs (text / email / password / search / url / number)
  - [x] File / color / date / range inputs
  - [x] Checkboxes & radios
  - [x] Select & datalist
  - [x] Textarea (with / without `rows`)
  - [x] Progress & meter
  - [x] Fieldset / legend / label structure
- [x] Definition lists (`dl` / `dt` / `dd`)
- [x] Figure / figcaption

### Phase 6 — Full Edit [✅ DONE]

- [x] Convert `index.astro` from the monolith into the slim hub 
- [x] Full spelling and error check across all files
- [x] Full user-review in the browser to address working etc

### Phase 7 - Final Cleanup [✅ DONE]

- [x] Remove the old single-page partials
- [x] Remove the now-unused `src/components/styleguide/` helpers (`SGTOC`, `SGTypographySwitcher`) and their barrel once nothing references them (check `scratchpad.astro`)
- [x] Update `docs/developer/` if any patterns changed
