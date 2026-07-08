# Task: Article Series

I occasionally write articles as a series. I want to be able to add a `series: <uniqueseriesname>` to the frontmatter of articles, and if that is present then all articles which have it should show a special callout at the top which says something like "this article is part of a series" foloowed by a list of all the other published articles in that series where each list item is a link to the article and the current one is not a link and is bolded in the list. This should ignore draft articles and those with a future published date. It should obviously be ordered by pubDate.

- This should be correctly included in the markdown version of the article, tho lets see how it comes out by default before we specificaly address this. Likewise for RSS feeds.
- We'll need to do some gentle styling to make sure this looks good in articles by eye. We should probably start with the standard `Callout` as the base and see how that looks.

## Implementation thoughts

### Option 1 - a JSON content collection

An "Astro-native" way to do this would be to create a "article-serieses" JSON content collection with a form like:

```json
[
  {
    "id": "loomclone",
    "name": "LoomClone Series",
    "intro": "This short series covers how and why I built my own video recording and hosting platform to replace tools like Loom"
  }
]
```

where `intro` is an optional field, `id` is the unique name and `name` and `intro` are used in the callout. We could then add an optional `reference()` ([See here](https://docs.astro.build/en/reference/modules/astro-content/#reference)) to the articles collection anduse that (if present) to grab all the relevant posts and build the callout.

This has some advantages:

- By explicitly specifying an id and using references(), we get Astro stuff like type safety. Also we'll get an error if we try to reference a series which doesn't exist. Also editors like Astro Editor will show this as a dropdown for articles. Etc.
- We have a sensible place to add a human-readable name and intro for the callout.
- We could also add a `/writing/series/loomclone/` path which renders a version of the `src/writing/index.astro` which only shows the articles in the series.

The downside is that we have to explicitly define series' in a JSON file when we first crate them.

### Option 2 - No content collection

We add an optional "series" field to the article schema and if present we simply grab all the other articles which have exactly that id and use them to render the callout. We won;t get any of the advantages above, but we also won't have to maintain a seperate JSON file.

---

## Implementation Plan (agreed)

**Decision: Option 1** — a JSON `series` content collection referenced from articles via `reference()`.

The deciding factor: per-article authoring is *identical* to Option 2 (you still just write `series: loomclone` in frontmatter — Astro resolves the bare id string into a reference). Option 1's only extra cost is one JSON entry the first time a series is created, in exchange for build-time validation of the id, an editor dropdown, and a natural home for the human-readable series name + intro that the callout needs to display anyway.

**Scope for this task:** the in-article callout only. The per-series index page (`/writing/series/<id>/`) is deferred to a follow-up.

### 1. Schema & data (`src/content.config.ts` + `src/content/series.json`)

- New `series` collection using the `file()` loader (same pattern as the existing `toolboxPages` collection), reading a new `src/content/series.json`. Schema:
  - `id: z.string()` — unique series key (e.g. `loomclone`)
  - `name: z.string()` — human-readable title shown as the callout heading
  - `intro: z.string().optional()` — optional blurb shown under the heading
- Add `series: reference('series').optional()` to the `articles` schema (import `reference` from `astro:content`).
- Register `series` in the `collections` export.
- Seed `src/content/series.json` with the two existing series: `loomclone` and `website-redesign`.

### 2. Backfill article frontmatter

- Add `series: loomclone` to `lc1a.mdx` and all the LoomClone draft articles.
- Add `series: website-redesign` to the ~15 `2020-*-website-redesign-*` articles.

### 3. `getPublishedSeriesArticles()` helper (`src/utils/content.ts`)

A small pure function so the selection/ordering logic is unit-testable and the component stays thin:

- Input: the series `id`, the full `articles` collection, and the current article `id`.
- Reuses the **existing `filterContentForListing`** — no bespoke future-date filtering. In production this drops drafts (and future-dated posts are, in practice, always drafts too); in dev it keeps drafts so they can be previewed. This keeps series behaviour consistent with the rest of the site.
- Filters to articles whose `data.series?.id` matches.
- Sorts by `pubDate`, tie-breaking on `title` (no bespoke ordering fields). **Series lists ascending (oldest → newest, i.e. Part 1 first)** — reading order — which intentionally differs from the newest-first order used on the index/feeds. _(Flagging this direction choice for confirmation.)_
- Returns the ordered list plus, per item, whether it is the current article and whether it is a draft.

### 4. `SeriesCallout.astro` component (`src/components/layout/`)

- Lives in `components/layout/` (it is layout-injected, not author-facing) and is exported via the layout barrel. Built on the existing `Callout` (imported from `@components/mdx/index`) using the default type as a starting point.
- Renders: the series `name` as the callout title, the optional `intro`, then an ordered list of the series articles.
  - Each item is a link to `/writing/${id}/`, **except the current article**, which is rendered bold and unlinked.
  - **Dev-only drafts** are prefixed with `[draft] ` so it's obvious they won't appear in production. (In prod the filter removes them, so the prefix never ships.)
- **Guard:** renders nothing unless the series resolves and the filtered list has **≥2 articles** — a "part of a series" box listing only the current article is pointless. Consequence: in production the LoomClone callout stays hidden until part 2 is published; in dev it shows immediately thanks to the drafts.

### 5. Integration (`src/layouts/Article.astro`)

- Once the schema adds `series`, it arrives automatically in the layout's spread props as a reference object (`{ collection, id }`).
- Render `<SeriesCallout series={series} currentId={Astro.params.slug} />` immediately after `.post-header` and before `<slot />`. `Astro.params.slug` equals the article's `post.id`, so it matches cleanly against `entry.id` in the list.

### 6. Markdown twin & RSS

Because the callout is injected by the layout (not part of the MDX body), it will **not** appear in the `.md` twin (`[...slug].md.ts`) or the RSS feed by default. Leave this as-is for now and see how it reads, per the original note; adding a markdown rendering is a separate follow-up if wanted.

### 7. Styling & styleguide

Start from the base `Callout` look and adjust gently by eye in both light and dark themes (ordered list, bold current item). Add an example to the styleguide once the component exists.

### 8. Quality gates

- Unit test `getPublishedSeriesArticles()` (prod vs dev draft handling, ordering, current-article marking, the ≥2 guard).
- Run `bun run check:all` and verify the callout by eye in both themes on a LoomClone article and a website-redesign article.
