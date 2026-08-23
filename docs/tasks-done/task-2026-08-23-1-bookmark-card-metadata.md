# Task: BookmarkCard metadata — robustness, self-hosted images, richer cards

Rewrote the link-metadata pipeline behind `BookmarkCard` so it fetches once per build, caches, degrades honestly when a site is dead or blocking, self-hosts preview images, and shows whatever else a page publishes about itself.

The pipeline is documented in [docs/developer/link-metadata.md](../developer/link-metadata.md). This is the record of the work.

## What was wrong

- **Two fetchers.** `fetchLinkMetadata.ts` (every BookmarkCard) and `fetchLinkPreview.ts` (only `Notion.astro`), the second better than the first.
- **Nothing cached or deduped.** A note's `sourceURL` renders on the note page, the home page, `/notes` and in the RSS feed, so one URL was fetched several times per build, every build, with a 10s timeout each. Built HTML depended on who happened to be up, and it was the likely cause of the GitHub rate-limiting seen in practice.
- **Silent parsing bugs.** The value regex was `["']([^"']+)["']`, so any double-quoted attribute containing an apostrophe was truncated at it — `They're Monkey Paws.` became `They`. Numeric entities were left raw, relative `og:image` paths were never resolved, and `og:image:secure_url` was never checked.
- **Hotlinked images**, which failed five ways: relative paths, 404s, rate-limited generators, URLs changing between build and view, and every visitor hitting a third-party host.
- **`Preview unavailable - click to visit`**, apologising for a card that is already a working link.

## What was built

`src/utils/linkPreview/` — one module, one call, `fetchLinkPreview(url)`, which never throws and never returns null.

- **A disk cache of raw captured `<head>`s** in `node_modules/.astro/link-cache/`, with in-flight dedup, a concurrency cap shared with image downloads, and a 30-day TTL. Storing the head rather than the parsed fields is what lets every later parser change apply to every cached link offline.
- **A status taxonomy** (`ok` / `blocked` / `dead` / `unreachable` / `non-html`) replacing an `isFallback` boolean. Only 404/410 marks a link dead. Link rot warns, never fails the build, and prints an end-of-build summary — which immediately found a genuinely dead link in a published article (`www.adhdexperience.com`).
- **Self-hosted images.** Downloaded and re-encoded to webp with `sharp`, cached beside the captures, emitted to `dist/link-previews/` by `src/lib/link-preview-images-integration.mjs`, and served from the cache in dev. Real dimensions on every `<img>`, and a logo/banner split at aspect ratio 1.2 so square avatars aren't cropped through the middle.
- **Richer cards.** Scope was decided by measuring all 80 captured heads: `og:site_name` (57%), author (31%), `article:published_time` (21%), `og:image:alt` (31%) and the favicon (81% declare one, 75% usable). Rendered as `[favicon] domain · site name · [person] author · [calendar] date`.
- **Archive unwrapping.** `archive.ph/<ts>/<original>` links describe the page they preserve while still linking to the archive.

## Decisions worth remembering

Most of the reasoning lives in the developer doc. Three things that aren't obvious from the code:

- **The square preview panel's width is hardcoded, and has to be.** A square panel's width should be the card's height, which depends on how the text wraps, which depends on the width — CSS breaks the loop by collapsing the panel to zero. Three attempts looked correct only because the images had already loaded; measuring with image loading blocked showed panels at `0x101`, `0x125`, `20x92`.
- **Prefix stripping was dropped, suffix stripping kept.** `Aha! | Seth's Blog` → `Aha!` is unambiguous; `GitHub - foo` → `foo` versus `Cap — Beautiful screen recordings` → `Beautiful screen recordings` is a coin-flip. Six GitHub cards keep their prefix.
- **Charset handling and JSON-LD extraction were both removed** after being built. Node 22 and Node 26 disagree about `windows-1252`, so build output depended on which ran it; and since HTML requires `<title>` and `<title>` is always a candidate, JSON-LD can essentially never be the only source of a title.

Two open visual questions from the card design were settled as **deliberate non-changes**:

- **Site name duplicating the domain** (`github.com · GitHub`) — 25 of the 56 cards with a site name, but the spaced, capitalised form reads better than the domain often enough to keep.
- **A generic glyph for the 26% of cards with no favicon** — the favicon is decorative, the domain text carries the information, and an invented icon repeated down the page is worse than a slightly ragged left edge.

## Outcome

227 pages. Cold build 1m23s, warm 31s. 81 captures and 105 self-hosted images; no bookmark image hotlinks a third party. 59 unit tests over real captured heads. The link-health report lists 6 problems: four genuine, and two deliberately-failing URLs on `/styleguide` that keep the dead and blocked card states visible.

Every card state is rendered at [`/styleguide/components#bookmark-card`](/styleguide/components#bookmark-card). `/scratchpad` — the test bench this was built against — is back to empty.

## Follow-ups

- **AT Protocol.** Extracting `at://` rel links (`site.standard.document` and friends — the rel name needs verifying against standard.site's docs). Because the raw head is cached, adding it later costs nothing and needs no refetch.
- **Internal-URL cards.** Teaching `Embed.astro` to render `danny.is` URLs as ArticleCard/NoteCard; also noted in the card consolidation task.
- **Rejected: client-side metadata refresh.** Re-running the scraper in the browser to catch OG images that changed after build — a large client cost for rare, low-stakes staleness.
