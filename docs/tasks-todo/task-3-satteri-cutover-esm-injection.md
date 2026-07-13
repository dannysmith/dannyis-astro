# Task 3: Cutover — MDX ESM Auto-Injection + Flip to Sätteri

> **STATUS: DONE.** All programmatic checks green; manually verified by Danny in the dev server. The site builds on Sätteri (`satteri@0.9.5` / `@astrojs/markdown-satteri@0.3.4`). See **Completion notes** at the bottom — including two findings from `@astrojs/mdx` v7's Sätteri wiring that reshape Tasks 4 and 5.

## Overview

Build the one foundational plugin the whole migration hinges on — **module-level ESM injection into MDX** — and then **flip the live processor to `satteri()`**. After this task the site builds on Sätteri. Remaining features (captions, autolinks, reading-time, mermaid, …) will be *degraded but building*, and restored one at a time in Tasks 3–4, each verified against real content.

**Prerequisite:** Task 2 done (on Astro 7, `satteri@0.9.x` available). Task 1 gate passed (ESM injection + frontmatter read-back both proven on the 0.9.x API). A working draft of this plugin — written for the 0.9.x API (`ctx.data`, value-only `mdxjsEsm`) — is preserved at `docs/tasks-todo/temporary/satteri-spike/satteri-mdx-imports.mjs.reference`.

**Why ESM injection is foundational:** we auto-import every PascalCase MDX component from the barrel (`src/components/mdx/index.ts`) so content never writes explicit imports. Under Sätteri, `astro-auto-import` (a remark plugin) won't run — so without our own injector, every `<Callout>` etc. becomes an *undefined component* and MDX **fails to compile**. This is the one plugin that gates compilation, so it comes first.

Two related concerns share the same `mdxjsEsm` mechanism and live together here:

- **Auto-imports** — inject `import { A, B, … } from '@components/mdx'` (barrel-derived list) into every `.mdx`.
- **Page-components** — for routed `.mdx` using `Page.astro`, also inject `export const components = MDX_COMPONENT_REMAPPING` (today: `src/lib/remark-page-components.mjs`).

We build our own rather than depend on `@bhdouglass/satteri-auto-imports@0.0.1` (single-file, doesn't do `export const components`), but use it as **reference**. It's a small single file.

## Sätteri plugin API reminders

- Register via `satteri({ mdastPlugins: [...], hastPlugins: [...], features: {...} })`.
- Plugins: `defineMdastPlugin` / `defineHastPlugin` — an object with a `name` + visitors keyed by node type; visitors get `(node, ctx)`.
- Nodes are **read-only**; all mutation via `ctx` (`setProperty`, `replaceNode`, `insertBefore`, `prependChild`, `appendChild`, `textContent`, …). New nodes are plain spec-shaped objects.
- **No `parent`/`index` accessor, no root handle, no file-level data bag.**
- Factory form `(opts) => defineMdastPlugin({...})` gives per-document state reset.

## Phases

### Phase 1 — In-house auto-imports MDAST plugin

- New plugin (e.g. `src/lib/satteri-auto-imports.mjs`) that injects `import { … } from '@components/mdx'` at module level for every `.mdx`.
- Reuse the existing single-source-of-truth logic in `astro.config.ts`: derive the PascalCase export list from the barrel (`src/components/mdx/index.ts`) rather than hardcoding.
- Preserve today's constraint: content must **never** explicitly import from `@components/mdx` (would duplicate-declare). Keep the "skip if already imported" guard if the ESM path needs it.
- Reference `@bhdouglass/satteri-auto-imports` for the `{ name, from }` injection shape.

### Phase 2 — Page-components injection

- Port `remark-page-components` behaviour: for `.mdx` whose frontmatter `layout` basename is `Page.astro`, inject `export const components = MDX_COMPONENT_REMAPPING` (import from `@config/mdx-components`).
- Reuse the estree approach proven in Task 1. Keep the "respect a page's own `export const components`" guard.
- Decide: fold into the same plugin as Phase 1 (both inject module ESM) or a sibling plugin. Prefer one plugin if the injection helper is shared.

### Phase 3 — Flip the live processor to Sätteri

- Change `markdown.processor` from `unified()` to `satteri()`, wiring in the Phase 1–2 plugins and the needed `features` (directives etc. as required).
- **Delete** `rehypeHeadingIds` (native now) and the `astro-auto-import` integration + barrel-derived `AutoImport` block.
- **Remove** the `vite.build.rollupOptions.external: ['satteri', '@astrojs/markdown-satteri']` hack — those packages are now real dependencies, so the dead-code branch that motivated it no longer exists.
- Leave the not-yet-ported plugins as a tracked TODO list in the config (comment) so Task 3/4 have a checklist. Confirm **all** MDX content still compiles (degraded features are expected).

## Success criteria

- [ ] Every `.mdx` compiles under `satteri()` with no explicit component imports.
- [ ] Routed `Page.astro` MDX pages get the component remapping (links/images/tables render as our components).
- [ ] `rehypeHeadingIds`, `astro-auto-import`, and the vite `external` hack are gone.
- [ ] `bun run build` succeeds; site is browsable (features degraded, not broken).

## References

- Current config: `astro.config.mjs`
- Current plugins: `src/lib/remark-page-components.mjs`
- Reference impl: `@bhdouglass/satteri-auto-imports` — <https://gitlab.com/bhdouglass/satteri-plugins>

---

## Completion notes

### What shipped

- **`src/lib/satteri-mdx-imports.mjs`** — one MDAST plugin covering both Phase 1 (barrel auto-imports) and Phase 2 (Page.astro `export const components`), with unit tests in `tests/unit/satteri-mdx-imports.test.ts` (12 tests, run against the real `mdxToJs`/`markdownToHtml` compile API — Sätteri plugins are pleasantly unit-testable this way).
- `astro.config.mjs` flipped to `satteri()`. Deleted from config: `AutoImport` integration, `rehypeHeadingIds`, all unified plugin registrations, the vite `rollupOptions.external` hack. The old `src/lib/remark-*`/`rehype-*` plugins **stay on disk unloaded** (with their unit tests still passing) as reference until the migration completes — per Danny. `astro-auto-import` and the rehype packages stay in `package.json` until the Task 5 dependency cleanup.
- A `TODO` checklist comment in `astro.config.mjs` tracks the unported plugins for Tasks 4–5.

### Improvements over the spike draft (`temporary/satteri-spike/satteri-mdx-imports.mjs.reference`)

- Reads `layout` from **`ctx.data.astro.frontmatter`** (seeded by `@astrojs/mdx` v7 before plugins run) instead of gray-matter-parsing the raw `yaml` node — no extra dependency.
- Detects a user's own `export const components` by scanning `root.children` at injection time (via `node.parseExpression()` with a regex fallback) — the draft's visitor-ordering approach missed an ESM node placed *after* the first block. Injection itself: climb to root via `ctx.parent()`, `ctx.prependChild(root, nodes)`.
- Gates on `ctx.sourceFormat === 'mdx'` instead of sniffing `fileURL`.

### ⚠️ Finding 1 — mdx@7 DOES round-trip frontmatter writes (reshapes Task 5)

Task 1's caveat ("frontmatter injection silently dropped for `.mdx`") was true of `@astrojs/mdx` **v6** but is **fixed in v7**: `dist/satteri/index.js` seeds `data: { astro: { frontmatter } }` into `mdxToJs` and exports the **read-back** `result.data.astro.frontmatter` (with an `isFrontmatterValid` guard). So `minutesRead`/`hasFootnotes` *could* be ported as ordinary Sätteri plugins writing to the frontmatter bag — the entry.body approach is no longer forced. Re-evaluate in Task 5.

### ⚠️ Finding 2 — native heading-IDs run AFTER user hastPlugins (reshapes Task 4)

In both the `.md` (`satteri-processor.js`) and `.mdx` wiring, plugin order is hardcoded: highlight → **user hastPlugins** → image marker/component → **heading-IDs** → (mdx only) astro metadata. So Task 4's "autolink must run after native heading-IDs" is impossible via ordering. Fix: the autolink plugin slugs headings itself (github-slugger, already a transitive dep of `@astrojs/markdown-satteri`) and sets `id`; the native plugin respects an existing `id` and still records it into `astro.headings` for TOCs.

### Verification

- `bun run build` green **first try** — zero Sätteri parser-strictness fallout across all 124 `.md` + 76 `.mdx` files; 208 pages.
- Built-output spot checks: `<Callout>` renders as component; heading `id`s native; `/now` links render through SmartLink (`class="external"` + target/rel) proving the injected `export const components` works; native GFM footnotes render; no `undefined` leaks from the missing `minutesRead`.
- Expected degradations confirmed (all restored in Tasks 4–5): md-preview/tree/mermaid fences render as plain code blocks (EC warns `language "tree" … not found` at build — goes away in Task 4); no heading anchors; no `target="_blank"` on external links in plain-`.md` content (`.mdx` unaffected — SmartLink does it); no image captions/unwrapping; no `minutesRead`/`hasFootnotes`.
- `bun run check:all` green (incl. 14/14 e2e) **in a clean env** (`rm -rf node_modules && bun install --frozen-lockfile`) — no phantom deps exposed.
- Build no longer needs a headless browser (that was `rehype-mermaid`) — CI's playwright install still needed for e2e only.
