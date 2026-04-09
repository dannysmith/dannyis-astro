# Typography Font Selection

## Overview

Review and potentially replace the typefaces used across the site. The goal is to find fonts that work better together as a cohesive system while serving their distinct purposes more effectively.

## Usage Contexts

I basically have five different usage contexts. 

### 1. Display

Large, Bold, Presentational. Used for page headers, 404 page, large headings, hero text etc. Type-driven design where text is a visual element, bold personal expression, more fun and modern than strict historical geometric forms (in a subtle way).

**Requirements:**
- Works beautifully at very large sizes - the "big text aesthetic"
- Bold, in-your-face presence
- Bauhaus/constructivist/modernist feel but with contemporary refinement
- Should also work at thinner weights
- Ideally, has sufficient interes and/or "texture" to be interesting at large sizes.
- Ideally: rich OpenType features and variable axes, including proper small-caps.
- Will mostly be used as Caps/Small Caps

**CSS Variable:** `--font-display`
**Was:** League Spartan → **Now:** Geist

### 2. Long-form Prose

Articles with dense paragraphs and other "book-like" content, including the typography within them (things like headings, tables (within prose), blockquotes, small-caps etc).

**Requirements:**
- Excellent readability in long blocks of text and works well for sustained reading.
- The kind of face which typography nerds will appreciate and everyone else will just enjoy reading.
- Rich typographic features for "bookish" typography (eg oldstyle numbers, tabular/lining numbers for use in tables, proper small caps, nice ligatures, nice italic etc etc)

**CSS Variable:** `--font-prose`
**Current:** Literata
**Decision:** Literata works well - keeping it.

### 3. Shorter-form Prose

Anywhere we have prose, but a "bookish" feel seems inappropriate. This could be our Notes, About/Now pages etc. It could also be certain elements within long form prose like callouts, table/image captions, accordians etc.

**Requirements:**
- Less "Bookish" than Literata, probably a sans-serif
- Still works well for "prose" and has nice typographic features
- Works well ALONGSIDE Literata.

**CSS Variable:** `--font-ui` (the site body default).
**Was:** Literata → **Now:** Figtree

### 4. UI (Interface Elements)

The default for "interface elements" like buttons, HTML form elements, pills, UI labels, navigation etc. 

**Requirements:**
- Clean & readable at both small sizes, still looks nice at larger sizes.
- Designed for interface elements on screens
- Sans-serif

**CSS Variable:** `--font-ui`
**Was:** League Spartan → **Now:** Figtree

### 5. Code

Monospace font used for code examples etc. Also used occasionally as a stylistic choice in other contextes.

**Requirements:**
- Monospace, designed specifically for code.
- Works okay alongside whatever typefaces we use for (2) and (3).

**CSS Variable:** `--font-code`
**Current:** Fira code

## Current Font Setup

| Usage        | Variable         | Font     |
| ------------ | ---------------- | -------- |
| 1. Display   | `--font-display` | Geist    |
| 2. LongForm  | `--font-prose`   | Literata |
| 3. ShortForm | `--font-ui`      | Figtree  |
| 4. UI        | `--font-ui`      | Figtree  |
| 5. Code      | `--font-code`    | Fira Code |

**Notes:**

- Body default is now `--font-ui` (set in `_typography.css:11`), so short-form prose and UI share Figtree. `.longform-prose` scopes Literata to long-form articles only (set in `LongFormProseTypography.astro:17`).

## Problems with Original Setup

- While we have 5 usage contexts, I do not want 5 different faces. (3) Shortform Prose should almost certainally use the same typeface as EITHER (4) UI or (2) Longform. Currently it uses 

### 1. Display Face

League Spartan was chosen partly for Gill Sans similarity (London connection) and works fairly well for this use but is not *quite* beautiful enough at large, bold sizes...

- Glyphs aren't beautiful at very large "posterish" sizes. Sharp corners lack visual interest.
- Maximum weight isn't quite heavy enough at extremely large sizes

### 2. LongForm Prose Face

Literata works very well in this context. No issues here.

### 3. Shorter-form Prose Face

- Literata can feel a bit too "bookish" for short-form content like Notes, and a sans-serif which works well WITH Literata may look better for things like callouts, CTAs, captions etc when used inside longform prose.

- Using League Spartan doesn't work because it looks *terrible* as body copy, and almost never looks its best when not set in all-caps. It's too geometric and has a high x-height/cap-height difference. Also very limited variable font settings, no proper small caps etc. Doesn't feel modern or refined. It also doesn't work at all Alongside Literata.

### 4. UI Face

- League Spartan works well enough as a UI face when set in all-caps (eg in the Footer, Nav List, Article Lists) but it could be argued these use cases are as much "display" as they are "UI".
- League Spartan looks *terrible* as body copy in form elements, CTA Buttons, toasts, callouts etc. It only works in UI components like Pills if it's heavy and all-caps, which is verylimiting. It's too geometric and has a high x-height/cap-height difference. Also very limited variable font settings, no proper small caps etc. Doesn't feel modern or refined.

### 5. Code Face

Fira code works fine, but there may be an opportunity to switch to a face which is a) more flexible and b) is more cohesive with the rest of our font stack.

### Cohesion Issues

The current typefaces (Literata, League Spartan, Fira Code) don't work together as a harmonious system. In particular, League Spartan and Literata clash when used in close proximity.

Note: There is no need for our display face and Literata to be **expecially** cohesive, in the same way a book cover doesn't need strong typographic cohesion with the books' body face.

## Technical Requirements

- **Licensing:** Free or inexpensive, no subscriptions or recurring payments for use on a single domain/project. Ideally, am able to self-host WOFF2 files. (Any open-source font is ok here!)
- **Format:** Variable fonts strongly preferred (required for UI, Shortform and Longform use cases)
- **Modern Features:** Rich, modern OpenType features available

---

# Testing Summary & Decisions

## Outcome

- **Display (`--font-display`):** Geist (Vercel) — variable, weight 100–900
- **UI + Short-form (`--font-ui`):** Figtree (Erik Kennedy) — variable, weight 300–900
- **Long-form prose (`--font-prose`):** Literata — unchanged
- **Code (`--font-code`):** Fira Code — unchanged for now (Monaspace still worth a look later)

Both new fonts are self-hosted as variable WOFF2s in `public/fonts/`. A commented `--font-ui: 'Geist'` line remains in `_foundation.css` as a one-line toggle for experimenting with **Path B** (unified Geist for display + UI).

## What Was Tested

Tested via CDN in `_foundation.css` with TEST 1–7 toggle blocks (since removed). In order:

| Font                    | Role tested | Verdict | Why |
| ----------------------- | ----------- | ------- | --- |
| **Bricolage Grotesque** | Unified sans (display + UI) | ❌ out | Reads nicely as UI/short-form and the optical size axis is clever, but **no italic variant** is a dealbreaker for short-form prose (notes, callouts). Display feel was also lukewarm. |
| **Inter**               | UI          | ❌ out  | Very readable but felt boring. |
| **Figtree**             | UI          | ✅ chosen | More geometric and cleaner-looking than Inter. Slightly less readable but fine for the short strings UI actually uses, and has proper variable italic. Pairs well with Literata. |
| **Satoshi**             | Display     | Not reached | Geist eclipsed it before testing. |
| **Familjen Grotesk**    | Display     | Not reached | — |
| **Instrument Sans**     | Display     | Not reached | — |
| **Geist**               | Display     | ✅ chosen | Love it at large scale. Angular terminals add craft. Potentially a unified-sans candidate too. |

## Geist Italic Correction

The earlier research note ("Geist: no italic") was **wrong**. Vercel ships variable italic TTFs at `vercel/geist-font/fonts/Geist/variable/Geist-Italic[wght].ttf` — just not via Fontsource or Google Fonts CDNs. Self-hosted, it's fully usable with a variable weight axis.

This is what unlocked "Path B" (unified Geist for display + UI/short-form) as a real option. For now we've gone with Path A (Figtree + Geist split) because the contrast between the two sans adds character, but the toggle is one uncommented line away if we want to try unified Geist later.

## Open at Time of Completion

Font swap and initial size/weight tuning are done. Remaining explorations:

- **Path B (unified Geist)** — one uncommented line in `_foundation.css` away. Worth trying at some point to see if a single sans for display + UI feels more cohesive than the Geist/Figtree split.
- **Geist's stylistic sets** (`ss01`–`ss11`) and Figtree's `ss01`/`ss02` are unexplored — inspect via [wakamaifondue.com](https://wakamaifondue.com) or a glyph viewer to see if any unlock useful alternate letterforms for display contexts.
- **Tracking & weight calibration** — Section 5 from the typography review was deferred. Worth eyeballing default body tracking, `--tracking-tight` aggressiveness, and `.all-caps` letter-spacing now that Figtree has different proportions than League Spartan.
- **Geist `dlig`** (discretionary ligatures) is unused — try enabling on display contexts for decorative effect.

## Ruled Out (Historical)

| Font                   | Reason                                   |
| ---------------------- | ---------------------------------------- |
| League Spartan         | Replaced (glyphs not beautiful at large, no italic, limited features) |
| Bricolage Grotesque    | No italic                                 |
| Inter                  | Too boring                                |
| Big Shoulders Display  | Too condensed                            |
| Clash Display          | Not the right feel                       |
| Trap*                  | Over-the-top ink traps                   |
| Work Sans              | Feels too "Google"                       |
| Plus Jakarta Sans      | Not ideal for either UI or display       |
| Mona Sans / Hubot Sans | Feels very "GitHub" at display sizes     |
| Whyte Inktrap          | Paid/premium                             |

---


# Reference & Notes

## Visual Context

Important: Ask the user for screenshots if you need visual context.

## Font Variable Usage Checklist

Reference for where each font variable is used across the codebase. Use this when testing new typefaces.

### `--font-display` (Large Display Typography)

| Location                               | Element        | Context                                 |
| -------------------------------------- | -------------- | --------------------------------------- |
| `src/pages/index.astro`                | h1             | Homepage "DANNY SMITH" at massive scale |
| `src/pages/writing/index.astro`        | .title         | "WRITING" page header                   |
| `src/pages/notes/index.astro`          | .title         | "Notes" page header                     |
| `src/pages/404.astro`                  | h1             | Giant "404" text                        |
| `src/pages/404.astro`                  | h2             | "Page Not Found" label                  |
| `src/pages/now/index.astro`            | h1             | "What I'm doing now" heading            |
| `src/components/ui/PersonalLogo.astro` | .personal-logo | Brand mark in nav/footer                |

### `--font-ui` (Interface Elements)

| Location                                         | Element             | Context                           |
| ------------------------------------------------ | ------------------- | --------------------------------- |
| `src/styles/_utilities.css`                      | .ui-style           | Utility class for non-prose areas |
| `src/components/ui/Pill.astro`                   | .pill               | Small tag/label pills             |
| `src/components/mdx/Tabs.astro`                  | button              | Tab control buttons               |
| `src/components/mdx/Tabs.astro`                  | ::before            | No-JS fallback tab labels         |
| `src/components/ui/MarkdownContentActions.astro` | .flash-notification | Toast notification                |
| `src/layouts/Article.astro`                      | .draft-notice       | Draft status badge                |

**Via `.ui-style` class** (inherits `--font-ui`):
- `MainNavigation.astro` - Navigation drawer
- `Footer.astro` - Site footer
- `NoteCard.astro` - Note card headers
- `ContentCard.astro` - Content card component
- Various pages with UI sections

### `--font-prose` (Reading/Body Text)

Default font for the document body. Used in:
- Article body content
- Note body content
- Any area not explicitly set to UI or display

### `--font-code` (Code/Monospace)

| Location                                   | Element       | Context                         |
| ------------------------------------------ | ------------- | ------------------------------- |
| Code blocks                                | `<pre><code>` | Syntax-highlighted code         |
| Inline code                                | `<code>`      | Inline code snippets            |
| `src/layouts/Article.astro`                | .metadata     | Article date/reading time       |
| `src/pages/styleguide/_DesignTokens.astro` | Various       | Token display (styleguide only) |


## Principles Worth Carrying Into Tuning

- Interest at large display sizes comes from **ink traps, subtle stroke contrast, and optical refinements** — distinctive letterforms matter less.
- NOT looking for extreme ink traps anywhere — subtle refinement over showy character.
- The "life" in printed type comes from physical imperfection (ink bleed, micro-variations). Digital vectors lack this; the closest approximation is fonts with subtle humanist qualities or optical corrections.

---
