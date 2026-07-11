# Task: Command Palette & Site Search

Build a `Cmd/Ctrl+K` command palette overlay that supports both **navigation/commands** and **full-text search** across articles, notes, and pages. Fully keyboard-navigable and accessible; zero-JS-by-default (nothing loads until the palette opens); no React.

All research, rationale, decisions, references and the full reminders checklist live in the issue — that's the source of truth, this doc is the plan of work:

**[GitHub issue #41 — Keyboard Search & Command Palette](https://github.com/dannysmith/dannyis-astro/issues/41)**

Short version of the agreed approach: hand-rolled native `<dialog>` + WAI-ARIA combobox palette, backed by **Pagefind** for content search, wired via an inline `astro:build:done` integration. Commands/nav baked into the component at build time.

## How this plan is structured

We started with **two throwaway experiments in scratchpad pages** — one to de-risk the UI craft (Phase 1), one to de-risk the search infrastructure (Phase 2). Both are **done**; their findings are captured in place. (Note: this reverses the experiment numbering in the issue, where Pagefind is "Experiment 1".)

**Phases 3 onward are the real build**, re-planned from what the experiments taught us: get the index right → extract a clean lib API → build the palette component → wire search into it → test/clean up → the trailing polish phases. Each phase is a checklist, roughly in dependency order.

---

## Phase 1 — Experiment: hand-rolled command palette ✅ (`src/pages/scratchpad2.astro`)

**Done.** A working, accessible command-palette shell built up one native primitive at a time, no framework. Commands/nav are dummy/static for now — real content search (Pagefind) is Phase 2. The live example is **`src/pages/scratchpad2.astro`**; it's the reference for how the production component gets built later.

What it establishes:

- **Native modal `<dialog>` + `showModal()`** gives focus-trap, `::backdrop`, `inert` background and Esc-to-close for free. `closedby="any"` adds click-outside dismissal declaratively (no JS). A single CSS rule (`overflow: hidden`) plus the `.ui-style` utility handle framing.
- **WAI-ARIA combobox/listbox pattern.** Input is `role="combobox"`; DOM focus stays in the input the whole time; the active option is tracked via `aria-activedescendant` + a `[data-active]` style hook (never real focus, so typing never breaks). Groups are `role="group"` with `role="presentation"` labels.
- **Commands baked in at build time.** A typed `PaletteItem[]` in frontmatter renders to markup — no client fetch. Every option is a real `<a role="option">`: nav items carry an `href` (native link → ⌘/middle-click opens a new tab), action items are href-less and carry a `data-action`. (We chose all-`<a>` over an `<a>`/`<button>` split for uniformity; `role="option"` makes the element choice behavioural, not semantic.)
- **Filter-as-you-type** over label + a hidden `data-keywords` field, leaning on the native `[hidden]` attribute for hiding (no CSS needed for the hide itself). Empty groups collapse via `:has()`; a "No results" state shows when everything filters out (also `:has()`).
- **Keyboard nav** — arrow/Enter driven from the input (`scrollIntoView({block:'nearest'})` keeps the active row visible); Escape/click-outside close.
- **Minimal fade animation** — opacity only, in and out, via `@starting-style` + `transition-behavior: allow-discrete` on `display`/`overlay` (keeps the dialog in the top layer through the exit so the dim backdrop rides along); `prefers-reduced-motion` turns it off.
- **Idempotent init (codebase convention).** The document-level hotkey is bound once behind a module-scoped guard (`wireHotkey`, mirroring `Tabs.astro`'s `wireDelegation`); per-dialog wiring re-runs on `astro:page-load` behind a `data-cpReady` guard — safe under View Transitions.
- **Zero-JS open path.** The visible trigger opens the dialog via the **Invoker Commands API** (`command="show-modal"`), and `<input autofocus>` handles focus on open — both with no JS. The only JS the open path fundamentally needs is the global `Cmd/Ctrl+K` hotkey (~10 lines), since there's no declarative way to bind a global shortcut.

**Key findings for the real build:**

- The whole thing is ~85 lines of dependency-free JS + ~70 lines of CSS. Everything the old command-palette libraries did (top layer, focus trap, inert, Esc, animation, light-dismiss) is now platform-native.
- Baking commands/nav into the component at build time works cleanly and means the palette is fully functional in dev regardless of any search index.
- **Open questions surfaced:** Invoker Commands + `closedby` are early-2026 Baseline (Chrome/Edge 135+, Firefox 144+, Safari 26.2) — decide in the real build whether to rely on Baseline or add tiny JS fallbacks (the hotkey works everywhere regardless). `aria-live` result-count announcements and fuzzy matching were deliberately deferred.

## Phase 2 — Experiment: Pagefind wiring ✅ (`src/pages/scratchpad.astro`)

Separate experiment to de-risk the search infrastructure and learn the result-data contract that Phase 1's results group will consume. **Done** — the live experiment is `src/pages/scratchpad.astro` (both variants side by side); the wiring lives in `astro.config.mjs` + the content layouts.

- [x] Add `pagefind` and an inline `astro:build:done` integration in `astro.config` that runs Pagefind's Node API over `dist/`, emitting `dist/pagefind/`. Done as an inline `pagefind()` integration (crib of `astro-pagefind`, not a dep) with two hooks: `astro:build:done` (index `dist/` → `dist/pagefind/`, throws on any index error) and `astro:server:setup` (serve prebuilt `/pagefind/*` in dev via `sirv`). Added `pagefind` + `sirv` as **devDependencies**. `dist/` is already gitignored, so the index stays uncommitted; it lands in `dist/` before CI copies it onward.
- [x] Index scoping on the real layouts. `data-pagefind-body` + `data-pagefind-meta="type:article|note"` on the article/note content region; `data-pagefind-meta="title"` on the `<h1>`; `data-pagefind-ignore` on the metadata line, footer-actions, and the TOC. **`NoteCard` gained an explicit `indexAsBody` prop** set only by `Note.astro` — the notes-index and styleguide reuse the same card and must stay unindexed, so blanket-marking `NoteCard` would wrongly index the listing page. (Adding `data-pagefind-body` anywhere makes Pagefind index _only_ pages that carry it, which conveniently excludes all chrome + listing + non-content pages for free.)
- [x] Build + verify the full round-trip. **185 pages indexed** (116 notes + 69 articles; drafts and all chrome/listing pages excluded). The build log's "219 pages" is total HTML files _scanned_ by `addDirectory`; the entry manifest's `page_count:185` is what carries a body marker. Verified by driving `astro preview` in a headless browser: real, well-ranked results with correct `/writing/…` and `/notes/…` URLs.
- [x] Drive results two ways and compare. Built both on `scratchpad.astro`: (A) raw `pagefind.search()` → `.data()` rendered into the Phase-1 combobox listbox, and (B) the building-block web components. **Decision: raw API** (see below). The building blocks came from `pagefind-component-ui.js` (`<pagefind-input>`/`<pagefind-results>`/`<pagefind-summary>`/`<pagefind-config>`), _not_ `pagefind-modular-ui.js` (which is a class-based JS API). They render into **light DOM** (not shadow), so they're styleable/inspectable.
- [x] Record the shape of the `.data()` object (the contract Phase 1 consumes):
  ```js
  {
    url,
    excerpt,        // HTML string with <mark> around matches
    plain_excerpt,  // same, no markup
    meta: { title, type: "article"|"note", image?, image_alt? },
    sub_results: [{ title, url, excerpt, plain_excerpt, ... }],  // heading-anchored sections
    word_count, content, raw_content, anchors, weighted_locations, locations, filters
  }
  ```
  The palette needs only `url`, `meta.title`, `meta.type` (grouping key), and `excerpt`.
- [x] Assess styling reach + measure payload. Payload (measured): **~161 KB one-time core** (`pagefind.js` 45 KB + `pagefind-worker.js` 41 KB + `wasm.en.pagefind` 73 KB + meta), cached after first use; then **~32 KB per alphabetical index shard** (shared across many queries) + a tiny fragment (0.15–5 KB) per rendered result. First-ever search ≈ ~200 KB; later searches a few KB–35 KB. In line with the "~100 KB typical" expectation.
- [x] Dev mode. The `astro:server:setup` middleware serves a previously-built `dist/pagefind/` via `sirv` — verified all bundle files 200 under `astro dev`. No prior build → the palette's lazy `import()` catches and shows a "search unavailable" note; nothing else breaks.

**Deliverable / learnings captured:**

- **Decision — build the real palette on the RAW API (Variant A), not the building blocks.** Only the raw API composes into the Phase-1 combobox: commands + nav + content results share **one `<input>`, one listbox, one `aria-activedescendant` nav loop**, with full control over grouping and result-row markup. The building-block `<pagefind-results>` brings its **own `<input>` and a real-DOM-focus nav model** (↓ moves focus _into_ the list; ↑ at the top returns to the input) that structurally fights the combobox. The blocks are polished out-of-the-box but are a self-contained search box — parked as a possible future standalone `/search` page. Raw API is also lighter (`pagefind.js` ~45 KB core vs `pagefind-component-ui.js` ~175 KB + CSS).
- **No separate `search-index.json` needed** — Pagefind covers title + full-text + `type`. Confirmed.
- **Grouping uses `data-pagefind-meta`, read via `.meta.type`** (so `pagefind.filters()` is empty — expected). A real _faceted filter_ UI would instead need `data-pagefind-filter="type:…"`. Deferrable.

**Gotchas for the production build (bit us during the experiment):**

1. **Dynamic-import path must be a computed expression, not a static string literal.** `import('/pagefind/pagefind.js')` fails both Vite's dev-server import analysis _and_ the rollup build (unresolvable from `src/`); `@vite-ignore` alone is insufficient and `rollupOptions.external` only covers the build, not dev. Use `` import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`) `` — the expression defeats static analysis in both, and needs no `external` entry.
2. **JS-injected result rows don't get Astro's scoped-CSS `data-astro-cid` attribute**, so scoped `<style>` never reaches them (they render unstyled). Style dynamic result rows with an `is:global` block (or a dedicated stylesheet / Pagefind's own CSS). Baked-in commands/nav are fine scoped.
3. **Note excerpts include the leading date + embed-card text** — consider `data-pagefind-ignore` on the note date-link to clean excerpts.
4. Building-block components load from `pagefind-component-ui.{js,css}` and render into **light DOM**.

**Files touched by the experiment (to consolidate/tear down in the real build):** `astro.config.mjs`, `src/pages/scratchpad.astro`, `src/layouts/Article.astro`, `src/layouts/Note.astro`, `src/components/layout/NoteCard.astro`, `src/components/layout/TableOfContents.astro`.

## Phase 3 — Get the Pagefind index right

Indexing works; now make the index itself genuinely good — correct scoping everywhere, the right pages included, and a deliberate metadata schema. Result quality in the palette rests on this.

**Audit + fix the existing scoping**

- [ ] Re-check the article/note attributes from Phase 2 are correct and complete: `data-pagefind-body`, `type` meta, `title` meta, and the `data-pagefind-ignore`s (metadata line, footer-actions, TOC). Confirm `LLMDiscoveryNote`, `SeriesCallout`, and the note `Embed`/date-link behave the way we want.
- [ ] Clean up excerpt noise: notes currently index the leading date and the embed-card text. `data-pagefind-ignore` the note date-link, and decide whether the source embed should contribute to the body at all.

**Decide + add the right pages** (static _content_ pages only — never chrome/utility pages)

- [ ] Audit `src/pages/` and decide what to index. Real candidates: home (`index.astro`), `making.astro`, and the standalone MDX pages `now.mdx`, `colophon.mdx`, `privacy.mdx`, `ai.mdx`. Explicitly **exclude** `404`, `scratchpad`, `scratchpad2`, `toolboxtest`, and `styleguide/*` (internal / `noindex`).
- [ ] Find the single seam to add `data-pagefind-body` for the MDX pages (they likely share a layout) so it's one edit, not four.
- [ ] `making.astro`: decide whether to index it as one `/making` result or surface individual projects (they live at `/making#{id}` — heading anchors can become `sub_results`).

**Metadata schema — what we capture beyond Pagefind's defaults**

- [ ] Settle the `type` taxonomy (today `article|note`; add `page`, maybe `project`) and give each newly-indexed page a sensible `type`.
- [ ] Decide whether to index frontmatter `description` as `data-pagefind-meta="description"` (a stable result subtitle vs the match-excerpt).
- [ ] Decide on meta for `date`, `tags`, cover `image` — plus whether to add `data-pagefind-sort="date"` for recency ordering and/or `data-pagefind-weight` to boost titles.
- [ ] Meta vs **filter**: we group by `.meta.type` today (so `pagefind.filters()` is empty). Only switch to `data-pagefind-filter` if we actually want a faceted filter UI.
- [ ] Confirm the indexed `url` is canonical for every type (articles `/writing/{id}/`, notes `/notes/{id}/`, pages `/{slug}/`).

**Verify**

- [ ] Rebuild and re-check the round-trip: page count matches the intended set, every result carries the metadata we designed, excerpts are clean. Re-measure payload if the index grew.

## Phase 4 — Extract the Pagefind integration into `lib/`

Pull the inline experiment wiring out of `astro.config.mjs` into a clean, reusable module, and define the typed client-side search API the palette will consume.

- [ ] Move the inline `pagefind()` integration (the `astro:build:done` indexer + `astro:server:setup` dev middleware) into `src/lib/`; import it in `astro.config.mjs`.
- [ ] Build a small typed **client search helper** (the "nice API" for the components): lazy-init + `debouncedSearch`, normalize `.data()` → a stable `{ url, title, type, excerpt, description?, … }` shape, degrade gracefully when there's no index.
- [ ] Bake in the Phase 2 gotcha: the runtime import must use a **computed path** (`` `${import.meta.env.BASE_URL}pagefind/pagefind.js` ``), not a static literal.
- [ ] Decide where the client helper lives — `lib/` is for build-time plugins, so the browser-side helper probably belongs in `utils/` or alongside the component, not `lib/`.

## Phase 5 — Build the command palette as a real Astro component

Promote the `scratchpad2.astro` shell into a production component (or a small set) and wire it into the site. **No search yet** — commands + nav only, so it's fully functional regardless of index state.

- [ ] Create the palette component(s) — decide single `CommandPalette.astro` vs a shell + item/group subcomponents. Likely under `components/navigation/` or `components/ui/`.
- [ ] Carry over the proven primitives from Phase 1: native modal `<dialog>` + combobox/listbox, `aria-activedescendant` nav, `@starting-style` animation, idempotent init on `astro:page-load`, the Invoker-Commands open path + `Cmd/Ctrl+K` hotkey.
- [ ] Wire it into the shared layout / `BaseHead` so it's on every page; decide where the visible trigger lives (nav?).
- [ ] Implement the real commands: Latest/Random Article, Latest/Random Note, Copy URL, Copy as Markdown (reuse the `.md.ts` twins), navigation to all pages (consider the `discoverStaticPages()` glob from `llms.txt.ts` for nav targets).
- [ ] Baseline-vs-fallback call for Invoker Commands + `closedby` (early-2026 Baseline) — rely on Baseline or add tiny JS fallbacks. The hotkey works everywhere regardless.

## Phase 6 — Wire Pagefind results into the palette

Consume the Phase 4 client API inside the Phase 5 component to add the live Content results group. This is where search lands in the real palette — and where most of the result styling/design work happens.

- [ ] Render a Content results group from the client search API into the same listbox, sharing the one `aria-activedescendant` nav loop (the Variant-A model from Phase 2).
- [ ] Style result rows (title / type / excerpt, `<mark>` highlights, maybe `sub_results`). Phase 2 gotcha: JS-injected rows need **global CSS**, not scoped `<style>`.
- [ ] Expect to **adjust the palette design** to accommodate results: grouping, empty / loading / no-results states, result density, whether descriptions or sub-results show.
- [ ] `aria-live` result-count announcements; sensible ordering (recency vs relevance) using whatever Phase 3 metadata enabled.
- [ ] Full accessibility pass: screen-reader testing, focus return on close.

## Phase 7 — Testing, cleanup & refactor

Now that it all works, make it correct, lean, and clean — and remove the experiment scaffolding.

- [ ] Tests: e2e the shell + commands. **The Check stage runs Playwright in parallel with Build, so no index exists there** — don't depend on one. Unit-test / fixture the search-result rendering. Confirm how `test:e2e` is wired first.
- [ ] Performance: confirm zero-JS-by-default still holds (nothing loads until the palette opens), re-check payload, verify no unnecessary JS ships.
- [ ] Code/CSS review: clean and evergreen comments, tidy CSS; run `check:knip` + `check:dupes`.
- [ ] Tear down the experiments: delete `scratchpad.astro`, `scratchpad2.astro`, and any `docs/tasks-todo/temporary/` leftovers.
- [ ] `check:all` green.

## Phase 8 — OpenSearch XML

- [ ] Add an OpenSearch description XML document for browser address-bar search integration, linked from the `<head>`.

## Phase 9 — LLM / agent-readiness for site search

- [ ] Any LLM-friendly or meta-tag additions now that the site has search. Re-run the tooling from `docs/tasks-done/task-2026-06-14-1-agent-readiness-improvements.md` (afdocs, isitagentready) to check for anything new to add.

## Phase 10 — Styleguide & developer docs

- [ ] Add the palette (and any sub-components) to the right parts of the multi-page styleguide; update any existing components changed along the way (`NoteCard`, `TableOfContents`, the layouts).
- [ ] New evergreen developer doc explaining how the palette + Pagefind + build integration fit together.
- [ ] Update `docs/developer/deployment.md` for the Pagefind build step; check `docs/developer/` guides, `README.md`(s), and `AGENTS.md` are still correct.

## Last Phase — Final review, QA & ship

- [ ] Review sweep: refactor opportunities, remove cruft, confirm comments/tests are good.
- [ ] Confirm the CI packaging step copies `dist/pagefind/` into the deployed output (`.vercel/output/static/`) — the one thing we couldn't verify locally.
- [ ] OG images generate correctly and SEO data is correct (bump OG `CACHE_VERSION` if templates/branding/fonts changed).
- [ ] Check Lighthouse scores.
- [ ] CSP note: the site sends no CSP today so Pagefind's WASM loads fine; if a CSP is ever added it needs `wasm-unsafe-eval` + `worker-src blob:`.
- [ ] Merge, deploy, and test on mobile.

---

# Reference appendix

Everything below is copied/distilled from [issue #41](https://github.com/dannysmith/dannyis-astro/issues/41) and our research so this doc is self-contained across sessions. The issue remains the canonical source if anything conflicts.

## The decision, in detail

**Hand-rolled native `<dialog>` + WAI-ARIA combobox palette (~50 lines of dependency-free JS), backed by Pagefind for full-text content search. No React.**

- **UI:** native `<dialog>` + `showModal()` gives focus-trap, `::backdrop`, `inert`, and Esc-to-close *for free* (all of which `show()` does NOT provide — must use `showModal()`). ARIA **combobox-with-listbox** pattern: DOM focus stays on the input, the active option is tracked via `aria-activedescendant` (roving tabindex would break typing). CSS `@starting-style` + `transition-behavior: allow-discrete` for open/close animation; gate on `prefers-reduced-motion`. Invoker Commands API (`command="show-modal"`) can open the dialog with zero JS from a visible button, but the `Cmd/Ctrl+K` global hotkey always needs a few lines of JS.
- **Search:** Pagefind — Rust→WASM, runs post-build, shards its index alphabetically so the browser fetches only the chunks a query touches (~100 KB typical total payload incl. WASM). `search()` returns lightweight handles for *all* matches; `.data()` pulls one fragment per result you actually render. It's the default search in Astro Starlight.
- **Data:** commands / nav / recent-posts are **server-rendered into the component at build time** (so they work in dev regardless of index freshness). Likely **no separate `search-index.json` needed** — Pagefind covers title + full-text. "Copy as Markdown" reuses the existing `.md.ts` endpoints.

## Key technical notes

- **Where Pagefind runs:** inline `astro:build:done` integration → `pagefind.Node` API over `dist/` → `dist/pagefind/`. Our build runs in **CI (GitHub Actions), not on Vercel** (`vercel deploy --prebuilt` just hosts prebuilt output), so the hook is the right mechanism — it travels with `astro build` on any host/CI, keeping the build host-agnostic. Output must land in `dist/` before the CI step copies it into `.vercel/output/static/`. `dist/` is already gitignored, so the generated index stays uncommitted (consistent with "don't commit generated assets").
- **No CSP today** — the security headers in `vercel.output-config.json` are `x-content-type-options`, `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`, and a `link` header; there is **no `Content-Security-Policy`**, so Pagefind's WASM loads without header changes. If a CSP is ever added it needs `wasm-unsafe-eval` + `worker-src blob:`.
- **View transitions not in use** — only a comment in `MarkdownBlock.astro` references `astro:page-load`. No re-bind gotcha today, but the codebase convention is to make init scripts idempotent on `astro:page-load` — follow it.
- **Pagefind index scoping attributes:** `data-pagefind-body` (restrict indexing to real content, excludes nav/footer/chrome), `data-pagefind-ignore` (exclude elements), `data-pagefind-meta="type:article"` (carry content type into results for grouping/faceting), `data-pagefind-weight` (boost e.g. titles).
- **Pagefind custom-UI API shape** (the contract Phase 1 consumes):
  ```js
  const pagefind = await import("/pagefind/pagefind.js");
  await pagefind.init();
  const search = await pagefind.debouncedSearch(query, {}, 300); // null if superseded
  const top = await Promise.all(search.results.slice(0, 8).map(r => r.data()));
  // each item: { url, excerpt, meta:{title,image,...}, sub_results:[{title,url,excerpt}] }
  // extras: pagefind.preload("s"), pagefind.filters(), search(q,{filters}), search(q,{sort})
  ```
- **CI test interaction:** `check:all` runs Playwright in the **Check** stage, which runs *in parallel with Build* and produces **no Pagefind index**. So e2e the shell + commands (no index needed); unit-test / fixture the search-result rendering.

## Repo grounding (existing infrastructure to reuse)

- `src/pages/redirects.json.ts` — the idiomatic `.json.ts` endpoint pattern (`export const prerender = true`, `APIRoute` `GET` returning a `Response`) if we ever do need a JSON index. A single JSON file needs **no** `getStaticPaths`.
- `src/pages/writing/[...slug].md.ts` & `src/pages/notes/[...slug].md.ts` — existing per-page Markdown twins → "Copy as Markdown" is basically free.
- `src/pages/llms.txt.ts` — static-page auto-discovery via `import.meta.glob` (`discoverStaticPages()`), useful if we want to enumerate nav targets.
- `src/lib/remark-reading-time.mjs` — the `mdast-util-to-string` frontmatter-injection pattern to copy **if** we ever need build-time plaintext (`mdast-util-to-string@^4` is already a dep). Handles MDX gracefully (component children contribute text; bare islands contribute nothing and never throw — unlike the Container-API path in `rss.xml.js`, which must skip island-bearing entries).
- `src/utils/content.ts` — `filterContentForListing` / `getSortedProjects` (drops drafts in prod, keeps them in dev). **Gotcha:** cast collection results `as CollectionEntry<'...'>[]` (generic filter collapses in CI before `astro sync`).
- Content volume at time of research: **79 articles + 117 notes + 4 projects (~200 docs)**. URLs: articles `/writing/{id}/`, notes `/notes/{id}/`, projects `/making#{id}`.

## Open questions (settle during the experiments)

- **Building-block components vs raw JS API** — reuse Pagefind's `<pagefind-input>`/`<pagefind-results>` inside our dialog (less maintenance) or render from raw `.data()` (full control)? Decide on the keyboard-nav-composition seam in Phase 2. *(Danny's steer: keep the building blocks genuinely in play, don't pre-reject them.)*
- **Metadata JSON — needed at all?** Probably not, if Pagefind covers search and commands are baked in at build time.
- **Dev-mode approach** — serve prebuilt `dist/pagefind/` via middleware vs degrade to no results.

## References & resources

**Reference implementations (inspiration, not dependencies):**
- Astro Starlight `Search.astro` — canonical native-`<dialog>` + idle-loaded-Pagefind pattern: https://github.com/withastro/starlight/blob/main/packages/starlight/components/Search.astro
- `astro-pagefind` (shishkin) — small codebase; crib the `astro:build:done` hook + dev-server middleware: https://github.com/shishkin/astro-pagefind
- `accessible-astro-launcher` — zero-dep, no-React, WCAG 2.2 AA combobox palette (nav + action items): https://github.com/incluud/accessible-astro-launcher
- seanmcp.com — personal Astro palette, explicitly no React/kbar: https://www.seanmcp.com/articles/new-command-palette/

**Pagefind:**
- Docs & API: https://pagefind.app/ · https://pagefind.app/docs/api/ · https://pagefind.app/docs/components/
- Guides: https://toolchew.com/en/how-to-add-search-astro/ · https://flaviocopes.com/static-site-search-pagefind/ · https://dteather.com/blogs/astro-search-bar/ · https://lilting.ch/en/articles/pagefind-astro-search

**Platform / a11y:**
- WAI-ARIA APG combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ (+ autocomplete-list example: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)
- Invoker Commands API: https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API
- `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- `<dialog>` entry/exit animations: https://developer.chrome.com/blog/entry-exit-animations
- awesome-command-palette: https://github.com/stefanjudis/awesome-command-palette
- Reusing a Pagefind index outside Starlight (Macwright): https://macwright.com/2024/04/03/starlight-search-everywhere

**Considered & rejected:** MiniSearch/Fuse/Lunr/FlexSearch (in-memory, load the full index eagerly — Pagefind's chunking is the whole point); Orama (eager, overkill unless we want vector/semantic later); Stork (unmaintained, superseded by Pagefind); Algolia/Typesense/Meilisearch (reintroduce a backend); building our own Rust/WASM (Pagefind already *is* that, more mature); cmdk/kbar (React-only).
