# Margin annotations

Readers can annotate an article in the right-hand margin. Select a phrase, click "Write in margin", and the phrase gets a hand-drawn underline while the note appears out in the gutter in Caveat, with an inked arrow pointing back at it. Notes are stored in the reader's own browser and never leave it.

Everything ships hidden and inert, so an article reads perfectly without the script.

## The parts

- **`src/utils/annotations.ts`** — the stored record and the anchoring. DOM-free, unit tested.
- **`src/utils/ink-arrow.ts`** — tapered-bezier arrow geometry.
- **`src/components/layout/MarginAnnotations.astro`** — marks, notes, the editor, layout, print.

Mounted in `Article.astro` inside `<LongFormProseTypography data-annotations-content>`, for every article without a `redirectURL`. Notes pages don't have it.

## Anchoring, and why a note doesn't just vanish

A record stores the quote, up to 32 characters of context either side, character offsets into the block's text, the block's index and tag, and a `blockId` (`tag:index:hash`).

`blockId` is a cheap "did this block change?" signal and **nothing more** — a mismatch never drops a note. Gating on it is what makes the prior art lose every note on a paragraph the moment a typo is fixed elsewhere in it. Only whether the quote is still present decides:

1. If the recorded offsets still hold the quote, it stays there — unless another candidate scores _strictly_ better on surviving context. Without that rule an edit elsewhere in a paragraph can shunt a note onto a different copy of the same phrase.
2. Otherwise every occurrence of the quote is scored by how much stored context still surrounds it, nearest block first.
3. A quote that's ambiguous with no surviving context **orphans** rather than guessing. An unambiguous one re-anchors even with no context at all.

`reanchor()` returns the record that should be stored, with coordinates and context refreshed — including when the quote hasn't moved but the text around it has, so records don't rot over successive edits. It returns the original object by identity when nothing needs saving, so callers compare with `!==`.

Orphans are kept, rendered as detached with a label, and never rewritten.

Storage is `localStorage` under `annotations:v1:<pathname>`, whole array rewritten per change, reads and writes wrapped so unreadable storage means no annotations rather than a broken page. Bump the version in `storageKey()` if the record shape changes.

Reference numerals aren't stored: they're computed at layout from document order, so annotating paragraph three and then paragraph one still numbers them 1, 2 down the page.

## What's annotatable

```
:scope > p, :scope > blockquote, :scope > :is(ul, ol) > li
```

Direct prose children only, so a selection can never be wrapped inside an MDX component and break it. Also excluded:

- **Headings** — our `h2` has a bottom border that fights the underline.
- **`.intro-paragraph`** — its own script rewrites text nodes on load, which would race the offsets.
- Code blocks, figures and anything full-bleed, by virtue of the selector.

Selections must start and end in the same block and can't overlap an existing mark.

## The three modes

One layout function, dispatching on available space rather than a breakpoint: it reads the grid's own used column widths, so nothing has to stay in sync with `--measure-standard` being in `ch`. Margin mode holds down to a 256px gutter (around 1328px viewport).

**Margin.** Notes are absolutely positioned in the gutter — an abspos child of the prose grid takes its containing block from `grid-column`, so the aside lands exactly on the third column with no width arithmetic. Notes are placed by a collision cursor, each pushed clear of the one above, with room reserved for the hover controls. **The editor is a participant in that same pass**, taking the slot its note will occupy, so opening it pushes the column down instead of landing on top of existing notes.

**Inline** (narrow). Notes go after their block — or after the whole list, for a list item — numbered like footnotes.

**Print.** An absolutely positioned element inside a container spanning several pages doesn't paginate, so on `beforeprint` each note moves in beside its own mark: the block becomes the positioning context and `top: auto` leaves the note at its static position, which is the mark's own line. The block then carries its note across page breaks. Two notes on one block print stacked beneath it with numerals, because print positions come from static positions and nothing measured during `beforeprint` describes the paginated page. `afterprint` puts it all back, and a `@media print` block is the safety net for any browser that never fires the events.

## Sharp edges

- **Never reparent a note during layout.** Moving a DOM node blurs a focused field inside it and drops the caret, making a note impossible to type into. Set `top`; only move a note when its parent is genuinely wrong.
- **The underline is two theme-keyed data URIs**, switched on `[data-theme]`. A data URI can't read a custom property, and both tidier options fail: an SVG carrying its own `prefers-color-scheme` query follows the OS in WebKit rather than the page, and `mask-image` hides the element's text too — losing it entirely in WebKit once a mark wraps a line. Keep the two colours in sync with `--color-annotation` by hand.
- **`position: fixed` doesn't escape the prose container.** `container-type: inline-size` makes `.longform-prose` a containing block for fixed descendants in both Chromium and WebKit, which is why the invite button is appended to `<body>`.
- **First-line alignment is measured**, not derived from `line-height`: `text-box-trim` plus a handwriting face makes the arithmetic unreliable.
- **Saving happens on blur, on Enter and on Save**, so the editor never holds a note the reader thinks they've written. Cancel and Escape are the only ways out without saving, which is why the editor's buttons prevent focus loss on `pointerdown` — otherwise the blur save would fire before the click landed.

## Deliberately not here

Accounts, sync or any server-side storage; shared or public annotations; cross-paragraph selections; exporting notes as markdown (worth doing eventually). Annotations on notes pages.
