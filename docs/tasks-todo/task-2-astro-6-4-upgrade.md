# Upgrade to Astro 6.4 and bump remaining dependencies

## Goal

Move from `astro@^6.1.1` to the latest 6.4.x, bring all official integrations and third-party packages to current versions, and selectively adopt the new APIs introduced across 6.2 → 6.4 where they're actually useful for this site.

## Read this first — context from the previous attempt

This is the **second** attempt at this upgrade. The first one (branch `astro-6-4-upgrade`, not merged) ran into upstream bugs and accumulated entangled state that became impossible to debug cleanly. Rather than untangle it, we're redoing the work from scratch on a fresh branch (`astro-upgrade-v2`, off `main`) with the lessons-learned baked into the phase structure below. The old branch is preserved for reference.

The OG font swap (Geist + Figtree) was clean and self-contained, so it's already been cherry-picked onto this branch as the first two commits. Treat it as Phase 1 = done. The work below starts at Phase 2.

### Hard-won lessons from the first attempt

These are the things to know going in:

1. **`bunx @astrojs/upgrade` defaults to pnpm.** It writes a `pnpm-lock.yaml` and rebuilds `node_modules` via pnpm. After running it, you must:
   ```bash
   rm -f pnpm-lock.yaml
   rm -rf node_modules
   bun install
   ```
   `package.json` is what we keep; everything else gets re-resolved by bun.

2. **`@astrojs/mdx` 6.0.1 ships a broken bundle.** Its `dist/satteri/index.js` imports `satteri` at module top level. Rollup walks the dynamic import to that file when building, can't resolve `satteri` (which is opt-in via `@astrojs/markdown-satteri` and not in our deps), and the build fails with `Rollup failed to resolve import "satteri"`. Astro 6.4 *explicitly supports* older `@astrojs/mdx` versions for this transition period — see withastro/astro#16883 ("older versions of @astrojs/mdx continue to work when used with Astro 6.x. This entry point will be removed in Astro 7"). **Pin `@astrojs/mdx` to `^5.0.6`.** This is non-negotiable until upstream ships a fixed mdx 6.

3. **Do not attempt the `markdown.processor` migration.** mdx 5 does not understand `markdown.processor`. It only reads from top-level `markdown.remarkPlugins` / `rehypePlugins`. The deprecation warning on `astro dev` startup is the price of staying on mdx 5 — it's a warning, not an error, and the plugins work. The migration becomes available again when a fixed mdx 6 ships.

4. **`experimental.svgo` was renamed to `experimental.svgOptimizer` in Astro 6.2, and the new API takes a factory call, not a boolean.** Import the factory from `astro/config`:
   ```js
   import { defineConfig, svgoOptimizer } from 'astro/config';
   // ...
   experimental: {
     svgOptimizer: svgoOptimizer(),
   },
   ```

5. **GFM features (footnotes via `[^1]`, tables via `| col |`) MUST be verified after the upgrade.** During the first attempt, both broke at some point in the branch state — and the breakage survived a revert of the `markdown.processor` migration, so the root cause wasn't the migration. We never isolated what actually broke them. **This is the single most important verification gate of the whole upgrade.** If a clean upgrade on this fresh branch breaks GFM features, stop and investigate before doing anything else.

6. **There are some 0.x dep bumps that need the `package.json` pin widened** (bun won't take them via `bun update` alone): `astro-embed 0.12 → 0.13`, `astro-expressive-code 0.41 → 0.42`. Both were verified safe in the first attempt — astro-embed 0.13's only breaking change is to the `<Bluesky>` component internals, which we don't use; astro-expressive-code 0.42 has no surface-level changes.

7. **`bunx @astrojs/upgrade` tells you `@astrojs/mdx` has breaking changes** and asks you to confirm. Answer **Yes** — but understand the breaking-change PR (#16848) is the markdown processor abstraction, which we are deliberately *not* adopting.

## References

- Astro 6.2 release post — https://astro.build/blog/astro-620/
- Astro 6.3 release post — https://astro.build/blog/astro-630/
- Astro 6.4 release post — https://astro.build/blog/astro-640/
- Astro `v6` upgrade guide — https://docs.astro.build/en/guides/upgrade-to/v6/
- `withastro/astro` changelog — https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md
- withastro/astro#16883 (the "older mdx versions continue to work" fix) — https://github.com/withastro/astro/pull/16883
- The previous, abandoned attempt — branch `astro-6-4-upgrade` in this repo

## Phases

Run `bun run check:all` after each phase. Run `bun run build` at the verification gates called out below — a full build is the only thing that catches certain failure modes (notably the mdx 6 bundle issue, but also any GFM regression). Dev server is fine for everything else.

Commit per phase. Keep diffs bisectable.

### Phase 1 — OG font swap [ DONE — already on this branch ]

The OG image pipeline now uses Geist (display) and Figtree (UI) TTFs instead of League Spartan. See `src/utils/og-image-generator.ts`, `src/utils/og-templates.ts`, `public/fonts/`. Docs in `docs/developer/fonts.md` updated.

This phase has nothing to do with the Astro upgrade — it was cherry-picked from the previous attempt's branch because it was clean and self-contained.

### Phase 2 — Run the official upgrade tool + pin mdx 5

This is the **highest-risk phase** of the whole task. Get it right and the rest is straightforward.

1. Run `bunx @astrojs/upgrade`. It will:
   - Resolve upgrade targets for astro core and the official integrations.
   - Tell you `@astrojs/mdx` has a breaking change. Confirm Yes.
   - Run `pnpm install` (yes, pnpm, even though we use bun). This creates `pnpm-lock.yaml`.

2. Clean up the pnpm artifacts and re-resolve with bun:
   ```bash
   rm -f pnpm-lock.yaml
   rm -rf node_modules
   bun install
   ```

3. **Immediately pin `@astrojs/mdx` back to `^5.0.6`** in `package.json` (the upgrade tool will have moved it to ^6.x.x). Then `bun install` again.

   ```diff
   - "@astrojs/mdx": "^6.0.1",
   + "@astrojs/mdx": "^5.0.6",
   ```

4. Run `bun run check:types`. Expect:
   - One Astro deprecation: `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. **This warning is expected and unavoidable while we're on mdx 5.** Do not try to silence it by migrating to `markdown.processor` — that's the trap that derailed the first attempt.
   - One config error: `Invalid or outdated experimental feature`. That's the `experimental.svgo` → `experimental.svgOptimizer` rename being required. Fix it as the first sub-step of Phase 3 below before considering the upgrade verified.

5. **Run `bun run build`.** This must succeed. If it fails on the satteri import, re-check that the mdx pin is `^5.0.6` and bun has actually picked it up (`bun pm ls | grep mdx`).

6. **Verification gate — GFM features.** Run `bun run dev` and visit:
   - An article with a footnote (e.g. anything containing `[^1]` syntax) — verify the footnote renders as a superscript reference link, not as literal text.
   - An article with a markdown table (e.g. the styleguide article, or any article with `| col | col |` syntax) — verify it renders as an HTML `<table>`, not as literal pipe-separated text.

   If either is broken, **stop here** and investigate. This is the regression the first attempt hit and never isolated. Possible angles to start from: stale `.astro/` cache (try `rm -rf .astro && bun run sync`), GFM-related changes between `@astrojs/markdown-remark` 7.1 → 7.2, mdx 5.0.3 → 5.0.6 changelog, or Astro 6.4 default GFM handling for `.mdx` files specifically. Do not move on to later phases until GFM works.

7. Commit. Suggested message: `Phase 2: Astro 6.4 upgrade + mdx pin to 5.0.6` with a body explaining the mdx pin reason.

### Phase 3 — Required config changes

1. Rename `experimental.svgo: true` → `experimental.svgOptimizer: svgoOptimizer()` in `astro.config.mjs`:
   ```diff
   - import { defineConfig } from 'astro/config';
   + import { defineConfig, svgoOptimizer } from 'astro/config';
   // ...
     experimental: {
   -   svgo: true,
   +   svgOptimizer: svgoOptimizer(),
     },
   ```

2. Image config audit (6.3 changes):
   - `image.dangerouslyProcessSVG` — default flipped to `false`. Only matters if `<Image>` / `<Picture>` / `getImage()` is called with an `.svg` source.
     ```bash
     grep -rnE '<(Image|Picture)[^>]*src=[^>]*\.svg' src/
     grep -rnE 'getImage\(' src/
     ```
     Both were empty at the time of writing — re-verify.
   - Remote image redirects (6.3): now follow up to 10 redirects but require each URL to match `image.remotePatterns` / `image.domains`. We don't configure remote image sources, so no-op — verify by checking `astro.config.mjs` has no `image.remotePatterns` or `image.domains`.

3. `bun run check:all` and `bun run build`. Both must be clean.

4. Commit.

### Phase 4 — Bump remaining dependencies

#### Tier A — safe in-range bumps

`bun update` will take all of these. Quick sanity check after with `bun run check:all`.

Last-known-safe targets from the first attempt: `@iconify-json/simple-icons`, `marked`, `mermaid`, `react`, `react-dom`, `satori` (0.18.x only — see Phase 8), `@playwright/test`, `@types/react`, `@typescript-eslint/*`, `eslint` (9.x only), `eslint-plugin-astro`, `jscpd`, `knip` (5.x only), `playwright`, `prettier`, `tsx`, `vitest`.

#### Tier B — 0.x minors that need the pin widened in `package.json`

Both verified safe in the first attempt:

- `astro-embed`: `^0.12.0` → `^0.13.0`. The only breaking change is internals of `<Bluesky>`, which this site does not use (only plain link references to bsky.app exist).
- `astro-expressive-code`: `^0.41.7` → `^0.42.0`. No surface-level changes.

Edit `package.json`, then `bun install`.

#### Verification

`bun run check:all` and `bun run build`. Re-verify the GFM gate from Phase 2.6 — footnotes and tables still render correctly. Commit.

### Phase 5 — Other migrations from the Astro 6.4 release notes

Most of the new 6.4 features are not useful for this site or not currently adoptable:

- **`markdown.processor` migration**: **NOT YET** — blocked while we're pinned to mdx 5. Revisit when mdx 6 ships a working release (track `@astrojs/mdx` patch versions; the bundle issue is in 6.0.1, watch for 6.0.2+ or 6.1.x).
- **`experimental_getFontFileURL` from `astro:assets`**: not useful for the OG pipeline because the Fonts API serves WOFF2 and Satori needs TTF. Skip.
- **`@astrojs/markdown-satteri`**: explicitly not adopting — does not support remark/rehype plugins, which we rely on.
- **Astro 7 Rust compiler default**: not relevant in 6.x; will fold into the eventual 7.0 upgrade.

If none of those apply, this phase is a no-op. Note it in the commit message and move on.

### Phase 6 — `compressHTML: 'jsx'` experiment

Added in Astro 6.2. Strips whitespace using JSX rules. Smaller HTML output; whitespace inside `<pre>` preserved so code blocks are safe.

In the first attempt this was tested cleanly — the size delta was small (~0.5–2% per page) and the diffs showed only purely-decorative whitespace being collapsed (between block tags, inside flex containers where CSS controls spacing). Inter-sentence and inter-inline-element whitespace was preserved.

1. Capture a "before" snapshot of representative pages so the diff is easy:
   ```bash
   rm -rf dist && bun run build
   mkdir -p /tmp/before
   cp dist/writing/article-styleguide/index.html /tmp/before/styleguide.html
   cp dist/writing/website-redesign-ii/index.html /tmp/before/article-footnotes.html
   cp dist/index.html /tmp/before/home.html
   cp dist/rss.xml /tmp/before/rss.xml
   ```

2. Add `compressHTML: 'jsx'` at the top level of `defineConfig({...})` in `astro.config.mjs`.

3. Rebuild. Save the same pages to `/tmp/after/`.

4. Visually compare: byte sizes (small drop = good), then `grep` around the Notion-emoji span region in the styleguide, the footnote area in the article, and the footer nav links. Anything that mashes adjacent text together at a visible boundary is a regression — revert. Anything that collapses inter-tag whitespace inside flex containers or trims trailing space inside text spans is safe.

5. If clean, commit. If anything looks off, revert the config change and capture what you saw in a follow-up task.

### Phase 7 — Final verify and tidy

1. `bun run check:all` clean.
2. `bun run build` clean. Inspect via `bun run preview`.
3. Visually verify in both light and dark themes:
   - Article pages (typography, code blocks, callouts, **tables**, **footnotes**)
   - Note pages (including the datepicker note's React island)
   - Styleguide
   - RSS feeds (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`)
   - OG image endpoints (article, note, default)
   - Mermaid diagrams (drop a temporary `mermaid` block in a draft article if no existing content uses them)
4. Run `bun run scrape-toolbox` to confirm the Playwright-based scraper still works.
5. Update `docs/developer/` where any of these changes touch documented patterns. Likely candidates:
   - `architecture-guide.md` if config shape changed beyond the `svgo` rename
   - `content-system.md` for anything OG-stack-related not already covered

### Phase 8 — Explore the deferred major version bumps

Phase 4's Tier A intentionally skipped four major-version bumps because each one has a wide enough blast radius to deserve its own pass. Now that everything else is green and verified in production, work through these one at a time. **Do not bundle them** — each gets its own commit (and probably its own PR) so any regression can be bisected cleanly.

Likely sequence (lowest risk → highest):

1. **`knip` 5 → 6.** Dev tool only; doesn't affect runtime or build output. Risk is local to `knip.config.ts`. Check the v6 migration guide for config-schema changes; rewrite `knip.config.ts` if needed; run `bun run check:knip` and confirm no new false-positives. If the v6 output noise drops or the config gets simpler, take it; if it just adds churn, revert.

2. **`@eslint/js` 9 → 10, `eslint` 9 → 10.** Likely needs matching bumps for `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-astro`, and `astro-eslint-parser` (check each one's eslint peer constraint first). Run `bun run check:lint` and triage any new errors. Most likely to surface as a flat-config syntax change or a few rule defaults flipping.

3. **`satori` 0.18 → 0.26.** Used directly in `src/utils/og-image-generator.ts` and consumed via JSX-like templates in `src/utils/og-templates.ts`. This is the riskiest of the four because the output is binary (PNG) and harder to diff. Process:
   - Read the satori CHANGELOG between 0.18 and 0.26 — particularly anything around the `satori(element, options)` signature, font options shape, the `@ts-expect-error` cast we currently rely on (`og-image-generator.ts:113`), and the SVG output structure (resvg consumes it next).
   - Bump and run the OG endpoints locally for an article, a note, and the default fallback. Visually compare against a pre-bump baseline (open the previous PNGs in a separate tab; the rendering should be pixel-stable apart from any deliberate font change).
   - If Satori 0.26 needs a different element type, update the templates rather than fighting the cast.

4. **`typescript` 5 → 6.** Highest cascade risk and depends on peer tools being ready.
   - **First** verify peer compatibility: `astro` (check the `typescript` peerDependency on the installed Astro 6.4.x), `@astrojs/check`, `@typescript-eslint/*`, `tsx`, `vitest`. If any of these don't yet accept TS 6, stop and revisit later.
   - Bump, run `bun run check:types` — expect new strict-mode complaints. Triage the simple ones; defer if anything requires non-trivial refactoring across multiple files.
   - If the TS 6 errors look like more than ~10 minutes of fixup work, this becomes its own task. Don't burn through the upgrade momentum patching a hundred TS errors.

**Stop conditions for any of these:** if the bump produces more than a small handful of fixes or surfaces an upstream incompatibility, revert that single commit and capture what you found in a fresh task. The point of this phase is the easy wins, not heroic upgrades.

## Captured for later (not in this task)

- **OG visual rework** — separate task once design intent is sketched.
- **`experimental_getFontFileURL` adoption** — only if Astro adds an explicit format option to request TTF/OTF variants from the Fonts API.
- **`markdown.processor` migration** — once a working `@astrojs/mdx` 6.x is published.
- **`@astrojs/markdown-satteri`** — only viable if the site ever drops its remark/rehype plugin set.
- **Astro 7** — the Rust compiler becomes the default and `experimental.rustCompiler` is deprecated. No action needed in 6.x; track for the eventual 7.0 upgrade.
