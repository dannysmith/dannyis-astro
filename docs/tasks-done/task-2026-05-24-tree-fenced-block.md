# `tree` Fenced Code Block → File Tree Component

## Background

Articles often need to show directory/file structures. The natural way to write one in markdown is a fenced block that renders as plain text on GitHub, in text editors, and from `tree(1)`:

````markdown
```tree
data/a1b2c3d4-e5f6-7890-abcd-ef1234567890/
├── init.mp4                          # HLS initialization segment
├── seg_000.m4s                       # ~4s media segments
├── seg_001.m4s
├── ...
├── stream.m3u8                       # HLS playlist
└── derivatives/
    ├── source.mp4                    # Stitched single-file MP4
    ├── 1080p.mp4
    └── thumbnail.jpg                 # Auto-selected best frame
```
````

On the rendered page this should turn into a macOS Finder-like file tree — folders and files with appropriate icons, optional collapsing, inline comments shown alongside (not as raw `#` text).

## Goal

Author writes a `tree` fenced block in MDX (or plain MD) using a `tree(1)`-style format. The build pipeline transforms it into a rich `<FileTree>` component on the page. The source stays human-readable in the repo / on GitHub / in editors.

## Requirements

### Input format — accepted variants

A single unified parser handles three common formats:

1. **GNU `tree(1)` Unicode (default)** — `├──`, `└──`, `│`, 4-space continuation. Primary target.
2. **GNU `tree --charset=ascii`** — `|--`, `` `-- ``, `|`.
3. **Hand-typed pipe/dash** — `|-`, `+--`, with 2-space or 4-space indent.

**Parsing strategy** — tree glyphs are pure decoration; the parser ignores *which* glyphs are used and derives structure purely from column position.

- For each line, find `contentCol` = column of the first character that is neither whitespace nor a tree glyph. Tree glyphs are any of `│ ├ └ ─ | + \ \` -`.
- Maintain a stack `[(col, node), …]`. For each new line: while top-of-stack `col >= contentCol`, pop. The remaining top is the parent. Push current.
- This is unit-agnostic: 2-space, 4-space, tabs, or mixed all work as long as columns increase when descending and decrease when ascending.
- Mixed glyphs in one tree are tolerated (real-world copy-paste happens).

Known limitation: filenames starting with `-` won't parse correctly (the `-` is consumed as a glyph). Vanishingly rare; documented.

Pure markdown unordered lists (`- file`) are **out of scope** — they're a different input shape (use Starlight directly if needed).

### Filename handling

- Filenames with spaces (`My New Video.mp4`).
- Dotfiles (`.videorc`, `.gitignore`).
- Extensionless files (`makefile`, `Dockerfile`).
- Folders identified by **either** a trailing `/` **or** having indented children beneath them (or both). A bare line ending in `/` with no children is still a folder.
- A literal entry of `...` (or `…`), with optional comment, renders as a visual ellipsis indicating "more files" — not as an actual file.

### Comments

- Single-line comments after `#`, rendered subtly to the right of the entry.
- Comment delimiter: ` # ` (space-hash-space-anything) or end-of-line ` #`. The leading space avoids colliding with filenames that contain `#`.
- Comment text is parsed as inline markdown (bold, links, code spans) at render time — the parser returns the raw comment string; the renderer handles the inline-markdown pass.

### Markdown links

Supported in two positions:

1. **Inside comments** (primary use case):
   ```tree
   ├── stream.m3u8     # HLS playlist for the [HLS spec](https://...)
   ```

2. **As the filename** (link to a representation elsewhere, e.g. GitHub):
   ```tree
   ├── [index.html](https://github.com/.../index.html)    # The index page
   └── [src/](https://github.com/.../src)                  # Source folder
   ```
   The link *text* is used for icon lookup and folder detection (trailing `/` belongs inside the brackets for folders).

### Expressive-Code-compatible meta attributes

Where reasonable, mirror the syntax EC users already know:

- `title="…"` — shown in the frame header.
- `frame="none"` — suppresses the window-style frame chrome. When set, the title (if also present) is ignored. Only `"none"` is recognised for now; any other value falls back to the default frame.
- Line highlight syntax `{2,5-7}` — subtly highlights those (1-based) rows in the tree. The parser records the 1-based source line of every entry so the renderer can apply highlight classes.

### Rendering

- macOS Finder-like appearance: icons + name + optional comment.
- Per-extension icons (Seti UI icon set, ported from Starlight). Distinct open/closed folder icons.
- Folders expanded by default; clickable to collapse via native `<details>`/`<summary>` — **zero runtime JS**.
- Frame chrome matches the site's existing code-block treatment.
- Light + dark mode parity using existing design tokens.

### Semantic HTML / accessibility

- Native `<details>`/`<summary>` for collapse — accessible by default (keyboard + screen reader expanded-state announcement).
- `<ul>` for siblings; `<li>` per entry.
- No ARIA `role="tree"` — that pattern requires full keyboard widget behaviour (arrow keys, typeahead, roving tabindex); applying it without that contract actively harms accessibility. APG and MDN both flag this. Our tree is a static illustration, not a browsable widget.
- Decorative tree glyphs and icons are CSS / `aria-hidden`.
- Files (leaves) are plain `<li>`; only folders wrap in `<details>`.

### Error behaviour

The parser throws at build time on catastrophic failure. Astro surfaces this in `dev` and fails the production build — broken trees never silently render.

**Hard errors** (throw with a clear message + offending block content):
- Empty or whitespace-only block.
- First content line is indented (no root entry to attach to).

**Tolerated quietly** (Postel's law):
- Blank lines anywhere — skipped.
- Mixed glyph styles in one tree.
- Inconsistent indentation within a depth level (stack-based parsing doesn't care).
- A flat list of files with no nesting (valid output: all entries at depth 0).

### Out of scope (for now)

- Authoring via markdown unordered lists (Starlight-style).
- Syntax highlighting inside the tree.
- Per-entry colour overrides.
- A "copy raw" button (the source is already in the MDX file).

## Approach decision

**Going with Option A — remark plugin + custom `<FileTree>` component**, mirroring the existing `remark-markdown-preview` → `MarkdownBlock` pattern in this repo.

Option B (build as an Expressive Code plugin) was viable but rejected: a file tree isn't semantically a `<pre><code>`, the EC frame/copy-button wins are small, and coupling to EC's hook lifecycle makes future evolution harder. Building it as a first-class component keeps full control over markup, CSS layers, and design tokens.

## Implementation plan (Option A)

Build order: parser as a pure standalone module first (TDD), then the icon set, then the remark plugin, then the renderer, then wiring + styleguide.

### Phase 1 — Parser (TDD, pure module, no Astro/remark plumbing)

Location: `src/lib/file-tree/parse-tree.ts`, tests in `tests/unit/file-tree-parser.test.ts`.

Output shape:

```ts
type TreeNode = FileNode | FolderNode | EllipsisNode;
type FileNode = { kind: 'file'; name: string; href?: string; comment?: string; line: number };
type FolderNode = { kind: 'folder'; name: string; href?: string; comment?: string; line: number; children: TreeNode[] };
type EllipsisNode = { kind: 'ellipsis'; comment?: string; line: number };
```

TDD phases — each phase writes failing tests, makes them pass, refactors, then moves on:

1. **Basics** — empty input throws; single file; flat list; one folder with one child; deep nesting; folder by trailing `/`; folder by having children.
2. **Multi-format** — same fixture rendered three ways (Unicode / ASCII / pipe-dash) parses to identical output.
3. **Special entries** — `...` and `…` become ellipsis kind; spaces in filenames; dotfiles; extensionless files.
4. **Comments** — ` # text` extracted as raw string; preserved verbatim for the renderer.
5. **Markdown-link filenames** — `[index.html](url)` → `{ name, href }`; `[derivatives/](url)` recognised as folder link.
6. **Line tracking** — each entry carries its 1-based source line.
7. **Error cases** — clear thrown messages for hard errors (empty block, leading-indented first line).

### Phase 2 — Icon resolution (via existing astro-icon)

Use the site's existing `astro-icon` system rather than introducing a new icon-management approach. No SVGs ported into the repo.

- Add one Iconify pack: `@iconify-json/simple-icons` (3,433 monochrome brand-logo icons, CC0). Pure-JSON data dep; same install pattern as the already-installed `@iconify-json/heroicons`.
- Folders + generic-category icons + fallback come from Heroicons (already installed): `heroicons:folder`, `heroicons:folder-open`, `heroicons:document`, `heroicons:photo` (images), `heroicons:film` (video), `heroicons:musical-note` (audio), `heroicons:archive-box` (archives).
- Language/tool specifics from simple-icons: `simple-icons:typescript`, `simple-icons:javascript`, `simple-icons:json`, `simple-icons:markdown`, `simple-icons:python`, `simple-icons:ruby`, `simple-icons:docker`, etc. Brand-logo aesthetic at small sizes reads as "this is a Ruby file / TS file" — same approach VS Code's Material Icons uses.
- `src/lib/file-tree/lookup-icon.ts` — thin functions `iconForFile(name)` and `iconForFolder(open?)` returning an Iconify-style icon name string.
- Resolution order: exact filename match (case-insensitive) → extension walk (`.test.ts` → `.ts`) → generic fallback. Hand-curated mapping table for the ~40–60 file types likely to appear in posts; anything else falls back to `heroicons:document`.
- Icons coloured monochrome via `currentColor`, foreground at reduced opacity for v1. Category-based accent colours from the syntax-highlighting palette can be layered on later as a CSS-only enhancement.

Why not the Atom `file-icons` Iconify pack (initial candidate): Iconify's import of that pack is incomplete — 237 of Atom's 907 icons are missing, including all the common ones (`js`, `python`, `ruby`, `markdown`, `json`, `react`, `git`). Verified against both the upstream `.icondb.js` and the Iconify JSON. simple-icons + heroicons covers what file-icons doesn't.

Why not port Starlight's Seti set: `@iconify-json/*` packages are pure-data dependencies (no install scripts, no executable code), the lowest supply-chain risk class. The icon-resolution layer is a thin abstraction — if a later dep-reduction pass swaps the icons for locally-ported SVGs, only `lookup-icon.ts` and the icon files change; the renderer and CSS don't.

### Phase 3 — Remark plugin

`src/lib/remark-tree-block.mjs`, modelled on `remark-markdown-preview.mjs`:

- Match `lang === 'tree'`.
- Parse meta string for `title="…"`, `frame="none"`, and `{1,3-5}` highlight ranges.
- Emit a `<file-tree>` `mdxJsxFlowElement` with `code`, `title`, `frame`, `highlight` props.

### Phase 4 — Renderer

`src/components/mdx/FileTree.astro`:

- Parse the tree (call the Phase 1 parser).
- Render the figure: `<figure class="file-tree">` → optional `<figcaption>` → `<ul role="list">` → entries.
- Folders: `<li class="folder"><details open><summary>…</summary><ul>…</ul></details></li>`.
- Files: `<li class="file">…</li>`.
- Ellipsis: `<li class="ellipsis" aria-hidden="true">…</li>`.
- Comment text rendered via inline-markdown pass (reuse the `marked` setup from `MarkdownBlock.astro`).
- Frame styling via existing design tokens; visually consistent with EC's terminal frame but not coupled.
- `frame="none"` → skip frame + caption.
- Apply `.is-highlighted` to rows whose line number is in the highlight set.

### Phase 5 — Wiring

- Add `'file-tree': FileTree` to `src/config/mdx-components.ts`.
- Add `remarkTreeBlock` to `astro.config.mjs`.

### Phase 6 — Styleguide

`src/pages/styleguide/_ContentComponents.astro` — examples covering: simple tree, with title, `frame="none"`, highlighted lines, ellipsis row, dotfiles / spaces / extensionless, markdown-link comments, markdown-link filenames, deeply nested, all three input formats producing the same output.

## Files involved

- `src/lib/file-tree/parse-tree.ts` (new — Phase 1)
- `src/lib/file-tree/parse-tree.types.ts` (new — Phase 1)
- `tests/unit/file-tree-parser.test.ts` (new — Phase 1)
- `src/lib/file-tree/lookup-icon.ts` (new — Phase 2; thin extension → icon-name map)
- `tests/unit/file-tree-icon-lookup.test.ts` (new — Phase 2)
- `package.json` (update — add `@iconify-json/simple-icons` — Phase 2)
- `src/lib/remark-tree-block.mjs` (new — Phase 3)
- `src/components/mdx/FileTree.astro` (new — Phase 4)
- `src/config/mdx-components.ts` (update — register `'file-tree'` — Phase 5)
- `astro.config.mjs` (update — wire up the remark plugin — Phase 5)
- `src/pages/styleguide/_ContentComponents.astro` (update — add examples — Phase 6)

## Open questions

None outstanding — ready to build when approved.
