# Exploring Full Text Justification (2026 research)

**Status:** Research / exploration only. No implementation decided.
**Date:** 2026-06-19
**Question:** Should we fully justify paragraph text on danny.is — probably on narrow
viewports, possibly elsewhere — and if so, how do we do it _well_ (avoiding ugly
rivers) without breaking semantic HTML, copy/paste, or the fluid type system?

---

## TL;DR / Recommendation

**Don't reach for `text-align: justify` on narrow viewports — that's the single
worst case for it.** Justification quality is a function of how many words fit on a
line, and narrow columns have the fewest. Every authority consulted (Butterick,
Rutter, Bringhurst-via-Rutter, Smashing, Cloud Four, plus WCAG/accessibility orgs)
defaults to left-aligned ragged-right, and treats justification as a deliberate,
tested, wide-measure-only choice that is **invalid without hyphenation**.

There is no build-time trick that gives us TeX-quality justification on a fluid
`clamp()` layout: the good algorithm (Knuth–Plass) _requires a known fixed line
width_, which we don't have, and the one build-time workaround in the wild breaks
copy/paste and screen readers — violating our constraints.

**If we still want to experiment**, the only defensible version is:

1. **Wide measures only**, gated behind a container query (`≥ ~30em` / ~40+ chars
   per line), i.e. the _opposite_ of "narrow viewports only".
2. **Always paired with `hyphens: auto`** (we already enable this on article
   paragraphs at narrow widths).
3. **As a pure-CSS progressive enhancement**, scoped to `> p` only, behind
   `@supports`, so non-supporting/edge cases fall back to our current
   `text-wrap: pretty` ragged-right.
4. **Probably as an opt-in**, not a global default — e.g. a frontmatter flag or a
   body class, so we can try it on specific pieces rather than every page.

My honest read: the most _on-brand_ "cool typography" win here is **not**
justification at all, but doubling down on **ragged-right microtypography** we can
already do well — `text-wrap: pretty`, hanging punctuation (Safari), tuned
hyphenation — and treating justification as an occasional expressive flourish on
wide blocks. See "Recommendations" at the end.

---

## 1. What we do today (codebase audit)

Searched for everything rag-related (`hyphen`, `text-align`, `text-wrap`,
`justify`, `widows`, `orphans`, `text-rendering`). Findings:

| Context | File | Font | Rag-relevant CSS |
|---|---|---|---|
| Global default | `src/styles/_reset.css` | — | `text-wrap: pretty` on `:where(p, blockquote)`; `text-wrap: balance` on headings/`figcaption`/`legend`; `overflow-wrap: break-word` on `p` + headings; `hyphenate-character: '‐'`, `hyphenate-limit-chars: auto 2 3` (set up, but `hyphens` itself is **not** turned on here); `orphans/widows: 2` (print) |
| Articles | `src/components/layout/LongFormProseTypography.astro` (`.longform-prose`) | serif (Literata) | **`@media (max-width: 42em)`: `.longform-prose > p` → `hyphens: auto` + `text-wrap: auto`** — the only place hyphenation is actively enabled. Note it _trades away_ `pretty` for `auto` at narrow widths. |
| Notes | `src/components/layout/NoteCard.astro` (`.note-content`) | UI sans (Figtree) | nothing rag-specific |
| MDX/Astro pages | `src/layouts/Page.astro`, `BasicPage.astro` (`.content`) | UI sans | nothing rag-specific |
| Intro paragraph | `src/components/mdx/IntroParagraph.astro` | inherits serif | `hyphens: none` on `::first-line` only (drop-cap line) |

**Summary:** Everything is left-aligned. `text-wrap: pretty` does browser-level rag
smoothing globally. The _only_ active hyphenation is on **article** paragraphs at
**≤42em**. Nothing is justified anywhere. There's no historical justification code —
the only mentions of "rag"/justification in the repo are inside old _article content_
(2014 Redcarpet post, 2020 redesign series), not the live styles.

So the foundation for "justify-with-hyphenation" already half-exists for articles;
notes and pages have no hyphenation at all.

---

## 2. Why naive `text-align: justify` is bad — and worst exactly where you want it

The core finding, and it's well-evidenced: **justification quality scales with the
number of words per line.** Full justification works by stretching/shrinking the
spaces between words to force a flush right edge. Fewer words = fewer gaps to absorb
the slack = each gap stretches more = bigger, uneven gaps and **rivers** (vertical
streaks of white where wide gaps coincidentally line up across rows).

- Narrow/mobile columns have the fewest words per line, so they are the **worst**
  case, not a safe one. Cloud Four's hands-on cross-browser test: justified text
  looked "better than expected" at medium/large widths but "deteriorated
  significantly" at narrow widths (Chrome → large gaps; Safari/Firefox →
  over-aggressive word splitting). They recommend gating justification behind
  `@container (inline-size >= 30em)`.
  <https://cloudfour.com/thinks/justified-text-better-than-expected/>
- **Minimum measure** for acceptable justified English text is widely cited as
  **~40 characters per line** (practitioner heuristic — repeated everywhere but not
  traceable to one peer-reviewed study, so flag it as such). Bringhurst's canonical
  measure range is **45–75 characters, 66 ideal** for a single column.
  <http://webtypography.net/2.1.2> (Rutter's Bringhurst-applied-to-web)
- Our measure is `--measure-standard: 70ch` — comfortably in Bringhurst's range _at
  full width_, but on a phone the column is far narrower than 70ch, which is squarely
  in the danger zone.
- **Accessibility:** WCAG 2.x SC 1.4.8 (AAA) explicitly says don't fully justify
  body text; the inconsistent spacing causes eye "jumps" and is worse for low-vision
  (magnified) and dyslexic readers. RNIB/BOIA both advise against it.
  <https://www.boia.org/blog/why-justified-or-centered-text-is-bad-for-accessibility>

**Conclusion for this site:** "justify on narrow viewports" is precisely the
combination the evidence says to avoid. If we justify at all, it should be **wide
measures only**.

---

## 3. What pure CSS can do in 2026 (and what it can't)

Browser-support facts verified against MDN / caniuse / web-platform-dx signals
(mid-2026). "Baseline" = works across all major engines.

### The reliable, cross-browser core
- **`text-align: justify` + `hyphens: auto`** — universally supported. Hyphenation
  is the single biggest quality lever: it lets long words break so a line can fit
  "two-and-a-half well-spaced words" instead of "two words + a huge gap." **Every**
  typographer treats it as mandatory with justify. Requires a `lang` attribute to
  work (we have `<html lang="en">` ✓).

### Useful enhancements (NOT Baseline — progressive only)
- **`hyphenate-limit-chars`** — tunes hyphenation (`min-word-len before after`) to
  avoid ugly tiny fragments; e.g. `hyphenate-limit-chars: 7` discourages
  over-hyphenation. **Chromium 109+ only**; Firefox/Safari ignore it (Safari uses
  legacy `-webkit-hyphenate-limit-*`). We already set `auto 2 3` in the reset.
- **`text-wrap: pretty`** — improves line breaking. **But it does NOT make justified
  text good**, and can make it _worse_:
  - **Chrome** (117+): only adjusts the **last ~4 lines** (orphan/short-last-line
    prevention) — it is _not_ a full-paragraph optimizer. It does "appropriately
    adjust for justification" per Chrome docs, but the win is on ragged-right.
  - **Safari 26** (2025): whole-paragraph version (better rag, less hyphenation) —
    but combining it with `text-align: justify` produces **blown-out inter-word
    spacing** (matklad, Feb 2026): pretty deliberately targets a slightly-narrow
    width, then justify stretches each line to full width, amplifying the gap. No
    clean workaround. <https://matklad.github.io/2026/02/14/justifying-text-wrap-pretty.html>
  - **Firefox**: not shipped as of mid-2026 (safe fallback to normal wrap).
  - **Takeaway:** `pretty` + `justify` together is risky; test both engines, or
    keep `pretty` for ragged-right and don't combine.
- **`text-justify`** (`inter-word` etc.) — historically Firefox-only; **now Chrome/
  Edge 145+ (Feb 2026) too**, but **still no Safari**. Not Baseline → don't rely on it.
- **`hanging-punctuation`** — genuine optical-margin nicety (hangs quotes/hyphens
  into the margin). **Still Safari-only** (Chrome/Firefox: none). Safe as an
  enhancement; we don't use it yet and could.
- **`text-spacing-trim` / `text-autospace`** — CJK-focused, experimental, irrelevant
  to our English content.

### What CSS fundamentally cannot do
Browsers use a **greedy first-fit** line breaker. Once a line is packed, a bad early
break can't be undone. That's why CSS justification can't match print: it can't see
the whole paragraph. `text-wrap: pretty` is the closest thing, and it's either
last-4-lines (Chrome) or not justify-friendly (Safari).

---

## 4. The "cool build-time thing" idea — and why it doesn't fit us

The right algorithm is **Knuth–Plass total-fit** (the TeX algorithm): it models the
paragraph as boxes/glue/penalties and globally minimizes raggedness across the whole
paragraph, unifying justification + hyphenation in one pass. This is what makes
LaTeX paragraphs look beautiful and river-free.

JS/web implementations exist:
- **`tex-linebreak`** (Robert Knight) — the most-referenced; `justifyContent()`
  manipulates the DOM to set per-line spacing. Needs a measurement callback (Canvas
  `measureText`).
- **`typeset`** (Bram Stein) — original port; outputs via `word-spacing` / absolute
  positioning; effectively unmaintained; WebKit sub-pixel `word-spacing` issues.
- **`tex-linebreak2`** (egilll), **`knuth-plass-wrap`** (currentspace, v2.0.0 May
  2026, measures via HarfBuzz-WASM for sub-pixel accuracy) — both still **runtime**,
  both re-run on resize.

**The fatal problem for us — three independent blockers:**

1. **Knuth–Plass needs a known, fixed line width.** Our measure is fluid
   (`clamp()` / `min(70ch, …)`), so the final rendered width is unknown until the
   browser lays out at the user's viewport. A build step literally cannot know where
   the lines will fall. This is the core, unsolved tension (the "Web We Want" entry
   #74 names it explicitly). <https://webwewant.fyi/wants/74/>

2. **The only build-time workaround quantizes width and breaks our constraints.**
   Matthew Petroff's "Pre-calculated Line Breaks" (2020) precomputes breaks at
   discrete widths (e.g. 250–500px in 50px steps), wraps every potential break in
   `<span>`s, and reveals the right set via media queries. It explicitly **"only
   works for discrete, pre-calculated widths, not fluid layouts"** and requires
   `user-select: none` + `aria-hidden="true"` — i.e. it **breaks copy/paste and
   screen-reader accessibility**, the exact things you asked to preserve.
   <https://mpetroff.net/2020/05/pre-calculated-line-breaks-for-html-css/>

3. **The alternative (runtime JS that recomputes on resize) violates our
   zero-JS-by-default principle** and re-flows on every resize.

So: there is **no** way to get build-time Knuth–Plass justification that
simultaneously (a) works with our fluid `clamp()` measure, (b) keeps semantic HTML +
copy/paste intact, and (c) stays zero-runtime-JS. Any one of those can be had by
sacrificing another, but not all three. This idea is a dead end _for our
constraints_ — worth knowing definitively rather than re-discovering later.

> Note: Chrome's `text-wrap: pretty` _is_ "Knuth–Plass-inspired" (score-based, per
> the Chromium Intent to Ship / Ishii design doc), but capped to the last ~4 lines
> for performance. So the browser already gives us a sliver of KP for free on
> ragged-right — just not for justification, and not whole-paragraph.

---

## 5. Expert consensus (whether to justify on the web at all)

- **Butterick (Practical Typography):** "If you're using justified text, you must
  also turn on hyphenation." But the browser engine "is rudimentary compared to a
  professional page-layout program… I'll always left-align." Justification is "a
  matter of personal preference… not a signifier of professional typography."
  <https://practicaltypography.com/justified-text.html>
- **Rutter (Web Typography):** justified web text "generally looks terrible…
  'rivers' of white are introduced"; hyphenation "helps alleviate" rivers (justify)
  _and_ raggedness (left-align). <https://clagnut.com/blog/2394>
- **Smashing — The Perfect Paragraph:** the problem is word spacing; don't justify
  without hyphenation. <https://www.smashingmagazine.com/2011/11/the-perfect-paragraph/>
- **Cloud Four (most current):** left-aligned stays the default; justify only for
  "finite, justified blocks of expressive typography," `≥30em`, behind
  `@supports (text-wrap: pretty) and (hyphenate-limit-chars: 7)`, tested.
- **Minority pro view (Heyman):** "stop saying never" — research doesn't damn
  _properly hyphenated_ justified text. Still: conditional on hyphenation.

Unanimous shape: **left-align by default; justify only wide + hyphenated + tested;
never as a careless global.**

---

## 6. Microtypography we _could_ adopt regardless of justification

These improve text whether or not we ever justify, and several fit our
"typography-first creative playground" identity better than justification does:

- **Keep `text-wrap: pretty` for ragged-right** (already global). It's the single
  best automatic rag improver and it's safe.
- **`hanging-punctuation: first allow-end last`** — we _already_ set this on `html`
  in `_typography.css`! It's Safari-only but a free optical-margin win. Nothing more
  to do, but worth knowing it's there.
- **Tune hyphenation** — extend the article-only hyphenation pattern to notes/pages
  if we want consistency, and consider `hyphenate-limit-chars` values that avoid
  two-letter fragments (Chromium).
- **Reconsider the ≤42em rule** — currently article narrow paragraphs _drop_
  `text-wrap: pretty` in favour of `text-wrap: auto` + hyphens. With Safari's
  whole-paragraph `pretty` now shipping, `hyphens: auto` + `text-wrap: pretty`
  together (ragged-right) may now beat the old `auto` fallback. Worth A/B-ing.

---

## 7. Concrete options, prioritised

### Option A — Do nothing to alignment; polish ragged-right (recommended)
Keep left-alignment everywhere. Optionally: revisit the narrow-viewport article rule
to keep `text-wrap: pretty` alongside `hyphens: auto` now that engines improved.
Lowest risk, on-brand, accessible. **This is my recommendation as the baseline.**

### Option B — Justify wide blocks only, pure CSS, opt-in (the "experiment")
If you want to actually try justification as an expressive flourish:

```css
/* Scope to a flag so it's opt-in per piece, not global */
.justify-prose > p {
  /* Only kick in where there's enough measure for it to look OK */
}
@container (inline-size >= 34em) {
  @supports (hyphens: auto) {
    .justify-prose > p {
      text-align: justify;
      hyphens: auto;                 /* mandatory */
      hyphenate-limit-chars: 7 3 3;  /* Chromium-only nicety */
      /* Do NOT also set text-wrap: pretty here — see Safari gap bug */
    }
  }
}
```
- Needs the prose container to be a container-query context (`container-type:
  inline-size`). The `.cq` class already on `.longform-prose`/`.note` suggests we
  have container-query plumbing — verify what `.cq` sets.
- Expose via a frontmatter flag (e.g. `justify: true`) → body/wrapper class, or an
  MDX wrapper component `<Justified>…</Justified>` for one-off blocks.
- **Explicitly the opposite of "narrow viewports only"** — gated to wide measures.
- Test Chrome + Safari + Firefox; verify copy/paste (unaffected — pure CSS) and that
  dark/light both look fine.

### Option C — Build-time Knuth–Plass — NOT recommended
Documented above. Incompatible with fluid measure + copy/paste + zero-JS
simultaneously. Skip unless we abandon fluid measures for justified blocks (e.g. a
fixed-width "fine print" component), which isn't worth it.

---

## 8. Open questions for Danny

1. Is the goal **readability** (then: don't justify, especially not narrow) or
   **expressive/visual "cool factor"** (then: Option B on wide blocks, opt-in)?
2. Where would justification actually appear — all article body copy, or specific
   showcase pieces / a styleguide demo?
3. Appetite for it being **opt-in per piece** vs a global default? (Strongly suggest
   opt-in given the constraints.)

---

## Sources

- Cloud Four — Justified Text: Better Than Expected? <https://cloudfour.com/thinks/justified-text-better-than-expected/>
- Butterick — Practical Typography: Justified text <https://practicaltypography.com/justified-text.html>
- Rutter — Web Typography (Bringhurst applied) <http://webtypography.net/2.1.2>, <https://clagnut.com/blog/2394>
- Smashing — The Perfect Paragraph <https://www.smashingmagazine.com/2011/11/the-perfect-paragraph/>
- BOIA — Justified/centered text & accessibility <https://www.boia.org/blog/why-justified-or-centered-text-is-bad-for-accessibility>
- Heyman — Stop saying never justify <https://heyman.info/2023/fill-justified-text-on-the-web>
- matklad — Justifying text-wrap: pretty (Feb 2026) <https://matklad.github.io/2026/02/14/justifying-text-wrap-pretty.html>
- Chrome for Developers — text-wrap: pretty <https://developer.chrome.com/blog/css-text-wrap-pretty>
- WebKit — Better typography with text-wrap: pretty <https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/>
- MDN — text-justify <https://developer.mozilla.org/en-US/docs/Web/CSS/text-justify>, hyphenate-limit-chars, text-wrap-style, hanging-punctuation
- caniuse — css-hanging-punctuation, text-wrap pretty
- Petroff — Pre-calculated line breaks for HTML/CSS <https://mpetroff.net/2020/05/pre-calculated-line-breaks-for-html-css/>
- tex-linebreak <https://github.com/robertknight/tex-linebreak>; typeset <https://github.com/bramstein/typeset>; knuth-plass-wrap <https://github.com/currentspace/knuth-plass-wrap>
- Wikipedia — Knuth–Plass line-breaking; Rivers (typography); hz-program
- The Web We Want — #74 better justification <https://webwewant.fyi/wants/74/>
</content>
</invoke>
