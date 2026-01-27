# Task: Comprehensive Styleguide Rework

## Overview

Completely rework the main styleguide page (`src/pages/styleguide.astro`) into a comprehensive design system reference. The goal is to create a single canonical location that displays all components, styling, typography, and visual treatments used across the site.

### Goal

> Create a comprehensive `/styleguide` page

A single place to see all styling and components used in the site. I'll use this:
1. To help me improve visual consistency and global styles.
2. When experimenting with changes to global styles – I can see their effect in one place.
3. When designing new visual components: I'll get them working in here first and then check they work in actual articles, notes etc.
4. When working in external tools like Figma or visual AI Agents: An HTML export and/or a full-page screenshot will give a decent overview of ALL UI and styling on the site.
5. Since this will be public, I may include a link to it in my site's footer for people who are interested.

### Existing Styleguides

The note and article styleguides serve as "double-checks" that styling works in realistic content contexts. They are proper content items in the `src/content/articles/` and `src/content/notes/` collections, but have `styleguide:true` set, which prevents them being shown in lists, RSS feeds etc.

1. **Note Styleguide** - MDX content file simulating a real note, checking styling in context
2. **Article Styleguide** - MDX content file simulating a real article, checking styling in context

There is also `src/pages/styleguide-old.astro` which will be removed once this task is complete.


## Approach

We'll create `src/pages/styleguide/index.astro` as a top-level page containing a floating TOC, and then import a partial for each logical section of the styleguide (eg. `src/pages/styleguide/_ColorSystem.astro`). This way we end up with one page in the generated site, but the styleguide code is much more manageable when I'm working with it. If it's nececarry to create any styleguide-specific Astro components, we'll do so in `src/components/styleguide/`.

## Reusable Components

Where we identify components which will clearly be useful outside of the styleguide, we'll take the time to properly create them in either `src/components/mdx/` or `src/components/ui/` as appropriate. They must be properly designed to work in a variery of contexts (eg. respond to their container size, dark/light mode, in MDX files etc.) Their props and external interface should be well-thought-out and consideration must be given to which CSS properties are inherited from their parents and which are explicitly set via our global variables etc. They should also have no unnececarry code in them. TL;DR: They must be properly designed reusable components.

There are at least three reusable components we **know** we'll need in the styleguide pages:

1. Tabs - See `src/components/mdx/Tabs.astro` and `src/components/mdx/TabItem.astro`.
2. Colour Swatches - See `src/components/mdx/ColorSwatch.astro`. We'll use this in various contexts to display colour swatches in the styleguide, but this is also very likely to be used elsewhere in the site. 
3. Resizable Container - See `/src/components/mdx/ResizableContainer.astro`. We can use this to wrap other components, allowing users to see how they respond to their container size. This will help make our styleguide shorter (we won't need to show the same componentt at various widths) but will clearly also be useful elsewhere in the site. 

### Styleguide Specific Components

Where possible, we should avoid abstracting out SG-specific components and instead use (or create) generally reusable ones, or keep things simple and scoped to the relevant partial or styleguide/index.astro. We will create `SGTOC.astro` to handles the floating TOC.

We will also create `SGTypographySwitcher.astro` - This important component lets us write:

```astro
<SGTypographySwitcher>
   <p>Some content here</p>
</SGTypographySwitcher>
```
and have that turn into:

```astro
<Tabs>
   <TabItem label="Default">
      <p>Some content here</p>
   </TabItem>
   <TabItem label="Long Form Prose">
      <LongFormProseTypography>
      <p>Some content here</p>
      </LongFormProseTypography>
   </TabItem>
<TabItem label="UI Style">
<div class="ui-style">
<p>Some content here</p>
</div>
</TabItem>
</Tabs>
```

We'll use this extensively in the styleguie to show how things are styled differently depending on the typography system they appear in. See `/src/components/styleguide/SGTypographySwitcher.astro` for the implementation of this.

## Implementation Rules & Guidance

- Avoid styleguide-specific CSS wherever possible and instead rely on inheritance from the standard global styles. (Eg. if we need to display font weights we should prefer a standard `<table>` with something like `<tr><td class="font-weight-example" style="[inject stuff]">Aa</td><td><code>--font-size-xs</code></td></tr>`. We can rely on the global styling for everything except `.font-weight-example`, which obviously needs some styleguide-specific styling just for this use case.) This ensures as far as possible that the styleguide is the truest represenation of the ACTUAL styles and components as possible.
- Keep all markup as simple and minimal as possible. This makes it much easier to understand and edit the styleguide HTML.
- Use modern CSS to the fullest extent to help with the above.
- Ensure all dummy content is as useful as possible. (Eg. "Aa" is better than a paragraph of lorem ipsum in a table showing font weights. A chunky paragraph of lorem ipsum is ideal for comparing various line-heights. And when comparing different typography styles, a realistic text including headings, inline styles etc is probably best)
- Where possible, dummy content should naturally test the same kind of boundries real content does. It we're demoing H1-H6: make one long enough it naturally wraps, include numbers and emoji occasionally to see how they're rendered. Maybe include common ligatures like "fi", or some inline `<code>`? This kind of stuff should not be so pervasive that it takes over, but these kind of things can really help us spot styling problems before they occur with real content.
- Generally speaking, each styleguide partial should be conceptually about one concept (or a group of closeley-related concepts).
- When a developer is reading a partial, it should generally not be nececarry to refer to any other styleguide-specific file to understand it.
- Do not hardcode CSS variable *values* unless absolutely unavoidable. (eg. Changing the value of `--color-accent` in `global.css` should not require any changes to the styleguide.)
- Any components created in `src/components/styleguide/` must be named with SG PRefix (eg: "SGMyComponent")

### Code Examples

If it's ever nececarry to include user-facing code examples in the stylegude, remember we have `astro-expressive-code` available.

### Implementation Notes (from planning session)

- **MDX component remapping**: Auto-replacement of markdown elements is configured in `src/config/mdx-components.ts`. Currently only two remappings exist: `a` → `SmartLink` and `img` → `BasicImage`. Plain markdown blockquotes render as standard `<blockquote>` (not `BlockQuoteCitation`).

- **Components demoed in Typography (Section 3)**: `highlight`, `BlockQuoteCitation`, and `SmallCaps` are MDX components (located in `src/components/mdx/`) but are demoed in Section 3 (Typography) rather than Section 4, because they're essentially inline/block text treatments rather than content-block components.

- **Checklist HTML output**: Astro uses remark-gfm which outputs checklists as `<ul class="contains-task-list">` with `<li class="task-list-item"><input type="checkbox" disabled>` elements.

### Theme Display Approach

- **Colour Palette Examples:** Show BOTH light and dark variants side-by-side, regardless of current theme. This allows quick visual comparison of what `--color-coral` maps to in each theme.
- **Everywhere else:** Rely on the site's normal theme toggle. Components and examples render in the current theme.

**Implementation:** See `/src/pages/styleguide/_ColorSystem.astro` and `/src/pages/styleguide/index.astro`. The CSS uses `light-dark()` function with `color-scheme: light dark`. To force a specific theme on a container, set `color-scheme: light` or `color-scheme: dark` on that element. This causes all `light-dark()` values within to resolve to the forced mode.

## Globally Reusable Components & Setup [✅ COMPLETE]

- [x] ColorSwatch.astro
- [x] Tabs.astro and TabItem.astro
- [x] ResizableContainer.astro

### Setup  [✅ COMPLETE]

- [x] New `styleguide.astro` and set up imports
- [x] SGTOC Component
- [x] SGTypographyswitcher - src/components/styleguide/SGTypographySwitcher.astro


## The Sections

Each of these will be its own partial.

### 1. ColorSystem [✅ COMPLETE]

This section should outline the colour system and include the main palette which is always visible in both light and dark colours using clickable colour swatches to copy hex codes. It should also include absolute colours and then a table of the various semantic colours which we use across the site. 

- [x] Main Palette
- [x] Absolute Colours
- [x] Semantic Colour Table

### 2. Design Tokens [✅ COMPLETE]

This section basically includes a visual reference for the main design tokens that we have available. That should include the regular spacing scale, the standard border widths and radii, our standard shadow treatments, the font families in use, the standard font size system, line height and letter-spacing utilities, standard font weights etc. While this section does contain stuff to do with typography, the reason it's here is because it is basically just showing the standardized design tokens that we have available rather than showing off the typography in various realistic situations. We can think of this more as a reference than as a visual example or demo remote of these things in use. 

- [x] Spacing Scale
- [x] BorderWidths
- [x] Border Radii
- [x] Shadows
- [x] Font Famillies
- [x] Font Sizes
- [x] Line Height
- [x] Letter Spacing
- [x] Font Weights

### 3. Typography

This section needs to show off the various typography elements in a realistic setting. For each chunk of this, the content should be wrapped in SGTypographySwitcher, so it's easy to compare how the contents look accross all typography "systems" (ie default, wrapped in LongFormProseTypography or wrapped in a div with `class="ui-style"`). Ideally these "chunks" will be short enough that they're not much longer than a whole screen in most cases, whough with some (paragraphs of variuos lenghs, headings with paragraphs in-between etc) realism is more important than this.

This section will include normal "contentish" HTML elements like paragraphs, blockquotes, lists, headings, tables etc, as well as inline type treatments like `<strong>`, `<a>` and `<kbd>` etc. Examples of opentype features should also be included appropriately. Ideally, all inline examples should be realistic, in a realistic setting and explain themselves. Eg:

```
<p>
Text can be <em>emphasised</em> in several ways. We can use <strong>strong text</strong> for indicating the importance of a word and <em>emphasis</em> for stressing. You could also use <b>bold</b> and <i>italic</i> for stylistic purposes, but this doesn't give any semantic meaning so should generally be avoided. For keyboard shortcuts, use the `kbd` element to make them look nicer. So we could do <kbd>Ctrl</kbd> + <kbd>S</kbd> to which should look fairly loveley, or perhaps we could use <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> as another example. We can see that these are all inline text treatments which should work everywhere.
</p>
```

IMPORTANT: The example above deliberately has a load of filler words because without them the paragraph would be too short to depict em, strong, b, i and kbd in a realistic setting. Instead of just using Lorum Ipsum, We're using filler, which also helps to explain the various tags and what they're used for. If it's necessary to have long runs of text or multiple paragraphs, we don't have to do this. We could use some dummy text from a classic book or something, and then in amongst it we could insert this type of stuff as well. The expectation here is not that someone reading this style guide will actually read all of this text. They're gonna look at it, but it would be good if then when we focus in on a particular element, say <kbd>, in the dummy text, the actual text around it helps to explain about it.

#### Checklist

Each item below is a "chunk" wrapped in `SGTypographySwitcher`. OpenType features (ligatures, numerals, fractions, small caps) should be woven naturally into the content rather than having a separate demo section.

- [x] **Paragraphs & Basic Inline Text**
      Multiple paragraphs of varying lengths demonstrating common inline elements:
      `<a>` (internal/external), `<strong>`/`<b>`, `<em>`/`<i>`, `<code>`
      Include an H2 for context, plus an `<hr>` between sections.
      Naturally include: ligatures (fi, fl, ff), old-style numerals in prose, fractions (1/2, 3/4).

      Also include a duplicate paragraph using `<SmartLink>` instead of `<a>` to show the difference
      (SmartLink auto-replaces markdown links via MDX remapping). Explain in the demo copy itself.

- [x] **Technical & Specialized Inline Elements**
      Paragraphs (optionally with headings) demonstrating less common inline elements:
      `<kbd>`, `<mark>`, `<del>`/`<s>`, `<sup>`, `<sub>`, `<small>`, `<cite>`, `<q>`, `<dfn>`, `<var>`, `<samp>`
      Also demo together: `<abbr>` (with/without title), `<SmallCaps>` component, `<highlight>` component.
      Can have a slightly "technical documentation" flavour to make these feel natural.

- [x] **Headings (H1-H6)**
      Full heading hierarchy with realistic paragraphs between them (varying lengths, not all super short).
      Include ligatures naturally in heading text (words with fi, fl, ff).

- [x] **Blockquotes**
      Include headings/paragraphs between blockquotes for realistic context.
      Demo both:
      - Plain HTML `<blockquote>` (what markdown produces)
      - `<BlockQuoteCitation>` variants: author only, +title, +url, small

- [x] **Lists: Unordered**
      `<ul>` with nesting, realistic content. Can include inline elements within list items.

- [x] **Lists: Ordered**
      `<ol>` with nesting, realistic content.

- [x] **Lists: Checklists**
      Render via MDX snippet import (e.g., `import { Content } from './_snippets/checklist.mdx'`)
      to ensure output matches actual MDX processing. Include nesting.

- [x] **Tables**
      Two tables to cover common use cases:
      1. Numeric/tabular data - demonstrates lining numerals, tabular figures
      2. Mixed content - with `<code>`, images, or `<ColorSwatch>` in columns
      Include a paragraph with numerals before the first table to show old-style vs lining contrast.


### 4. Content Components

This section should show off our Astro content components. These are components which are designed primarily to be used inside content. Either inside `.astro` pages, or in `.mdx` content files.

As with the typography section, these should all be shown insite a `SGTypographySwitcher` in a realistic context. For example, an `IntroParagraph` example should be realistically long, probably include a link and be preceeded by a normal paragraph or two for realism.

Most of the other block-level things should be shown with a short paragraph before/after because that's how they'll likeley be used. These "dummy" paragraphs could be used to help explain a bit about the thing if it's appropriate.

For components which should respond to their container (which is most of the block-level ones), we should wrap the SGTypographySwitcher in a ResizableContainer.

Some of these components are configured to replace the default components when markdown content is parsed (eg a markdown image renders as `BasicImage`, links render as `SmartLink`) - this should be noted in the demos.

#### Checklist

Each chunk is wrapped in `SGTypographySwitcher`. Most block-level components should also be wrapped in `ResizableContainer`. Include realistic context (paragraphs before/after) where appropriate.

- [x] **IntroParagraph**
      Realistic long paragraph with drop cap. Include a link and precede with a normal paragraph or two for context.

- [x] **Images**
      Group `BasicImage`, `<Image>`, and `<Picture>` together.
      - `BasicImage` variants: normal, framed, bleed, showAlt, source
      - Note that BasicImage auto-replaces markdown images
      - `<Image>` and `<Picture>` from astro:assets

- [x] **Embeds**
      Group `Embed`, `Loom`, and `Notion` together. Use real URLs to test actual functionality.
      - `Embed`: YouTube, Vimeo, Twitter examples
      - `Loom`: embedded Loom video
      - `Notion`: auto title and manual title variants

- [x] **BookmarkCard**
      Various real URLs to test link preview functionality. Show responsive behaviour.

- [ ] **ButtonLink**
      Own chunk (expecting more variants in future).
      Show: primary, secondary, inline variants.

- [ ] **Callout**
      Be smart about combinations - demo various prop permutations overlapping with color demos:
      - All 7 colors (default, red, blue, green, orange, yellow, purple)
      - With/without title, icon vs emoji vs neither
      At least one callout with complex content: code block, headings, lists, inline styling (code, links, bold, italic).

- [ ] **Accordion**
      - Standard and plain variants
      - At least one with complex content: lists, headings, code block, longer paragraphs
      - No need to separately demo open/closed prop

- [ ] **Tabs & TabItem**
      Demo tabbed content with multiple tabs.

- [ ] **Layout Utilities**
      Group `Center`, `Grid`, `Spacer`, and `ResizableContainer` together.
      - `Center`: simple demo
      - `Grid`: various columns/rows/gaps configurations. Try putting inside ResizableContainer to test responsiveness.
      - `Spacer`: multiple sizes
      - `ResizableContainer`: demo the component itself (meta - we use it throughout!)

- [ ] **ColorSwatch**
      Demo the ColorSwatch component with various colors.

- [ ] **Code Blocks (astro-expressive-code)**
      May need multiple SGTypographySwitchers under this heading depending on number of examples.
      Demonstrate all expressive-code features:
      - `title="filename.js"` - File name/title in frame header
      - `{3,5-7}` - Marked/highlighted lines (neutral)
      - `ins={2-3}` - Inserted lines (green, for additions)
      - `del={4}` - Deleted lines (red, for removals)
      - `diff` language - Diff syntax with `+`/`-` line prefixes
      - Line numbers (automatic)
      - Language indicators

### 5. UI Components

These components are intended for use in the "UI" of the site. Some are highly reusable primitives (eg "Pill", "Spinner"), while others are more specialized but still self-contained and worth including for visual reference when experimenting with CSS changes.

Most components should be wrapped in `SGTypographySwitcher` to show how they appear in different type contexts. The exception is `Footer` which has fixed styling (`dark-surface`) and should only be shown in a `ResizableContainer`.

**Not included:** `NavLink` (minimal - just adds active class), `FormattedDate` (no visual styling), `MainNavigation` (position:fixed, too dependent on page context), `TableOfContents` (too fiddly, rarely used).

#### Checklist

- [ ] **PersonalLogo**
      Simple component showing circle + "Danny Smith" text.
      Wrap in SGTypographySwitcher.

- [ ] **Pill**
      Show various colors (default, custom colors via props).
      Wrap in SGTypographySwitcher.

- [ ] **Spinner**
      Show default and various custom sizes.
      Wrap in SGTypographySwitcher.

- [ ] **SocialLinks**
      Social media icon links.
      Wrap in SGTypographySwitcher.

- [ ] **ThemeToggle**
      Interactive light/auto/dark toggle.
      Wrap in SGTypographySwitcher for consistency.

- [ ] **MarkdownContentActions**
      Shows "share / copy / view as markdown" links.
      Use fake URL for visual appearance only (functionality won't work in demo).
      Wrap in SGTypographySwitcher.

- [ ] **ContentCard: Articles**
      Show article-type cards with various prop permutations (standard/compact, with/without image, etc.).
      Wrap in SGTypographySwitcher and ResizableContainer.

- [ ] **ContentCard: Notes**
      Show note-type cards with various prop permutations.
      Wrap in SGTypographySwitcher and ResizableContainer.

- [ ] **Footer**
      Self-contained footer component. Uses PersonalLogo, NavLink, SocialLinks internally.
      **Do NOT wrap in SGTypographySwitcher** (has fixed `dark-surface` styling).
      Wrap in ResizableContainer to test responsive behaviour.

#### NoteCard

- [ ] **NoteCard**
      Card component for notes with title, date, optional tags, optional sourceURL.
      Approach TBD - needs slot content and may require special handling.


### 6. HTML Elements

We have already included a number of plain HTML elements in the earlier sections, but these were mostly confined to typography-related stuff. This section covers remaining HTML elements that might be used on the site, providing sensible base styles for future use.

Wrap in `SGTypographySwitcher` to see how elements render in different type contexts. Block elements should also be in `ResizableContainer`.

**Not included:** `<img>` (covered by BasicImage in Section 4), `<iframe>` (covered by Embed in Section 4), `<dialog>` (not currently used), `<address>` (unlikely to use).

#### Checklist

- [ ] **Forms**
      One realistic form demo with `<fieldset>`, `<legend>`, `<label>`, and common form controls:
      - Text inputs: text, email, password, search, url, number
      - File and color pickers: file, color
      - Checkboxes and radios: checkbox, radio
      - Dropdowns: select, datalist
      - Multi-line: textarea
      - Button: button
      - Progress indicators: meter, progress

- [ ] **Details/Summary**
      Native HTML disclosure widget.

- [ ] **Definition Lists**
      `<dl>`, `<dt>`, `<dd>` demo.

- [ ] **Figure/Figcaption**
      Simple demo to see inherited base styles (distinct from BasicImage's enhancements).

- [ ] **Audio/Video**
      Native HTML `<audio>` and `<video>` elements for future use.

### 7. Other Stuff

This section should contain any other stuff which which we wanna keep visible in the styleguide. At the moment, the only examples I can think of for this are:

- Footnote styles (from LongFormProseTypography and `/src/layouts/Article.astro`)?
- Inline footnote styles (from `/src/layouts/Article.astro`)

If this section ends up completely empty, that's fine. We'll still keep the section and add to it as necessary.

### 8. Utility Classes

This section documents available utility classes. Most only need a description (no visual demo). Present these in a table for easy scanning.

#### Utility Classes Table

Include all utilities in a single table with Class and Purpose columns:

| Class | Purpose |
|-------|---------|
| `.ui-style` | Opt-out of prose typography for nav, footer, UI-heavy areas. Already demoed extensively via SGTypographySwitcher throughout this styleguide. |
| `.dark-surface` | Forces dark background (charcoal) with light text (beige). For always-dark areas regardless of theme. |
| `.card-surface` | Raised card/panel styling with background, border, radius and shadow. |
| `.cq` | Establishes container query context (`container-type: inline-size`). |
| `.all-caps` | Uppercase text with wide letter-spacing. For labels and UI text. |
| `.content-trim` | Removes top margin from first child, bottom margin from last child. Use inside padded containers with slotted content. |
| `.img-cover` | Makes image fill container with `object-fit: cover`. |
| `.sr-only` | Visually hidden but accessible to screen readers. |
| `.external-arrow` | Subtle arrow indicator for external/offsite links in UI contexts. |
| `.flow` | Vertical rhythm spacing between child elements. See demo below. |
| `.list-reset` | Removes list styling for navigation/UI lists. See demo below. |

#### Visual Demos

##### `.flow`

Side-by-side comparison wrapped in `SGTypographySwitcher` to show behaviour across typography contexts:

```astro
<SGTypographySwitcher>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-m);">
    <div>
      <strong>Without .flow</strong>
      <!-- Content without .flow class -->
    </div>
    <div>
      <strong>With .flow</strong>
      <div class="flow">
        <!-- Same content with .flow class -->
      </div>
    </div>
  </div>
</SGTypographySwitcher>
```

Demo content should include paragraphs and headings (h2, h3) to show how `.flow` adds proportionate spacing.

##### `.list-reset`

Same side-by-side pattern in `SGTypographySwitcher`:

```astro
<SGTypographySwitcher>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-m);">
    <div>
      <strong>Without .list-reset</strong>
      <ul><!-- nav-style links --></ul>
    </div>
    <div>
      <strong>With .list-reset</strong>
      <ul class="list-reset"><!-- same nav-style links --></ul>
    </div>
  </div>
</SGTypographySwitcher>
```

Demo content should be navigation-style links to show the intended use case.
