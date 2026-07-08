# Task: Add a Projects ("Stuff I Made") page

Collect the various things I've made and am making in one place at `danny.is/making`. Each project is an item in a content collection, so I can list them on the `/making` page, surface active/featured ones on the now page and (later) the homepage, and expose them to LLMs — without necessarily giving each project its own page.

Originates from [issue #135](https://github.com/dannysmith/dannyis-astro/issues/135).

## Goal

A `/making` page that shows my projects grouped by how alive they are, each with a title, one-line byline, short markdown writeup, a square icon, optional main image, optional website/GitHub links, and a status. Reuse the site's existing visual language (accent-border card shell, `Pill`, big display-type page title). Zero runtime JS, static HTML/CSS.

**Not building** per-project routes (`/making/<project>/`). Project bodies render inline on `/making`. This can be added later if wanted — content collections don't require routes.

## Candidate projects (to seed)

Astro Editor, Taskdn, LoomClone, My own website, The Toolbox, Roberts Radios, bluemap-mc-structures, bluemap-mc-chunktrimmer, mc-infra, Cobalt Next for Zed, My Datepicker, Tauri Template, danny-vps-infra, denv. Some are proper, some are tiny vibe-coded toys — the schema needs to represent that honestly.

---

## Key decisions (agreed)

### Status is three orthogonal axes, not one

The core design realisation: "status" is really three independent questions, and they can't collapse into a single enum (Astro Editor is `active-development + public + proper`; Roberts Radios is `actively-maintained + public-with-dragons + toy`; LoomClone is `finished + personal-only + toy`).

- **A — Activity / lifecycle:** _Is Danny still on this?_
- **B — Audience:** _Who's it for, can I use it?_
- **C — Seriousness:** _How seriously should I take it?_

**Decision:** store them normalized as separate fields, derive display denormalized. Keep A (`stage`) and B (`audience`) as first-class enums; make C (`kind`) an optional field used only when it adds something. B and C are correlated (both answer "how should the reader relate to this?") so C stays quiet in the UI.

- `stage`: `active-development` | `actively-maintained` | `finished` | `paused` | `archived`
- `audience`: `public` | `public-with-dragons` | `personal-only`
- `kind` (optional): `proper` | `toy` | `experiment`

#### What the values mean

**`stage`** — the liveness of the project. Also defines the group order on `/making` (top → bottom):

| Value | Meaning |
| --- | --- |
| `active-development` | I'm actively working on this right now |
| `actively-maintained` | I consider this *finished software* and I actively maintain it with dependency upgrades, bug fixes, small improvements etc |
| `finished` | I consider this *finished software* and I don't nececarrily keep it up-to-date |
| `paused` | Was in development but I've set it aside for now |
| `archived` | No longer working on this and don't intend to again. Probably archived on GitHub |

**`audience`** — who it's for and whether others can use it:

| Value | Meaning |
| --- | --- |
| `public` | Properly released for anyone to use, and ready for it (e.g. Astro Editor). |
| `public-with-dragons` | Available publicly and should work, but rough — alpha quality, or no effort put into making it work for anyone but me (e.g. Taskdn, Roberts Radios, the Minecraft stuff). |
| `personal-only` | Made just for me; not intended for others to use (e.g. LoomClone). |

**`kind`** (optional) — how seriously to take it:

| Value | Meaning |
| --- | --- |
| `proper` | A serious project I've put real effort into. |
| `toy` | A small, fun, often vibe-coded thing. |
| `experiment` | Made mainly to try something out or learn. |

**Display rule:** primary badge derives from `stage` (icon + colour via the existing `Pill`). `audience` shows as secondary context only when it's _not_ `public` — i.e. a "rough" hint for `public-with-dragons` and a "personal" hint for `personal-only`. `kind` is a quiet tag or nothing. Storage stays truthful; the card stays clean.

### Ordering: group by stage, sort by date within

No manual `order` index to babysit. On `/making`, group by `stage` in liveness order (`active-development` → `actively-maintained` → `finished` → `paused` → `archived`); within a group sort by `startDate` (newest first, undated floats to top). `featured` is a separate flag purely for cross-page surfacing — not for ordering the main list. An optional manual `order` escape hatch can be added later if genuinely needed.

### Content collection with markdown bodies, no routes

A `glob` md/mdx loader in `src/content/projects/` (like `articles`/`notes`, not the JSON `file` loader) because each project has a real markdown writeup. Icon/image via `image()`. No routes — bodies render inline on `/making` via `render()`.

### New `ProjectCard`, don't bend `ContentCard`

`ContentCard` is tightly coupled to the article/note/tool model (`pubDate` as primary meta, `generateSummary()`, 2:1 cover, `TYPE_CONFIG` keyed by collection). Projects are a different shape (square icon, byline, status badges, website/GitHub links, no date headline) and never appear in a _mixed_ card-list alongside articles/notes. So a dedicated `ProjectCard` that borrows the visual language (accent-border-grows-on-hover shell, container-query compact mode) is cleaner than teaching `ContentCard` about projects. Extract a shared shell only if a real need appears later.

---

## Phases

### Phase 1 — Schema, data, and the `/making` page (core, v1)

The minimum that makes `/making` real.

1. **Schema** (`src/content.config.ts`): new `projects` collection, `glob` md/mdx loader over `src/content/projects/`. Fields:
   - `title: z.string()`
   - `byline: z.string()` — one-sentence description
   - `stage: z.enum(['active-development','actively-maintained','finished','paused','archived'])`
   - `audience: z.enum(['public','public-with-dragons','personal-only'])`
   - `kind: z.enum(['proper','toy','experiment']).optional()`
   - `icon: image()` — square (document the requirement; can't enforce at schema level)
   - `image: image().optional()` — main graphic
   - `website: z.url().optional()`
   - `github: z.url().optional()`
   - `featured: z.boolean().default(false)`
   - `startDate: z.coerce.date().optional()`
   - `draft: z.boolean().default(false)` — for consistency with other collections
   - body: markdown writeup
   - Register `projects` in the `collections` export.
2. **Seed content**: create `src/content/projects/*.md` for the candidate projects above, with icons. Start with a handful of well-known ones (Astro Editor, Taskdn, LoomClone, this website, The Toolbox) to validate the design, then backfill the rest.
3. **Ordering helper** (`src/utils/content.ts`): a small pure, unit-testable function that takes the projects collection and returns them grouped by `stage` (in display order) and sorted by `startDate` within each group. Reuse `filterContentForListing` for draft handling.
4. **`ProjectCard.astro`** (`src/components/ui/`): square icon, title, byline, `stage` badge (via `Pill`), `audience` hint when not `public`, optional website/GitHub links. Borrows `ContentCard`'s shell/hover treatment and container-query compact mode. Renders the markdown body (or a compact variant without it — decide during build).
5. **`/making` page** (`src/pages/making.astro`): big display-type "Making" / "Stuff I Made" title matching the writing index; grouped grid of `ProjectCard`s with section headings per `stage`. Test light + dark.
6. **Quality gates**: unit-test the ordering helper; `bun run check:all`; eyeball both themes.

### Phase 2 — Now page integration

Auto-surface live projects on the now page instead of hand-maintaining the list.

- `<ActiveProjects />` component pulling `stage: active-development` (and/or `featured`) projects, rendered inside `now.mdx`. Note this shifts `now.mdx` from pure prose to prose + component — acceptable, but a deliberate change. Replace the current hand-written Taskdn/Astro Editor bullets.

### Phase 3 — SEO & LLM discovery

- Add a projects section to `llms.txt` (`src/pages/llms.txt.ts`).
- Confirm `/making` is in the sitemap (should be free).
- No RSS/JSON feeds for projects.
- Nice to have: schema.org `CreativeWork` / `SoftwareApplication` structured data per project on `/making`.

### Phase 4 — Clean up the data

Actually, have well-written descriptions of all these things, all the links are correct, I've got icons and covers and all the rest of it. Most of this is going to be manual on my part.

### Phase 5 - Add to footer, nav, homepage and the like

### Phase 5 - Deployment, CI, Checks & Documentation

We may need to update the deployment pipeline to ensure that assets for this are correctly handled, optimised and cached, although we may not need to do this at all. Maybe a few other places that we need to update to ensure that this new content collection is used and referenced everywhere it needs to, and so on.

We also need to update the developer documentation appropriately to reflect the new content collection and the `/making` route. We'll also need to update the styleguide as appropriate to include any new components.
