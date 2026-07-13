# Task 2: Upgrade to Astro 7 (staying on `unified()`)

> **STATUS: DONE & SHIPPED.** Site is on Astro 7.0.8 / Vite 8, still on the `unified()` pipeline. Merged to `main`, deployed to production, and verified working live. `bun run build` + `bun run check:all` green. See **Completion notes** below for what actually happened and the context Tasks 3–5 need — in particular the **phantom-dependency gotcha**, which will very likely recur during the Sätteri cutover.

## Overview

Upgrade the framework to **Astro 7 first**, keeping the existing `unified()` Markdown pipeline intact so the site stays green. The Sätteri migration (Tasks 3–5) then happens **on Astro 7**, against the aligned `satteri@0.9.x` API.

**Why this order (reversed from the original plan):** Astro 6.4's `@astrojs/mdx@6.0.3` pins `@astrojs/markdown-satteri@0.3.0` → `satteri@^0.8.0`, an **older, more limited** API — no `ctx.data`, no `ctx.parent()`/`indexOf()`, no frontmatter bag — and the community plugins we want (`@xingwangzhe/satteri-mermaid`, `@bhdouglass/satteri-auto-imports`) target the **0.9.x** API. Astro 7's `@astrojs/mdx@7` pins `markdown-satteri@^0.3.1` → `satteri@0.9.x`, which is exactly what the Task 1 spike validated. Doing Sätteri on 6.4 first would mean building the whole plugin suite twice. See issue [#132](https://github.com/dannysmith/dannyis-astro/issues/132) and the Task 1 findings.

**Key fact:** Astro 7 makes **Sätteri the default** Markdown processor. Our config already sets `markdown.processor: unified({...})` explicitly, which *is* the documented opt-out — so we stay on `unified()` through this upgrade with no pipeline change. `@astrojs/mdx@7` still supports the `unified()` processor (`isUnifiedProcessor` guard).

## Starting state

- Astro **6.4.2**, `@astrojs/mdx` **6.0.3**, `unified()` processor with our full remark/rehype stack + `astro-auto-import`. Everything working.
- `satteri` / `@astrojs/markdown-satteri` are **not** installed (removed after the spike). They come back in Task 3 at the 0.9.x line.

## Phases

### Phase 1 — Framework & integration bump

- Run `npx @astrojs/upgrade` (or bump `astro` + `@astrojs/*` manually), keeping `bun`.
- Bump and verify Astro-7 compatibility for every integration: `@astrojs/mdx` (6→7), `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`, `astro-expressive-code`, `astro-icon`, `astro-embed`, `astro-webrings`, `@astrojs/check`, and **`astro-auto-import`** (confirm it still supports Astro 7 — it's the one third-party integration in the Markdown path; if it breaks, that accelerates the Task 3 cutover).
- Resolve **Vite 8 / Rolldown** fallout in the `vite` config (`optimizeDeps.exclude`, the `satteri`/`markdown-satteri` `rollupOptions.external` hack, `svgOptimizer`).

### Phase 2 — Keep `unified()` working under Astro 7 defaults

- Confirm the explicit `markdown.processor: unified({...})` still opts out of the new Sätteri default and all our remark/rehype plugins still run.
- Re-confirm the `vite … external: ['satteri', '@astrojs/markdown-satteri']` hack is still needed (mdx@7 still ships a Sätteri branch we don't use yet) — keep or adjust. It goes away in Task 3.
- Verify `syntaxHighlight` / `excludeLangs`, heading IDs, gfm, smartypants, Expressive Code all behave as before.

### Phase 3 — `.astro` compiler strictness sweep

Astro 7's Rust `.astro` compiler is stricter (unclosed/malformed tags now error; JSX-style whitespace collapse). This affects **`.astro` components/layouts** now (MDX content strictness only bites once we're on Sätteri, Tasks 3–5).

- Build and fix any unclosed tags / bad attributes the Rust compiler flags in `src/components`, `src/layouts`, `src/pages`.

### Phase 4 — Full verification

- `bun run check:all` (types → format → lint → unit + e2e).
- `bun run build` + browse the built site: articles, notes, routed `.mdx` pages, styleguide, RSS feeds, sitemap, OG image generation (`satori`/`resvg`), command palette / Pagefind search.
- Verify **both light and dark themes**.
- Optional / out of scope unless wanted: `src/fetch.ts`, stable route caching, JSON structured logging.

## Success criteria

- [x] `astro` on 7.x, all integrations Astro-7-compatible, `bun run build` green.
- [x] Site still runs the `unified()` pipeline — no content/rendering regressions.
- [x] Vite 8 / Rolldown issues resolved; `.astro` strictness issues fixed (none surfaced — build clean).
- [x] `bun run check:all` green; feeds, sitemap, OG images, search all working. Themes visually verified by Danny.

## Completion notes

### Final versions
Astro **7.0.8**, `@astrojs/mdx` **7.0.3**, `@astrojs/react` **6.0.1**, `@astrojs/markdown-remark` **7.2.1**, `@astrojs/rss` **4.0.19**, **Vite 8.1.4** (deduped to a single copy across the tree). Plus explicit `rehype` / `unist-util-visit` / `@types/hast` (see phantom-dep note below). Still on `markdown.processor: unified({...})` — Sätteri is **not** installed yet (Task 3).

### ⚠️ Phantom-dependency gotcha — READ BEFORE Task 3

The PR's **first CI run failed on both jobs while everything passed locally** — a stale-`node_modules`-vs-frozen-lockfile trap that will very likely recur during the Sätteri cutover:

- `src/lib/tabs/process-panels.ts` imports `rehype`, `unist-util-visit`, and `hast` (types), but **none were declared in `package.json`.** Astro **6** supplied `rehype` (+ `unist-util-visit`) *transitively*, so the phantom imports resolved locally and on Astro-6 CI.
- **Astro 7 dropped `rehype` from its own dependencies**, so it vanished from `bun.lock`. Local builds kept passing on **leftover** `node_modules`, but CI's `bun install --frozen-lockfile` produces a clean tree → `rehype` unresolved → **Build** fails (`Rolldown failed to resolve import "rehype"`, escalated to an error by `@astrojs/react`'s `onwarn`) and **Check** fails (`tsc … error TS2307: Cannot find module 'rehype'`).
- **Fix:** declared `rehype` + `unist-util-visit` (dependencies) and `@types/hast` (dev) explicitly.

**Why this bites again in Tasks 3–5:** the cutover **removes** `@astrojs/markdown-remark`, `astro-auto-import`, `rehype-autolink-headings`, `rehype-external-links`, `rehype-mermaid`, and the `unified()` processor. Any of those may be the *transitive* provider of a package our own `src/` code imports directly — removing them can expose the **next** phantom dep exactly the same way. Rule of thumb: **anything `src/` imports must be a declared dependency.**

**Verification practice — do this before every push once you start removing deps:** reproduce CI's clean environment; a green build on a stale `node_modules` proves nothing.
```
rm -rf node_modules && bun install --frozen-lockfile && bun run build && bun run check:all
```

### What went smoothly
- `bunx @astrojs/upgrade` handled the `astro` + `@astrojs/*` bumps. No `.astro` Rust-compiler strictness errors surfaced (no unclosed-tag fixes needed).
- `compressHTML` default changed to `'jsx'` in v7 — we **kept the new default** (aligns with Sätteri's whitespace conventions); Danny visually verified no regressions.
- The `vite … rollupOptions.external: ['satteri','@astrojs/markdown-satteri']` hack is **still present and still needed** (mdx@7 ships a Sätteri branch we don't use on `unified()`). **Task 3 removes it** once `satteri` is installed.

### Fixes made along the way (context for Task 3)
- **`getContainerRenderer`** moved to `@astrojs/mdx/container-renderer` in the 3 RSS files (old root import deprecated in v7).
- **Playwright e2e / dev server:** Astro 7 auto-backgrounds `astro dev` when it detects an agent, breaking Playwright's web server. Fixed in `playwright.config.ts` by setting `ASTRO_DEV_BACKGROUND=1` via the webServer `env` property (forces foreground) + a `url` health-check. **Also:** bumping `playwright` requires `bunx playwright install` (build-time mermaid rendering via `rehype-mermaid` uses the headless browser). CI handles this (cache keyed on `bun.lock`); it only bites locally.
- **CodeRabbit review nitpicks folded in:** playwright `env` property (above); styleguide TOC `@supports` tightened to `(scroll-target-group: auto) and selector(:target-current)`. (CodeRabbit also flagged `astro@7.0.8` as "unavailable" — a false positive; 7.0.8 is the published latest.)
- **Dependency alignment** (same PR): `sharp` → **0.35.3** (Astro 7 supports `^0.34 || ^0.35`); the `vitest` bump collapsed the tree to a single **Vite 8**; plus routine minor/patch bumps. Prettier 3.9 reformatted 2 files (union-type collapsing).
- **ESLint `.astro` tooling → v3** (`eslint-plugin-astro@3` + `astro-eslint-parser@3` + new `eslint-plugin-jsx-a11y@6.10.2` peer). Gotchas that persist:
  - `astro-eslint-parser@3`'s Rust parser **crashes on a self-closing `<script … />`**. `src/components/mdx/Embed.astro` was changed to an explicitly-closed `<script>…</script>`. **Don't reintroduce self-closing `<script/>` in `.astro` files.**
  - `prettier-ignore` comments **don't work in `.astro`** (prettier-plugin-astro#410), and prettier keeps re-collapsing that `<script>` to a self-close — so `Embed.astro` is in `.prettierignore` and must be **hand-formatted**.
  - `eslint-plugin-jsx-a11y@6.10.2` prints a peer warning on install (doesn't declare eslint 10). Cosmetic; we only pull it to satisfy the astro plugin's peer.

### Held / deferred (revisit later)
- **TypeScript 7** — held: `@astrojs/check@0.9.9` peers `typescript "^5 || ^6"`, so TS 7 would break `astro check`. Wait for ecosystem support.
- **Oxlint / Oxfmt** — evaluated, deferred: oxlint doesn't lint `.astro` frontmatter/template yet (only `<script>` tags), oxfmt is alpha with nascent Astro support. Revisit when both mature.
- **`jscpd`** bumped to v5 (native-binary rewrite; shrank the lockfile). It's a manual, informational tool (`bun run check:dupes`), **not a gate** — its non-zero exit on found clones is expected and fine.

### Known cosmetic warnings that remain (all non-blocking)
- lightningcss warns on the styleguide's `:target-current` (valid, too-new selector — rule is preserved).
- `vite:react-babel` esbuild→oxc / `optimizeDeps.rolldownOptions` deprecation (upstream `@astrojs/react`).
- `markdown.remarkPlugins … deprecated` notice — our `unified({...})` usage is the documented approach and works.

## References

- Astro 7 release: <https://astro.build/blog/astro-7/>
- Migration walkthrough: <https://bhdouglass.com/blog/astro-7-0-release/>
- Issue [#132](https://github.com/dannysmith/dannyis-astro/issues/132)
