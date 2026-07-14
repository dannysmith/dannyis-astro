# Content System Architecture

Technical implementation of content collections, RSS feeds and build-time content generation.

## Content Collections

The site uses Astro's content collections with **glob loaders** and **inline-commented schemas** in `src/content.config.ts`.

### Collection Configuration

Five collections are defined in `src/content.config.ts` (the single source of truth for schemas, which carry inline comments):

- **`articles`** and **`notes`** — markdown/MDX via a `glob` loader.
- **`projects`** — the "things I've made" surfaced on `/making`, markdown/MDX via a `glob` loader (see below).
- **`toolboxPages`** — external data via a `file` loader (see below).
- **`series`** — article-series metadata via a `file` loader from `src/content/series.json` (schema `{ id, name, intro? }`). Drives the "part of a series" callout (`SeriesCallout`); articles opt in via the optional `series` frontmatter field, a reference to this collection.

### Glob Loader Behavior

- **Pattern:** `**/[^_]*.{md,mdx}` - Matches all `.md` and `.mdx` files except those starting with underscore
- **Ignored files:** Anything starting with `_`
- **Naming pattern:** `YYYY-MM-DD-descriptive-slug.{md,mdx}` format

See `content-authoring.md` for file naming conventions and schema reference.

### Toolbox Pages Collection

The `toolboxPages` collection uses a JSON loader via Astro's `file()` loader:

- **Source:** `scripts/get-toolbox-json.ts` (run via `bun run scrape-toolbox`) — two unauthenticated fetches, joined on the Notion page UUID: the betterat.work `/tool/` index (super.so embeds a Notion-ish recordMap as Next.js RSC flight data, giving title/slug/UUID/icon/cover/dates/order) and Notion's unofficial v3 `queryCollection` API (giving category and summary). Background: [#47](https://github.com/dannysmith/dannyis-astro/issues/47)
- **Auto-refresh:** `.github/workflows/update-toolbox.yml` runs the scrape on a weekly cron (and on demand) and commits any changes
- **Data file:** `src/content/toolboxPages.json` — entry `id` is the URL slug; `emoji`/`iconUrl` are mutually exclusive representations of the page icon
- **Consumption:** the `/toolbox` page, rendered with the `ToolCard` component (`ContentCard` also supports the collection)
- **Pattern:** JSON loader enables sourcing external API data at build time

### Projects Collection

The `projects` collection powers the `/making` page — a showcase of things Danny has made. It uses a `glob` md/mdx loader over `src/content/projects/`, and each project's markdown body is rendered inline. There are **no per-project routes**.

- **Files:** named by slug (e.g. `astro-editor.md`, no date prefix); the filename is the project `id` and its `/making#<id>` anchor.
- **Schema:** `title`, `byline`, three status axes (`stage`, `audience`, optional `kind`), `icon`/`image` (via `image()`), `website`/`github`, `featured`, `startDate`, `draft`. See the inline-commented source in `src/content.config.ts`.
- **Ordering:** `getSortedProjects()` (`src/utils/content.ts`) drops drafts and sorts by `startDate` (newest first, undated on top). Consumed by `/making` and `src/pages/scratchpad.astro`.
- **Components:** `ProjectCard` renders a project, with a `compact` prop for a small linked tile; `ProjectIcon` renders the square icon or a display-type monogram fallback.
- **Discovery:** listed in `llms.txt` and the sitemap, and `/making` emits an `ItemList` of `CreativeWork` JSON-LD. Deliberately **excluded from RSS/JSON feeds** — projects aren't dated posts.

### Content Filtering

Content is filtered based on `draft` and `styleguide` frontmatter flags in production builds. Development mode shows all content.

**Centralized utilities:** `src/utils/content.ts`

```typescript
import { filterContentForPage, filterContentForListing } from '@utils/content';

// For individual pages (allows styleguide pages)
const posts = filterContentForPage(await getCollection('articles'));

// For listings and RSS (excludes styleguide pages)
const posts = filterContentForListing(await getCollection('articles'));
```

**Filtering rules:**
- **Individual pages:** Excludes drafts in production, includes styleguide pages
- **Listings/RSS:** Excludes drafts AND styleguide pages in production
- **Development:** Includes drafts, always excludes styleguide from listings

**Used in:** RSS feeds, listing pages, individual page routes, OG image generation

### Reading Time Injection

Reading time is **NOT from SEO utilities** - it's injected automatically by a Sätteri plugin at build time.

**File:** `src/lib/satteri-reading-time.mjs`

**What it does:**
- Runs during markdown/MDX processing at build time
- Calculates reading time using the `reading-time` package (200 words per minute)
- Injects `minutesRead` into frontmatter automatically (via the `ctx.data.astro.frontmatter` bag)

**How to access:**
```typescript
// Option 1: From collection entries
const posts = await getCollection('articles');
const readingTime = posts[0].data.minutesRead; // "5 min read"

// Option 2: From rendered content
const { Content, remarkPluginFrontmatter } = await render(post);
const readingTime = remarkPluginFrontmatter.minutesRead; // "5 min read"
```

**Type:** String (e.g., `"3 min read"`), not a number

**Important notes:**
- Registered in `astro.config.mjs` in the `satteri()` processor's `mdastPlugins`
- Injected during markdown parsing, NOT from `@utils/seo` functions
- Located in `src/lib/` with other build-time utilities
- See JSDoc comments in the file for implementation details

## RSS Feed Implementation

Three RSS feeds generated using Astro's experimental Container API:

- `/rss.xml` - Combined articles + notes
- `/rss/articles.xml` - Articles only
- `/rss/notes.xml` - Notes only

### Container API Pattern

See [architecture-guide.md § RSS Container API](./architecture-guide.md#rss-container-api) for complete RSS Container API implementation details.

**Key features:**

- Full MDX component rendering in RSS feeds
- All MDX components (Callout, Embed, etc.) work in RSS output
- Automatic content filtering (drafts/styleguide excluded in production)
- Error-resilient rendering (failed items are skipped with warning)

### Implementation Files

- `src/pages/rss.xml.js` - Combined feed
- `src/pages/rss/articles.xml.js` - Articles only
- `src/pages/rss/notes.xml.js` - Notes only

All three use identical pattern with different collection sources.

## SEO

See `seo.md`

## OpenGraph Image Generation

**Automatic generation** for all content at build time.

### Implementation

Dynamic generation using `satori` + `@resvg/resvg-js`, with a `sharp`-rendered SVG fallback if Satori fails.

**Files:**

- `src/pages/writing/[...slug]/og-image.png.ts` - Articles
- `src/pages/notes/[...slug]/og-image.png.ts` - Notes

**Note:** `@resvg/resvg-js` is excluded from Vite optimization in `astro.config.mjs` (see [architecture-guide.md § Dynamic API Endpoints](./architecture-guide.md#dynamic-api-endpoints)).

### Features

- Build-time creation via TypeScript endpoints
- Proper sizing for social platforms (1200x630)
- Fallback to `/og-default.png` if generation fails
- No manual configuration needed per article/note

## Dynamic API Endpoints

TypeScript files with special extensions generate dynamic content:

**Markdown Export (.md.ts):**

```
src/pages/writing/[...slug].md.ts  → Markdown version of articles
src/pages/notes/[...slug].md.ts    → Markdown version of notes
```

These are API routes that return `.md` files on request.

**Image Generation (.png.ts):**

```
src/pages/writing/[...slug]/og-image.png.ts  → OG images for articles
src/pages/notes/[...slug]/og-image.png.ts    → OG images for notes
```

See [architecture-guide.md § Dynamic API Endpoints](./architecture-guide.md#dynamic-api-endpoints) for details.

### Markdown Export Limitations

Markdown export endpoints (`.md.ts` files) convert rendered content back to markdown format.

**Important limitation:** MDX component tags remain inline as-is in the exported markdown.

**Example:**

- Source MDX: `<Callout type="info">This is important</Callout>`
- Exported markdown: `<Callout type="info">This is important</Callout>` (unchanged)

**Purpose:** Sharing content, not round-tripping to source. The exported markdown contains the MDX components but won't render them without the component definitions.

## Content Summary Generation

**Automatic summaries** for content cards and previews.

### Summary Priority

1. Frontmatter `description` (if provided)
2. Extracted first meaningful paragraph
3. Title as fallback

### Utility Functions

`src/utils/content-summary.ts` exposes `generateSummary(entry, maxLength)` (used by `ContentCard`) plus its helpers for stripping MDX, extracting the first meaningful paragraph, sentence-aware truncation, and validation. See the file for signatures.

## Markdown Plugins Configuration

Markdown and MDX are processed by **[Sätteri](https://satteri.bruits.org/)** (Astro's native Rust-based pipeline, the default since Astro 7), configured as `markdown.processor: satteri({...})` in `astro.config.mjs`. All plugins are custom, live in `src/lib/satteri-*.mjs`, and each has a unit suite in `tests/unit/` driving the real Sätteri compile API. Remark/rehype plugins do NOT run under Sätteri — its plugin model is `defineMdastPlugin`/`defineHastPlugin` with read-only nodes mutated via a `ctx` object (see the JSDoc in any plugin, and the API learnings recorded in the plugin files' comments).

**File:** `astro.config.mjs`

### Pipeline order

MDAST plugins run first (array order), then MDAST→HAST conversion, then HAST plugins. Expressive Code hooks in via its own Sätteri-aware HAST plugin, and the built-in image-collection and heading-IDs passes run *after* user plugins (hardcoded).

**MDAST plugins:**

- `satteriReadingTime` - Injects `minutesRead` into frontmatter (registered first so it measures the document before ESM injection)
- `satteriFootnoteDetector` - Flags whether content contains footnotes (`hasFootnotes`)
- `satteriMdxImports` - Injects the `@components/mdx` barrel import into every `.mdx` file (replaces the old `astro-auto-import` integration) AND auto-applies `MDX_COMPONENT_REMAPPING` to routed MDX pages using `Page.astro`
- `satteriMarkdownPreview` - Transforms ` ```md preview ` blocks into a `MarkdownBlock` component
- `satteriTreeBlock` - Transforms ` ```tree ` blocks into a `FileTree` component

**HAST plugins:**

- `satteriHeadingIdsPlugin` (from `@astrojs/markdown-satteri`, registered as a factory) - Adds IDs to headings early so the autolink plugin can read them; the built-in trailing run respects them
- `satteriAutolinkHeadings` - Appends an empty anchor to each heading (the `#` glyph is CSS-generated so TOC text stays clean)
- `satteriUnwrapImages` - Strips the wrapping `<p>` from any paragraph whose only content is images, so the `img → BasicImage` remapping produces clean, directly-nested `<figure>`s. Without it, a block `<figure>` inside a `<p>` is hoisted out by the HTML parser, leaving empty `<p>` siblings
- `satteriImageCaption` - Moves a markdown image's title text onto a `caption` prop (rendered as `<figcaption>` by `BasicImage`)
- `satteriExternalLinks` - Adds `target="_blank" rel="noopener noreferrer"` to external links (SmartLink semantics: absolute http(s) URL whose host isn't danny.is or a subdomain)
- `satteriListDensity` - Adds `long-list-items` class to lists with paragraph-like items
- `satteriMermaid` - Renders ` ```mermaid ` fences to inline SVG at **build time** (zero client JS) via `mermaid-isomorphic`. Theme-aware: sentinel colors from `src/config/mermaid.js` are rewritten to `--mermaid-*` variables defined in `src/styles/_mermaid.css` (see comments in those files for how and why)

**Location rationale:** Build-time plugins are kept in `src/lib/` separate from runtime utilities (`src/utils/`) and one-off scripts (`scripts/`). They run during the build process before any component code executes.

## Build Configuration

**File:** `astro.config.mjs`

### Critical Settings

- **Redirects:** Configured in `src/config/redirects.ts` plus per-page `redirectURL` frontmatter (see [architecture-guide.md § Redirects](./architecture-guide.md#redirects))
- **Vite optimizations:** Excludes `@resvg/resvg-js`
- **Markdown plugins:** Sätteri processor + plugin configuration
- **Expressive Code:** Custom theme loaded from `src/config/code-theme.json`, with no frame box-shadow

## External Dependencies

See `package.json` for the full list. The non-obvious ones:

- **Image generation** uses **satori** (JSX → SVG) then **@resvg/resvg-js** (SVG → PNG), with **sharp** as a fallback renderer if Satori fails.
- **RSS** renders MDX via Astro's experimental **Container API**.
- Markdown processing is driven by the custom Sätteri plugins listed under [Markdown Plugins Configuration](#markdown-plugins-configuration) above. Mermaid diagrams render at build time via **mermaid-isomorphic** (headless Playwright browser).

## See Also

- [architecture-guide.md](./architecture-guide.md) - Core Principles for organizational rules
- [component-patterns.md](./component-patterns.md) - ContentCard component and other component details
