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
:scope > p, :scope > blockquote, :scope > :is(h2, h3, h4), :scope > :is(ul, ol) > li
```

No `pre`, no `.full-bleed`, no figures, nothing inside a component. Two specific hazards:

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

We expect to tune that breakpoint down after looking at it — `--measure-standard` is `70ch`, so there may be usable gutter well below 1400px.

One inherited limit: absolutely positioned notes don't contribute to document height. His stretched grid cell behaves the same way, so it's a known constraint rather than a regression.

### Anchoring, storage and orphaning

His anchoring is tangled into the DOM code. Ours goes in `src/utils/annotations.ts` as pure functions, because it's both the most testable part and the part where his version is weakest.

Same record shape, with two changes:

- **Fuzzy re-anchoring.** When offsets no longer match, search the block for `prefix + quote + suffix`, then the block's neighbours, then `quote` alone. Only give up when the quote genuinely isn't in the article any more.
- **Orphan, don't delete.** A note whose anchor can't be found stays in storage and is surfaced as detached. Losing a reader's writing without telling them is not acceptable.

Storage key gets a schema version so a future record change can migrate rather than silently discard: `annotations:v1:${pathname}`.

### Render modes

The same three, with the same algorithms — the collision cursor, the inline insertion with its per-block `Map`, the `beforeprint`/`afterprint` pair plus the `@media print` fallback. The reflow triggers carry over too, including `document.fonts.ready`, which matters more for us than for him because the handwriting face loads late by design.

### Theming

The one place his CSS is no use to us. Every colour becomes a token, and specifically:

**The underline SVG can't read a custom property** from inside a data URI. Two options: ship two URIs and swap them with `light-dark()`, or use the SVG as a `mask-image` and let `background-color: var(--…)` do the colouring. Prefer the mask — one asset, themes for free.

Thin handwriting strokes also fade on charcoal at the same alpha that reads well on beige, so the note colour likely wants a different value per theme rather than one shared token.

### The handwriting face

A handwriting face will get used elsewhere on the site later, so this isn't a private choice belonging to one component. It becomes a real token, `--font-handwriting`, with a styleguide specimen and a font-reference entry — same standing as Literata, Geist, Figtree and Fira Code. That means it has to be good in the abstract, not merely good at small size in a gutter, and it should look like **script** rather than tidy print.

**Shortlist: Caveat, Kalam, Indie Flower.** Measured `woff2` bytes from the Fontsource CDN. We vendor one file per face with no `unicode-range` splitting (unlike his site, which loads three Kalam subsets separately), so the number that matters is latin + latin-ext — and it shouldn't be subset harder than that, because the *reader* types the content and may well type accents.

| Face         | Axis             | latin   | + latin-ext | Note                              |
| ------------ | ---------------- | ------- | ----------- | --------------------------------- |
| Caveat       | variable 400–700 | 73.2 KB | ~102 KB     | Front-runner; needs a ~15% bump   |
| Kalam        | static 400       | 21.8 KB | ~34 KB      | His choice; the one to beat       |
| Indie Flower | static 400       | 19.1 KB | ~30 KB      | Cheap script; may tip twee        |

For scale: Figtree is 27 KB, Geist 68 KB, Literata **394 KB**. Even Caveat is a quarter of Literata.

Caveat leads on the wider-use argument: it's the only shortlisted face with a weight axis, and for a site-level token that flexibility is worth the extra weight over Kalam. Kalam is the one to beat *on the page* — known-good, a third of the size, but much less script-like and therefore the weaker general-purpose face. Everything else tested was rejected for being upright print rather than script (Architects Daughter, Patrick Hand, Edu NSW ACT Foundation), too light (Shadows Into Light Two), or not actually handwriting despite the Fontsource category (Cause, Delius). Literata italic reads as *emphasis*, not annotation, which is what settles the question of buying a new face at all.

Note that `1.03rem` is a Kalam-specific number: at identical `font-size` these faces render at very different apparent sizes, so whichever wins needs its own size and line-height.

**Lazy loading is free.** A browser only downloads a webfont when rendered text actually matches the `@font-face`. Notes don't exist until a reader writes one, so readers who never annotate never fetch the face — no JS, no `document.fonts.load()`. The only thing that would break this is preloading, so `--font-handwriting` must **not** go in the `BaseHead.astro` preload list.

### Payload

This is the one rule the task genuinely spends: no-runtime-JS-by-default. It's honest progressive enhancement — the article renders and reads perfectly without the script — but it's still weight on every article page.

The idea to test: before a reader interacts, the only work needed is restoring existing notes and listening for `selectionchange`. So a tiny inline stub can read `localStorage` and either `import()` the module immediately (notes exist) or wait for the first non-collapsed selection (they don't). For most readers on most articles that's ~15 lines instead of ~11 KB, and it's the same logic we already applied to Pagefind. Phase 1 measures whether the deferred import adds visible lag between selecting and the button appearing; if it does, ship the module directly and accept the weight.

### Decisions taken

| Decision    | Call                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| Note face   | A script hand as `--font-handwriting`. Try Caveat, Kalam, Indie Flower    |
| Breakpoint  | Start at the TOC's `1400px`, expect to tune down after eyeballing it      |
| Note marker | A numeral in the handwriting face — try it and see                        |
| Invitation  | Selection popover only to start; a standing prompt is a likely follow-up  |
| Enabling    | All articles except those with a `redirectURL`                            |
| Payload     | Open — Phase 1 measures the lazy stub against shipping the module         |

## The plan

### Phase 1 — Scratchpad experiment

De-risk in `src/pages/scratchpad.astro` before writing anything real, the same way the command palette was built.

- [ ] Reproduce the tapered-bezier connector in isolation and confirm it reads as ink at our type sizes, not just his.
- [ ] Test the `mask-image` underline against the two-data-URI approach in both themes. Pick one.
- [ ] Confirm right-gutter absolute positioning holds at 1400px with `--measure-standard: 70ch` in Literata — measure the real gutter width, check a two-line note fits comfortably, then push the breakpoint down to find where it stops working.
- [ ] Try all three shortlisted faces in the real gutter. Calibrate each one's own size and line-height. Judge twice: as a margin note, **and** at display size as a general site face.
- [ ] Set the note colour per theme and check thin strokes hold up on charcoal, not just beige.
- [ ] Set a reference numeral in the chosen face and see whether it reads as a marker at 400 or needs a heavier weight. **This decides whether we need a variable face at all**, so answer it before vendoring anything.
- [ ] Measure the lazy-import stub. Confirm no visible lag between selection and button.

### Phase 2 — Anchoring and storage as pure functions

- [ ] `src/utils/annotations.ts`: record type, `fnv1a`, `blockId`, offset↔range conversion, serialise/deserialise, validation predicate.
- [ ] Fuzzy re-anchoring: `prefix + quote + suffix` in the block, then neighbours, then `quote` alone.
- [ ] Orphan state for notes that can't be re-anchored — kept in storage, surfaced as detached.
- [ ] Versioned storage key.
- [ ] Unit tests in `tests/unit/annotations.test.ts` — round-trip; exact restore; restore after an edit earlier in the same paragraph; restore after the quote itself is edited (must orphan, not mis-anchor); duplicate reference renumbering; corrupt and absent `localStorage`.

### Phase 3 — The component

- [ ] `src/components/layout/MarginAnnotations.astro`, barrel-exported, mounted in `Article.astro` for every article bar `redirectURL` ones, with `data-annotations-content` passed through `LongFormProseTypography`.
- [ ] Vendor the chosen face in `public/fonts/` with the version-dated filename convention, `@font-face` in `_foundation.css`, a `--font-handwriting` token beside the other four, and **no preload entry**. Docs and styleguide are Phase 6.
- [ ] Server-render all chrome hidden. Styles in the component's `<style is:global>` — marks and notes are injected into slotted MDX content, so scoping can't reach them.
- [ ] Selection handling, the fixed selection button, save/edit/delete, `Escape` to cancel. No standing invitation prompt for now.
- [ ] Margin layout: the sorted collision cursor, generated connectors, and the full set of reflow triggers.

### Phase 4 — Narrow viewports and print

- [ ] Inline mode below the breakpoint, inserted after the block (parent list for an `li`), several notes per block stacking in order.
- [ ] Reference numerals in the handwriting face, on both mark and inline note. Check against a real footnote reference in the same paragraph — the face is doing the work of telling them apart, so if it can't, revisit the marker.
- [ ] Print mode: the `beforeprint`/`afterprint` pair *and* the `@media print` fallback.
- [ ] Verify against an article carrying real footnotes, a `Callout`, a code block and a `BookmarkCard`.

### Phase 5 — Accessibility, export, tests

- [ ] Accessibility pass, at least matching his: `aria-describedby` on marks, `role="note"`, labelled textarea, `aria-hidden` connectors, keyboard-reachable edit and delete, visible focus. Then check with a screen reader.
- [ ] **Export.** A "copy my notes" action emitting markdown (quote + note, in document order). Small, and it's what stops the feature being a dead end.
- [ ] E2E coverage in `tests/e2e/` — annotate, reload and see it restored, edit, delete, narrow viewport, and an article with footnotes.
- [ ] `bun run check:all`, plus `bun run shoot /writing/<article>` in both themes at 1440 and 2560.

### Phase 6 — Fold `--font-handwriting` and the component into the system

The face is a site-level token, so it has to land everywhere the other four are documented — otherwise the next person or agent reaches for an inline `font-family`.

- [ ] **`docs/developer/fonts.md`** — a full per-font section following the existing pattern: source information (version, repository, build date), variable axes with CSS examples, OpenType features. Plus the overview-table row and the custom-properties list.
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

`docs/tasks-todo/temporary/marginalia-reference/` holds the decompiled original — the Prettier-formatted script, the extracted CSS, and the server-rendered markup — pulled from the live site on 2026-09-11. `docs/tasks-todo/temporary/font-specimen/` holds the face comparison (`specimen-light.png`, `specimen-dark.png`, regenerate with `node shoot.mjs`).

Both are gitignored and will eventually be cleaned up, which is why everything load-bearing is written into this document. The originals are useful for checking a detail, not as a dependency.
