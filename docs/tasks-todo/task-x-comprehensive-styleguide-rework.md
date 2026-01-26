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

## Globally Reusable Components & Setup

- [x] ColorSwatch.astro
- [x] Tabs.astro and TabItem.astro
- [ ] ResizableContainer.astro (Needs review and cleaning up)

### Setup  [✅ COMPLETE]

- [x] New `styleguide.astro` and set up imports
- [x] Styleguide TOC Component


## The Sections

Each of these will be its own partial.

### ColorSystem [✅ COMPLETE]

- [x] Main Palette
- [x] Absolute Colours
- [x] Semantic Colour Table

### Design Tokens [✅ COMPLETE]

- [x] Spacing Scale
- [x] BorderWidths
- [x] Border Radii
- [x] Shadows
- [x] Font Famillies
- [x] Font Sizes
- [x] Line Height
- [x] Letter Spacing
- [x] Font Weights

### Typography

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


### MDX Components

#### MDX Content Components
| Component            | Key Variants/Configs                            | Notes      |
| -------------------- | ----------------------------------------------- | ---------- |
| `Embed`              | YouTube, Vimeo, Twitter, Loom, fallback         | Show code  |
| `Accordion`          | Standard, plain, open/closed                    | Show code  |
| `BasicImage`         | Normal, framed, bleed variants, showAlt, source | Show code  |
| `BlockQuoteCitation` | Author only, +title, +url, small                | Show code  |
| `BookmarkCard`       | Various URLs                                    | Responsive |
| `ButtonLink`         | Primary, secondary, inline                      | Show code  |
| `Callout`            | All 7 types, with/without title, icon/emoji     | Show code  |
| `Center`             | Default                                         | Simple     |
| `Grid`               | Various columns/rows/gaps                       | Show code  |
| `IntroParagraph`     | Default (drop cap)                              | Show code  |
| `Loom`               | Default                                         | Simple     |
| `Notion`             | Auto title, manual title                        | Show code  |
| `Spacer`             | Multiple sizes                                  | Simple     |
| `SmartLink`          | Internal, external                              | Simple     |
| `ColorSwatch`        |                                                 |            |

Note: `Tabs`, `TabItem` and `ResizableContainer` do not need demonstrating because they are used so frequently elsewhere in the styleguide.

#### MDX Typography Components
| Component           | Key Variants/Configs | Notes          |
| ------------------- | -------------------- | -------------- |
| `Title1` - `Title4` | Default              | Show hierarchy |
| `SmallCaps`         | Default              | Simple         |
| `highlight`         | Default              | Simple         |

### Astro Components

### UI Components

| Component                | Key Variants/Configs           | Notes                  |
| ------------------------ | ------------------------------ | ---------------------- |
| `FormattedDate`          | Various dates                  | Simple, no code needed |
| `PersonalLogo`           | Default                        | Simple                 |
| `Pill`                   | Multiple colors                | Simple                 |
| `SocialLinks`            | Default                        | Simple                 |
| `ContentCard`            | Standard/compact, article/note | Responsive, show code  |
| `Spinner`                | Default, custom size           | Simple                 |
| `MarkdownContentActions` | Default                        | May need context       |

#### Layout Components
| Component        | Key Variants/Configs         | Notes                              |
| ---------------- | ---------------------------- | ---------------------------------- |
| `NavLink`        | Active/inactive              | Show both states                   |
| `ThemeToggle`    | Light/auto/dark              | Interactive                        |
| `MainNavigation` | Open/closed states           | May not work in isolation - try it |
| `Footer`         | Full width                   | Should work in ResizableContainer  |
| `NoteCard`       | With/without sourceURL, tags | Grid display                       |
| `Lightbox`       | Click interaction            | Show clickable image               |

### HTML UI Elements

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

#### Astro Built-in Components
- `<Image>` from `astro:assets` - Optimized, responsive images
- `<Picture>` from `astro:assets` - Art direction with multiple formats

#### Code Blocks (astro-expressive-code)
- `<pre>` / `<code>` - Code blocks
- 
Demonstrate all expressive-code features beyond basic syntax highlighting:
- `title="filename.js"` - File name/title in frame header
- `{3,5-7}` - Marked/highlighted lines (neutral)
- `ins={2-3}` - Inserted lines (green, for showing additions)
- `del={4}` - Deleted lines (red, for showing removals)
- `diff` language - Diff syntax with `+`/`-` line prefixes
- Line numbers (automatic)
- Language indicators

#### Footnotes (Article Context)
Demonstrate footnote rendering (article-specific via LongFormProseTypography):
- Inline footnote references `[^1]`
- Footnote section at bottom
- Back-reference links


### Utility Classes

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
