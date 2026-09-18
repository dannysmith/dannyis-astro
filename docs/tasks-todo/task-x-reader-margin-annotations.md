# Task x: Reader margin annotations

## What it is

Let readers annotate articles in the right-hand margin, the way you'd write on a printout.

Select a phrase in an article and a small "Write in margin" button appears by the selection. Click it and a textarea opens out in the right margin. Save, and two things happen: the selected phrase picks up a wobbly hand-drawn underline, and the note appears in the margin in a handwriting face, with a tapered arrow pointing back at the phrase. Hovering a note reveals Edit and Delete.

Notes belong to the reader. They're stored in that reader's browser, they're never sent anywhere, nobody else can see them, and they survive reloads.

Three ways the same annotations render:

| Context         | Rendering                                                        |
| --------------- | ---------------------------------------------------------------- |
| Wide viewport   | Notes in the right margin, arrows pointing to their phrases      |
| Narrow viewport | Notes inline beneath the annotated block, as numbered footnotes  |
| Print           | Notes back out in the margin, with short connectors              |

**Scope: articles only** — and not articles with a `redirectURL`, which immediately bounce off-site. Notes are short enough that margin annotation makes little sense, and `Note.astro` has no gutter to speak of.

## Why

The idea is lifted from [blog.mastykarz.nl](https://blog.mastykarz.nl/your-product-didnt-get-worse/). Waldek Mastykarz's post [The red pen](https://blog.mastykarz.nl/the-red-pen/) makes the argument better than we could: a red pen solved the problem of pointing at something a long time ago. You circle a sentence, cross out a word, write "too strong" in the margin. You don't describe the coordinates of your criticism — you point and say *this*.

That's worth having on a site whose whole purpose is writing that people read closely, and it's the sort of thing this site exists to try.

## Prior art: how Waldek does it

### Provenance

Not a library and not published. His blog is an Astro site; the feature is one bespoke `Marginalia.astro` component with an inline `<script>`, compiling to ~10.9 KB minified with zero imports and no framework. None of his 208 public repos is this blog, and a GitHub code search for the invitation string returns nothing.

So everything below was reverse-engineered from the shipped bundle and stylesheet. It's a **specification to reimplement from**, not code to copy — his work carries no licence. Treat the numbers as calibrated for his typography (Source Serif 4 at a 38rem measure), not as values to inherit.

### The markup

All the chrome ships server-rendered and hidden. The script only ever adds marks and notes.

```html
<aside class="reader-margin" aria-label="Reader margin">
  <div class="marginalia-prototype" data-marginalia>
    <p class="margin-invitation">This margin is yours. Select and start annotating.</p>
    <svg class="marginalia-connectors" aria-hidden="true"></svg>
    <form class="margin-note-editor" data-margin-note-editor hidden>
      <label for="margin-note-text">Your note</label>
      <textarea id="margin-note-text" rows="3" maxlength="500"></textarea>
      <div class="margin-note-actions">
        <button type="button" data-cancel-note>Cancel</button>
        <button type="submit">Save</button>
      </div>
    </form>
  </div>
  <button class="margin-selection-action" data-margin-selection-action hidden>Write in margin</button>
</aside>
```

Three DOM hooks: `[data-article-shell]` (the grid), `[data-article-content]` (the prose container), `[data-marginalia]` (the margin container). Annotatable blocks are `p, li, blockquote, h2, h3, h4, h5, h6, pre`.

A saved note is injected as:

```html
<span class="margin-note" id="margin-note-{id}" role="note" tabindex="0"
      data-note-id="{id}" data-note-reference="{n}">
  <span class="margin-note-text">…</span>
  <span class="margin-note-controls">
    <button type="button" data-edit-note>Edit</button>
    <button type="button" data-delete-note>Delete</button>
  </span>
</span>
```

…and the annotated phrase is wrapped in `<span class="marginalia-mark" data-note-reference="{n}" aria-describedby="margin-note-{id}">`.

### The layout

Two-column grid, with the reading column as `display: contents` so header, prose and margin all place themselves into it:

```css
.article-shell  { display: grid; grid-template-columns: minmax(0, 38rem) minmax(12rem, 15rem);
                  column-gap: 2rem; max-width: 57rem; margin: 0 auto }
.reading-column { display: contents }
.reader-margin  { grid-area: 2 / 2; align-self: stretch }
@media (width <= 960px) { .article-shell { display: block; max-width: 38rem }
                          .reader-margin { display: none } }
```

### Selection to mark

A `selectionchange` listener on `document` accepts a selection only if it has exactly one range, is non-collapsed, starts and ends **in the same block**, is non-empty after trim, and **doesn't intersect an existing mark**. Cross-paragraph selections are rejected outright.

The "Write in margin" button is `position: fixed` and `document.body.append`-ed on init, so it survives the aside being hidden at narrow widths. Positioning, from the **last** client rect of the range:

```js
const r = range.getClientRects().at(-1) ?? range.getBoundingClientRect()
const below = r.bottom + 8
const top = below + h <= innerHeight - 8 ? below : r.top - h - 8
btn.style.top  = Math.max(8, Math.min(top, innerHeight - h - 8)) + 'px'
btn.style.left = Math.max(8, Math.min(r.right, innerWidth - w - 8)) + 'px'
```

So: 8px below the selection, flipped above when there's no room, clamped into the viewport. `pointerdown` gets `preventDefault()` so clicking it doesn't collapse the selection. `scroll` (passive) and `resize` just hide it.

On save the range is wrapped — `mark.append(range.extractContents()); range.insertNode(mark)` — and the invitation is hidden for good.

### Anchoring and storage

The stored record:

| Field         | How it's produced                                                  |
| ------------- | ------------------------------------------------------------------ |
| `id`          | `crypto.randomUUID()`                                              |
| `articleId`   | `location.pathname`, trailing slash stripped                        |
| `blockIndex`  | index into the annotatable-blocks NodeList                          |
| `blockId`     | `${tag}:${index}:${fnv1a(block.textContent)}` — a change detector  |
| `blockTag`    | lowercased tag name                                                 |
| `startOffset` | `Range(block start → selection start).toString().length`           |
| `endOffset`   | same, to the selection end                                          |
| `quote`       | `range.toString()`                                                 |
| `prefix`      | 32 chars of `block.textContent` before `startOffset`                |
| `suffix`      | 32 chars after `endOffset`                                          |
| `note`        | the reader's text, `maxlength="500"`                                |
| `createdAt`   | ISO string                                                          |
| `reference`   | `max(existing) + 1`; reassigned on load if missing or duplicated   |

The hash is FNV-1a, base-36:

```js
let h = 2166136261
for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
return (h >>> 0).toString(36)
```

Offsets are character offsets into the block's `textContent`, so they survive inline markup. Converting back to a `Range` walks text nodes with a `TreeWalker`, accumulating lengths until the offsets fall inside a node.

On load, each record must clear **every** one of these or it's dropped: the block exists at `blockIndex`, its tag matches, its hash matches, `text.slice(start, end) === quote`, prefix matches, suffix matches, and the rebuilt range doesn't intersect an already-restored mark.

So the record *looks* like a W3C Web Annotation `TextQuoteSelector` + `TextPositionSelector`, but **there is no fuzzy re-anchoring**. Quote, prefix and suffix are extra exact-match guards, never a search fallback. The fields are there to support it later; he hasn't built it.

Storage is `localStorage` under `marginalia:${pathname}`, the whole array rewritten on every change, every read and write wrapped in a bare `try {} catch {}`.

### The three render modes

One rAF-batched layout function dispatches on `matchMedia('print')`, then `matchMedia('(max-width: 960px)')`, else margin mode.

**Margin.** Notes are absolutely positioned in the aside with `inset-inline: 0`, sorted by their mark's `getBoundingClientRect().top`, each vertically centred on its mark, then collision-avoided with a running cursor:

```js
const wanted = markRect.top - asideTop + (markRect.height - note.offsetHeight) / 2
const top = Math.max(0, wanted, cursor)
note.style.top = `${top}px`
cursor = top + note.offsetHeight + 24
```

Overlapping notes push downward and never collide. Connectors are rebuilt from scratch each pass into the inline `<svg>`, which has `overflow: visible` so the arrows can render outside the aside, in the column gap.

**Inline** (≤960px). Notes get `.inline-margin-note` and are `insertAdjacentElement('afterend', …)` on the block — or the parent `ul`/`ol` for an `li`. A `Map` of block → last-inserted note keeps several notes on one block in order. Reference numerals appear via `content: attr(data-note-reference)` on the note's `::before` and the mark's `::after`.

**Print.** `beforeprint` cancels any pending frame, adds `body.preparing-print` (which forces the two-column grid back on with `fr` units and un-hides the margin), lays out, then forces a reflow by reading `offsetHeight`. Notes are appended *into* their block, which gets `position: relative`, and each gets its own small connector SVG. `afterprint` unwinds it all. A `@media print` block covers browsers that skip the events.

Reflow triggers: `ResizeObserver` on the shell (guarded by comparing rounded dimensions so no-op resizes don't thrash), `window resize`, the `matchMedia` change event, and `document.fonts.ready`.

### The visual craft

This is the part actually worth stealing, so here it is precisely.

**The underline** is a data-URI SVG background — a wobbly closed path in a `0 0 100 6` viewBox with `preserveAspectRatio="none"`, stretched to the full width of the mark:

```css
.marginalia-mark {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 6' preserveAspectRatio='none'%3E%3Cpath d='M0 4.1 L2 3.8 L6 2.9 L15 2.88 L28 2.87 L42 2.64 L57 2.5 L72 2.22 L85 2.13 L92 2.27 L97 2.56 L100 2.9 L97 2.96 L92 3.17 L85 3.43 L72 3.68 L57 3.9 L42 4.16 L28 4.23 L15 4.32 L6 4.4 L2 4.1 Z' fill='%236F7378'/%3E%3C/svg%3E")
    0 calc(100% - 1px) / 100% 0.32em no-repeat;
  padding-bottom: 0.08em;
  box-decoration-break: clone;   /* repeats correctly across line breaks */
  print-color-adjust: exact;     /* survives printing */
}
```

**The arrow** is generated, not an asset, and the generator is the clever bit. Given a start and end point it returns two SVG paths:

1. Cubic bezier from start to end, with both control points pushed **perpendicular** to the line by `min(5, length * 0.08)` — so longer runs bow more, short ones stay nearly straight. Control points sit at 34% and 72% along, the second at 55% of the offset.
2. Sample 9 points along that curve. At each, compute the tangent, and offset perpendicular by a half-width that tapers to points at both ends:
   ```js
   halfWidth = Math.sin(Math.PI * t) ** 0.65 * 0.75 + 0.04
   ```
3. Walk forward down one edge, `toReversed()` back along the other, close with `Z`. The result is a **filled** tapered path — thick in the middle, pointed at both ends. That variable width is what makes it read as ink rather than a stroke.
4. The arrowhead is a separate two-line stroked path, 7.5 units back along the final segment's direction and ±3.25 perpendicular, with `vector-effect: non-scaling-stroke`.

In margin mode the arrow is drawn from just inside the margin column to just short of the prose edge, spanning the column gap, arrowhead at the prose end. In print mode it's the same function over a fixed `0 0 32 24` viewBox, from `{x:24,y:12}` to `{x:8,y:12}`.

**The type.** His values, for reference — ours need recalibrating:

| Element                 | Spec                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `.margin-note`          | Kalam 400, 1.03rem/1.42, `translateY(-1px) rotate(-0.8deg)`    |
| editor `textarea`       | same face and size, transparent, 1px bottom border, min 4.5rem |
| `.margin-note-actions`  | Inter 0.68rem, right-aligned, 0.65rem gap                      |
| `.margin-note-controls` | Inter 0.64rem, `opacity: 0` until `:hover` / `:focus-within`   |
| selection button        | Inter 0.7rem, white, 1px border, 3px radius, soft shadow       |
| inline numeral          | Source Serif 4 600 at 0.76em, hung in the left margin          |
| mark numeral (≤960px)   | Source Serif 4 600 at 0.58em, `vertical-align: super`          |

The `-0.8deg` tilt is what sells the handwriting. Keeping the UI chrome in the interface face at tiny sizes is what stops the whole thing looking like a novelty.

### Accessibility

Better than expected. Marks carry `aria-describedby` pointing at their note; notes are `role="note"` with `tabindex="0"`; the textarea has a visually-hidden `<label>`; connector SVGs are `aria-hidden`; the aside has `aria-label="Reader margin"`; `Escape` cancels the editor; deleting unwraps cleanly via `mark.replaceWith(...mark.childNodes)`.

Small nice touches: the invitation hides as soon as any note exists, and the note being edited is `hidden` while the editor is open so they don't overlap. Editing relabels Save to "Update".

### Where it falls short

- **Silent data loss.** Any change to a paragraph fails the hash check and every reader note on it disappears with no message. For a site whose posts get revised, that's the one behaviour we shouldn't copy.
- **No export.** Notes can never leave the browser.
- **No theming.** His site has no `prefers-color-scheme` rules at all, which is why the marginalia CSS hardcodes `#6f7378` and `#302f2b` with alpha.
- The `marginalia-prototype` class name suggests he considers it unfinished, which seems about right.

## How we'll build it

Same architecture, three deliberate improvements (orphaning instead of silent loss, export, theming), and a different layout technique because our grid already gives us what we need.

### Where it hangs in our DOM

`Article.astro` already renders `<article class="h-entry" …>` with `position: relative`, containing `TableOfContents` and then `<LongFormProseTypography>` (which renders `div.longform-prose.cq.flow`).

- New component `src/components/layout/MarginAnnotations.astro`, barrel-exported, placed inside `<article>` as a sibling of the prose — exactly where `TableOfContents` sits.
- Mounted for every article **except** those with a `redirectURL`. `Article.astro` already suppresses view-transition names on that same condition, so reuse it.
- The content hook needs no component change: `LongFormProseTypography` spreads `{...props}` onto its div, so `Article.astro` can pass `data-annotations-content` straight through.

**Annotatable blocks are narrower than his**, because our articles are MDX full of components (`Callout`, `Embed`, `BookmarkCard`, `Tabs`, Mermaid, lightboxed images). Wrapping a range with `extractContents()` inside any of those risks breaking their behaviour. So: direct prose children only.

```
:scope > p, :scope > blockquote, :scope > :is(ul, ol) > li
```

No `pre`, no `.full-bleed`, no figures, nothing inside a component.

**Drop the headings too** (`h2, h3, h4`), which his selector allows. Our `h2` carries its own `border-bottom`, and an annotation underline lands right on top of it: the wobble and the rule fight each other and the mark stops reading as a mark. Headings are also the least useful thing to annotate — there's no argument in them to disagree with. Easy to add back later if it's missed.

Two further hazards:

- **`.intro-paragraph`** (from the `IntroParagraph` MDX component) rewrites its own text nodes on load to trim leading whitespace. Annotating it means racing that script, and offsets captured before normalisation won't match after. Exclude it to start.
- **Real footnotes already exist and already render inline.** `InlineFootnotes.astro` expands `a[data-footnote-ref]` beneath the paragraph, mounted behind `Article.astro`'s `hasFootnotes` flag. Two independent superscript sequences in one paragraph would be badly confusing, so we lean on the **handwriting face** to separate them: a reader's numeral is visibly handwritten, the author's is Literata. Needs checking with both in one paragraph.

No `astro:page-load` re-init and no idempotency guard. Per `docs/developer/view-transitions.md` there's no `ClientRouter` — every navigation is a full page load, so the script runs fresh each time. `InlineFootnotes` carries both defensively; this shouldn't grow them speculatively.

### Layout: the right gutter, not a new grid

Our article grid is three columns with prose in the middle:

```css
grid-template-columns: minmax(var(--gutter), 1fr)
                       min(var(--measure-standard), calc(100% - var(--gutter) * 2))
                       minmax(var(--gutter), 1fr);
```

`TableOfContents` doesn't take a grid cell — it's `position: absolute` in the **left** gutter, `width: calc(calc(100vw - var(--measure-standard)) / 2)`, shown only at `min-width: 1400px`. Mirroring that on the right means **no grid restructure at all**, the prose column never shifts, and articles without annotations stay pixel-identical. Reusing `1400px` also makes the margin and the TOC appear together, reading as one deliberate wide-screen layout rather than two unrelated breakpoints.

**Use the grid area, not a width calculation** (verified in Phase 1). An absolutely positioned child of a grid container takes its containing block from `grid-column`/`grid-row`, so the margin needs no width maths at all:

```css
.longform-prose { position: relative } /* the abspos containing block */
.longform-prose > .annot-margin { position: absolute; grid-column: 3; inset: 0 }
```

Measured, that lands the margin's left edge on 1128px at a 1440px viewport — exactly the prose column's right edge. The TOC's `calc(100vw - var(--measure-standard))` approach can't be that precise here, because `--measure-standard` is `70ch` and `ch` resolves against the *element's* font: 70ch means one thing in Literata inside `.longform-prose` and another in Figtree on `article`. The grid area sidesteps the whole problem.

One inherited limit: absolutely positioned notes don't contribute to document height. His stretched grid cell behaves the same way, so it's a known constraint rather than a regression.

One inherited limit: absolutely positioned notes don't contribute to document height. His stretched grid cell behaves the same way, so it's a known constraint rather than a regression.

### Anchoring, storage and orphaning


His anchoring is tangled into the DOM code. Ours goes in `src/utils/annotations.ts` as pure functions, because it's both the most testable part and the part where his version is weakest.

Same record shape, with two changes:

- **Fuzzy re-anchoring.** When offsets no longer match, search the block for `prefix + quote + suffix`, then the block's neighbours, then `quote` alone. Only give up when the quote genuinely isn't in the article any more.
- **Orphan, don't delete.** A note whose anchor can't be found stays in storage and is surfaced as detached. Losing a reader's writing without telling them is not acceptable.

Storage key gets a schema version so a future record change can migrate rather than silently discard: `annotations:v1:${pathname}`.

### Render modes

The same three, with the same algorithms — the collision cursor, the inline insertion with its per-block `Map`, the `beforeprint`/`afterprint` pair plus the `@media print` fallback. The reflow triggers carry over too, including `document.fonts.ready`, which matters more for us than for him because the handwriting face loads late by design.

Two deliberate departures, both from watching the prototype:

**Number the notes by document order, not creation order.** His `reference` is `max(existing) + 1`, so annotate the third paragraph and then the first, and the numerals read 2 then 1 down the page. Invisible in margin mode, glaring in inline mode where they sit in the text as footnote-style markers. Renumber on layout from document position; the stored `reference` then only has to be stable enough to keep a note matched to its mark within a session.

**Never reparent a note during layout.** Moving a DOM node blurs a focused `contenteditable` inside it and drops the caret, so re-appending every note on every layout pass — the obvious way to keep them in document order — makes a note impossible to type into: the first keystroke lands, then focus falls to `<body>` and the rest of the word goes nowhere. The Phase 1 prototype had exactly this bug. Set `style.top`, and move a note only when its parent is genuinely wrong, i.e. on a mode switch. Margin notes are absolutely positioned, so their DOM order doesn't matter anyway.

**Align the note's first line with the mark's first line**, rather than centring the whole note box on the mark's bounding box as he does. For a one-line note the two are identical; for a two- or three-line note his version points the arrow at the middle of the block, while first-line alignment keeps the arrow horizontal and makes it read as leading into the start of the handwriting. Use the mark's *first* client rect too, so a mark that wraps across lines is pointed at where the phrase begins.

### Theming

The one place his CSS is no use to us. Connectors and note text are easy — they're inline SVG and real text, so `var(--…)` and `light-dark()` just work. The underline is the hard part, because **an SVG in a data URI can't read a custom property**: it's an isolated document, and `currentColor` there resolves to black.

Phase 1 tested three ways round it, in Chromium and WebKit. **Two theme-keyed URIs wins:**

```css
.annot-mark { --_ul: var(--_ul-light); background: var(--_ul) 0 calc(100% - 1px) / 100% 0.32em no-repeat }
:root[data-theme='dark'] .annot-mark { --_ul: var(--_ul-dark) }
```

`data-theme` is always on `<html>` (BaseHead's theme script sets it to the *resolved* theme, even on auto), and its own comment calls it a styling hook, so this is a sanctioned use rather than a workaround.

The two rejected options, with the evidence, because both look more elegant on paper:

- **One SVG carrying its own `@media (prefers-color-scheme: dark)`.** Works perfectly in Chromium, which passes the embedding page's used `color-scheme` into the image — it even follows the site's own toggle. **WebKit follows the OS instead**, so a reader whose site theme disagrees with their OS gets light ink on charcoal (2.5:1) or dark-mode ink on beige (2:1, near-invisible). That's precisely the reader who went out of their way to choose, so it's not a corner worth cutting.
- **`mask-image` with a themeable `background-color`.** A mask hides everything it doesn't cover, *including the text*, so the text area needs its own opaque mask layer and the underline has to move down into padding below the descenders — which loses the pen-crossing-the-letters look. Worse, **in WebKit the marked text disappears entirely once the mark wraps across a line break.** Dead on arrival.

Both rejected techniques are still in the scratchpad lab behind `?underline=svgmedia` and `?underline=mask` if that needs re-confirming.

Thin handwriting strokes also fade on charcoal at the same value that reads well on beige, so the ink wants a different lightness per theme. Verified pair, both clearing WCAG AA for normal text:

`oklch(48% 0.012 210)` on beige is 5.79:1, and `oklch(76% 0.012 210)` on charcoal is 7.62:1 — both clear WCAG AA for normal text. For reference `--color-text-secondary` is only 4.30:1 on beige, so the notes should not simply reuse it.

**Don't use coral.** It was worth trying, given "the red pen" framing and our accent, and it reads well (5.29:1 / 7.22:1). But footnote references and links are *already* coral: a coral reader numeral next to a coral footnote ref makes the reader's marks look like the author's. Grey ink keeps the two voices apart, which is the whole point.

### The handwriting face

A handwriting face will get used elsewhere on the site later, so this isn't a private choice belonging to one component. It becomes a real token, `--font-handwriting`, with a styleguide specimen and a font-reference entry — same standing as Literata, Geist, Figtree and Fira Code. That means it has to be good in the abstract, not merely good at small size in a gutter, and it should look like **script** rather than tidy print.

**Decided: Caveat**, on the strength of the Phase 1 comparison — the most convincingly script-like of the three, the strongest at display size (which matters for a site-level token), and the only one whose numeral works. The shortlist it came from, with measured `woff2` bytes from the Fontsource CDN. We vendor one file per face with no `unicode-range` splitting (unlike his site, which loads three Kalam subsets separately), so the number that matters is latin + latin-ext — and it shouldn't be subset harder than that, because the *reader* types the content and may well type accents.

| Face         | Axis             | latin   | + latin-ext | Note                              |
| ------------ | ---------------- | ------- | ----------- | --------------------------------- |
| Caveat       | variable 400–700 | 73.2 KB | ~102 KB     | Front-runner; needs a ~15% bump   |
| Kalam        | static 400       | 21.8 KB | ~34 KB      | His choice; the one to beat       |
| Indie Flower | static 400       | 19.1 KB | ~30 KB      | Cheap script; may tip twee        |

For scale: Figtree is 27 KB, Geist 68 KB, Literata **394 KB**. Even Caveat is a quarter of Literata.

Caveat leads on the wider-use argument: it's the only shortlisted face with a weight axis, and for a site-level token that flexibility is worth the extra weight over Kalam. Kalam is the one to beat *on the page* — known-good, a third of the size, but much less script-like and therefore the weaker general-purpose face. Everything else tested was rejected for being upright print rather than script (Architects Daughter, Patrick Hand, Edu NSW ACT Foundation), too light (Shadows Into Light Two), or not actually handwriting despite the Fontsource category (Cause, Delius). Literata italic reads as *emphasis*, not annotation, which is what settles the question of buying a new face at all.

`1.03rem` is a Kalam-specific number: at identical `font-size` these faces render at very different apparent sizes. Calibrated in the real gutter against Literata, relative to the prose font size, these match each other optically:

| Face         | Note size | Line height | Notes                                            |
| ------------ | --------- | ----------- | ------------------------------------------------ |
| Caveat       | `1.15em`  | 1.15        | Small x-height, so the largest number            |
| Kalam        | `0.9em`   | 1.4         | Largest apparent size per point                  |
| Indie Flower | `0.95em`  | 1.35        | Widest — wraps ~1 line more than the others      |

Indie Flower's width is a real cost, not just a look: at 1440px its long seed note takes three lines where Caveat and Kalam take two, which pushes the next note down and bends that note's arrow. The narrower the gutter, the more it compounds.

**The numeral settles the variable-axis question, and it points at Caveat.** Set as a superscript marker beside real footnote references: Caveat at 400 is too faint to read as a marker and needs 700, which its axis provides. Kalam is heavy enough at 400. Indie Flower renders 400 and 700 *identically* — it has no bold, so with `font-synthesis: none` (and synthesis would look awful) it simply can't do a heavier numeral. So: pick Caveat and the weight axis earns its keep; pick Kalam and it never gets used; pick Indie Flower and the option doesn't exist.

Separately, the marker worry from Phase 4 is already answered: a reader's numeral is grey and handwritten, the author's footnote ref is coral and Literata. They don't read as the same sequence, provided the ink stays grey.

**Lazy loading is free.** A browser only downloads a webfont when rendered text actually matches the `@font-face`. Notes don't exist until a reader writes one, so readers who never annotate never fetch the face — no JS, no `document.fonts.load()`. The only thing that would break this is preloading, so `--font-handwriting` must **not** go in the `BaseHead.astro` preload list.

### Payload

This is the one rule the task genuinely spends: no-runtime-JS-by-default. It's honest progressive enhancement — the article renders and reads perfectly without the script — but it's still weight on every article page.

The idea tested: before a reader interacts, the only work needed is restoring existing notes and listening for `selectionchange`. So a tiny stub reads `localStorage` and either `import()`s the module immediately (notes exist) or waits for the first non-collapsed selection (they don't).

**Measured, and the case for the stub is weaker than it looked.** Sizes first:

| Module                                       | Minified  | Gzipped |
| -------------------------------------------- | --------- | ------- |
| His shipped `Marginalia` script              | 10.9 KB   | 4.0 KB  |
| Our Phase 1 prototype (no storage, no export) | 5.6 KB    | 2.8 KB  |

So the real component lands somewhere near his — call it 4–5 KB gzipped, against Literata's 394 KB on every article page. That is the entire saving the stub is protecting.

And it isn't free. Perceived lag, measured from the reader finishing their selection to the button appearing, on the dev server (which adds ~170 ms of transform overhead and one extra request that production wouldn't have):

| Selection           | +150 ms RTT | +300 ms RTT | +600 ms RTT |
| ------------------- | ----------- | ----------- | ----------- |
| Drag-select, ~400ms | 30 ms       | ~320 ms     | ~900 ms     |
| Double-click        | ~500 ms     | ~800 ms     | ~1400 ms    |

Production would be roughly one RTT rather than two plus the dev overhead, so: a drag-select hides the fetch behind the drag, while a **double-click selection — which is instant, with no drag to hide behind — waits about one RTT**, up to ~600 ms on a bad connection.

Triggering the import on `pointerdown` in the prose rather than on `selectionchange` was worth testing and turned out not to help measurably (~15 ms), because the first `selectionchange` already fires almost immediately on pointer-down.

**Recommendation: ship the module on article pages and drop the stub.** 4–5 KB gzipped is noise next to the fonts, nothing is perceptibly delayed, and it removes a moving part from a feature that already has plenty. "Only where it's needed" is still satisfied at page granularity — articles only, never notes or index pages — and with no annotations stored the module's whole job is one cheap `selectionchange` listener. The stub stays a reasonable option if minimum bytes matters more than the double-click case; the scratchpad keeps it behind `?seed=0` either way.

### Decisions taken

| Decision    | Call                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| Note face   | **Caveat**, variable 400–700, as `--font-handwriting`. Numerals at 700    |
| Breakpoint  | `1400px`, matching the TOC. Works to ~1366; don't go below ~1280         |
| Note marker | Grey handwritten numeral, renumbered in document order. Settled          |
| Ink         | Grey, not coral — coral is already the footnote and link colour          |
| Underline   | Two theme-keyed data URIs, switched on `[data-theme='dark']`             |
| Invitation  | Selection popover only to start; a standing prompt is a likely follow-up |
| Enabling    | All articles except those with a `redirectURL`                           |
| Payload     | Ship the module on article pages; drop the stub                          |
| Blocks      | Paragraphs, blockquotes and list items only — no headings                |

## The plan

### Phase 1 — Scratchpad experiment ✅

**Done.** The live experiment is **`src/pages/scratchpad.astro`** plus `src/pages/_scratchpad/margin/` — a real article rendered through the real `Article` layout, with a throwaway prototype layered on top. A "Margin lab" panel (bottom left) switches ink, underline technique, numerals, layout mode and arrow weight; each is also a URL param, e.g. `?mode=margin&numerals=700`. Now the face is decided the lab carries Caveat only — the Kalam and Indie Flower files and switches are gone. `?seed=0` starts empty and exercises the lazy-load stub. Selecting text adds a real note you can type into, so it's worth playing with before Phase 3 starts.

Everything it established has been folded into the sections above. The checklist and what came back:

- [x] **Tapered-bezier connector reads as ink** at our type sizes, reimplemented in `_scratchpad/margin/ink-arrow.ts` (pure, no DOM — promote it to `src/utils/` in Phase 3). His constants transfer unchanged; the `weight` multiplier the lab exposes wasn't needed, 1× is right.
- [x] **Underline technique: two theme-keyed data URIs.** Both alternatives fail in WebKit — see [Theming](#theming). The mask idea the plan preferred is dead: masks hide the text too, and WebKit loses the marked text completely once a mark wraps.
- [x] **Right gutter holds up, via the grid area** rather than a width calculation — see [Layout](#layout-the-right-gutter-not-a-new-grid). Measured, with margin mode forced on:

  | Viewport | Prose | Gutter | Note width | Worst note | Worst collision push |
  | -------- | ----- | ------ | ---------- | ---------- | -------------------- |
  | 1440px   | 816px | 312px  | 234px      | 2 lines    | 11px                 |
  | 1400px   | 816px | 292px  | 215px      | 3 lines    | 30px                 |
  | 1366px   | 816px | 275px  | 198px      | 3 lines    | 30px                 |
  | 1280px   | 816px | 232px  | 155px      | 4 lines    | 58px                 |
  | 1200px   | 801px | 199px  | 123px      | 4 lines    | 58px                 |
  | 1024px   | 769px | 127px  | 53px       | 10 lines   | 207px                |

  `1400px` is comfortable and matches the TOC. It still works at `1366px`; by `1280px` notes are 4 lines and drifting ~60px from their marks; below `1200px` it falls apart. So there's room to tune down to ~1366px, but not to ~1200px. Note the arrow gap and right padding eat 78px of every gutter — worth reclaiming if we ever want a lower breakpoint.

- [x] **All three faces tried in the real gutter and at display size**, each calibrated to its own size and line height — see [The handwriting face](#the-handwriting-face). Screenshots in `docs/tasks-todo/temporary/margin-lab/`.
- [x] **Ink set per theme** and checked on charcoal. Also killed the coral idea, for a reason worth keeping: coral is the author's footnote and link colour.
- [x] **Numerals answered, and they decide the face question** — Caveat needs its 700, Kalam doesn't need one, Indie Flower can't have one.
- [x] **Lazy stub measured** — and the recommendation is now to drop it. See [Payload](#payload).

Three things the prototype turned up that weren't on the list:

- **Numbering must follow document order**, not creation order. His doesn't, and inline mode makes it obvious.
- **Headings are a bad annotation target** on this site — our `h2` has a `border-bottom` that the underline collides with. Dropped from the block selector.
- **Aligning the note's first line** with the mark beats centring the note box, once notes run to more than one line.
- **Layout must not reparent notes** — see [Render modes](#render-modes). Found by trying to type into a prototype note and getting one character in before focus vanished.
- **Deleting an empty note on blur is the wrong interaction.** The prototype does it (there being no editor) and it reads as the feature throwing your annotation away. Evidence for keeping his explicit Cancel/Save rather than improving on it.

Left for Phase 3 to confirm rather than chased here: that `position: relative` on `.longform-prose` moves nothing on a real article (the prototype's own page renders `LCVid`, callouts, tables and code blocks correctly with it applied, which is good evidence but not a before/after diff).

### Phase 2 — Anchoring and storage as pure functions ✅

**Done.** `src/utils/annotations.ts` (~270 lines) with 44 tests in `tests/unit/annotations.test.ts`.

- [x] Record type, `fnv1a`, `blockId`, `createAnnotation`, `serialiseAnnotations` / `parseAnnotations`, `isStoredAnnotation`, `storageKey`, `normaliseArticleId`.
- [x] Fuzzy re-anchoring in `findAnchor`, scored by surviving context.
- [x] Orphan state: `{ status: 'orphaned' }`, with the record handed back untouched so nothing is rewritten on the strength of a failed search. Showing it as detached is Phase 3's job.
- [x] Versioned storage key: `annotations:v1:<pathname>`.
- [x] Unit tests, including the cases the plan named and a few it didn't.

**The module is DOM-free, and the range conversion moved to Phase 3.** Vitest here runs in plain Node with no jsdom or happy-dom, and adding one for a single function isn't worth a dependency — the real DOM path gets covered by the Phase 5 e2e tests instead. That constraint turned out to be the right seam anyway: anchoring is entirely string work over block text, so the part that fails silently is the part under test, and `rangeFromOffsets` (already written in the prototype) stays with the component.

Three decisions worth knowing before Phase 3 uses this:

- **`blockId` is not a gate.** It's stored, and it's a cheap "did this block change?" signal, but a hash mismatch is never a reason to drop a note — that mismatch *is* his silent-data-loss bug. Only the quote's actual presence decides.
- **Where we left it wins ties.** `findAnchor` scores every occurrence of the quote by how much stored context still surrounds it, but an annotation whose recorded offsets still hold the quote stays put unless another candidate scores *strictly* better. Without that rule, an edit elsewhere in a paragraph can shunt a note onto a different copy of the same phrase.
- **Ambiguity orphans.** If the recorded position no longer holds the quote, no context survives, and the quote appears in more than one place, it orphans rather than guessing. Attaching a reader's note to the wrong sentence is worse than telling them it came loose. A quote that's unambiguous re-anchors even with no context at all.

`reanchor` wraps `findAnchor` and returns the record that should be stored — coordinates and context refreshed from wherever the quote now is, including when it hasn't moved but the surrounding text has, so records don't rot over successive edits. It returns the original object by identity when nothing needs saving, so the caller can just compare with `!==` to decide whether to write.

**Interface for Phase 3:** collect `{ tag, text }` for the annotatable blocks in document order, call `reanchor(record, blocks)` per stored record, then use `rangeFromOffsets` on the block at `anchor.blockIndex` to build the mark. Reference numerals aren't stored at all — they're computed at layout from document order (Phase 1's finding), which also makes them stable across reloads.

### Phase 3 — The component ✅

**Done.** `src/components/layout/MarginAnnotations.astro`, mounted in `Article.astro` on every article bar `redirectURL` ones, with `data-annotations-content` passed straight through `LongFormProseTypography` (it spreads `{...props}`, so no component change was needed).

- [x] The component, barrel-exported, with all chrome server-rendered and hidden.
- [x] Caveat vendored: `public/fonts/Caveat-v2.000-2026-09-18.woff2` + `-LatinExt-`, `@font-face` in `_foundation.css`, a `--font-handwriting` token beside the other four, and **no preload entry**.
- [x] `--color-annotation` token, light and dark.
- [x] Selection handling, the fixed invite button, save / edit / delete, `Escape` to cancel, no standing invitation.
- [x] Margin layout: collision cursor, generated connectors, and the reflow triggers.
- [x] Storage and anchoring wired to `@utils/annotations`, including detached notes.

Three deviations from the plan, all deliberate:

- **Inline mode landed here too**, not in Phase 4. Margin-only would have meant a commit where the feature silently does nothing below 1400px, and the two modes share one layout function anyway — it was about twenty lines. **Phase 4 is now print plus the verification matrix.**
- **Caveat is split by `unicode-range`** (latin 73 KB, latin-ext 29 KB) rather than the site's usual one-file-per-face. The reader supplies the text here, so we can't predict glyph coverage: most readers only ever need latin, and the extended file arrives only if someone types an accent. Worth a note in `fonts.md` in Phase 6, since it breaks the existing pattern.
- **`ink-arrow.ts` was promoted to `src/utils/`** and the Phase 1 prototype deleted, along with its scratchpad page and experiment font. It had to go: the real component now runs on every article, including the one the lab rendered, so the two would have fought over the same prose. `scratchpad.astro` is back to its empty state; the reference material and harnesses stay in `docs/tasks-todo/temporary/`.

Verified against the real article at 1440px (margin) and 500px (inline), in both themes, driving the component through a browser:

- Create, persist, reload, edit, delete — with the mark unwrapped cleanly on delete and the prose text left intact.
- **A stale record re-anchors instead of vanishing.** Seeded with an offset of 999 and context from an imaginary older draft, it found its quote at offset 295, refreshed the stored coordinates and kept the note. This is the exact case his version drops silently.
- **An impossible quote shows as detached**, with no numeral, and its record is left untouched in storage.
- The handwritten numeral sits next to a real coral footnote reference in the same paragraph and reads as a different thing entirely.
- `position: relative` on `.longform-prose` shifts nothing: the `LCVid` play button is still centred on its frame, which was the thing most likely to move.

One thing to keep an eye on: detached notes currently just stack at the end (of the margin, or of the article inline). That's honest but plain — a labelled group, or something collapsible, might be better once there's a real one to look at.

### Phase 4 — Print, and verification against real content

- [x] **Print mode.** Notes go back out in the margin on paper, each with a short connector.
- [ ] Verify against an article carrying real footnotes, a `Callout`, a code block and a `BookmarkCard` — annotating around them, not inside them.
- [ ] Check several notes on one block, and a note on a list item, in both modes.
- [ ] Decide how detached notes should present themselves once there's a real one on screen.

How print works, since it isn't obvious:

**Each note moves in beside its own mark**, not into the margin aside. An absolutely positioned element inside a container spanning several pages doesn't paginate — it lands on the first page or nowhere — so the notes have to hang off something that's in flow. The annotated block becomes `position: relative`, the note is inserted straight after the mark, and `top: auto` leaves it at its static position, which is the mark's own line. The block then carries its note across page breaks. `beforeprint` does the moving and sets `data-annotations="print"`; `afterprint` puts everything back.

**Two notes on one block print beneath it instead, numbered.** In the margin they'd overlap: print positions come from static positions, and there's no collision pass available because anything measured during `beforeprint` describes the screen, not the paginated page. So a block with one note gets the margin treatment, and a block with several gets them stacked underneath with handwritten numerals — deterministic, and it degrades rather than colliding. (The prior art overlaps here.)

The print grid also takes the outer gutter back and spends it on the margin (`0 minmax(0, 1fr) 13rem`), since A4 has no room for a full measure plus a margin.

**Safety net:** if a browser never fires `beforeprint`, the notes are still inside the aside — which is absolutely positioned across the whole article and would print on page one or not at all. A `@media print` block drops them into flow at the end of the article and brings the numerals back, so they're ugly rather than lost. Worth knowing for testing: Chromium's own print path (and Playwright's `page.pdf()`) does fire the events, so this is belt-and-braces.

Verified by driving a real print: the events fire, the conversion happens, three notes land beside their marks with connectors, the margin and hover controls are hidden, numerals are suppressed where a connector does the pointing, and `afterprint` restores every note to the margin with nothing left behind. Also eyeballed at A4 width, both the margin case and the stacked case.

One thing printing turned up that isn't ours: the skip link, the nav toggle and `Open ↗` links all print. That's the site's existing print styling, not the annotations — worth a separate look sometime.

### Phase 5 — Accessibility, export, tests

- [ ] Accessibility pass, at least matching his: `aria-describedby` on marks, `role="note"`, labelled textarea, `aria-hidden` connectors, keyboard-reachable edit and delete, visible focus. Then check with a screen reader.
- [ ] **Export.** A "copy my notes" action emitting markdown (quote + note, in document order). Small, and it's what stops the feature being a dead end.
- [ ] E2E coverage in `tests/e2e/` — annotate, reload and see it restored, edit, delete, narrow viewport, and an article with footnotes.
- [ ] `bun run check:all`, plus `bun run shoot /writing/<article>` in both themes at 1440 and 2560.

### Phase 6 — Fold `--font-handwriting` and the component into the system

The face is a site-level token, so it has to land everywhere the other four are documented — otherwise the next person or agent reaches for an inline `font-family`.

- [ ] **`docs/developer/fonts.md`** — a full `## Caveat` section following the existing per-font pattern: source information (version, repository, build date), variable axes with CSS examples, OpenType features. Plus the overview-table row and the custom-properties list.
- [ ] **`docs/developer/fonts.md` preload note** — the existing copy explains which faces preload and why. Say explicitly that this one doesn't, and why, so nobody "fixes" it later.
- [ ] **`docs/developer/design-tokens.md`** — add `--font-handwriting` to the font-token table (currently four rows) with a one-line purpose.
- [ ] **`src/pages/styleguide/foundations.astro`** — a fifth `<SGTypeSpecimen>` in the `.type-specimens` block. Its intro prose says "five distinct usage contexts, covered by four font stacks", so that sentence needs rewriting rather than appending to.
- [ ] Decide whether the face needs a static TTF for the Satori OG pipeline. It only matters if OG images ever set handwriting type — they don't today, so probably not. Record the decision either way, because every other face has TTFs and the asymmetry will otherwise look like an oversight.
- [ ] **`docs/developer/margin-annotations.md`** — the anchoring contract, storage key and record shape, the three render modes, the block selector and why it's narrow, the lazy-load arrangement.
- [ ] **`AGENTS.md`** — a line under key features pointing at that doc, matching how the command palette is listed.
- [ ] Styleguide examples for the mark, the note and the connector. They need real prose to sit beside, so put them somewhere with a measure rather than in the bare component grid.
- [ ] `bun run check:knip` and `bun run check:dupes` — this adds a util, a component and a font.

## Out of scope

- Notes pages, and any collection other than `articles`.
- Accounts, sync, or server-side storage. Notes stay in the reader's browser.
- Public or shared annotations. Nobody but the reader ever sees their notes.
- Cross-paragraph and cross-block selections — the same limit his version has.
- Annotating code blocks, images, embeds, intro paragraphs, or anything inside an MDX component.

## Reference material

All gitignored, under `docs/tasks-todo/temporary/`:

- **`marginalia-reference/`** — the decompiled original (Prettier-formatted script, extracted CSS, server-rendered markup), pulled from the live site on 2026-09-11.
- **`font-specimen/`** — the first flat face comparison that produced the shortlist (`node shoot.mjs`).
- **`margin-lab/`** — the Phase 1 evidence and the harnesses that made it, all pointed at `bun run dev`: `inspect.mjs` (layout geometry and console), `shoot-lab.mjs` / `shoot-mark.mjs` / `shoot-wrap.mjs` (screenshots, `BROWSER=webkit` for Safari), `sample-underline.mjs` (reads ink colour out of a PNG), `gutter.mjs` (the gutter table), `lag-perceived.mjs` (the payload numbers) and `grid.mjs` (composites PNGs into a comparison sheet). The `cmp-*.png` files are the comparisons themselves.

Both are gitignored and will eventually be cleaned up, which is why everything load-bearing is written into this document. The originals are useful for checking a detail, not as a dependency.
