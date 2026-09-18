# Task x: Reader margin annotations

## What it is

Readers can annotate an article in the right-hand margin, the way you'd write on a printout. Select a phrase, a "Write in margin" button appears, and saving underlines the phrase and writes the note out in the gutter in a handwriting face, with an inked arrow pointing back at it. Notes live in the reader's own browser and are never sent anywhere.

| Context         | Rendering                                                         |
| --------------- | ----------------------------------------------------------------- |
| Wide viewport   | Notes in the right gutter, arrows pointing at their phrases       |
| Narrow viewport | Notes inline beneath the annotated block, numbered like footnotes |
| Print           | Notes back out in the margin, with short connectors               |

Articles only, and not ones with a `redirectURL` (they bounce off-site immediately).

The idea is lifted from [blog.mastykarz.nl](https://blog.mastykarz.nl/your-product-didnt-get-worse/); Waldek Mastykarz's [The red pen](https://blog.mastykarz.nl/the-red-pen/) is the argument for why it's worth having. His version isn't published, so ours was reimplemented from the shipped bundle. The one thing we deliberately do better: his drops a note the moment its paragraph changes at all, silently. Ours re-anchors, and says so when it can't.

## What's built

| Piece                     | What it does                                            |
| ------------------------- | ------------------------------------------------------- |
| `utils/annotations.ts`    | The record, and anchoring that survives edits. 44 tests |
| `utils/ink-arrow.ts`      | Tapered-bezier arrow geometry                           |
| `MarginAnnotations.astro` | Marks, notes, editor, layout, print                     |
| Caveat v2.000             | `--font-handwriting` + `--color-annotation` tokens      |

Mounted in `Article.astro` inside `<LongFormProseTypography data-annotations-content>`, for every article without a `redirectURL`.

## Decisions worth knowing

The things the code can't tell you on its own.

**Anchoring never trusts the hash.** `blockId` is stored as a cheap "did this block change?" signal, but a mismatch never drops a note — that mismatch _is_ the silent-data-loss bug. Only whether the quote is still present decides. An annotation whose recorded offsets still hold its quote stays put unless another candidate scores _strictly_ better on surviving context, so an edit elsewhere in a paragraph can't shunt a note onto another copy of the same phrase. An ambiguous quote with no surviving context orphans rather than guessing; an unambiguous one re-anchors even with no context at all. Detached notes are kept, shown as detached, and never rewritten.

**One layout pass, and the editor is in it.** Notes are placed by a collision cursor, and the editor takes a slot alongside them — open it and the column moves out of the way, rather than the editor landing on top of notes. The hover controls have their room reserved too. First-line alignment is _measured_ (a Range over the note's text), because `text-box-trim` plus a handwriting face makes line-height arithmetic unreliable.

**Never reparent a note during layout.** Moving a DOM node blurs a focused field inside it and drops the caret, which makes a note impossible to type into. Set `top`; only move a note when its parent is genuinely wrong.

**Numbering follows the document, not creation order** — otherwise annotating paragraph three and then paragraph one numbers them 2, 1 down the page. Numerals aren't stored; they're computed at layout.

**The underline is two theme-keyed data URIs.** A data URI can't read a custom property, and both tidier alternatives fail: a single SVG carrying its own `prefers-color-scheme` query follows the _OS_ in WebKit rather than the page, so anyone overriding their OS theme gets around 2:1 contrast; and `mask-image` hides the element's text too, losing it altogether in WebKit once a mark wraps a line. The Custom Highlight API would remove the DOM wrapping entirely but can't take a `background-image` (so no hand-drawn underline) and leaves no element for `aria-describedby`.

**Ink is grey, not coral.** Coral is already the footnote and link colour, so coral reader marks read as the author's.

**Mode comes from the measured gutter**, not a breakpoint: the grid's own used column widths decide, so nothing has to stay in sync with `--measure-standard` being in `ch`. Margin mode holds down to a 256px gutter (around 1328px viewport), inline below that.

**Caveat needs its 700 for the numeral** — at 400 it's too faint to read as a marker. It's split by `unicode-range` rather than the site's usual one file per face, because the reader supplies the text: latin covers almost everyone, and latin-ext arrives only if someone types an accent. Deliberately **not preloaded**, so it's fetched the first time a note renders.

**Blocks are paragraphs, blockquotes and list items only.** No headings (our `h2` border fights the underline), nothing inside an MDX component, and not `.intro-paragraph` (its own script rewrites text nodes on load, which would race the offsets).

**Print moves each note in beside its mark.** An absolutely positioned element inside a container spanning several pages doesn't paginate, so notes hang off the block instead, which is in flow. Two notes on one block print stacked beneath it with numerals, because print positions come from static positions and there's no collision pass to run. There's a `@media print` safety net for any browser that never fires `beforeprint`.

## What's left

### Manual testing (Danny) ✅

- [x] Annotate around a `Callout`, a code block, a `BookmarkCard` and real footnotes — not inside them.
- [x] Several notes on one block, and a note on a list item, in both margin and inline modes.
- [x] Print an annotated article for real.
- [x] Detached notes stay as they are: a plain stack at the end of the margin, labelled, with no arrow or numeral. Reviewed and accepted rather than dressed up.

The gitignored harnesses in `docs/tasks-todo/temporary/margin-lab/` drive a browser against a real article if any of this needs reproducing (`inspect.mjs`, `verify-*.mjs`, `shoot-*.mjs`, `grid.mjs`).

### Documentation and styleguide ✅

- [x] **`docs/developer/fonts.md`** — a `## Caveat` section, the overview-table row, the stack list and the purpose table. The preload guidance now says explicitly that this one isn't preloaded and shouldn't be, and the section records the `unicode-range` split and the absence of static TTFs.
- [x] **`docs/developer/design-tokens.md`** — `--font-handwriting` in the font table, `--color-annotation` in the semantic colours.
- [x] **`src/pages/styleguide/foundations.astro`** — a fifth `<SGTypeSpecimen>`, and the intro prose rewritten (it claimed five contexts across four stacks).
- [x] **`docs/developer/margin-annotations.md`** — the anchoring contract, storage, what's annotatable, the three modes, and the sharp edges.
- [x] **`AGENTS.md`** — a line under key features.

### Review

- [ ] Accessibility pass, including a screen-reader run: mark-to-note association, `role="note"`, the labelled editor, keyboard-only create / edit / delete, focus handling after save and delete, and the detached label.
- [ ] Full review of the new code on this branch.
- [ ] `bun run check:all`, plus `check:knip` and `check:dupes` (this adds two utils, a component and a font).

## Out of scope

- Notes pages, and any collection other than `articles`.
- Accounts, sync, or server-side storage. Notes stay in the reader's browser.
- Public or shared annotations.
- Cross-paragraph selections, and annotating code blocks, images, embeds, intro paragraphs or anything inside an MDX component.
- Exporting notes as markdown. Worth doing eventually — notes that can't leave the browser are a bit of a dead end — but not now.
- E2E coverage, styleguide examples for the mark, note and connector, and a static TTF for the OG pipeline (nothing sets handwriting type in OG images).
- A standing "this margin is yours" prompt. The selection popover is the only affordance for now.
