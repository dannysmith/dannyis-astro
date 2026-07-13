# Task 5: Frontmatter Plugins, Mermaid & Finalise Sätteri

> **STATUS: code complete, all programmatic checks green — awaiting Danny's manual review.** See **Completion notes** at the bottom, including the two decisions taken (frontmatter plugins over entry.body; own build-time mermaid plugin over the client-side community package) and the one open question (when to delete the old reference plugins).

## Overview

Restore the last two feature groups — frontmatter-writing plugins and Mermaid — then clean up dependencies and lock in the Sätteri migration with a full quality pass. This is the final task: after it the site is fully on Sätteri, on Astro 7.

**Prerequisite:** Task 4 complete (content-transform plugins ported). Task 1 already proved frontmatter read-back works (for `.md`; `.mdx` handled below).

## Phases

### Phase 1 — Reading-time & footnote detection (moved OUT of the markdown pipeline)

**Task 1 finding:** the `ctx.data.astro.frontmatter` write-back works for `.md` but is **silently dropped for `.mdx`** (`@astrojs/mdx` v6 exports `frontmatter` from the original parsed YAML and never reads the Sätteri data bag back). Porting `remark-reading-time` / `remark-footnote-detector` as-is would lose `minutesRead` / `hasFootnotes` on all **76 `.mdx` files** (23 articles + 53 notes).

**⚠️ Task 3 finding — the above is FIXED in `@astrojs/mdx` v7:** its Sätteri path seeds `data.astro.frontmatter` into `mdxToJs` and exports the **read-back** value, so frontmatter writes round-trip for `.mdx` too. Both approaches are now viable — **re-evaluate here** (per Danny): (a) port both as small Sätteri MDAST plugins writing to the frontmatter bag (closest to today), or (b) compute from `entry.body` outside the pipeline and delete both plugins. Weigh: (b) is pipeline-independent and simpler config, but `entry.body` includes raw MDX/ESM syntax in the word count where (a) counts rendered text; and routed `.mdx` pages (not collections) have no `entry.body`, though only collections use these values today.

**Approach (pre-finding, now one of two options):** compute both **outside** the markdown pipeline, from `entry.body` (raw markdown), so it's format-agnostic and works uniformly for `.md` and `.mdx`. This deletes both remark plugins entirely.

- **Reading time** — a shared util (`reading-time` over `entry.body`) called where entries are loaded/rendered (content-collection config `transform`, or the Article/Note layouts + `writing/[...slug]/index.astro`, which already read `minutesRead`).
- **Footnote detection** — derive `hasFootnotes` from `entry.body` (e.g. presence of `[^…]:` definitions) in the same place.

Verify: `minutesRead` and `hasFootnotes` are correct on **both** `.md` and `.mdx` articles/notes and render in layouts. Confirm current readers (`src/layouts/Article.astro`, `src/pages/writing/[...slug]/index.astro`) still get the values.

### Phase 2 — Mermaid via `@xingwangzhe/satteri-mermaid`

Decision (issue #132): **keep build-time Mermaid** (no client JS), adopt the community package rather than dropping it. It's used only in `src/content/notes/note-styleguide.mdx` today but we want to retain the capability.

- Install `@xingwangzhe/satteri-mermaid` (v0.2.8; peer deps `satteri >= 0.8`, `mermaid >= 11`).
- Register both plugins — the dual approach is required because Sätteri's text transforms otherwise corrupt Mermaid's diamond-node syntax:
  ```js
  import { mermaidMdast, mermaidHast } from '@xingwangzhe/satteri-mermaid';
  satteri({
    mdastPlugins: [/* ...ours... */, mermaidMdast()],
    hastPlugins: [/* ...ours... */, mermaidHast()],
  });
  ```
- Reconcile with `markdown.syntaxHighlight.excludeLangs: ['mermaid']` (behaviour recorded in Task 1) so Mermaid fences aren't also syntax-highlighted.
- Remove the old `rehype-mermaid` wiring and confirm whether `src/config/mermaid.ts` config still applies (map onto the new plugin if needed).

Verify: the styleguide Mermaid diagram renders at **build time** with **zero client-side JS**; check both themes.

### Phase 3 — Dependency cleanup & quality pass

- Remove now-unused deps from `package.json`: `astro-auto-import`, `rehype-autolink-headings`, `rehype-external-links`, `rehype-mermaid`, and `@astrojs/markdown-remark` / `unified` if nothing else imports them. Run `bun run check:knip` to catch stragglers.
- Update `astro.config.ts` comments and remove the Task 2 TODO checklist.
- Update `docs/developer/` (markdown pipeline / architecture guide) to describe the Sätteri plugin set.
- Full `bun run check:all` (types → format → lint → unit + e2e), plus `check:knip` and `check:dupes`.
- Manual sweep of representative articles/notes/pages in **both themes**.

## Success criteria

- [ ] `minutesRead` + `hasFootnotes` populate correctly.
- [ ] Mermaid renders at build time, zero client JS, both themes.
- [ ] Old remark/rehype/mermaid/auto-import deps removed; `knip` clean.
- [ ] `bun run check:all` green.
- [ ] Developer docs updated. Site is fully on Sätteri (still Astro 6.4).

## References

- Plugins: `src/lib/remark-reading-time.mjs`, `remark-footnote-detector.mjs`
- Mermaid config: `src/config/mermaid.js`
- `@xingwangzhe/satteri-mermaid`: <https://github.com/xingwangzhe/satteri-mermaid>

---

## Completion notes

### Phase 1 — reading time & footnotes: ported as Sätteri plugins (decision)

Re-evaluated as agreed. Went with **frontmatter-bag plugins**, not the entry.body approach: mdx@7 verifiably round-trips `ctx.data.astro.frontmatter` writes (confirmed in production build — `.mdx` articles show "10 min read", `.md` show theirs); the `remarkPluginFrontmatter` contract stays intact so the single consumer (`src/pages/writing/[...slug]/index.astro`) needed zero changes; and AST-based footnote detection keeps ignoring `[^1]` inside code blocks, which a body regex could not. Both plugins share a new `defineRootPlugin` helper (`src/lib/satteri-root-plugin.mjs`) — "fire once per document with the root node" — since Sätteri has no root visitor. Reading-time registers FIRST in `mdastPlugins` so it measures the document before `satteriMdxImports` queues injected import statements (a small improvement: under `astro-auto-import` the injected ESM text was counted). `hasFootnotes` is always written (true/false), and `<InlineFootnotes />` gating verified both ways in the built site.

### Phase 2 — Mermaid: own build-time plugin (decision)

The planned `@xingwangzhe/satteri-mermaid` turned out to be **client-side**: it emits an empty `<pre class="mermaid">` and expects the browser to run `mermaid.run()` — incompatible with the "build-time, zero client JS" half of the decision. Meanwhile issue #132's "build-time port not expressible" is outdated: Sätteri now supports **async visitors** and node-returning filtered visitors. So `src/lib/satteri-mermaid.mjs` renders fences at build via **`mermaid-isomorphic`** (the same Playwright-based renderer inside `rehype-mermaid`, so the Vercel/CI story is unchanged) and replaces the `<pre>` with the inline `<svg>` — parity with rehype-mermaid's inline-svg strategy. `src/config/mermaid.js` theming passes straight through as `mermaidConfig`. Each diagram gets a unique id prefix (`mermaid-<n>-0`) — a shared renderer index would otherwise duplicate DOM ids when a page has several diagrams — and the site's `svg[id^='mermaid-']` CSS still matches. A render failure throws and fails the build (parity). Expressive Code and the highlight plugin both leave mermaid fences alone (`excludeLangs`), so there's no ordering conflict.

**⚠️ Gotcha found by Danny's visual review — splicing pre-rendered SVG/HTML verbatim needs a different mechanism per format, and never a hast parse.** Two failure modes hit in sequence:

1. *Parsed splice breaks attributes.* The first cut parsed the SVG with `hast-util-from-html` and returned the element tree; the parse camelCases SVG presentation attributes (`marker-end` → `markerEnd`) and Sätteri's serializer only maps *some* back (`text-anchor` survived, `markerEnd` came out verbatim-invalid) — every arrowhead vanished and sequence-diagram layout broke.
2. *`raw` nodes only work for `.md`.* The second cut returned `{ type: 'raw', value: svg }`: byte-for-byte on the markdown path, but the **MDX JSX compiler stringifies raw nodes to escaped text** — the styleguide note rendered the SVG source as prose.

Final mechanism, regression-tested for both paths: `.md` → `raw` node; `.mdx` → `mdxJsxFlowElement` named `Fragment` with a `set:html` attribute carrying the SVG string — the same mechanism `@astrojs/mdx`'s own `optimizeStatic` uses (Astro's MDX runtime always provides `Fragment`). Verification lesson: greps for `marker-end` pass on *escaped* output too — check for unescaped `<svg` / absence of `&lt;svg` when verifying raw splices.

### Phase 3 — dependency cleanup

- **Removed:** `astro-auto-import`, `rehype-autolink-headings`, `rehype-external-links`, `rehype-mermaid`, `@astrojs/markdown-remark` (direct dep — it stays in the tree transitively because `@astrojs/mdx@7` still ships the unified branch), and `mermaid` (comes with `mermaid-isomorphic`).
- **Added:** `mermaid-isomorphic` (only — `hast-util-from-html` was briefly added for the mermaid plugin's first cut, then removed with the raw-splice fix).
- **Kept deliberately:** `rehype` + `unist-util-visit` (real imports in `src/lib/tabs/process-panels.ts` — candidate for a later "replace with Sätteri?" look), `mdast-util-to-string` (only the old reference `remark-reading-time.mjs` imports it now), `reading-time` (new plugin uses it).
- Clean-env verification passed (`rm -rf node_modules && bun install --frozen-lockfile && build && check:all`) — no phantom deps exposed.
- **knip:** migration-relevant finding is that the old reference tests (`remark-markdown-preview.test.ts`, `remark-tree-block.test.ts`) import now-unlisted `unified`/`remark-parse`/`remark-mdx` (resolving only transitively). Other knip hits (BasicPage.astro, simple-icons, Props exports, date-fns) are pre-existing and unrelated. **jscpd** flags old-vs-new plugin clone pairs — expected, gone when old files are deleted.

### Open question

When to **delete the old plugins + their four test files** (`src/lib/remark-*.mjs`, `rehype-*.mjs` and `tests/unit/remark-*.test.ts`, `rehype-*.test.ts`): they were kept unloaded as in-repo reference during the migration (per Danny), but all ten ports are now done, git history preserves them forever, and deleting them clears the knip unlisted-deps and jscpd clone noise plus lets `mdast-util-to-string` go. Danny to decide (suggested: delete as part of Task 6 final cleanup).

### Developer-docs update

Deferred to Task 6 (which exists for exactly this), except the `astro.config.mjs` comments, which now describe the final pipeline.
