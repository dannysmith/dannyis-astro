# Upgrade to Astro 6.4 and bump remaining dependencies

## Goal

Move from `astro@^6.1.1` to the latest 6.4.x, bring all official integrations and third-party packages to current versions, and work through the remaining major-version dep bumps one at a time.

## Status

Phases 1–6 are committed on `astro-upgrade-v2`. Phases 7–9 are the deferred majors — each gets its own commit. Phase 10 is the final cross-cutting verify before the branch ships.

## Reference

- Astro 6.2 / 6.3 / 6.4 release posts — https://astro.build/blog/astro-620/, /astro-630/, /astro-640/
- Astro `v6` upgrade guide — https://docs.astro.build/en/guides/upgrade-to/v6/
- `withastro/astro#16883` — the "older `@astrojs/mdx` versions continue to work with Astro 6.x" guarantee that lets us stay on mdx 5 while mdx 6 is broken.
- The previous, abandoned attempt — branch `astro-6-4-upgrade` in this repo.

## Two persistent build/dev-time warnings (both upstream, no action available)

These will keep showing up until upstream changes. Don't chase them.

1. `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Inherent to staying on `@astrojs/mdx` 5 — mdx 5 doesn't understand the new `markdown.processor` abstraction, so we have to keep using the deprecated top-level keys. Goes away when mdx 6 ships a working release.
2. `markdown.gfm` and `markdown.smartypants` are deprecated. Fires only during RSS build. **This is an Astro 6.4 bug**: `experimental_AstroContainer.create()` calls `validateConfig(ASTRO_CONFIG_DEFAULTS, ...)`, and `ASTRO_CONFIG_DEFAULTS.markdown.gfm === true` (from `@astrojs/internal-helpers/markdown`), so Astro's own defaults trip Astro's own new deprecation check. Nothing we did caused it; nothing we can do about it from config.

## Completed phases

### Phase 1 — OG font swap [DONE]

The OG image pipeline now uses Geist (display) and Figtree (UI) TTFs instead of League Spartan. See `src/utils/og-image-generator.ts`, `src/utils/og-templates.ts`, `public/fonts/`. Docs in `docs/developer/fonts.md` updated. Cherry-picked from the previous attempt; nothing to do with the upgrade itself.

### Phase 2 — Astro 6.4 upgrade + mdx 5 pin + `svgOptimizer` rename [DONE]

`bunx @astrojs/upgrade` was run manually. It bumps `@astrojs/mdx` to 6.0.1, which ships a broken bundle (`dist/satteri/index.js` imports `satteri` at module top level; Rollup can't resolve it; build fails with `Rollup failed to resolve import "satteri"`). Pinned `@astrojs/mdx` back to `^5.0.6` in `package.json`. This pin is **non-negotiable until upstream ships a fixed mdx 6** (watch for 6.0.2+ or 6.1.x).

Also renamed `experimental.svgo: true` → `experimental.svgOptimizer: svgoOptimizer()` in `astro.config.mjs` (the 6.2 rename; the old name now hard-errors at startup). The factory is imported from `astro/config`.

Image config audit done at the same time — no changes needed:

- No `<Image>`/`<Picture>` components with `.svg` source anywhere in `src/` → the 6.3 `image.dangerouslyProcessSVG` default flip (now `false`) doesn't affect us.
- No `getImage()` calls in `src/`.
- No `image.remotePatterns` or `image.domains` in `astro.config.mjs` → the 6.3 remote-image-redirect change doesn't affect us.

Commits: `a56af8a`.

### Phase 3 — GFM fix for `.mdx` files [DONE]

After Phase 2, GFM features (footnotes, tables, task lists, strikethrough) broke in `.mdx` files but not `.md` files. Custom remark/rehype plugins still worked. Root cause:

Astro 6.4 moved the schema-level default for `markdown.gfm` and `markdown.smartypants` into the new `unified()` processor abstraction. The schema field is now `z.boolean().optional()` — undefined unless explicitly set. `@astrojs/mdx` 5 doesn't know about the processor abstraction; it reads `config.markdown.gfm` directly via its `extendMarkdownConfig` mechanism. It now sees `undefined`, which is falsy, so it never adds `remarkGfm` to its plugin chain. `.md` files were unaffected because they go through Astro's new processor pipeline, which falls back to `markdownConfigDefaults.gfm` (still `true`) from `@astrojs/internal-helpers`.

Fix: pass the flags directly to the mdx integration in `astro.config.mjs`:

```js
mdx({ gfm: true, smartypants: true })
```

Scoped exactly to the gap, doesn't touch `config.markdown.*`, doesn't trip the deprecation warning. Goes away alongside the mdx 5 pin when we eventually move to a fixed mdx 6 + adopt `markdown.processor`.

Verified: footnotes, tables, and task lists render correctly in `.mdx` articles.

Commit: bundled with `a56af8a` (the Astro upgrade commit on the working branch).

### Phase 4 — Safe in-range dep bumps [DONE]

`bun update` to pick up patch/minor bumps across 19 packages: `@iconify-json/simple-icons`, `marked`, `mermaid`, `react`, `react-dom`, `satori` (stayed in 0.18.x), `@playwright/test`, `@types/react`, `@typescript-eslint/*`, `eslint` (stayed in 9.x), `eslint-plugin-astro`, `jscpd`, `knip` (stayed in 5.x), `playwright`, `prettier`, `tsx`, `vitest`, `@eslint/js`. All caret pins were respected, so no major boundaries crossed.

Commit: `bfc688d`.

### Phase 5 — `astro-embed` + `astro-expressive-code` pin widens [DONE]

Two 0.x minors that needed the `package.json` pin widened by hand:

- `astro-embed`: `^0.12.0` → `^0.13.0`. The only breaking change is internals of `<Bluesky>`, which this site does not use.
- `astro-expressive-code`: `^0.41.7` → `^0.42.0`. No surface-level changes.

Commit: `e7cfac0`.

### Phase 6 — knip 5 → 6 [DONE]

Dev-tooling-only bump. Breaking changes don't affect us: we're on Node 22, don't use the dropped `classMembers` issue type, don't use the dropped `--include-libs`/`--isolate-workspaces` flags, don't use `--experimental-tags`, and don't consume the reporter/JSON shapes that changed. `knip.config.ts` works as-is.

Net effect on `bun run check:knip` output: v6 produces 5 fewer false-positive "unused exported type" findings than v5 (`LinkMetadata`, `LinkPreview`, `LoomCloneVideo`, `PageType`, `SEOData`). The 11 "Configuration hints" already existed in v5, so no new churn.

Commit: `e1754c5`.

## Remaining phases — deferred major version bumps

Each bump gets its own commit (and probably its own PR). **Do not bundle them.** Stop conditions for any of these: if the bump produces more than a small handful of fixes or surfaces an upstream incompatibility, revert the single commit and capture what you found in a fresh task.

### Phase 7 — ESLint 9 → 10

Lowest-risk of the three remaining. Peer audit (already done) confirms readiness:

- `@typescript-eslint/eslint-plugin` 8.60 → `eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"` ✓
- `@typescript-eslint/parser` 8.60 → same ✓
- `eslint-plugin-astro` 1.7 → `eslint: ">=8.57.0"` ✓
- `astro-eslint-parser` 1.4 → no peer constraint ✓
- Node 22.19 satisfies the new `^20.19.0 || ^22.13.0 || >=24` engine requirement ✓

**What may bite:**

- Three rules join `eslint:recommended` and will start reporting: `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`. Fix the findings or explicitly disable each in `eslint.config.js`.
- `no-shadow-restricted-names` now reports `globalThis` by default. Add `{ reportGlobalThis: false }` if it surfaces noise.
- `eslintrc` (legacy config) support removed entirely. We're on flat config already ✓
- `/* eslint-env */` comments are now errors. We have none (grepped) ✓
- Schema tightenings on `radix`, `func-names`, `no-invalid-regexp` — we don't configure these ✓
- The `v10_config_lookup_from_file` feature flag is now default behavior — we don't set the flag, no action ✓

**Procedure:**

1. Bump `eslint` and `@eslint/js` to `^10.x` in `package.json`. `bun install`.
2. `bun run check:lint`. Triage any new errors from the three new recommended rules. Most likely small handful of fixes.
3. `bun run check:all`. Commit.

### Phase 8 — Satori 0.18 → 0.27

Used in `src/utils/og-image-generator.ts` (`satori(element, options)` call) and `src/utils/og-templates.ts` (the `{ type, props }` element literals).

Changelog scan 0.19 → 0.27: **entirely features and fixes**, no signposted breaking changes. Notable: 0.21 added a ~10% perf improvement, 0.25 added CSS variables support, 0.26 added an opt-in builtin minimal JSX runtime (doesn't affect our manual `{ type, props }` setup).

**The real risk is verification, not migration.** Satori output is a binary PNG (via Resvg). There's no automated diff. The `@ts-expect-error` cast at `og-image-generator.ts:91` already decouples our element shape from satori's public types, so the API-surface change risk is low; the rendering output change risk is what to watch.

**Procedure:**

1. Capture pre-bump baselines for the three OG endpoints (article, note, default fallback) — open the current PNGs in a separate tab or save them.
2. Bump `satori` to `^0.27.x`. `bun install`.
3. `bun run build`. Inspect the same three OG endpoints. Compare pixel-stability against baselines. Subtle font kerning / layout shifts are acceptable if the design intent survives; anything that mangles glyph shapes, drops text, or breaks layout is a regression — revert.
4. `bun run check:all`. Commit.

### Phase 9 — TypeScript 5 → 6 (most aggressive defaults change)

**Bounded to 6.0.x.** `@typescript-eslint/*` 8.60 has `"typescript": ">=4.8.4 <6.1.0"` — it accepts TS 6.0.x but not 6.1+. Pin TypeScript to `~6.0.x` (or `^6.0.0` with care) until `@typescript-eslint` widens its range. Other peers are ready: `@astrojs/check` accepts `^5.0.0 || ^6.0.0`; `astro`/`tsx`/`vitest` have no typescript peer constraint.

**TS 6 default flips that DON'T affect us** (Astro's tsconfigs already set them):

- `strict: true` — `astro/tsconfigs/strict` already sets this ✓
- `target: es2025` — `astro/tsconfigs/base` overrides to `ESNext` ✓
- `module: esnext` — same ✓
- `moduleResolution`: we're on `Bundler` ✓

**TS 6 changes that MIGHT bite:**

- **`types: []` is now the default.** `astro/tsconfigs/base` does NOT set `types`. TS 6 will stop auto-loading every `@types/*` package from `node_modules`. Likely surfaces as missing globals from `@types/react`, `@types/react-dom`, `@types/node`, etc. Probable fix: add `"types": ["node"]` (or whatever check:types complains about) to `tsconfig.json`.
- **`noUncheckedSideEffectImports: true` default.** Could surface as new errors on side-effect-only imports. Astro projects usually fine but watch the diff.
- **`baseUrl` deprecation.** We set `"baseUrl": "."` at `tsconfig.json:5`. Still works in 6.0 but emits a deprecation warning; removed in 7.0. Path aliases via `paths` resolve relative to the tsconfig dir without `baseUrl`, so we can drop the line — but verify `paths` resolution still works after removal.
- **Hard removals** we don't use: `moduleResolution: classic`, `outFile`, `amd`/`umd`/`systemjs`/`none` modules, `no-default-lib` directive, `import asserts` syntax ✓

**Procedure:**

1. Bump `typescript` to `~6.0.x` (NOT `^6.0.0` — that would float to 6.1+ once it's out). `bun install`.
2. `bun run check:types`. Triage errors:
   - Likely first wave: missing types from no-auto-loaded `@types/*`. Add `"types": ["node", ...]` to `tsconfig.json`.
   - Possible second wave: `noUncheckedSideEffectImports` complaints. Address per occurrence.
   - Deprecation warning for `baseUrl`. Drop the line; verify `paths` still resolves.
3. **Stop condition:** if TS 6 errors look like more than ~10 minutes of fixup work across multiple files, revert and split it into its own task. Don't burn through the upgrade momentum patching dozens of TS errors.
4. `bun run check:all`. Commit.

## Phase 10 — Final cross-cutting verify

After Phases 7–9 (or after deferring any that bail out):

1. `bun run check:all` clean.
2. `bun run build` clean. Inspect via `bun run preview`.
3. Visually verify in both light and dark themes:
   - Article pages (typography, code blocks, callouts, **tables**, **footnotes**, **task lists** — the GFM gate from Phase 3)
   - Note pages (including the datepicker note's React island)
   - Styleguide
   - RSS feeds (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`)
   - OG image endpoints (article, note, default) — final pass after Phase 8
   - Mermaid diagrams
4. Run `bun run scrape-toolbox` to confirm the Playwright-based scraper still works.
5. Update `docs/developer/` for any documented patterns the upgrade changed. Likely just the `experimental.svgo` → `experimental.svgOptimizer` rename in `architecture-guide.md` if mentioned there.
6. Move this task to `tasks-done/` via `bun task:complete`.

## Captured for later (not in this task)

- **OG visual rework** — separate task once design intent is sketched.
- **`markdown.processor` migration + `@astrojs/mdx` 6 upgrade** — once a working `@astrojs/mdx` 6.x is published (track `@astrojs/mdx` patch versions; the bundle issue is in 6.0.1, watch for 6.0.2+ or 6.1.x). Adopting the processor abstraction is what clears the persistent `markdown.remarkPlugins/rehypePlugins/remarkRehype` deprecation warning. Also unlocks dropping the `mdx({ gfm: true, smartypants: true })` workaround from Phase 3.
- **`experimental_getFontFileURL` adoption** — only if Astro adds an explicit format option to request TTF/OTF variants from the Fonts API (Satori needs TTF; Astro's Fonts API currently serves WOFF2).
- **`@astrojs/markdown-satteri`** — only viable if the site ever drops its remark/rehype plugin set; it doesn't support them.
- **TypeScript 6.1+** — blocked on `@typescript-eslint` widening its `typescript` peer range past `<6.1.0`.
- **Astro 7** — the Rust compiler becomes the default and `experimental.rustCompiler` is deprecated. No action needed in 6.x; track for the eventual 7.0 upgrade.
