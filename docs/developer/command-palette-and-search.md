# Command Palette & Search

The `⌘/Ctrl+K` command palette is the site's one search-and-navigation surface: baked-in commands and navigation, plus full-text search across articles, notes and pages.

This doc covers the _why_. The code is the reference for _how_.

## The three parts

Kept separate so each can change on its own:

1. **The palette UI** — `src/components/layout/CommandPalette.astro`. A self-contained overlay dropped into every layout.
2. **The search index** — [Pagefind](https://pagefind.app), built into `dist/pagefind/`.
3. **The client API** — `src/utils/pagefind.ts` (`@utils/pagefind`), a typed wrapper so the palette never touches Pagefind's untyped runtime directly.

## Why native `<dialog>`, no library

A native modal `<dialog>` plus the WAI-ARIA combobox pattern gives us the hard parts — focus trap, backdrop, background `inert`, Esc-to-close, click-outside — for free, in plain HTML/CSS/JS. So there's no command-palette library and no React island, which fits the site's zero-JS-by-default approach: nothing loads until you open the palette.

Commands and navigation are baked into the markup at build time, so the palette works even when there's no search index. The only JS the open path really needs is the small `⌘K` hotkey — there's no declarative way to bind a global shortcut.

## Why Pagefind

Most search libraries load the whole index up front — fine for a few docs, wasteful for a couple of hundred. Pagefind builds a static index split into shards, and the browser only fetches the shards a query actually touches. It runs entirely client-side (no backend, no serverless), which keeps the site deployable anywhere. It's also what Astro Starlight uses.

What gets indexed is controlled by `data-pagefind-*` attributes on the content layouts:

- **`data-pagefind-body`** marks the searchable region. Adding it anywhere makes Pagefind index _only_ pages that have it — so chrome, listing and utility pages drop out for free.
- **`data-pagefind-ignore`** removes bits we don't want in results (TOC, footer actions, a note's date and source embed).
- **`data-pagefind-meta`** carries `type` / `title` / `date` through to results, for grouping and a recency sort.

See `Article.astro`, `NoteCard.astro` (in `components/ui/`), `Page.astro` and `making.astro`. `NoteCard` only marks itself as the body on the note's own page (via its `standalone` prop), so listing pages don't turn every note into a separate result.

## Why the build integration is ours

Pagefind indexes the _built_ site, so it has to run after the build. Rather than pull in `astro-pagefind`, we do the same thing in one small module — `src/lib/pagefind-integration.mjs` — with two hooks:

- **`astro:build:done`** runs the indexer over `dist/` and writes `dist/pagefind/`. It rides `astro build`, so it works on any host (we build in CI; Vercel just hosts the output). `dist/` is gitignored, so the index is never committed.
- **`astro:server:setup`** serves a previously-built `dist/pagefind/` in `astro dev`, since there's no build in dev. No prior build just means search shows "unavailable" — nothing breaks. Run `bun run build` once, or use `bun run preview`, to search locally.

## How a search flows

Open the palette → on first focus, `@utils/pagefind` loads and inits Pagefind → each keystroke runs a debounced `search()` that returns normalized results → the palette drops those into a "Content" group alongside the commands, sharing the same keyboard nav.

## Sharp edges

- **The Pagefind import path is computed**, not a static string (`` `${import.meta.env.BASE_URL}pagefind/pagefind.js` ``). A literal path makes Vite and the build try to resolve a file that only exists _after_ the build, and fail.
- **Result rows use global CSS**, not the component's scoped `<style>`. They're built with `innerHTML` at runtime, so Astro's scoped styles never reach them.
- **Grouping reads `data-pagefind-meta`, not filters.** A faceted-filter UI would need `data-pagefind-filter` instead.
- **There's deliberately no `/search?q=` page.** The palette is the whole search surface. A machine-readable route — and the OpenSearch / `SearchAction` metadata that would point at it — is deferred (issue #140).
- **CI has no index.** The Check stage runs in parallel with the build, so e2e tests can't rely on search results.

## Where things live

- `src/components/layout/CommandPalette.astro` — the palette (UI, hotkey, search wiring).
- `src/utils/pagefind.ts` — the client search helper (tested in `tests/unit/pagefind.test.ts`).
- `src/lib/pagefind-integration.mjs` — the build + dev-serve integration.
- The content layouts — the `data-pagefind-*` scoping.
- `/styleguide/ui` — visual documentation of the component.
