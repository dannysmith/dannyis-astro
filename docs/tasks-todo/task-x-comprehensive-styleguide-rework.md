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
5. I'll also use this when experimenting with changes to global styles, to see in one place how 
6. Since this will be public, I may include a link to it in my site's footer for people who are interested.

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

1. Tab System - See `src/components/mdx/Tabs.astro` and `src/components/mdx/TabItem.astro`.
2. Colour Swatches - See `src/components/mdx/ColorSwatch.astro`. We'll use this in various contexts to display colour swatches in the styleguide, but this is also very likely to be used elsewhere in the site. 
3. Resizable Container - We can use this to wrap other components, allowing users to see how they respond to their container size. This will help make our styleguide shorter (we won't need to show the same componentt at various widths) but will clearly also be useful elsewhere in the site. 

## Implementation Rules & Guidance

- Avoid styleguide-specific CSS wherever possible and instead rely on inheritance from the standard global styles. (Eg. if we need to display font weights we should prefer a standard `<table>` with something like `<tr><td class="font-weight-example" style="[inject stuff]">Aa</td><td><code>--font-size-xs</code></td></tr>`. We can rely on the global stling for everything except `.font-weight-example`, ehich obviously needs some styleguide-specific styling just for this use case.) This ensures as far as possible that the styleguide is the truest represenation of the ACTUAL styles and components as possible.
- Keep all markup as simple and minimal as possible. This makes it much easier to understand and edit the styleguide HTML.
- Use modern CSS to the fullest extent to help with the above.
- Ensure all dummy content is as useful as possible. (Eg. "Aa" is better than a paragraph of lorem ipsum in a table showing font weights. A chunky paragraph of lorem ipsum is ideal for comparing various line-heights. And when comparing different typography styles, a realistic text including headings, inline styles etc is probably best)
- Where possible, dummy content should naturally test the same kind of boundries real content does. It we're demoing H1-H6: make one long enough it naturally wraps, include numbers and emoji occasionally to see how they're rendered. Maybe include common ligatures like "fi", or some inline `<code>`? This kind of stuff should not be so pervasive that it takes over, but these kind of things can really help us sport styling problems before they occur with real content.
- Generally speaking, each styleguide partial should be conceptually about one concept (or a group of closeley-related concepts).
- When a developer is reading a partial, it should generally not be nececarry to refer to any other styleguide-specific file to understand it.
- Do not hardcode CSS variable *values* unless absolutely unavoidable. (eg. Changing the value of `--color-accent` in `global.css` should not require any changes to the styleguide.)

### Code Examples

If it's appropriate to include user-facing code examples, remember we have `astro-expressive-code` available.

### Theme Display Approach

- **Colour Palette Examples:** Show BOTH light and dark variants side-by-side, regardless of current theme. This allows quick visual comparison of what `--color-coral` maps to in each theme.
- **Everywhere else:** Rely on the site's normal theme toggle. Components and examples render in the current theme.

**Implementation:** The CSS uses `light-dark()` function with `color-scheme: light dark`. To force a specific theme on a container, set `color-scheme: light` or `color-scheme: dark` on that element. This causes all `light-dark()` values within to resolve to the forced mode.

## Globally Reusable Components & Setup [✅ COMPLETE]

- [x] ColorSwatch.astro
- [x] Tabs.astro and TabItem.astro
- [x] ResizableContainer.astro

### Setup  [✅ COMPLETE]

- [x] New `styleguide.astro` and set up imports
- [x] Styleguide TOC Component
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
Text can be <em>emphasised</em> in several ways. We can use <strong>strong text</strong> for indicating the importance of a word and <em>emphasis</em> for stresssing. You could also use <b>bold</b> and <i>italic</i> for stylistic purposes, but thi doesn't give any semantic meaning so should generally be avoided. For keyboard shortcuts, use the `kbd` element to make them look nicer. So we could do <kbd>Ctrl</kbd> + <kbd>S</kbd> to which should look fairly loveley, or perhaps we could use <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> as another example. We can see that these are all inline text treatments which should work everywhere.
</p>
```

IMPORTANT: The example above deliberately has a load of filler words because without them the paragraph would be too short to depict em, strong, b, i and kbd in a realistic setting. Instead of just using Lorum Ipsum, We're using filler, which also helps to explain the various tags and what they're used for. If it's necessary to have long runs of text or multiple paragraphs, we don't have to do this. We could use some dummy text from a classic book or something, and then in amongst it we could insert this type of stuff as well. The expectation here is not that someone reading this style guide will actually read all of this text. They're gonna look at it, but it would be good if then when we focus in on a particular element, say <kbd>, in the dummy text, the actual text around it helps to explain about it.

TBD

#### Block HTML Elements to include in Typography

- Paragraphs of various lengths
- H1-H6
- Blockquotes with and without citations
- ULs with nesting
- OLs with nesting
- Checklists with nesting
- Tables
- Horizontal rules

#### Inline HTML Elements to include in Typography

- `<a>` - Links (include )
- `<strong>` / `<b>` - Bold
- `<em>` / `<i>` - Italic
- `<del>` / `<s>` - Strikethrough
- `<sup>` - Superscript
- `<sub>` - Subscript
- `<code>` - Inline code
- `<mark>` - Highlight
- `<kbd>` - Keyboard input
- `<abbr>` - Abbreviation (with and without title attributes)
- `<small>` - Small text
- `<cite>` - Citation
- `<q>` - Inline quote
- `<dfn>` - Definition
- `<var>` - Variable
- `<samp>` - Sample output


#### OpenType Features to demonstrate in typography

Use explanatory copy that demonstrates the feature within the text itself:

**Old-style Numerals:**
> "In long-form prose, numbers like 1234567890 use old-style figures. Notice how 3, 4, 5, 7, and 9 have descenders that blend naturally with lowercase text, while 0, 1, and 2 sit on the baseline."

**Lining Numerals:**
> "In UI contexts, numbers like 1234567890 use lining figures. All digits share the same height, aligning with capital letters for clean tabular display."

**Ligatures:**
> "Standard ligatures improve readability: fi, fl, ff, ffi, ffl. The letters connect smoothly rather than colliding."

**Fractions:**
> "Proper fractions: 1/2, 1/4, 3/4. Compare to fake fractions made with slashes."

**Small Caps:**
> "ACRONYMS like NASA, BBC, and HTML look better in small caps, blending with surrounding text."

**Tabular vs Proportional:**
Show in a table with columns that should/shouldn't align.


### 4. Content Components

This section should show off our Astro content components. These are components which are designed primarily to be used inside content. Either inside `.astro` pages, or in `.mdx` content files.

As with the typography section, these should all be shown insite a `SGTypographySwitcher` in a realistic context. For example, an `IntroParagraph` example should be realistically long, probably include a link and be preceeded by a normal paragraph or two for realism.

Most of the other block-level things should be shown with a short paragraph before/after because that's how they'll likeley be used. These "dummy" paragraphs could be used to help explain a bit about the thing if it's appropriate.

For components which should respond to their container (which is most of the block-level ones), we should wrap the SGTypographySwitcher in a ResizableContainer.

Some of these components are configured to replace the default components when markdown content is parsed (eg a markdown image task renders a `BasicImage`) - if this is the case, it should be noted somehow.

| Component           | Key Variants/Configs | Notes          |
| ------------------- | -------------------- | -------------- |
| `Title1` - `Title4` | Default              | Show hierarchy |
| `SmallCaps`         | Default              | Simple         |
| `highlight`         | Default              | Simple         |
| `BlockQuoteCitation` | Author only, +title, +url, small                | Show code  |
| `IntroParagraph`     | Default (drop cap)                              | Show code  |

#### Content Components
| Component            | Key Variants/Configs                            | Notes      |
| -------------------- | ----------------------------------------------- | ---------- |
| `Embed`              | YouTube, Vimeo, Twitter, Loom, fallback         | Show code  |
| `Accordion`          | Standard, plain, open/closed                    | Show code  |
| `BasicImage`         | Normal, framed, bleed variants, showAlt, source | Show code  |
| `<Image>` | from `astro:assets` - Optimized, responsive images | |
| `<Picture>` | from `astro:assets` - Art direction with multiple formats | |
| `BookmarkCard`       | Various URLs                                    | Responsive |
| `ButtonLink`         | Primary, secondary, inline                      | Show code  |
| `Callout`            | All 7 types, with/without title, icon/emoji     | Show code  |
| `Center`             | Default                                         | Simple     |
| `Grid`               | Various columns/rows/gaps                       | Show code  |
| `Loom`               | Default                                         | Simple     |
| `Notion`             | Auto title, manual title                        | Show code  |
| `Spacer`             | Multiple sizes                                  | Simple     |
| `SmartLink`          | Internal, external                              | Simple     |
| `IntroParagraph`     | Default (drop cap)                              | Show code  |
| `Tabs & TabItem`     |                               | Show code  |
| `ResizableContainer`     |                               | Show code  |

Note: `Lightbox` component should "Just work" when images are clicked?

#### Code Blocks (astro-expressive-code)
- `<pre>` / `<code>` - Plain Code blocks

Demonstrate all expressive-code features beyond basic syntax highlighting:
- `title="filename.js"` - File name/title in frame header
- `{3,5-7}` - Marked/highlighted lines (neutral)
- `ins={2-3}` - Inserted lines (green, for showing additions)
- `del={4}` - Deleted lines (red, for showing removals)
- `diff` language - Diff syntax with `+`/`-` line prefixes
- Line numbers (automatic)
- Language indicators

### 5. UI Components

These components are intended for use in the "UI" of the site. Some of them are essentially UI primitives and are very reusable (eg "Pill" or "ContentCard"), and some of them will only ever be used in specific contexts (eg "NavLink"). If these components are block-level, they should be shown in a ResizableContainer, and if they have multiple variants and/or optional props we should aim to show a fairly full representation of the options. In many cases, we should show how these look in all typography systems (ie wrap in a SGTypographySwitcher) - this is important for things like `ContentCard` which may well find itself used in various contexts. We don't need to do this for layout components where we 100% know their use is limited to specific places (eg `NavLink` or `Footer`).

| Component                | Key Variants/Configs           | Notes                  |
| ------------------------ | ------------------------------ | ---------------------- |
| `PersonalLogo`           | Default                        | Simple                 |
| `Pill`                   | Multiple colors                | Simple                 |
| `SocialLinks`            | Default                        | Simple                 |
| `ContentCard`            | Standard/compact, article/note | Responsive, show code  |
| `Spinner`                | Default, custom size           | Simple                 |
| `MarkdownContentActions` | Default                        | May need context       |
| `FormattedDate`          | Various dates                  | Simple, no code needed |

#### Layout Components
| Component        | Key Variants/Configs         | Notes                              |
| ---------------- | ---------------------------- | ---------------------------------- |
| `NavLink`        | Active/inactive              | Show both states                   |
| `ThemeToggle`    | Light/auto/dark              | Interactive                        |
| `MainNavigation` | Open/closed states           | May not work in isolation - try it |
| `Footer`         | Full width                   | Should work in ResizableContainer  |
| `NoteCard`       | With/without sourceURL, tags | Grid display                       |


### 6. HTML Elements

We have already included a number of plain HTML elements in the earlier sections, but these were mostly confined to typography-related stuff. This section should include any other HTML elements which we may find ourselves using in the site. We should show how these look in all three type systems (ie wrap in SGTypographySwitcher) and for block elements we should also wrap that in a ResizableContainer. We should do our best to group these elements together into logical, realistic demos. For example, the demo of the form elements should probably be an actual `<form>` with `<fieldset>`, labels and all common form controls.

#### Form Elements
- `<button>` - Default button styling
- `<input type="text">` - Text input
- `<input type="checkbox">` - Checkbox
- `<input type="radio">` - Radio button
- `<select>` - Dropdown
- `<textarea>` - Multi-line input

#### Interactive Elements
- `<details>` / `<summary>` - Native disclosure
- `<dialog>` - Native dialog (if styled)

#### Other Elements
- `<img>` - Basic image
- `<figure>` / `<figcaption>` - Image with caption
- `<video>` - Native video (if used)
- `<iframe>` - Embedded content
- `<dl>` / `<dt>` / `<dd>`


#### Footnotes (Article Context)
Demonstrate footnote rendering (article-specific via LongFormProseTypography):
- Inline footnote references `[^1]`
- Footnote section at bottom
- Back-reference links

### 7. Other Stuff

This section should contain any other stuff which which we wanna keep visible in the styleguide. At the moment, the only examples I can think of for this are:

- Footnote styles (from LongFormProseTypography and `/src/layouts/Article.astro`)?
- Inline footnote styles (from `/src/layouts/Article.astro`)

If this section ends up completely empty, that's fine. We'll still keep the section and add to it as necessary.

### 8. Utility Classes

This section should simply include the details of the available utility classes. where there is no need for a visual demonstration. We should simply include a list explaining what each of them does. where a visual demonstration will make sense, we should include that with some realistic content. As ever, we should wrap these in SGTypographySwitcher Wherever they are a) likeley to be used in multiple systems and b) will potentially render differently in different systems (eg `.flow`, `.list-reset` etc.).

Document and demonstrate:
- `.dark-surface` - Always-dark areas
- `.card-surface` - Raised card styling
- `.cq` - Container query context
- `.flow` - Vertical rhythm
- `.list-reset` - Navigation lists
- `.all-caps` - Label styling
- `.content-trim` - Margin cleanup
- `.img-cover` - Responsive images
- `.sr-only` - Screen reader only
- `.external-arrow` - External link indicator
