# Task 3: Cutover — MDX ESM Auto-Injection + Flip to Sätteri

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

- Current config: `astro.config.ts`
- Current plugins: `src/lib/remark-page-components.mjs`
- Reference impl: `@bhdouglass/satteri-auto-imports` — <https://gitlab.com/bhdouglass/satteri-plugins>
