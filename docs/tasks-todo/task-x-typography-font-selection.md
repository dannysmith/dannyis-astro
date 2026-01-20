# Typography Font Selection

## Overview

Review and potentially replace the typefaces used across the site. The goal is to find fonts that work better together as a cohesive system while serving their distinct purposes more effectively.

## Current Font Setup

| Variable | Font | Current Usage |
|----------|------|---------------|
| `--font-prose` | Literata | Body copy, headings, default for non-UI |
| `--font-ui` | League Spartan | Navigation, footer, UI elements, display headings |
| `--font-code` | Fira Code | Code blocks, inline code, some stylistic uses |

## Usage Contexts

### 1. Display (Large, Bold, Presentational)

**Where:** Page headers, 404 page, large headings, hero text

**Requirements:**
- Works beautifully at very large sizes - this is the "big text aesthetic"
- Bold, in-your-face presence
- Should evoke Bauhaus/constructivist/modernist influences but with contemporary refinement
- More fun and interesting than the strict 1920s geometric letterforms
- Should also work at thinner weights
- Ideally: rich OpenType features and variable axes for "doing layout with words"

**Current:** League Spartan

### 2. UI (Interface Elements)

**Where:** Navigation, footer, buttons, form controls, UI labels

**Requirements:**
- Clean, readable at small sizes
- Works well for interface elements
- Almost certainly sans-serif
- Not needed for long-form body copy

**Current:** League Spartan

### 3. Long-form Prose

**Where:** Articles with dense paragraphs, book-like reading experiences

**Requirements:**
- Excellent readability in long blocks of text
- Works well for sustained reading
- Good typographic features for fine-tuning

**Current:** Literata (works well for this specific use case - keep it)

### 4. Short-form Content / General Purpose

**Where:** Notes, Now page, bullet lists, tables, shorter paragraphs, headings within content

**Requirements:**
- Looks good in shorter, varied content
- Works well in tables
- Handles bullet lists and mixed content gracefully
- Suitable for content that isn't dense long-form prose
- The letterforms need to work for this context (Literata's don't)

**Current:** Literata (not ideal - letterforms optimised for book-like text don't suit short paragraphs and lists)

**Note:** A good sans-serif might work better here. This could potentially be the same typeface as the UI font if it works well for both purposes.

### 5. Code

**Where:** Code blocks, inline code

**Current:** Fira Code (functional)

**Note:** Not a research priority. However, if any font families under consideration include a matching monospace variant, that's a bonus worth noting.

## Problems with Current Setup

### League Spartan Issues

1. **UI controls:** Too geometric for buttons and form elements - doesn't look modern or refined
2. **Display sizes:** Glyphs aren't beautiful at very large sizes - sharp corners lack visual interest
3. **Limited flexibility:** The version in use lacks variable font settings and refinement
4. **Not designed for display:** Works okay but isn't optimised for the big, bold, in-your-face usage

### Literata Issues

1. **Tables:** Not ideal for tabular data etc
2. **Short content:** Optimised for dense long-form text like books, not for notes with short paragraphs, lists and the like

**Note on headings:** Literata actually works acceptably for article/note titles and headings within content - this isn't a priority to change. However, if a new font pairs beautifully with Literata, using it for content headings could be considered. (Using the current League Spartan for headings within Literata body text would look awful - too much contrast.)

### Cohesion Issues

The three typefaces don't always work together as a harmonious system. They were chosen independently for their individual merits rather than as a coordinated family.

## Potential Approaches

### Option A: Three Fonts (Replace League Spartan)

Find a single sans-serif that:
- Excels at large display sizes (primary requirement)
- Can work for UI elements with appropriate settings/weights
- Possibly works for short-form prose content

Keep Literata for long-form prose only.

### Option B: Four Fonts (Separate Display and UI)

- **Display:** A refined display face specifically for large, bold usage
- **UI/Short-form:** A versatile sans-serif for interface and casual content
- **Long-form:** Keep Literata
- **Code:** Keep Fira Code (or swap later independently)

This allows each font to excel at its specific job. Open to this approach if it produces better results.

## Technical Requirements

- **Licensing:** Free or very inexpensive, no subscriptions (no Typekit etc.)
- **Format:** Variable font preferred (required for UI, Prose; optional for Display and Code)
- **Features:** Rich OpenType features and variable axes where possible
- **Web-ready:** Must work reliably on the web

## Design Direction

The overall aesthetic should evoke:
- Bauhaus / constructivist / modernist influences - but with contemporary refinement
- Type-driven design where text itself is a visual element
- Bold personal expression
- "Big text aesthetic" - large type that's beautiful and interesting, not just functional
- More fun and modern than strict historical geometric forms

Not looking for: faithful reproductions of 1920s Bauhaus letterforms. Want something that captures the spirit but feels fresh.

## Research Needed

1. Identify candidate display typefaces that capture a modern take on the Bauhaus/geometric/modernist aesthetic - prioritising beauty at very large sizes
2. Evaluate whether any display candidates can also serve UI needs (could reduce font count)
3. Consider sans-serif options for short-form content and UI - these might be the same font
4. Research which sans-serif typefaces are known to pair well with Literata
5. Assess how all candidates work together as a system

Code fonts are out of scope for this research. If a candidate font family happens to include a monospace, note it as a bonus.

## Out of Scope

- Technical implementation details (CSS, font loading, etc.)
- Code font selection (can be addressed separately later)

This is purely about typeface selection and design decisions.

## Visual Context

### Homepage (danny.is)

"DANNY SMITH" displayed at massive scale across the full viewport width in League Spartan bold. Below, navigation links in smaller League Spartan caps with red underlines. The huge text fills the screen and is the primary visual element - this is where the display font needs to shine. Currently the letterforms feel a bit stark and unrefined at this scale.

### Writing Index Page

"WRITING" as a large display heading in the upper right, same treatment as homepage. Article titles below in Literata. The display heading works reasonably but could have more visual interest.

### Now Page

Page heading "What I'm doing now" in Literata. Content is a short bullet list - just a few sentences each. Footer shows League Spartan in small caps. This page demonstrates the Literata problem clearly: the serif letterforms feel too bookish and heavy for what's essentially a quick status update. The content is casual and brief but the typography makes it feel formal.

### Article Page (Long-form)

Large Literata heading ("Moving this site to Astro"), drop cap at start of first paragraph, dense body text. Table of contents in left sidebar using League Spartan small caps. This is where Literata works well - sustained reading of multiple paragraphs. The heading is acceptable but not beautiful. The sidebar nav in League Spartan feels disconnected from the serif body text.

## Key Pages for Evaluation

When testing candidates, check these pages specifically:
- Homepage (display at massive scale)
- 404 page (display usage)
- Writing/Notes index pages (display headings + list items)
- Now page (short-form content problem case)
- Any article (long-form prose + headings + sidebar)
- Footer (UI usage at small scale)
