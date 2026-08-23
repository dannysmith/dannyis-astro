# Link metadata

`BookmarkCard` and `Notion` describe pages we don't control, fetched at build time.

This doc covers the _why_. The code is the reference for _how_ — `src/utils/linkPreview/` is commented at the level of individual decisions.

## The parts

Split by topic — how we get the page, what it says about itself, what we do with its images — rather than by pure-vs-impure. Splitting on purity sounds principled and reads badly: it strands the cache's own types away from the cache, and helpers away from the only thing that uses them.

- `index.ts` — the one public call, `fetchLinkPreview(url)`, and the `LinkPreview` type.
- `fetch.ts` — getting the page: network, retries, disk cache, dedup, concurrency, URL rules.
- `parse.ts` — what the page says about itself.
- `image.ts` — copying its images onto our domain.
- `health.ts` — the end-of-build warning summary.

`src/lib/link-preview-images-integration.mjs` emits the derivatives into `dist/link-previews/` and serves them from the cache in dev — the same two-hook shape as the Pagefind integration.

## Why one call that can't fail

`fetchLinkPreview(url)` never throws and never returns null, so no consumer needs a try/catch or a fallback object; `status` says how much of the result to trust. A link that 404s, blocks us or times out is a fact about the web, not an authoring error, and never fails the build.

It returns images **already downloaded**, as paths on this site. Handing back a remote URL that looks renderable but must never be rendered is the exact hazard self-hosting exists to remove. `faviconUrl` is the one remote URL that escapes, because Notion encodes a page's emoji into its icon URL — so the declared URL carries information our copy of the image doesn't.

## Why the cache stores the raw `<head>`

Captures live in `node_modules/.astro/link-cache/`, so the existing `actions/cache` step covers them. What's stored is the head as served, not the fields parsed out of it. Every later improvement to extraction then applies to every cached link at once, offline, with no refetch of sites that may since have died or started blocking us — and the cache doubles as a corpus of real captured heads to test a parser change against.

`LINK_CACHE_DIR` redirects both the captures and the image derivatives; the tests use it.

## Status, not a boolean

Five different situations, five treatments — a boolean would collapse them into one apologetic line under a card that is already a working link. Only 404/410 marks a link dead: sites block, rate-limit and time out for temporary reasons constantly, and a 404 is the only real signal among them.

| Status | Cause | Card shows |
| --- | --- | --- |
| `ok` | 2xx with readable HTML | Everything the page published. |
| `blocked` | 403, 429, or a challenge page | Last-known content, else a URL-derived title. No flag. |
| `dead` | 404 or 410 | Last-known content plus a visible flag. |
| `unreachable` | DNS, TLS, timeout, reset | Last-known content, else a URL-derived title. |
| `non-html` | PDF, zip, image content-type | A URL-derived title plus a type label. |

An archive link is the awkward case: the status describes the original, which is usually dead — that being why the archive exists — while the link we render is the archive's, and alive.

## What's deliberately not here

Written down so it doesn't get re-added on the assumption it was an oversight:

- **JSON-LD extraction.** HTML requires `<title>` and `<title>` is always a candidate, so JSON-LD can essentially never be the only source of a title.
- **Charset sniffing.** `response.text()` is UTF-8, which covers almost everything, and the failure mode is loud rather than silent.
- **Stripping a site name from the front of a title.** `GitHub - foo` → `foo` versus `Cap — Beautiful screen recordings` → `Beautiful screen recordings` is a coin-flip we can't call. Trailing site names _are_ stripped, but only when the removed part demonstrably names the site.
- **Scraping frameworks.** `metascraper` and friends are plugin systems for a job that is a few hundred lines. The one dependency is `entities`, for the entity table, because that part is a lookup rather than logic.
- **DNS-rebinding protection.** `isPublicHttpUrl` guards both fetchers at the _hostname_ level; a name that resolves to a private address still gets through. Catching that needs our own resolution and connection pinning.

## Sharp edges

- **The cache is not committed.** A cold cache refetches everything, and a cold cache plus a site that has since died loses that card's metadata and image for good. The degraded path is normal, not exceptional — which is why it has to look deliberate rather than apologetic.
- **The square preview panel's width is hardcoded, and has to be.** A square panel's width should be the card's height; that height depends on how the text wraps, which depends on the width, and CSS breaks the loop by collapsing the panel to zero. It looks fixed whenever the images happen to be loaded already — measure with image loading blocked. Same reasoning puts the panel in a wrapper rather than on the `<img>`: a lazy `<img>` has no intrinsic size until it arrives.
- **`.ico` favicons are skipped**, because `sharp` can't decode them and a third of sites still link a bare `/favicon.ico`. `apple-touch-icon` is the fallback.
- **Version keys are for stored shape only.** Changing `parse.ts` needs no bump — see `src/utils/CLAUDE.md`.
- **`/styleguide` fetches two deliberately-failing URLs** so the dead and blocked states are visible. They appear in every build's link-health report; the slugs make them obvious.

## Where things live

- `src/utils/linkPreview/` — the module.
- `src/lib/link-preview-images-integration.mjs` — emits and serves the images.
- `src/components/mdx/BookmarkCard.astro`, `Notion.astro` — the consumers.
- `tests/unit/linkPreview.test.ts`, with real captured heads in `tests/fixtures/link-heads/` — kept byte-for-byte as served, and excluded from Prettier for that reason.
- `/styleguide/components#bookmark-card` — every state, rendered.
