# Typography Font Selection

## Overview

Review and potentially replace the typefaces used across the site. The goal is to find fonts that work better together as a cohesive system while serving their distinct purposes more effectively.

## Current Font Setup

| Variable | Font | Current Usage |
|----------|------|---------------|
| `--font-prose` | Literata | Body copy, headings, default for non-UI |
| `--font-ui` | League Spartan | Navigation, footer, UI elements, display headings |
| `--font-code` | Fira Code | Code blocks, inline code, some stylistic uses |

---

## Testing Shortlist

Fonts to test side-by-side before making final decisions.

### Long-form Prose

**Decision: Keep Literata** - Works excellently for dense paragraphs and sustained reading. No change needed.

### UI + Sans Body Copy

Test these for navigation, footer, buttons, tables, short-form content (notes, Now page):

| Font | Source | Notes |
|------|--------|-------|
| **Inter** | rsms.me/inter | Proven Literata pairing, excellent for screens. Use variable version from rsms.me (not Google Fonts) for full OpenType features. Ubiquitous but that's not a concern. |
| **Figtree** | Google Fonts | Friendly while still being an interface font. Independent designer (Erik Kennedy). Less common than Inter. |

### Display (Large, Bold, Presentational)

Test these at massive scale (homepage "DANNY SMITH", page headers like "WRITING"):

| Font | Source | Notes |
|------|--------|-------|
| **League Spartan** | Current | Include for comparison. Known issues: sharp corners lack visual interest at large sizes. |
| **Satoshi** | Fontshare | Current leading candidate. Cleaner than League Spartan, more geometric. May be slightly too "even" - looking for a touch more refinement/interest. |
| **Bricolage Grotesque** | Google Fonts | Has weight, width, AND optical size axes. French/British grotesque heritage. Worth reconsidering - axes provide flexibility. |
| **Familjen Grotesk** | Google Fonts | Subtle ink traps add craft at display scale. Include for comparison despite uppercase N looking odd at large sizes. |
| **Instrument Sans** | Google Fonts | "Balances precision with subtle playfulness." Satoshi may perform better but worth comparing. |
| **Geist Sans** | Vercel | Angular terminals add craft at scale. Has companion Geist Mono. |

**Display font direction:** Looking for something like Satoshi but a tiny bit less "even" - subtle refinement rather than extreme ink traps. Geometric/humanist enough to feel modern. Should look like it was designed for billboard-scale typography.

### Code

| Font | Source | Notes |
|------|--------|-------|
| **Fira Code** | Current | Functional, keep for comparison. |
| **Monaspace** | GitHub Next | Flexible family with multiple variants (Neon, Argon, Xenon, Radon, Krypton). Could work in places beyond just code. |

---

## Usage Contexts

### 1. Display (Large, Bold, Presentational)

**Where:** Page headers, 404 page, large headings, hero text

**Requirements:**
- Works beautifully at very large sizes - the "big text aesthetic"
- Bold, in-your-face presence
- Bauhaus/constructivist/modernist feel but with contemporary refinement
- Should also work at thinner weights
- Ideally: rich OpenType features and variable axes

### 2. UI (Interface Elements)

**Where:** Navigation, footer, buttons, form controls, UI labels

**Requirements:**
- Clean, readable at small sizes
- Works well for interface elements
- Sans-serif

### 3. Long-form Prose

**Where:** Articles with dense paragraphs

**Requirements:**
- Excellent readability in long blocks of text
- Works well for sustained reading

**Decision:** Literata works well - keeping it.

### 4. Short-form Content

**Where:** Notes, Now page, bullet lists, tables, shorter paragraphs

**Requirements:**
- Looks good in shorter, varied content
- Works well in tables and lists
- Less formal than Literata

**Note:** The UI font (Inter or Figtree) will likely serve this purpose too.

### 5. Code

**Where:** Code blocks, inline code

**Requirements:**
- Monospace, clear character differentiation

---

## Problems with Current Setup

### League Spartan Issues

1. Too geometric for buttons/form elements - doesn't look modern or refined
2. Glyphs aren't beautiful at very large sizes - sharp corners lack visual interest
3. Limited variable font settings
4. Chosen partly for Gill Sans similarity (London connection) but not condensed enough for ideal display impact

### Literata Issues

1. Not ideal for tables
2. Too bookish for short-form content (notes, Now page)

**Note:** Literata works acceptably for article headings - not a priority to change.

### Cohesion Issues

The three typefaces don't work together as a harmonious system.

---

## Technical Requirements

- **Licensing:** Free or inexpensive, no subscriptions
- **Format:** Variable font preferred (especially for UI)
- **Features:** Rich OpenType features where possible
- **Hosting:** Will self-host - any open source font works regardless of source

---

## Design Direction

- Bauhaus/constructivist/modernist influences with contemporary refinement
- Type-driven design where text is a visual element
- Bold personal expression
- "Big text aesthetic" - large type that's beautiful and interesting
- More fun and modern than strict historical geometric forms

---

## Visual Context

### Homepage
"DANNY SMITH" at massive scale across full viewport. This is where the display font needs to shine.

### Writing/Notes Index Pages
Large display heading ("WRITING") plus article/note titles below.

### Now Page
Short bullet list content. Demonstrates the Literata problem - too bookish for casual content.

### Article Page
Large Literata heading, drop cap, dense body text. Sidebar TOC in League Spartan small caps. Literata works well here for body; sidebar feels disconnected.

---

## Key Pages for Evaluation

- Homepage (display at massive scale)
- 404 page (display usage)
- Writing/Notes index pages (display + list items)
- Now page (short-form content)
- Any article (long-form + headings + sidebar)
- Footer (UI at small scale)

---

## Research Notes

### Literata Pairing Findings

Both Satoshi + Literata and Figtree + Literata should work well (high compatibility based on typographic principles). No documented examples in the wild, but:
- Satoshi + Literata → more modernist/editorial feel
- Figtree + Literata → more friendly/approachable feel

Literata's documented pairings include Inter, Work Sans, DM Sans, Alegreya Sans - all humanist or geometric sans-serifs.

### Display Font Direction

Interest at large sizes comes from: ink traps, subtle stroke contrast, optical refinements. Distinctive letterforms are less important.

NOT looking for extreme ink traps - want subtle refinement. Satoshi may actually be close to ideal; if printed on paper at billboard scale it might look exactly right.

### Ruled Out

| Font | Reason |
|------|--------|
| Big Shoulders Display | Too condensed |
| Clash Display | Not the right feel |
| Trap* | Over-the-top ink traps |
| Work Sans | Feels too "Google" |
| Plus Jakarta Sans | Not ideal for either UI or display |
| Mona Sans / Hubot Sans | Feels very "GitHub" at display sizes |
| Whyte Inktrap | Paid/premium - noting for reference only |

---

## Out of Scope

- Technical implementation (CSS, font loading, etc.)
- This is purely about typeface selection
