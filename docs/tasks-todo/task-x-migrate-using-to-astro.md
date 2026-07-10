# Task: Migrate "Using" from Notion to Astro

Move the `/using` mini-site off Notion and into this codebase as native static pages. Currently `/using` redirects (via `src/config/redirects.ts`) to a Notion public site. We want the content to live here instead.

Originates from [issue #124](https://github.com/dannysmith/dannyis-astro/issues/124).

## Goal

`danny.is/using` becomes a real page on this site with four sub-pages, all rendered with the existing `@layouts/Page.astro` layout and existing MDX components to begin with. Content is migrated **verbatim** (we'll do a content-freshness pass later, separately). All images are pulled off Notion's S3, re-hosted in `src/assets`, optimised by Astro, and given proper alt text. The hardware database is **dropped**, not migrated.

**Not building** (for now): a custom `Uses` layout, a `using` content collection, or any structured "gear list" data. Start with plain MDX pages under `src/pages/using/`; we can graduate to a custom layout or collection later if it earns its keep.

## Source content (Notion)

The Notion mini-site is one landing page + four children (+ one embedded database we're dropping). Full-length reference screenshots are in `docs/tasks-todo/screenshots/` (`home`, `bag-1`…`bag-5` — the page is ~28k px tall so it's sliced, `office`, `software`, `outdoors`).

| Target route | Notion page | Shape | Images |
| --- | --- | --- | --- |
| `/using` | 🖥 Danny is Using… (landing) | Short philosophy intro + links to the four children | 0 (cover only) |
| `/using/bag` | 💼 Danny's Bag & Contents | Richest page. "Additive system" framing, principles, per-item write-ups with buy links | ~30 photos + 1 YouTube |
| `/using/office` | 🖥 Danny's Home Office & Desk Setup | Desk tour, pink section headings, column layouts, image galleries | ~17 photos |
| `/using/software` | 💻 Danny's Software | Principles + categorised tool lists, one toggle (Cursor extensions), phone/watch screenshots | ~2 wallpapers + ~18 phone/watch screenshots |
| `/using/outdoors` | 🎒 Hiking, Camping and Bushcraft Kit | Very detailed kit list, mostly bulleted prose, "Five C's" principles, wishlist | 1 YouTube video, ~0 inline photos |

**Total: ~65–70 images**, all on Notion S3 with expiring signed URLs. Re-hosting + optimising + alt text is the bulk of the work, not the markup.

## Key decisions (agreed)

### Drop the hardware database

The embedded "📦 Kit I Use" database is **not** migrated. Reasons: it's 27 rows but 26 are "Home Office" (1 "Day Bag", 0 "Field Kit"), ~12 are flagged "No longer used" (retired kit), and the live rows largely duplicate — and in places contradict — the Office page prose (DB lists a Logitech C920 + Mokin dock; the prose describes the current Sony ZV-1 + CalDigit TS4). A content collection would add maintenance for little reader value. The prose pages carry the kit, with buy-links inline as they already mostly do.

### Static MDX pages, `Page.astro` layout, no collection

These are evergreen pages, not dated posts — they fit the `now.mdx` / `colophon.mdx` pattern, not the articles/notes/projects pattern. Use `@layouts/Page.astro` for all five. We can swap in a custom `Uses` layout later if the pages want a distinct look; nothing here should block that.

- `src/pages/using.mdx` — the landing hub
- `src/pages/using/bag.mdx`, `office.mdx`, `software.mdx`, `outdoors.mdx`

`/using` stays the public hub URL (it's been shared), so keep it as the index.

### Migrate content verbatim, freshness pass comes later

Move everything across as-is. Known-stale bits (iPhone 11 Pro Max on the bag page, Arc/Cursor/"reconsidering web-first" on the software page, the outdoors wishlist and "I'll add links as I go" banner) stay **exactly as written** for this task. A separate content-update pass happens afterwards. The only content we remove is what's in the dropped database.

### Drop the "Made by Danny Smith" footer callout

Each Notion page ends with a synced "Made by Danny Smith… Youtube | Medium | @dannysmith | danny.is" callout. Don't migrate it — the site has its own footer and nav.

### Keep all four sub-pages

No consolidation. Each is substantial and serves a genuinely different audience.

## Notion block → component mapping

The conversion maps almost 1:1 onto existing MDX components (all in `src/components/mdx/`, available in MDX):

| Notion block | Target |
| --- | --- |
| Callout | `Callout` |
| Columns | `Grid` |
| Toggle / details (e.g. Cursor extensions) | `Accordion` |
| YouTube embed | `Embed` |
| Table (the "additive system" table) | `WrappedTable` or native MD table |
| Image + caption | Standard MD `![alt](../../assets/using/name.png 'caption')`; `Page.astro` already ships a `Lightbox` |
| Coloured (pink) section headings + divider | Native `##` |
| Image galleries (columns of photos) | `Grid` of images |

Images live in `src/assets/using/` and are referenced with relative MD image syntax so Astro optimises them at build (same as articles use `src/assets/articles/`).

---

## Phases

### Phase 1 — Scaffold routes and the landing page

1. Create `src/pages/using/index.mdx` (landing) using `layout: '@layouts/Page.astro'`, with the intro philosophy copy and links to the four sub-pages.
2. Create the four sub-page files as stubs (frontmatter + title) so routing/nav is real: `src/pages/using/{bag,office,software,outdoors}.mdx`.
3. Remove `'/using'` from `src/config/redirects.ts` (this is the single source feeding both the meta-refresh fallback and the Vercel HTTP redirect — removing it there removes it everywhere). Confirm the homepage link (`src/pages/index.astro:49`, "stuff I'm **using**") now resolves internally.
4. `bun run check:all`; eyeball `/using` in light + dark.

### Phase 2 — Image pipeline

The heavy lifting. For each page:

1. Pull every image off Notion (they're on expiring S3 URLs — grab them fresh; the raw fetched page JSON with image URLs is the source of truth). Includes `.jpeg`/`.png`/`.webp` and a couple of `.heic` desktop wallpapers on the software page (convert HEIC → web format).
2. Save into `src/assets/using/` with sensible, stable filenames.
3. Optimise (let Astro handle sizing; keep originals reasonable). Note any images that are low-res or should be re-shot.

### Phase 3 — Port page content

One page at a time, verbatim, using the block→component mapping above. Suggested order (simplest → richest): `outdoors` (mostly text) → `software` → `office` → `bag`.

Per page:
1. Convert prose, lists, callouts, columns, toggles, tables, embeds.
2. Wire in the migrated images.
3. Drop the "Made by Danny" footer callout. On `office`, drop the database entirely.
4. Check light + dark, check the `Lightbox` behaviour on galleries, check YouTube embeds render.
5. Write **alt text** for every image — most have none in Notion. Keep Notion captions where they exist (they become the MD image title / figcaption).

### Phase 4 - Review content and design (user-led)

Danny will read over all the ported content comparing the design and structure to the Notion pages. We'll probably need to tweak a few things and we may find ourselves wanting to make a few new astro components along the way, or enhance some of our existing ones. The goal here is to ensure that the new pages look good. May also remove or update certain bits of content which are no longer relevant manually.

We may also find ourselves considering a new breadcrumb component (either specifically for /uses or more generic). It may also make sense at this point to shift from the standard Page.astro layout to a new UsesPage layout.

### Phase 4 — SEO, discovery & nav

- Add `description` frontmatter to each page for `BaseHead`.
- Confirm all five routes land in the sitemap (should be free via file-based routing).
- Add the using pages to `llms.txt` (`src/pages/llms.txt.ts`) if appropriate.
- Decide whether `/using` should appear in main nav / footer, or stay linked only from the homepage (it's currently homepage-only).
- Consider per-page OG images, either custom or generated via `src/config/og-images.ts`.

### Phase 5 — Docs, checks & refactoring

- Update `docs/developer/` if we established any new pattern (e.g. an `src/assets/using/` convention). Check all docs for correctness (including AGENTS.md and README.md).
- Update the styleguide if we've added/altered components.
- Consider adding any unit tests for new/changed code or simple smoke tests for routes etc.
- Review the branch: tidy CSS/markup, evergreen comments only, remove any scaffolding cruft.
- `bun run check:all` (types, format, lint, unit, e2e).


## Notes

- **Pink section headings:** Notion uses a pink accent on `##` headings with a divider rule below. We'll just use our standard headings.
- **YouTube embeds:** the bag page has a clothes-rolling video and outdoors has a kit walkthrough — embed using our `<Embed>`.
