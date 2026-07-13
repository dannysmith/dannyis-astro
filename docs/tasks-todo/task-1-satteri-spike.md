# Task 1: Sätteri Spike & Go/No-Go Gate

> **STATUS: DONE — gate passed.** See the FINDINGS section below.
>
> **⚠️ Order reversed after this spike.** The spike ran against the *latest* `satteri@0.9.5` / `@astrojs/markdown-satteri@0.3.4`. But Astro 6.4's `@astrojs/mdx@6.0.3` is locked to `markdown-satteri@0.3.0` → `satteri@^0.8.0`, an **older, more limited** API (no `ctx.data`, no `ctx.parent()`/`indexOf()`, no frontmatter bag) that the community plugins don't support. Building Sätteri on 6.4 would mean targeting 0.8.x then rewriting for 0.9.x after the Astro 7 bump. So we now do **Astro 7 first** (Task 2), then Sätteri (Tasks 3–5) against `satteri@0.9.x` — the API this spike actually validated. The findings below therefore apply directly to the post-Astro-7 target.

## Overview

Before investing in a full port of our remark/rehype stack, run a throwaway spike to prove the two load-bearing unknowns that can't be worked around. **No production config changes until this gate clears.** If either unknown fails, we park the whole migration and re-evaluate after `satteri` hits 1.0 / upstream fixes land.

This task is pure de-risking with disposable stub plugins. The real ports happen in Tasks 2–4.

**Context:** see issue [#132](https://github.com/dannysmith/dannyis-astro/issues/132) for the full analysis. Migration order agreed: **Sätteri first (on Astro 6.4), then Astro 7** (Task 5). `@astrojs/mdx` v6 already ships Sätteri support, so we can adopt it without bumping the framework.

## Current state (July 2026)

- Astro **6.4.2**, `@astrojs/mdx` **6.0.3**, live processor is `unified()` (see `astro.config.ts`).
- `satteri` core **0.9.5**, `@astrojs/markdown-satteri` **0.3.3** — both pre-1.0, still churning.
- Mermaid is used in exactly one file (`src/content/notes/note-styleguide.mdx`), never in real content.

## The two unknowns to validate

Sätteri has **no file-level data bag**, uses **oxc** (not acorn) for MDX ESM, and nodes are **read-only views over Rust memory** (all mutation via `ctx`). Two consequences must be proven empirically:

1. **`mdxjsEsm` injection round-trips.** A Sätteri MDAST plugin can prepend a module-level `import { X } from '...'` **and** `export const components = X` from a string, and it compiles correctly through the oxc MDX path. ✅ unblocks **both** the auto-imports replacement **and** `remark-page-components` (Task 2).
2. **Frontmatter read-back works.** A plugin that writes a frontmatter value (today we do `data.astro.frontmatter.minutesRead = …`) is actually read back into the content-collection entry (`entry.data.minutesRead`) and/or `render()`'s `remarkPluginFrontmatter`. ✅ unblocks `remark-reading-time` + `remark-footnote-detector` (Task 4).

## Phases

### Phase 1 — Stand up Sätteri & confirm native features

- Install `satteri` + `@astrojs/markdown-satteri`.
- Temporarily route **only `.md`** through `satteri()` via the per-format processor option, leaving `.mdx` on `unified()`, so the live site is untouched.
- Confirm the build succeeds and verify the natives we currently get from plugins:
  - Heading IDs / slugs (native via `github-slugger` in `@astrojs/markdown-satteri`) — replaces `rehypeHeadingIds`.
  - `gfm` / `smartypants` mapped automatically from our existing `markdown` config.
  - **Expressive Code** renders through the Sätteri pipeline (expected ≥0.43.0).
  - Interaction of `markdown.syntaxHighlight.excludeLangs: ['mermaid']` with the Sätteri highlight plugin (UNKNOWN — record behaviour).

### Phase 2 — Prove unknown #1 (ESM injection)

- Write a disposable MDAST stub that prepends an `mdxjsEsm` node carrying **both** an `import` and an `export const components = …`, mirroring the estree we already hand-build in `src/lib/remark-page-components.mjs`.
- Point a throwaway test `.mdx` at `satteri()`, reference an auto-imported component + the components remapping, and confirm it compiles and renders.
- Note whether oxc needs a different estree shape than acorn (our current node supplies `data.estree`).

### Phase 3 — Prove unknown #2 (frontmatter read-back)

- Write a disposable MDAST stub that sets a frontmatter value (e.g. `minutesRead`).
- Confirm it surfaces in `entry.data` (via `getCollection`) and/or `remarkPluginFrontmatter` (via `render`). Record the exact mechanism `@astrojs/markdown-satteri` exposes for frontmatter writes (object bag vs raw-YAML string edit).

## Success criteria / decision gate

- [ ] Sätteri builds `.md` and native features (heading IDs, gfm, smartypants, Expressive Code) confirmed.
- [ ] `excludeLangs`/highlight interaction documented.
- [ ] **Unknown #1 passes** — `import` + `export const components` inject and compile.
- [ ] **Unknown #2 passes** — a frontmatter write is read back into the collection entry.
- [ ] Findings written back into issue #132.

**Gate:** both unknowns pass → proceed to Task 2. Either fails → park the migration, document why, revisit after `satteri` 1.0.

---

## FINDINGS (spike complete — GATE PASSED ✅)

Probed directly against the installed `satteri` **0.9.5** / `@astrojs/markdown-satteri` **0.3.4** compile API (`mdxToJs`, `markdownToHtml`) plus a read of the `@astrojs/mdx` v6 Sätteri wiring. Disposable probe: `docs/tasks-todo/temporary/satteri-spike/probe.mjs` (gitignored).

### Both load-bearing unknowns pass

- **Unknown #1 — `mdxjsEsm` injection round-trips: ✅ PASS.** A Sätteri MDAST plugin can prepend a module-level `mdxjsEsm` node and it compiles through the oxc MDX path. Confirmed for **both** a bare `import { … } from '…'` **and** the harder `import … ; export const components = …` (the `remark-page-components` case). **Simpler than today:** the node only needs a `value` **string** — no hand-built `data.estree` (our current `unified` plugin builds one; the Sätteri port can drop it). Injection is done via `ctx.parent(node)` → `ctx.prependChild(root, esm)`.
- **Unknown #2 — frontmatter read-back: ✅ PASS for `.md`.** Writing `ctx.data.astro.frontmatter.minutesRead` round-trips: `@astrojs/markdown-satteri` seeds `data.astro.frontmatter`, runs plugins, and returns `metadata.frontmatter = data.astro.frontmatter` to Astro. There **is** a real mutable data bag (the issue feared only raw-YAML string edits existed — it was written against an older Sätteri).

### ⚠️ New caveat — frontmatter injection does NOT work for `.mdx`

`@astrojs/mdx` v6's Sätteri path (`node_modules/@astrojs/mdx/dist/satteri/index.js`) calls `mdxToJs` **without seeding `data.astro`** and emits `export const frontmatter = <original parsed YAML>` — it never reads `result.data.astro.frontmatter` back. So a plugin writing to the frontmatter bag is **silently dropped for `.mdx`**. This affects **`remark-reading-time` (`minutesRead`) and `remark-footnote-detector` (`hasFootnotes`)** on the **76 `.mdx` files** (23 articles + 53 notes) — a real regression if ported as-is.

**Recommended fix (reshapes Task 4):** stop injecting these via the markdown pipeline. Compute both from `entry.body` at the content-collection / layout level (format-agnostic — works for `.md` and `.mdx` uniformly), which also lets us delete two remark plugins entirely. To be finalised in Task 4.

### Bonus findings that simplify Tasks 2–3

- **`ctx.parent(node)` and `ctx.indexOf(node)` DO exist** in 0.9.5. Issue #132 assumed neither did and planned "parent-side inversion" for `rehype-list-density` / `rehype-unwrap-images` — **not needed**; those ports are now near-direct. (Task 3 updated.)
- **Our `mdastPlugins` run on `.mdx`** (`[collectImages, ...satteriOptions.mdastPlugins]`), so auto-imports + page-components injection is viable — confirmed by unknown #1.
- **No per-format processor exists** — `markdown.processor` is a single processor and `@astrojs/mdx` inherits it, so `.md` and `.mdx` can't be split. Task 1's original "route only `.md` through `satteri()`" plan is not achievable; the spike used the compile API directly instead. Consequence: the Task 2 cutover is genuinely all-or-nothing (auto-imports must land with the flip, as already planned).

### Cross-cutting things still to validate in Task 2 (not gate blockers)

- End-to-end render on **real** content (alias resolution for `@components/mdx` / `@config/mdx-components`; Astro's MDX runtime actually applying an injected `export const components`).
- How much real content trips Sätteri's stricter parser / feature differences (directives, expressions) — survey during the cutover.

## Cleanup

Probe lives in gitignored `docs/tasks-todo/temporary/` — harmless to leave as a record. `satteri` + `@astrojs/markdown-satteri` are now installed (kept for Task 2). No production config was touched.

## References

- Issue [#132](https://github.com/dannysmith/dannyis-astro/issues/132)
- Sätteri docs: <https://satteri.bruits.org/docs/>
- `@bhdouglass/satteri-auto-imports` (reference for ESM injection): <https://gitlab.com/bhdouglass/satteri-plugins>
