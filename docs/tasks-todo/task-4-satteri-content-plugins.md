# Task 4: Port Content-Transform Plugins to Sätteri

## Overview

With the site building on Sätteri (Task 2), restore the content-transform plugins one group at a time, **verifying each against real content in both themes** before moving on. These are the mechanical ports — grouped into phases by theme, simplest first.

**Prerequisite:** Task 3 complete (processor is `satteri()`, site builds degraded).

**API reminders:** MDAST plugins run first (array order), then MDAST→HAST, then HAST plugins. Visitors get `(node, ctx)`; mutate only via `ctx`. `ctx.parent(node)` and `ctx.indexOf(node)` **do** exist (confirmed in Task 1 spike on satteri 0.9.5 — no inversion needed). `ctx.textContent` is whole-subtree.

## Phases

### Phase 1 — Code-fence component blocks (trivial)

Both turn a fenced code block into a component element — Sätteri's documented happy path (a `code` visitor returning an `mdxJsxFlowElement`). Gate to `.mdx` via `ctx.sourceFormat` (no `.md` content uses these fences, and the remapping they rely on is MDX-only). Our MDAST plugins run before Expressive Code's HAST plugin, so EC never sees the transformed fences (the `language "tree" not found` build warnings disappear).

- **`remark-markdown-preview`** (`src/lib/remark-markdown-preview.mjs`) — ` ```md preview ` → `<markdown-preview>`.
- **`remark-tree-block`** (`src/lib/remark-tree-block.mjs`) — ` ```tree ` → `<file-tree>`.

Verify against the styleguide and any real content using these fences.

### Phase 2 — Images (moderate)

- **`remark-image-caption`** (`src/lib/remark-image-caption.mjs`, MDAST) — moves a markdown image's `title` onto a `caption` hProperty consumed by `BasicImage`. MDX-only (gated on `.mdx` path). **Port at the HAST stage instead** (Task 3 review): whether Sätteri's Rust mdast→hast conversion honors `data.hProperties` is unknown, but `@astrojs/mdx` v7's img→component plugin runs *after* user `hastPlugins` and copies every `img` property verbatim into JSX attributes — so a HAST plugin doing `title` → `caption` on `img` elements is guaranteed to deliver the prop to `BasicImage`. Gate via `ctx.sourceFormat === 'mdx'`.
- **`rehype-unwrap-images`** (`src/lib/rehype-unwrap-images.mjs`, HAST) — strips the `<p>` wrapper around lone images so `img → BasicImage` (block `<figure>`) doesn't leave empty paragraphs (breaks the `Grid` component). Near-direct port: use `ctx.parent`/`ctx.indexOf` to splice the matching `<p>` in place. Reuse the `isImageContent`/`isWhitespace` helpers.

Verify: lone images render as clean `<figure>` with captions; `Grid` layout with images is correct; inline images inside text are untouched.

### Phase 3 — Links & headings (easy reimplements)

- **`rehype-external-links`** replacement (HAST) — Sätteri docs ship this as their example: filter `element` `["a"]`, add `target="_blank"` + `rel="noopener noreferrer"` for external hosts. External-host check aligned with SmartLink's semantics (http(s) **and not danny.is**) — a deliberate small improvement over the old plugin, which blank-targeted *all* absolute URLs including danny.is ones. Only affects plain-`.md` content (SmartLink handles `.mdx`).
- **`rehype-autolink-headings`** replacement (HAST) — filter `h1`–`h6`, append an anchor. Two Task 3/review findings shape this:
  1. **IDs:** native heading-IDs are hardcoded to run *after* user `hastPlugins`, so register `satteriHeadingIdsPlugin()` (public export of `@astrojs/markdown-satteri`) at the head of our own `hastPlugins` and read `node.properties.id` — the officially supported pattern (the plugin was made idempotent for exactly this, withastro/astro#17165; the trailing native run respects existing `id`s and doesn't duplicate `astro.headings`).
  2. **Anchor markup:** the trailing native run records each heading's TOC `text` via `textContent`, so the anchor must contribute **no text** (a literal `#` child would pollute `TableOfContents.astro` entries). Append `<a href="#slug" aria-label="Link to '…'"></a>` and render the `#` glyph via CSS `::after` in the existing `_typography.css` rule (which already targets `:is(h1…h6) > a[href^='#']`).

Verify: external links open in new tab with rel; heading anchors present and clickable; internal links untouched; article TOC text clean (no trailing `#`).

### Phase 4 — List density (moderate)

- **`rehype-list-density`** (`src/lib/rehype-list-density.mjs`, HAST) — adds `long-list-items` to lists whose items are long/paragraph-like. Near-direct port with `ctx.parent`/`ctx.indexOf` for the "skip if inside `li`" check; still hand-roll "exclude nested-list text" because `ctx.textContent` is whole-subtree.

Verify: long-item lists get generous spacing; short/nested lists unaffected.

## Success criteria

- [ ] All seven plugins ported and registered in the correct MDAST/HAST order.
- [ ] Each verified against real content in **both light and dark themes**.
- [ ] Config comment TODO list from Task 2 fully struck through except the frontmatter/mermaid items (Task 4).
- [ ] `bun run check:all` passes.

## References

- Plugins: `src/lib/remark-markdown-preview.mjs`, `remark-tree-block.mjs`, `remark-image-caption.mjs`, `rehype-unwrap-images.mjs`, `rehype-list-density.mjs`
- `BasicImage`: `src/components/mdx/BasicImage.astro`
- Sätteri HAST example (external-links): <https://satteri.bruits.org/docs/>
