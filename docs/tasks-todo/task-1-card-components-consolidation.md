# Task: Card components consolidation

Unify the card components (ToolCard, ProjectCard, NoteCard, plus a new ArticleCard) behind a consistent external interface, share the compact-tile implementation, retire the old unused ContentCard, and add a new `ContentCard` MDX dispatcher that renders any collection item with the right card.

## Background & decisions (agreed)

There are two kinds of card on this site:

1. **Primary display cards** (NoteCard, ProjectCard) — the default card *is* the main way the content type is rendered on the site, including its full body. Must stay fully-featured down to narrow container widths.
2. **Links-to-longer-content cards** (ToolCard, ArticleCard) — the content lives elsewhere (betterat.work, the article page); the card shows pertinent info + summary and links out. Mostly used in grids/collection indexes.

Decisions made during review:

- **Consistent prop name: `item`** — every card takes its collection entry as `item: CollectionEntry<'…'>` plus `compact?: boolean`. (Rhymes with the MDX dispatcher's `item="collection/id"` string prop.)
- **Compact = explicit, never responsive.** A compact card is a "click-me to go to the thing" tile chosen by the caller. Full cards adapt to narrow containers but never auto-degrade into compact (the old ContentCard's sub-350px auto-compact behaviour is explicitly rejected). All variants remain container-responsive *within* their variant, so type 2 full cards *may* hide some content/featres at smaller container widths if appropriate.
- **Shared compact tile, bespoke full cards.** ToolCard's and ProjectCard's compact variants are already near-identical copy-paste (icon + title + byline, left accent bar that grows on hover/focus, byline dropped under 20rem). Extract that into one internal component and give every card's compact branch to it. Full variants stay bespoke — they're genuinely different and shouldn't be abstracted.
- **Per-type accent colours** on the tiles (from the old ContentCard's scheme): article = `--color-accent`, note = `--color-blue`, tool = `--color-green`, project = `--color-accent`. Articles/notes have no natural icon — the tile renders icon-less for them; the accent colour carries the type signal.
- **NoteCard becomes fully self-contained** (Option B from discussion). Both current call sites (`Note.astro` layout and `notes/index.astro`) already hold the full entry and every difference between them keys off one fact — "is this the note's own page?". NoteCard takes `item` and calls `render()` internally (precedent: ProjectCard already renders its body inline); one boolean prop gates Pagefind indexing, BackToTopLink and MarkdownContentActions share behaviour. The slot goes away.
- **Old ContentCard is deleted** (used nowhere but the styleguide). A new `ContentCard` dispatcher lives in `components/mdx/` for easy use in MDX: `<ContentCard item="articles/some-slug" compact />` → `getEntry()` → renders the right card.
- **Out of scope / follow-up:** teaching `Embed.astro` to recognise internal `danny.is` / betterat.work URLs and render cards. Custom slugs make that a search rather than a `getEntry`, and it's separable.

## Working method

- After **each phase**: eyeball the results in `/scratchpad` (keep it up to date as cards change — it shows every card/variant in `ResizableContainer`s for narrow-width testing), check both themes for visual changes, and run `bun run check:all`. No full build needed per phase.
- Danny commits manually after each phase.

---

## Phase 1 — Shared compact tile + refactor existing cards

1. New internal component `src/components/ui/CompactCardTile.astro` (not in the barrel — imported directly by the cards, not consumer-facing):
   - Props: `href`, `title`, `byline?`, `accentColor?` (defaults to `--color-accent`), `external?` (target/rel handling, as ProjectCard's compact does now).
   - Default slot for the icon (so ToolCard can pass emoji/img and ProjectCard can pass `ProjectIcon`; ArticleCard/NoteCard pass nothing).
   - Owns the tile idiom: bordered `background-secondary` tile, left accent bar growing on hover/`:focus-visible`, icon/title/byline row, `@container (width < 20rem)` drops the byline. Is its own size container.
2. Refactor `ToolCard` and `ProjectCard` compact branches to delegate to it, deleting their duplicated compact CSS. Tool byline stays "Tool filed under {category}"; project byline stays `data.byline`.
3. Rename props: `ToolCard tool` → `item`, `ProjectCard project` → `item`. Update all call sites: `toolbox.astro`, `making.astro`, `styleguide/components.astro`, `scratchpad.astro`, and the published note `src/content/notes/2026-07-17-showing-my-toolbox-on-this-site.mdx` (imports ToolCard in MDX with `tool={…}` — must be updated or the build breaks).
4. Verify: no visual regressions on `/toolbox`, `/making`, scratchpad compact stacks at various widths.

## Phase 2 — New ArticleCard

1. `src/components/ui/ArticleCard.astro`, exported from the ui barrel. `item: CollectionEntry<'articles'>`, `compact?`.
2. **Full variant** — modelled on ToolCard's full card (same shell idiom, accent colour `--color-accent`):
   - Optional cover image (`data.cover`/`coverAlt` via `astro:assets` Image) with "Article" type badge overlaid; badge sits in the content header when there's no cover.
   - Title, then summary: `data.description` falling back to `generateSummary()` (`@utils/content-summary`), line-clamped.
   - Meta/footer: pubDate (`FormattedDate`), reading time (`data.minutesRead`, injected by `satteri-reading-time.mjs` — available straight off `getCollection()`), `platform` pill for medium/external pieces, and a small "part of a series" indicator when `data.series` is set.
   - Links to `/writing/{slug}/` respecting the custom `slug` frontmatter field (`data.slug ?? item.id`).
3. **Compact variant** — `CompactCardTile`, no icon, byline like "Article · 12 Mar 2026 · 5 min read" (drop segments gracefully when absent).
4. Add ArticleCard sections to the scratchpad: with cover, without cover, external/platform article, series member, compact stack.
5. This card is not yet *used* anywhere on the site — that's fine; candidate future uses (e.g. writing index, related-articles) are separate tasks.

## Phase 3 — NoteCard rework

1. Move `NoteCard.astro` from `components/layout/` to `components/ui/`; update both barrels and imports.
2. New interface: `item: CollectionEntry<'notes'>`, `compact?`, `standalone?` (replaces `indexAsBody`, since it now gates more than Pagefind).
3. Full variant becomes self-contained:
   - Derives title/pubDate/tags/slug from `item`; calls `render(item)` internally and renders `<Content components={MDX_COMPONENT_REMAPPING} />` itself. Keeps the sourceURL `Embed`, h-entry microformats and the note visual idiom (white surface, dot grid, top accent bar) unchanged.
   - `standalone` (the note's own page): sets `data-pagefind-body` + meta/sort dates, renders MarkdownContentActions (share enabled) + BackToTopLink.
   - Not standalone (listings): no Pagefind attrs, MarkdownContentActions with `disableShare`.
4. Update call sites:
   - `Note.astro` layout: page route passes the entry through; layout keeps head/OG/description concerns and renders `<NoteCard item={note} standalone />`. The content slot chain (page → layout → card) goes away.
   - `notes/index.astro`: loses its `render()` loop; recent notes become `<NoteCard item={note} />`.
5. **Compact variant** via `CompactCardTile`: no icon, blue accent, byline "Note · 15 Jul 2026".
6. Styleguide NoteCard demos switch from fabricated props to rendering real entries (the `note-styleguide` note exists for this).
7. Verify carefully: a note page (Pagefind attrs present in built HTML can wait for final phase; eyeball the rest), notes index, view transitions (`--vt-name` still set by callers), both themes.

## Phase 4 — ContentCard dispatcher

1. Delete `src/components/ui/ContentCard.astro` + its barrel export + `generateSummary` usages check (util stays — ArticleCard uses it).
2. New `src/components/mdx/ContentCard.astro`, exported from the mdx barrel:
   - Props: `item: string` (`"collection/id"`), `compact?: boolean`.
   - Parses collection prefix, `getEntry()`, throws a clear build-time error for unknown collection or missing id.
   - Dispatches: `articles` → ArticleCard, `notes` → NoteCard, `toolboxPages` → ToolCard, `projects` → ProjectCard, passing `item` + `compact` through.
3. Add scratchpad examples (one per collection, full + compact).

## Phase 5 — Styleguide, docs, visual testing

1. `styleguide/components.astro`: replace the old ContentCard section with the new dispatcher's docs; update NoteCard/ToolCard/ProjectCard sections for the `item` interface; add ArticleCard section with examples (per rule: styleguides updated when visual components change).
2. Add compact and full varients of each card to `note-styleguide.md` and `article-styleguide.md` with paragraphs between.
3. Developer docs sweep — grep shows cards mentioned in `component-patterns.md`, `content-system.md`, `architecture-guide.md`, `command-palette-and-search.md`, `design-tokens.md`; update whichever describe the old interfaces/locations.
4. Visual pass: `/scratchpad`, `/styleguide/components`, `/toolbox`, `/making`, `/notes`, a note page, `/writing` — both themes, narrow and wide, compact stacks dragged narrow.
5. Confirm Pagefind still indexes notes correctly (the `standalone` attrs) — full build + search smoke test happens here.
6. Review for obvious opportunities to refaceor, modernise CSS, improve semantics etc. Review for code quality.
7. Review for comments. Remove any AI slop comments and ensure all comments are good and evergreen.
8. Final `bun run check:all`.
