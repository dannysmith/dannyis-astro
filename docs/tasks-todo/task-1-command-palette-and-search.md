# Task: Command Palette & Site Search

Build a `Cmd/Ctrl+K` command palette overlay that supports both **navigation/commands** and **full-text search** across articles, notes, and pages. Fully keyboard-navigable and accessible; zero-JS-by-default (nothing loads until the palette opens); no React.

All research, rationale, decisions, references and the full reminders checklist live in the issue — that's the source of truth, this doc is the plan of work:

**[GitHub issue #41 — Keyboard Search & Command Palette](https://github.com/dannysmith/dannyis-astro/issues/41)**

Short version of the agreed approach: hand-rolled native `<dialog>` + WAI-ARIA combobox palette, backed by **Pagefind** for content search, wired via an inline `astro:build:done` integration. Commands/nav baked into the component at build time.

## How this plan is structured

We start with **two throwaway experiments in scratchpad pages** — one to de-risk the UI craft, one to de-risk the search infrastructure. We do the **command palette first, together**, because it's the more interesting/learnable part and its result shapes everything else. (Note: this reverses the experiment numbering in the issue, where Pagefind is "Experiment 1".)

Only Phases 1 and 2 are fully planned. **Everything after is numbered `X`** — deliberately provisional. Once both experiments are done we'll rewrite the back half of this doc to reflect what we actually learned (see the re-plan checkpoint).

---

## Phase 1 — Experiment: hand-rolled command palette (`scratchpad2.astro`)

Build the palette up one native primitive at a time, so we understand each piece and can decide the design by feel. Static/dummy command data only — no real search yet. Draw on the references in the issue (Starlight `Search.astro`, `accessible-astro-launcher`, the APG combobox pattern) as inspiration, not dependencies.

- [ ] New `src/pages/scratchpad2.astro` scaffold.
- [ ] Native `<dialog>` shell with `showModal()` — confirm the free wins (focus-trap, `::backdrop`, `inert`, Esc).
- [ ] Global `Cmd/Ctrl+K` hotkey (macOS vs other detection) + a visible trigger button. Experiment with the Invoker Commands API (`command="show-modal"`) for the zero-JS open path; measure how much JS the hotkey alone actually needs.
- [ ] Combobox/listbox ARIA structure: input `role="combobox"` + `aria-controls`/`aria-autocomplete`, results `role="listbox"`, items `role="option"`. Active item tracked via `aria-activedescendant` (DOM focus stays in the input).
- [ ] Filter-as-you-type over a static command list.
- [ ] Arrow / Enter / Escape keyboard navigation, with `scrollIntoView({block:'nearest'})` + `scroll-margin` for the active row.
- [ ] Grouped sections (Commands / Navigation / Recent posts) with headings that hide when their group is empty (`:has()`).
- [ ] Open/close animation (`@starting-style` + `transition-behavior: allow-discrete`, `::backdrop`) with `prefers-reduced-motion` fallback.
- [ ] Make the init script idempotent on `astro:page-load` (codebase convention).
- [ ] Prototype the command *actions* against dummy data: Copy URL, Copy as Markdown (fetch the current page's existing `.md` twin), Latest/Random Article/Note.

**Deliverable / learnings to capture:** the real minimum JS the palette needs; the chosen a11y model; the styling/theming direction; whether the commands/nav/recent data is comfortably server-rendered into the component at build time.

## Phase 2 — Experiment: Pagefind wiring (`scratchpad.astro`)

Separate experiment to de-risk the search infrastructure and learn the result-data contract that Phase 1's results group will consume.

- [ ] Add `pagefind` and an inline `astro:build:done` integration in `astro.config` that runs Pagefind's Node API over `dist/`, emitting `dist/pagefind/` (confirm it's picked up by the CI packaging step into `.vercel/output/static/`; `dist/` is already gitignored).
- [ ] Index scoping on the real layouts: `data-pagefind-body`, `data-pagefind-ignore`, and `data-pagefind-meta` (e.g. `type:article|note|page`) for grouping/faceting.
- [ ] Build + verify the full round-trip: build → index → query → real results across the actual content (79 articles / 117 notes / projects).
- [ ] Drive results two ways and compare: (a) the 1.5 building-block components (`<pagefind-input>`, `<pagefind-results>`) placed **inside a `<dialog>`**, and (b) the raw `pagefind.search()` → `.data()` JS API. Focus on the **keyboard-nav composition seam** — do the components' internal nav coexist with a separate commands group, or fight it?
- [ ] Record the shape of the `.data()` object (url, excerpt, meta, sub_results) — this is the contract Phase 1 consumes.
- [ ] Assess styling reach (CSS custom properties + custom inner structure slots) and measure payload impact (WASM + chunks) on a search.
- [ ] Dev mode: serve a previously-built `dist/pagefind/` via a tiny dev-server middleware (à la `astro-pagefind`), or accept no results in dev. Search need not work well in dev as long as nothing breaks.

**Deliverable / learnings to capture:** decision on building-blocks-vs-raw-API; confirmation of whether a separate `search-index.json` is needed at all; the dev-mode approach; payload numbers.

## Phase X — Re-plan checkpoint

After Phases 1 & 2, **rewrite everything below** to reflect real decisions: the chosen UI/data approach, the file/module structure, and a concrete build plan. The phases below are a provisional skeleton derived from the issue's reminders — treat them as a checklist of things not to forget, not a committed design.

---

## Phase X — Build the real thing

- [ ] Consolidate the two experiments into a production implementation; extract into `lib/` (build integration, any search helpers) + component files (palette component, likely under `components/navigation/` or `components/ui/`).
- [ ] Wire the palette into the real site layout so it's available on every page.
- [ ] Finalise the build integration + dev-mode handling from Phase 2.
- [ ] Implement all commands for real: Latest/Random Article, Latest/Random Note, Copy URL, Copy as Markdown, navigation to all pages.
- [ ] Full accessibility pass (screen-reader testing, `aria-live` result-count announcements, focus return).
- [ ] Tests: e2e the shell + commands (no index needed in the Check stage); unit-test / fixture the search-result rendering. Confirm how `test:e2e` is wired first.
- [ ] Tear down the scratchpad experiments.

## Phase X — OpenSearch XML

- [ ] Add an OpenSearch description XML document for browser address-bar search integration, linked from the `<head>`.

## Phase X — LLM / agent-readiness for site search

- [ ] Any LLM-friendly or meta-tag additions now that the site has search. Re-run the tooling from `docs/tasks-done/task-2026-06-14-1-agent-readiness-improvements.md` (afdocs, isitagentready) to check for anything new to add.

## Phase X — Styleguide

- [ ] Add the palette (and any new sub-components) to the correct parts of the multi-page styleguide; update any existing components we changed.

## Phase X — Developer docs

- [ ] New evergreen developer doc explaining how the palette + Pagefind + build integration work.
- [ ] Update `docs/developer/deployment.md` for the Pagefind build step, and check `docs/developer/` guides, `README.md`(s), and `AGENTS.md` are still correct.

## Phase X — Final review & QA sweep

Mostly checks that can be batched at the end:

- [ ] Review sweep: refactor opportunities, remove cruft, clean up CSS, ensure comments are good and evergreen, add any missing tests.
- [ ] Ensure OG images generate correctly and SEO data is all correct (bump OG `CACHE_VERSION` if templates/branding/fonts changed).
- [ ] Check Lighthouse scores.
- [ ] Future-CSP note: site currently sends no CSP so Pagefind's WASM loads fine; if a CSP is ever added it needs `wasm-unsafe-eval` + `worker-src blob:`.

## Phase X — Ship

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
