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
**Current:** League Spartan

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

**CSS Variable:** None, but should be the site default (currently Literata via `--font-prose`).
**Current:** Literata

### 4. UI (Interface Elements)

The default for "interface elements" like buttons, HTML form elements, pills, UI labels, navigation etc. 

**Requirements:**
- Clean & readable at both small sizes, still looks nice at larger sizes.
- Designed for interface elements on screens
- Sans-serif

**CSS Variable:** `--font-ui`
**Current:** League Spartan

### 5. Code

Monospace font used for code examples etc. Also used occasionally as a stylistic choice in other contextes.

**Requirements:**
- Monospace, designed specifically for code.
- Works okay alongside whatever typefaces we use for (2) and (3).

**CSS Variable:** `--font-code`
**Current:** Fira code

## Current Font Setup

| Usage        | Variable         | Font           |
| ------------ | ---------------- | -------------- |
| 1. Display   | `--font-display` | League Spartan |
| 2. LongForm  | `--font-prose`   | Literata       |
| 3. ShortForm | `--font-prose`   | Literata       |
| 4. UI        | `--font-ui`      | League Spartan |
| 5. Code      | `--font-code`    | Fira Code      |

**Notes:**

- `--font-ui` and `--font-display` currently share the same font stack. They are separated to allow independent experimentation with display typefaces.

## Problems with Current Setup

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

# Implementation/Experimentation Plan

## Running Task Lists

All test fonts are loaded via CDN in `src/styles/_foundation.css`. Uncomment the relevant `--font-ui` and `--font-display` lines to test each option.

### Phase 1 - Test Unified Sans Hypothesis

Can Bricolage Grotesque work for BOTH display AND UI/short-form via its optical size axis?

- [ ] Uncomment TEST 1 in `_foundation.css` (both `--font-ui` and `--font-display` lines)
- [ ] Check display contexts:
  - [ ] Homepage "DANNY SMITH" at massive scale
  - [ ] "WRITING" / "NOTES" page headers
  - [ ] 404 page
- [ ] Check UI contexts:
  - [ ] Nav drawer links
  - [ ] Footer
  - [ ] Pills / tags
- [ ] Check short-form prose:
  - [ ] /now page content
  - [ ] Note cards on /notes
- [ ] Check Literata pairing:
  - [ ] Callouts within articles
  - [ ] Captions next to prose
- [ ] **Decision:** Is lack of italic acceptable for short-form prose?
- [ ] **Verdict:** Does Bricolage work as unified sans? YES / NO

### Phase 2A - If Unified Works

- [ ] Bricolage Grotesque confirmed for both `--font-display` and `--font-ui`
- [ ] Skip to Phase 3

### Phase 2B - If Unified Doesn't Work, Split the Problem

**UI/Short-form candidates** (test in order):

- [ ] TEST 2: Inter - the proven, safe Literata pairing
  - [ ] Check /now page, note cards, nav, footer
  - [ ] Check pairing with Literata in callouts/captions
  - [ ] Verdict: ___
- [ ] TEST 3: Figtree - warmer, friendlier alternative
  - [ ] Same checks as Inter
  - [ ] Verdict: ___
- [ ] **UI Font Decision:** ___

**Display candidates** (test in order):

- [ ] TEST 4: Satoshi - leading candidate, clean geometric
  - [ ] Check homepage, page headers, 404
  - [ ] Verdict: ___
- [ ] TEST 5: Familjen Grotesk - ink traps add craft (watch the N)
  - [ ] Same checks
  - [ ] Verdict: ___
- [ ] TEST 6: Instrument Sans - subtle playfulness
  - [ ] Same checks
  - [ ] Verdict: ___
- [ ] TEST 7: Geist - angular terminals (no italic)
  - [ ] Same checks
  - [ ] Verdict: ___
- [ ] **Display Font Decision:** ___

### Phase 3 - Finalise

- [ ] Download and self-host chosen font(s) as woff2
- [ ] Remove CDN test fonts from `_foundation.css`
- [ ] Update `docs/developer/fonts.md` with new font documentation
- [ ] Run `bun run check:all`
- [ ] Test both light and dark themes
- [ ] Move this task to tasks-done/ 

## Research & Testing Notes

Fonts to test side-by-side before making final decisions.

### UI + Shortform Prose?

Test these for navigation, footer, buttons, tables, short-form content (notes, Now page):

| Font                    | Source        | Notes                                                                                                                                                                                |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Inter**               | rsms.me/inter | Proven Literata pairing, excellent for screens. Use variable version from rsms.me (not Google Fonts) for full OpenType features. Tabular figures excellent for tables.               |
| **Figtree**             | Google Fonts  | Friendly while still being an interface font. Independent designer (Erik Kennedy). Less common than Inter.                                                                           |
| **Bricolage Grotesque** | Google Fonts  | Test at small optical sizes (12-14pt range). The optical size axis adapts the design for legibility at small sizes. Could potentially serve as unified sans for both display AND UI. |

**Unified approach to test:** Bricolage Grotesque's optical size axis (12-96pt) means it adapts its design for different sizes. Worth testing whether one font can serve both display and UI/short-form roles - would reduce font count and create visual cohesion.

### Display (Large, Bold, Presentational)

Test these at massive scale (homepage "DANNY SMITH", page headers like "WRITING"):

| Font                    | Source       | Notes                                                                                                                                                                                                                                           |
| ----------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **League Spartan**      | Current      | Include for comparison. Known issues: sharp corners lack visual interest at large sizes.                                                                                                                                                        |
| **Satoshi**             | Fontshare    | Current leading candidate. Cleaner than League Spartan, more geometric. May be slightly too "even" - looking for a touch more refinement/interest.                                                                                              |
| **Bricolage Grotesque** | Google Fonts | 3 axes: weight (200-800), width (75-100), optical size (12-96pt). At large optical sizes, ink traps become decorative/stylistic. Softened corners avoid League Spartan's harsh angularity. French/British grotesque heritage. Strong candidate. |
| **Familjen Grotesk**    | Google Fonts | Subtle ink traps add craft at display scale. Include for comparison despite uppercase N looking odd at large sizes.                                                                                                                             |
| **Instrument Sans**     | Google Fonts | "Balances precision with subtle playfulness." Satoshi may perform better but worth comparing.                                                                                                                                                   |
| **Geist Sans**          | Vercel       | Angular terminals add craft at scale. Has companion Geist Mono.                                                                                                                                                                                 |

**Display font direction:** Looking for something like Satoshi but a tiny bit less "even" - subtle refinement rather than extreme ink traps. Geometric/humanist enough to feel modern. Should look like it was designed for billboard-scale typography.

### Code

| Font          | Source      | Notes                                                                                                               |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **Fira Code** | Current     | Functional, keep for comparison.                                                                                    |
| **Monaspace** | GitHub Next | Flexible family with multiple variants (Neon, Argon, Xenon, Radon, Krypton). Could work in places beyond just code. |


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


## Research Notes

### Literata Pairing Findings

Both Satoshi + Literata and Figtree + Literata should work well (high compatibility based on typographic principles). No documented examples in the wild, but:
- Satoshi + Literata → more modernist/editorial feel
- Figtree + Literata → more friendly/approachable feel

Literata's documented pairings include Inter, Work Sans, DM Sans, Alegreya Sans - all humanist or geometric sans-serifs.

### Display Font Direction

Interest at large sizes comes from: ink traps, subtle stroke contrast, optical refinements. Distinctive letterforms are less important.

NOT looking for extreme ink traps - want subtle refinement. Satoshi may actually be close to ideal; if printed on paper at billboard scale it might look exactly right. The "life" in printed type comes from physical imperfection (ink bleed, micro-variations) - digital vectors lack this. Can't be fully solved by typeface selection, but fonts with subtle humanist qualities or optical corrections get closer.

### Bricolage Grotesque Deep Dive

Emerged as strong candidate after further research. Key insight: the optical size axis (12-96pt) transforms the font's character:
- At large optical sizes: ink traps become decorative/stylistic features
- At small optical sizes: adapts for legibility with more pronounced traps
- Softened corners throughout avoid League Spartan's harsh angularity
- 3-axis flexibility (weight, width, optical size) enables "doing layout with words"

French influences (Antique Olive's relaxed confidence) + British grotesque heritage. Could potentially serve as unified sans for both display AND UI - worth testing this approach.

Pairing with Literata: geometric/transitional combination leverages difference productively. Both share intellectual rigour without feeling cold.

### Ruled Out

| Font                   | Reason                                   |
| ---------------------- | ---------------------------------------- |
| Big Shoulders Display  | Too condensed                            |
| Clash Display          | Not the right feel                       |
| Trap*                  | Over-the-top ink traps                   |
| Work Sans              | Feels too "Google"                       |
| Plus Jakarta Sans      | Not ideal for either UI or display       |
| Mona Sans / Hubot Sans | Feels very "GitHub" at display sizes     |
| Whyte Inktrap          | Paid/premium - noting for reference only |

---
