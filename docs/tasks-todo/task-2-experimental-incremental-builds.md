# Task 2: Experimental incremental static builds

## Overview

Astro 7.2 shipped `experimental.incrementalBuild`, which lets Astro skip re-rendering prerendered pages whose code and data are unchanged since the last build. This task evaluates it on this site, and turns it on if it can be made **provably correct**.

**Why we're doing this — read this before optimising for speed.** Build times here are already fine. The motivation is (a) curiosity, and (b) this will likely stop being experimental and may become the default for static builds, so it's worth understanding on our own terms rather than inheriting it. **This is not primarily a performance task**, and the measurements below explain why chasing wall-clock here would be a mistake.

There is also a decent chance this makes a good follow-up to [Speeding up Astro builds and improving deployment](/writing/speeding-up-astro-builds), which documents the caching work this interacts with.

## Starting state

- **Astro 7.2.2** (upgraded from 7.1.3 in the `upgrade-astro-7-2` branch, along with ~20 dependency bumps, satori 0.29, knip 6.32).
- `experimental.incrementalBuild` is **not** enabled. Nothing in the codebase returns a `cacheKey`.
- TypeScript held at 6.0.3 — TS 7 is a separate task.
- Content: 76 articles, 134 notes. Build produces 226 pages; Pagefind indexes 235; 222 OG images.

## The sizing problem (measured — don't skip this)

Real job timings from GitHub Actions on recent pushes to `main`:

| Run                     | Check | Build  | Deploy | Total |
| ----------------------- | ----- | ------ | ------ | ----- |
| 14 Aug (content push)   | 2m11s | 2m08s  | 1m27s  | 3m45s |
| 24 Jul                  | 2m43s | 2m01s  | 1m03s  | —     |
| 24 Jul                  | 1m53s | 2m24s  | 38s    | —     |

**Check and Build run in parallel and finish within seconds of each other.** Deploy waits on both. So making Build faster buys close to nothing end-to-end — Check simply becomes the critical path and the pipeline stays at roughly 3m45s.

Where incremental builds *would* genuinely help: local `bun run build` (which we run for Pagefind in dev), CI minutes, and headroom as content grows past 210 entries.

If the goal ever becomes pipeline wall-clock, the levers are the **Check job** and the **~1m27s Deploy job**, not Build. Worth noting separately.

One outlier seen in the data: a Build job that took **21m28s** (run `31824679198`, a content push with new images). Worth understanding on its own — incremental builds would not have helped it, since new content has to render regardless. Likely a cold image cache.

## How the feature works

Two independent signals, and a page is reused **only when both match** the previous build:

1. **`cacheKey`** — a per-path string we supply from `getStaticPaths()`. Covers **data**. Paths without one are always rendered, so opting in is explicit and the default is safe.
2. **Dependency hash** — computed automatically by Astro. Covers **code**: it walks each route's transitive module graph (template, layouts, components, imported assets, package code) and hashes the compiled output. Any change invalidates **every path on that route**.

Content entry data modules are deliberately excluded from the dependency walk — that's what keeps the split clean (code → dependency hash, content → `cacheKey`).

Other mechanics worth knowing:

- The cache lives in `cacheDir` (default `node_modules/.astro/`) as a manifest (`incremental-build.json`) plus a `dist/` subdirectory of rendered output.
- **Global invalidation:** an internal cache version, plus a hash of the output-affecting config subset (`site`, `base`, `trailingSlash`, `build.format`, `compressHTML`, `scopedStyleStrategy`). Any mismatch discards the whole cache.
- **Orphan cleanup:** paths removed from `getStaticPaths()` have their output deleted from both `dist/` and the cache.
- `astro build --force` ignores the cache and re-renders everything, while still writing a fresh cache.
- For content collections, `entry.digest` is the intended `cacheKey`. The glob loader sets it from file contents; Astro 7.2 added `digest` as an official optional property on entries. **Note the `file()` loader does not set a digest** — irrelevant here, since our dynamic routes only use the glob-loaded `articles` and `notes`.

## Routes that could opt in

All of these use `getStaticPaths()`:

- `src/pages/writing/[...slug]/index.astro` — article pages (the expensive ones: MDX rendering)
- `src/pages/notes/[...slug]/index.astro` — note pages
- `src/pages/writing/[...slug].md.ts`, `src/pages/notes/[...slug].md.ts` — raw markdown twins (cheap)
- `src/pages/writing/[...slug]/og-image.png.ts`, `src/pages/notes/[...slug]/og-image.png.ts`, `src/pages/[...page]/og-image.png.ts` — OG images (already covered by our own cache)

Everything else — `/writing`, `/notes`, `/`, `/making`, RSS, `llms.txt`, `redirects.json`, the styleguide — has no `getStaticPaths()` and will always render. That's correct: index pages aggregate other entries, so caching them on a per-entry key would be wrong anyway.

## ⚠️ Correctness risks specific to this codebase

The RFC names this as the feature's main drawback, and it applies directly: *"we might fail to invalidate the cache when we should… Any gap here produces stale pages that look correct, which is harder to notice than an outright build failure."*

Three concrete cases here:

### 1. `SeriesCallout` breaks the naive `cacheKey` — this is the real one

`Article.astro` renders `SeriesCallout`, which calls `getCollection('articles')` to list sibling articles in the same series. **20 articles have a `series`.** With a naive `cacheKey: post.digest`, publishing, retitling, or removing one article in a series leaves **every other member's page cached with a stale sibling list**.

Two options, agreed to decide during implementation:

**Option A — opt those articles out.** Simply omit `cacheKey` when `post.data.series` is set. Provably correct, no machinery, costs us caching on 20 of 76 articles.

**Option B — fold the series digest into the key.** `getStaticPaths()` already has every article loaded, so this is a few lines rather than real machinery. Sketch (**unvalidated — verify during implementation**):

```ts
const seriesDigests = new Map<string, string>()
for (const post of posts) {
  const id = post.data.series?.id
  if (!id) continue
  seriesDigests.set(id, (seriesDigests.get(id) ?? '') + post.digest)
}

return posts.map(post => ({
  params: { slug: post.id },
  props: post,
  cacheKey: post.data.series
    ? `${post.digest}-${seriesDigests.get(post.data.series.id)}`
    : String(post.digest),
}))
```

Concatenation order must be deterministic — sort the ids or hash the set rather than relying on collection iteration order. Also note `filterContentForPage` already removes drafts in production, so the digest set should cover published members only, matching what `SeriesCallout` renders.

Lean toward **A** unless B verifies cleanly; the whole point of this task is correctness, not squeezing out 20 more cached pages.

### 2. `ContentCard` — latent, same shape of problem

`src/components/mdx/ContentCard.astro` does `getEntry(collection, id)` to render a card for another entry. **Currently used 0 times in content**, so it's not live — but if it ever is, a change to the referenced entry (title, description, cover) would leave the embedding page stale, and its `cacheKey` wouldn't know. Worth a comment in the component so this doesn't get rediscovered the hard way.

### 3. `Footer` uses `new Date()`

`src/components/layout/Footer.astro:7` computes the copyright year at render time, and the footer is on every page. A page cached in December shows the wrong year in January. Trivial, but it means cached HTML carries a wall-clock dependency. Either accept it, or hardcode/derive the year differently.

(`src/pages/index.astro` also uses `Math.random()` to pick two toolbox items — harmless, as it has no `getStaticPaths()` and always re-renders.)

## Interaction with our existing build caching — mostly good news

Checked against `docs/developer/deployment.md` and the caching work in the builds article:

- **No changes needed to `.github/workflows/deploy.yml`.** `cacheDir` is `node_modules/.astro`, which the Build job already caches with a commit-SHA key and a `restore-keys` prefix fallback. That is exactly what the docs ask for ("cache and restore this single directory; nothing else needs to persist").
- **Pagefind is safe.** The docs are explicit that the output dir is emptied each build and skipped pages are **restored** from `cacheDir` — so `dist/` is complete before the `astro:build:done` hook runs and the index stays whole.
- **Keep the OG cache.** It's *finer-grained* than incremental build: ours is content-addressed on `{data, template, width, height, CACHE_VERSION}`, so it survives unrelated component and CSS edits. The incremental cache invalidates a whole route when any module in its graph changes. They're complementary, not redundant.
- **Cache size is worth watching.** `node_modules/.astro` is already ~287M locally (252M assets, 34M og-cache). Incremental adds a `dist/` subdirectory of cached HTML — small by comparison, but GitHub Actions has a 10GB per-repo cap and every run writes a fresh snapshot.
- **None of the documented limitations apply:** `build.concurrency` isn't set (the cache is disabled above 1), there's no middleware, no server islands, and no adapter.

## Open question to resolve first

**Do static endpoints participate, or only `.astro` pages?** Both the docs and the RFC say "pages" throughout, without addressing API routes. If endpoints are excluded, the `og-image.png.ts` and `[...slug].md.ts` routes keep relying on our own OG cache (fine) and the win narrows to the ~210 HTML pages. **Verify empirically rather than guessing** — it changes how much of this is worth doing.

## Version caveat

Both 7.2.1 and 7.2.2 shipped incremental-build fixes, and two are exactly this site's shape:

- 7.2.1 — "Fixed `experimental.incrementalBuild` re-rendering unchanged routes that import multiple assets"
- 7.2.2 — "Fixed incremental builds dropping optimized images for cached pages when using a `collectStaticImages` prerenderer"

The feature is still settling. Stay on 7.2.2+, and treat this as an experiment with a real verification step rather than set-and-forget.

## Findings (2026-08-24, branch `experimental-incremental-builds`, Astro 7.2.2)

**Outcome: enabled and working.** Warm local builds went from ~31s to ~8.4s, with 393 of ~430 prerendered paths reused. Getting there required fixing one non-obvious bug in our own setup — see "The blocker" below.

### The open question: endpoints DO participate

Confirmed by source and empirically. `generatePathWithPrerenderer` (`core/build/generate.js`) applies the skip/restore path to every prerendered route with no `route.type` filter, and `collectPagesData` puts endpoint routes into `allPages` so they get a `dependencyHash` like any page. The `.md.ts` twins cache exactly like the `.astro` pages.

### The blocker: `astro-icon` stamps a build timestamp into every page's dependency graph

Initially **nothing cached at all** — every `.astro` page re-rendered on every build despite a stable `cacheKey`, because Astro's `dependencyHash` for both `index.astro` routes differed between two byte-identical builds.

Found by patching `plugin-incremental.js` to dump a per-module hash of `resolveAssetPlaceholders(code)` for all 935 modules, running two builds and diffing. **Exactly 4 modules were unstable:**

- `virtual:astro-icon`
- three `.mdx` files containing Mermaid diagrams

Dumping the 5.3MB `virtual:astro-icon` module from both builds and diffing byte-by-byte found a single difference:

```
"local":{"prefix":"local","lastModified":1787579078, …}   ← build A
"local":{"prefix":"local","lastModified":1787579110, …}   ← build B
```

`astro-icon` builds a `local` icon set from `src/icons/`, and `@iconify/tools` (`lib/icon-set/index.mjs:162`) does `this.lastModified = value || Math.floor(Date.now() / 1e3)`. The bundled `heroicons` and `simple-icons` sets ship a real `lastModified` and are stable; our own set has none, so it gets the current build time. Every page reaches that module through the `Icon` component, so that one number invalidated every route, every build.

**Fix:** a small Vite plugin in `astro.config.mjs` (`stableIconSetTimestamp`) pins the local set's `lastModified` to `0`. The value is metadata nothing reads. This is the whole difference between the feature doing nothing and working.

### `series.json` is a real staleness vector the original analysis missed

`SeriesCallout` renders `seriesEntry.data.intro` from the `series` collection, which uses the `file()` loader (no digest). Content data modules are stripped from the dependency walk by `isContentDataIncrementalModule`, so **editing `series.json` invalidates nothing**. Any Option B would have to fold in the series entry, not just sibling digests.

Also confirmed by source: `recordContentEntryRender` fires only inside `renderEntry()`, so `getCollection()` and `getEntry()` are invisible to the cache. The `SeriesCallout` risk is proven, not merely suspected.

### What was implemented (Option A)

- `experimental.incrementalBuild: true` plus the `stableIconSetTimestamp` Vite plugin in `astro.config.mjs`.
- `contentCacheKey()` in `src/utils/content.ts` — returns `undefined` rather than `String(undefined)` when an entry has no digest, so a missing digest degrades to "always re-render" instead of "cache forever".
- `cacheKey` on `notes/[...slug]/index.astro`, `writing/[...slug]/index.astro` (omitted when `data.series` is set), and both `.md.ts` endpoints (no series caveat — they emit only the entry's own title and body).
- **Not** added to the `og-image.png.ts` endpoints: our own OG cache already covers them, and adding it would duplicate ~222 PNGs into the incremental cache.

### What still re-renders, and why each is correct

| Pages                              | Reason                                          |
| ---------------------------------- | ----------------------------------------------- |
| `/writing`, `/notes`, `/`, RSS, …  | No `getStaticPaths()` — aggregate other entries |
| 17 series articles                 | Option A opt-out                                |
| 2 Mermaid notes                    | Mermaid output genuinely differs per build      |
| All `og-image.png` endpoints       | No `cacheKey`; covered by our own OG cache      |

### Verification

Harness in `docs/tasks-todo/temporary/incremental/` (`snapshot.sh`, `compare.sh`, `noise.txt`). Snapshots `dist/` as sorted `sha256\tpath`, normalising Mermaid element ids before hashing.

**Noise floor:** two identical builds differ in 10 paths — `Math.random()` on the homepage, and Mermaid output being non-deterministic in both element ids and SVG path geometry (which also churns the RSS feeds that embed content). After normalising ids and excluding the 9 Mermaid-bearing pages, 3158 of 3411 files are byte-identical. No series article contains a Mermaid diagram, so the noise does not overlap the scenarios that matter.

**The core check:** a warm build serving 393 pages from cache is **byte-identical to a full `astro build --force` rebuild** across 3157 compared files.

| Scenario                       | Restored | Assertion                                  |
| ------------------------------ | -------- | ------------------------------------------ |
| Retitle an article in a series | 393      | 15/15 siblings show new title, 0 stale     |
| Add an article to a series     | 393      | 16/16 siblings list the new entry, 0 stale |
| Edit `series.json` intro       | 394      | 15/15 pages show new intro, 0 stale        |
| Edit `Footer.astro`            | 206      | 0 HTML pages reused; all 227 pick it up    |

The last one confirms dependency-hash invalidation works: every HTML page re-rendered while the `.md` endpoints correctly stayed cached, since they don't use the Footer.

`check:types`, `check:lint`, `check:format` green; 474 unit tests pass.

### Two incidental findings

- **`astro build --force` also clears the content data store** ("data store cleared (force)"), not just the incremental cache. On this site that forces every Mermaid diagram to re-render through Playwright, making `--force` far more expensive than a cold incremental build.
- **Mermaid diagram output is non-deterministic between builds** (element ids and path geometry). Independent of this feature, it means those pages' HTML churns on every build and they can never be cached. Worth fixing separately — it would bring the last 2 notes into the cache.

### Decisions on the two remaining correctness notes

**`Footer` year — left as it is, deliberately.** A page cached in December would show the wrong year in January. We're accepting that rather than building machinery for it, because the incremental manifest stores a `lockfileHash` and a config hash, and a mismatch on either discards the **entire** cache. Any dependency bump, config change, or edit to a component in the route's graph forces a full rebuild, so a page surviving untouched across New Year is unlikely on this site. Options considered and rejected: dropping the year from the footer, folding the year into the `cacheKey`, and a scheduled January `--force` build (the most fragile of the three — out-of-band, forgettable, and expensive here because `--force` also re-renders every Mermaid diagram through Playwright).

**`ContentCard` — opts itself out.** Rather than the comment the original plan suggested, `contentCacheKey` returns `undefined` when an entry's body references a component listed in `CROSS_ENTRY_COMPONENTS`. `ContentCard` is the only one today, it's used 0 times, and it's auto-imported into every MDX file by the barrel — so the moment anyone uses it, that page opts out on its own instead of relying on someone having read a warning. Verified end to end: adding a `<ContentCard>` to a note dropped exactly that note's page and its `.md` twin out of the cache while the card rendered correctly. The `.md` twin opting out is unnecessary (it emits raw text and can't go stale) but costs nothing on a currently-empty set, and keeping the check in one place is simpler than duplicating it.

### Still to do

- Deploy and verify in CI. `node_modules/.astro` is already cached by the Build job, so no workflow change is needed, but cache size is worth watching.
- Document the setup in `docs/developer/deployment.md` (Phase 4).
- Report the `astro-icon` / `@iconify/tools` timestamp upstream — it silently defeats incremental builds for any site using local icons.
- Optional: make Mermaid output deterministic. It's the only thing keeping the last 2 notes out of the cache, and it churns those pages' HTML on every build regardless of this feature.

## Phases

### Phase 1 — Spike and answer the open question

- New branch off `main`.
- Enable `experimental.incrementalBuild` with **no** `cacheKey` anywhere. Build twice; confirm nothing is skipped and output is unchanged (safe-by-default check).
- Add `cacheKey` to the two `index.astro` routes only, for articles **without** a series. Determine whether endpoints participate.

### Phase 2 — Verification harness (the important part)

The failure mode is silent staleness, so "it builds" proves nothing. Establish a repeatable diff:

- Build with the flag warm, then `astro build --force`, and **diff the two `dist/` trees**. They must be byte-identical.
- Exercise the cases that matter: edit one article, add a note, retitle an article **in a series**, add a new article to an existing series, delete an entry (orphan cleanup), change a shared component, change `astro.config.mjs`.
- The series cases are the ones that decide Option A vs Option B.

### Phase 3 — Decide and land

- Pick Option A or B for series articles based on Phase 2.
- Extend to the remaining routes if endpoints participate.
- Add the `ContentCard` comment; decide on the `Footer` year.
- `bun run check:all` + a real deploy.

### Phase 4 — Document or revert

- If kept: add a section to `docs/developer/deployment.md` covering what `cacheKey` means here, why series articles are handled the way they are, and the `--force` escape hatch. Note it in `src/utils/CLAUDE.md` if the OG interaction needs it.
- If reverted: record why here, so the next person doesn't repeat the evaluation from scratch.

## Success criteria

- [ ] Resolved whether static endpoints participate in the incremental cache.
- [ ] Warm incremental build and `--force` build produce byte-identical `dist/` trees across all the Phase 2 scenarios — **especially the series ones**.
- [ ] Series articles are provably correct (Option A or a verified Option B).
- [ ] Pagefind index still covers every page; OG images unaffected.
- [ ] `bun run check:all` green; production deploy verified.
- [ ] Decision documented in `docs/developer/deployment.md`, or the revert reasoning recorded here.

## References

- Astro 7.2 release: <https://astro.build/blog/astro-720/>
- Feature docs: <https://docs.astro.build/en/reference/experimental-flags/incremental-build/>
- RFC (stage 3): `proposals/0062-incremental-static-builds.md` in [withastro/roadmap](https://github.com/withastro/roadmap/pull/1404)
- Our caching background: `docs/developer/deployment.md` and `src/content/articles/2026-06-14-speeding-up-astro-builds.mdx`
