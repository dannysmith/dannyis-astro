# Task: Comprehensive Styleguide Rework

## Overview

Completely rework the main styleguide page (`src/pages/styleguide.astro`) into a comprehensive design system reference. The goal is to create a single canonical location that displays all components, styling, typography, and visual treatments used across the site.

## Background & Motivation

### Current Structure

The site has three styleguides with different purposes:

1. **styleguide.astro** - Plain Astro page for components and HTML elements (being reworked)
2. **Note Styleguide** - MDX content file simulating a real note, checking styling in context
3. **Article Styleguide** - MDX content file simulating a real article, checking styling in context

The note and article styleguides serve as "double-checks" that styling works in realistic content contexts. The main styleguide should be the authoritative reference for all visual treatments and components.

### Goals

1. **Single source of truth** - One place to see all components and styling for consistency review, visual simplification, and design experimentation
2. **Public-facing potential** - May be linked in footer for others to see the design system
3. **Export-friendly** - Easy to screenshot for Figma or AI tools for experimentation
4. **Quality improvement** - Enable holistic improvement of the visual design system which currently has inconsistencies

---

## Planning & Architecture Decisions

### Structure: Single Page with Partial Components

**Decision:** Single page experience visually, but split implementation into imported partial components.

**Rationale:**
- User wants single-page scrolling experience for holistic view
- Concern about code file becoming unwieldy
- Solution: Create partial components (e.g., `_ColorSystem.astro`, `_Typography.astro`) imported into main styleguide page
- Each partial is self-contained and easy to work with
- Main page stays clean as an orchestrator

**Astro Pattern:** Files in `src/pages/` prefixed with `_` are excluded from routing but can be imported. From Astro docs: "Files with the `_` prefix won't be recognized by the router and won't be placed into the `dist/` directory. This feature is useful for putting tests, utilities, and components in the same folder as their related pages."

**Alternative considered:** Multi-page with tabs/navigation
- Rejected because it defeats the "see everything at once" goal
- Can reconsider if page becomes too long to be useful

### Navigation Within Page

**Decision:** Simple sticky TOC on left margin.

- Purpose-built for styleguide, NOT reusing existing `TableOfContents` component
- Keep it dead simple - plain HTML/CSS, minimal JavaScript
- Just anchor links to major sections
- This is a dev tool, not a marketing page

### Responsive Testing Approach

**Create `ResizableContainer` component** - A draggable/resizable wrapper for testing responsive behavior.
- Location: `src/components/mdx/` (reusable in MDX articles/notes for demos)
- Shows current width
- Drag handles on right edge
- Min/max width constraints
- Graceful no-JS fallback (fixed width)

### Code Examples Approach

**Decision:** Selective, with disclosure pattern.

- **No code for simple components** - Pill, FormattedDate, Spacer, etc. don't need usage examples
- **Disclosure for complex components** - Use `<details>` so code is hidden by default but expandable
- **Focus on non-obvious usage** - Callout variants, BasicImage bleed options, etc.
- Use existing `astro-expressive-code` for syntax highlighting

This keeps the styleguide files clean while still providing value where it matters.

### Theme Display Approach

**Decision:** Dual display for token mappings only; elsewhere use theme toggle.

- **Token mapping sections:** Show BOTH light and dark variants side-by-side, regardless of current theme. This allows quick visual comparison of what `--color-coral` maps to in each theme.
- **Everything else:** Rely on the site's normal theme toggle. Components and examples render in the current theme.

**Implementation:** The CSS uses `light-dark()` function with `color-scheme: light dark`. To force a specific theme on a container, set `color-scheme: light` or `color-scheme: dark` on that element. This causes all `light-dark()` values within to resolve to the forced mode.

### Component Isolation Approach

**Decision:** Case-by-case handling.

- **Footer:** Should work fine in a container, possibly with ResizableContainer
- **MainNavigation:** May not work well outside its normal context - that's OK
- **Other layout components:** Try them in containers; if they don't work, that's a signal about component design (but not this task's problem to fix)

---

## Component Inventory

### Components to Demonstrate (37 total)

#### Layout Components (7)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `BaseHead` | N/A | Document only, don't render |
| `MainNavigation` | Open/closed states | May not work in isolation - try it |
| `Footer` | Full width | Should work in ResizableContainer |
| `NoteCard` | With/without sourceURL, tags | Grid display |
| `LongFormProseTypography` | Wrapper demo | Show effect on content |
| `TableOfContents` | With headings | Mock headings needed |
| `Lightbox` | Click interaction | Show clickable image |

#### Navigation Components (2)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `NavLink` | Active/inactive | Show both states |
| `ThemeToggle` | Light/auto/dark | Interactive |

#### UI Components (7)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `FormattedDate` | Various dates | Simple, no code needed |
| `PersonalLogo` | Default | Simple |
| `Pill` | Multiple colors | Simple |
| `SocialLinks` | Default | Simple |
| `ContentCard` | Standard/compact, article/note | Responsive, show code |
| `Spinner` | Default, custom size | Simple |
| `MarkdownContentActions` | Default | May need context |

#### MDX Content Components (14)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `Embed` | YouTube, Vimeo, Twitter, Loom, fallback | Show code |
| `Accordion` | Standard, plain, open/closed | Show code |
| `BasicImage` | Normal, framed, bleed variants, showAlt, source | Show code |
| `BlockQuoteCitation` | Author only, +title, +url, small | Show code |
| `BookmarkCard` | Various URLs | Responsive |
| `ButtonLink` | Primary, secondary, inline | Show code |
| `Callout` | All 7 types, with/without title, icon/emoji | Show code |
| `Center` | Default | Simple |
| `Grid` | Various columns/rows/gaps | Show code |
| `IntroParagraph` | Default (drop cap) | Show code |
| `Loom` | Default | Simple |
| `Notion` | Auto title, manual title | Show code |
| `Spacer` | Multiple sizes | Simple |
| `SmartLink` | Internal, external | Simple |

#### MDX Typography Components (6)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `Title1` - `Title4` | Default | Show hierarchy |
| `SmallCaps` | Default | Simple |
| `highlight` | Default | Simple |

#### Demo Components (1)
| Component | Key Variants/Configs | Notes |
|-----------|---------------------|-------|
| `DatePickerDemo` | React component | Interactive |

---

## Design Token Sections

### 1. Color System

**Display approach:** Flexoki-inspired (see screenshots in `.styleguide-screenshots/`). Use ColorSwatch component in grids and tables. Click to copy color value.

**Hue Variables:**
- `--hue-coral`, `--hue-pink`, `--hue-orange`, `--hue-purple`, `--hue-yellow`, `--hue-green`, `--hue-blue`, `--hue-grey`

**Adaptive Palette** (show BOTH light AND dark side-by-side):
- `--color-coral`, `--color-pink`, `--color-orange`, `--color-purple`, `--color-yellow`, `--color-green`, `--color-blue`

**Absolute Colors:**
- `--color-white`, `--color-black`, `--color-ink`, `--color-charcoal`, `--color-beige`

**Semantic Colors** (show BOTH light AND dark side-by-side):
- `--color-accent`, `--color-visited`, `--color-highlight`
- `--color-background`, `--color-background-secondary`, `--color-background-code`
- `--color-text`, `--color-text-secondary`
- `--color-border`, `--surface-raised`

### 2. Spacing Scale
Visual representation of all `--space-*` tokens:
- Base: `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl`
- Pairs: `3xs-2xs`, `2xs-xs`, etc.

### 3. Typography Tokens
- Font families: `--font-prose`, `--font-ui`, `--font-code`
- Font sizes: `--font-size-xs` through `--font-size-3xl`
- Line heights: `--leading-none` through `--leading-loose`
- Letter spacing: `--tracking-tight` through `--tracking-wider`
- Font weights: `--font-weight-light` through `--font-weight-bold`

### 4. Border & Radius
- Widths: `--border-width-hairline` through `--border-width-accent`
- Radii: `--radius-xs` through `--radius-full`

### 5. Motion & Shadows
- Durations: `--duration-fast`, `--duration-normal`, `--duration-slow`
- Easing: `--ease-in-out`
- Shadows: `--shadow-small`, `--shadow-medium`

---

## Typography Section

### Three Contexts to Demonstrate

For each context, show identical content so differences are apparent:

#### 1. Default (no wrapper)
Base HTML styling from `@typography` layer:
- Serif font (Literata)
- Underlined links with accent color
- Colored list markers
- Heading borders

#### 2. Long-form Prose (`<LongFormProseTypography>`)
Additional enhancements from `@longform` layer:
- Looser line height
- Old-style numerals
- Diagonal fractions
- Styled footnotes
- End mark (§)
- Enhanced link styling

#### 3. UI Style (`.ui-style`)
Opt-out for UI areas:
- Sans-serif font (League Spartan)
- No link underlines
- No heading borders
- Tighter spacing

### Content to Show in Each Context

- All heading levels (h1-h6)
- Paragraphs with inline elements that explain themselves. Must be fairly realistic content.
- Links (show hover state instruction)
- Ordered and unordered lists
- Nested lists
- Task lists (where supported)
- Blockquotes
- Horizontal rules

### Inline Elements
- `<strong>` / `<b>` - Bold
- `<em>` / `<i>` - Italic
- `<del>` / `<s>` - Strikethrough
- `<sup>` - Superscript
- `<sub>` - Subscript
- `<code>` - Inline code
- `<mark>` - Highlight
- `<kbd>` - Keyboard input
- `<abbr>` - Abbreviation
- `<small>` - Small text
- `<cite>` - Citation
- `<q>` - Inline quote
- `<dfn>` - Definition
- `<var>` - Variable
- `<samp>` - Sample output

### OpenType Features (Inline Demonstrations)

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

---

## HTML Elements Section

### Form Elements
- `<button>` - Default button styling
- `<input type="text">` - Text input
- `<input type="checkbox">` - Checkbox
- `<input type="radio">` - Radio button
- `<select>` - Dropdown
- `<textarea>` - Multi-line input

### Interactive Elements
- `<details>` / `<summary>` - Native disclosure
- `<dialog>` - Native dialog (if styled)

### Tables
- Basic table with headers
- Table with varied content

### Media Elements
- `<img>` - Basic image
- `<figure>` / `<figcaption>` - Image with caption
- `<video>` - Native video (if used)
- `<iframe>` - Embedded content

### Astro Built-in Components
- `<Image>` from `astro:assets` - Optimized, responsive images
- `<Picture>` from `astro:assets` - Art direction with multiple formats

### Semantic Elements
- `<address>` - Contact information
- `<time>` - Date/time
- `<blockquote>` - Block quotation
- `<pre>` / `<code>` - Code blocks

### Definition Lists
- `<dl>` / `<dt>` / `<dd>`

### Code Blocks (astro-expressive-code)
Demonstrate all expressive-code features beyond basic syntax highlighting:
- `title="filename.js"` - File name/title in frame header
- `{3,5-7}` - Marked/highlighted lines (neutral)
- `ins={2-3}` - Inserted lines (green, for showing additions)
- `del={4}` - Deleted lines (red, for showing removals)
- `diff` language - Diff syntax with `+`/`-` line prefixes
- Line numbers (automatic)
- Language indicators

### Mermaid Diagrams
Demonstrate mermaid diagram types (rendered via rehype-mermaid):
- Flowchart (`graph TD`)
- Sequence diagram (`sequenceDiagram`)
- Gantt chart (`gantt`)
- Class diagram (`classDiagram`)

### Footnotes (Article Context)
Demonstrate footnote rendering (article-specific via LongFormProseTypography):
- Inline footnote references `[^1]`
- Footnote section at bottom
- Back-reference links

### Task Lists
- `- [x]` Completed task
- `- [ ]` Incomplete task

---

## Utility Classes Section

Document and demonstrate:
- `.ui-style` - Opt-out of prose typography
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

---

## New Components to Create

### 1. `ColorSwatch.astro`
**Location:** `src/components/mdx/` (reusable in MDX articles/notes)
**Purpose:** Display a color swatch with optional label and click-to-copy
**Inspiration:** Flexoki color palette page (https://stephango.com/flexoki)
**Design principle:** Independent component that responds to its container. Keep it minimal and flexible - compose into grids/tables as needed. May need styleguide-specific wrapper components for certain layouts.
**Features:**
- Simple colored square/rectangle that fills/responds to container
- Optional label beneath
- Click to copy color value to clipboard
- Flexible sizing via container or optional props
**Props:**
- `color: string` - CSS color value or variable
- `name?: string` - Display label
- `variable?: string` - CSS variable name (for copy)
- `size?: 'sm' | 'md' | 'lg'` - Optional size override (default: respond to container)

### 2. `ResizableContainer.astro`
**Location:** `src/components/mdx/` (reusable in MDX articles/notes)
**Purpose:** Draggable container for responsive testing
**Features:**
- Drag handle on right edge
- Display current width
- Min/max width constraints
- Works without JavaScript (fixed width fallback)
**Props:**
- `initialWidth?: string` - Starting width
- `minWidth?: string` - Minimum resize width
- `maxWidth?: string` - Maximum resize width
- `showWidth?: boolean` - Display width indicator

### 3. Styleguide-Specific Components
**Location:** `src/components/styleguide/` (styleguide-only)

These are helpers for the styleguide that aren't useful elsewhere:

- `SpacingScale.astro` - Visual representation of spacing tokens
- `StyleguideTOC.astro` - Simple sticky navigation for sections

### 4. Styleguide Section Partials
**Location:** `src/pages/styleguide/` as `_SectionName.astro`
**Purpose:** Split content into manageable chunks

- `_ColorSystem.astro`
- `_SpacingSystem.astro`
- `_Typography.astro`
- `_HtmlElements.astro`
- `_LayoutComponents.astro`
- `_UiComponents.astro`
- `_MdxComponents.astro`
- `_Utilities.astro`

---

## File Structure

```
src/
├── components/
│   ├── mdx/
│   │   ├── ColorSwatch.astro         # Reusable in MDX
│   │   ├── ResizableContainer.astro  # Reusable in MDX
│   │   └── ... (existing MDX components)
│   └── styleguide/                   # Styleguide-specific
│       ├── SpacingScale.astro
│       ├── StyleguideTOC.astro
│       └── index.ts
├── styles/
│   └── styleguide.css                # Shared styleguide utilities (loaded only on styleguide)
├── pages/
│   └── styleguide/
│       ├── index.astro               # Main orchestrator page
│       ├── _ColorSystem.astro        # Partial - not a route
│       ├── _SpacingSystem.astro
│       ├── _Typography.astro
│       ├── _HtmlElements.astro
│       ├── _LayoutComponents.astro
│       ├── _UiComponents.astro
│       ├── _MdxComponents.astro
│       └── _Utilities.astro
```

---

## Implementation Phases

### Phase 1: Setup & Infrastructure ✅
- [x] Rename existing `src/pages/styleguide.astro` to `src/pages/styleguide-old.astro` (temporary, delete after completion)
- [x] Create `src/pages/styleguide/` directory with `index.astro` as orchestrator
- [x] Create `src/components/styleguide/` directory
- [x] Create `ColorSwatch` component in `mdx/`
- [x] Create `ResizableContainer` component in `mdx/`
- [x] Create `SpacingScale` component in `styleguide/`
- [x] Create `StyleguideTOC` component in `styleguide/`
- [x] Create basic section partial structure (empty partials)
- [x] Add barrel exports
- [x] Register new MDX components (ColorSwatch, ResizableContainer) in `src/components/mdx/index.ts`

### Phase 2: Design Tokens ✅
- [x] Implement `_ColorSystem.astro` with all color tokens
- [x] Implement `_SpacingSystem.astro` with spacing scale
- [x] Add typography tokens display
- [x] Add borders, radii, shadows, motion tokens
- [x] Create `src/styles/styleguide.css` for shared utilities

### Phase 3: Typography
- [ ] Implement `_Typography.astro`
- [ ] Three-context comparison (default, longform, ui-style)
- [ ] All inline elements
- [ ] OpenType feature demonstrations
- [ ] Lists, blockquotes, horizontal rules

### Phase 4: HTML Elements & Extended Features
- [ ] Implement `_HtmlElements.astro`
- [ ] Form elements
- [ ] Tables
- [ ] Media elements (including Astro `<Image>` and `<Picture>`)
- [ ] Semantic elements
- [ ] Code blocks with all astro-expressive-code features
- [ ] Mermaid diagrams (all types)
- [ ] Task lists
- [ ] Footnotes (in article context demonstration)

### Phase 5: Components
- [ ] Implement `_LayoutComponents.astro`
- [ ] Implement `_UiComponents.astro`
- [ ] Implement `_MdxComponents.astro`
- [ ] Code examples (selective, with disclosure)
- [ ] Responsive testing with ResizableContainer

### Phase 6: Utilities & Polish
- [ ] Implement `_Utilities.astro`
- [ ] Wire up StyleguideTOC navigation
- [ ] Test light and dark modes
- [ ] Run quality checks (`pnpm run check:all`)
- [ ] Review and refine

### Phase 7: Cleanup
- [ ] Delete `src/pages/styleguide-old.astro`
- [ ] Update any internal links pointing to old styleguide structure
- [ ] Final review of all sections

---

## Screenshots Reference

Screenshots saved in `.styleguide-screenshots/` (gitignored):
- `current-styleguide.png` - Current main styleguide
- `article-styleguide.png` - Article styleguide for comparison
- `note-styleguide.png` - Note styleguide for comparison
- `homepage.png` - Homepage for UI context

Flexoki color palette inspiration: https://stephango.com/flexoki

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Single vs multi-page | Single page with partial components for code organization |
| Partial pattern | Underscore prefix (`_Name.astro`) - confirmed Astro pattern |
| Section navigation | Simple sticky TOC, purpose-built, not reusing existing component |
| Code examples | Selective with `<details>` disclosure; skip for simple components |
| Dark mode display | Both themes for token mappings; theme toggle elsewhere |
| Component isolation | Case-by-case; Footer should work, MainNavigation might not |
| ColorSwatch location | `mdx/` for reuse in articles/notes |
| ResizableContainer location | `mdx/` for reuse in articles/notes |

---

## Out of Scope

- Reworking the Note or Article styleguides (they remain as-is for context testing)
- Adding new visual design treatments (this task is about displaying existing ones)
- Major refactoring of existing components
- Fixing components that don't work well in isolation (note it, but not this task)

---

## Session Context for Continuation

**Current Status (January 2026):**
- Phase 1 (Setup & Infrastructure) complete
- Phase 2 (Design Tokens) complete
- Ready to begin Phase 3 (Typography)

**Phase 2 Implementation Details:**

The design tokens section is fully implemented with:

1. **Color System** (`_ColorSystem.astro`):
   - Adaptive palette with side-by-side light/dark theme comparison
   - Absolute colors in grid layout
   - Semantic colors in proper `<table>` with mini swatches for both themes

2. **Spacing/Typography Tokens** (`_SpacingSystem.astro`):
   - Spacing scale with visual bars (SpacingScale component)
   - Fluid pairs explained with text + table (not redundant visualization)
   - Font families: simplified display with inline metadata (Name · Variable · Usage)
   - Font sizes: table with Preview, Variable, Typical Usage columns
   - Line heights, letter spacing, font weights: grid displays with explanatory paragraphs
   - Border widths, border radii: visual demonstrations with explanatory paragraphs
   - Motion (durations, easing) and shadows: interactive demos with explanatory paragraphs

3. **Shared Utilities** (`src/styles/styleguide.css`):
   - `.sg-label` - Small caps label pattern
   - `.sg-panel`, `.sg-panel-compact` - Contained areas with background
   - `.sg-grid` - Configurable grid for token displays
   - `.sg-subsection` - Subsection with h4 styling
   - `.sg-theme-comparison`, `.sg-theme-column` - Side-by-side theme comparison
   - `[data-theme]` utilities - Force light/dark mode on containers via `color-scheme`

**Key files for Phase 3:**
- `src/styles/global.css` - CSS layers including `@typography` and `@longform`
- `src/components/layout/LongFormProseTypography.astro` - `@longform` layer styles
- `docs/developer/fonts.md` - OpenType features (old-style numerals, ligatures, small caps)

**Typography contexts to demonstrate in Phase 3:**
1. Default - `@typography` layer (serif, underlined links, colored markers)
2. Long-form - `<LongFormProseTypography>` adds `@longform` (old-style numerals, end mark, etc.)
3. UI - `.ui-style` class (sans-serif, no underlines, tighter)

**User preferences noted:**
- Realistic, self-explanatory copy in typography demos (not lorem ipsum)
- Selective code examples (complex components only, use `<details>` disclosure)
- Simple, clean presentation without over-abstraction
- Explanatory paragraphs for each token category to explain when/why to use them
