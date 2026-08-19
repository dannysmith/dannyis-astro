# Task: BookmarkCard metadata — robustness, self-hosted images, richer cards

Rewrite the link-metadata pipeline behind `BookmarkCard` so it fetches once per build, caches, degrades honestly when a site is dead or blocking, self-hosts OG images, and surfaces whatever extra metadata a page offers.

## Background

`BookmarkCard` calls `fetchLinkMetadata(url)` at build time and renders title / description / domain / image, or a `Preview unavailable - click to visit` fallback. Two structural problems and a pile of parsing bugs sit underneath it.

**Two fetchers exist.** `src/utils/fetchLinkPreview.ts` (used only by `Notion.astro`) is the better one: capped body read, correct numeric-entity decoding, base-URL resolution for favicons, attribute-order tolerance, and the `facebookexternalhit/1.1` UA that makes most sites serve real OG data. `src/utils/fetchLinkMetadata.ts` — the one every BookmarkCard uses — is the older, weaker implementation.

**Nothing is cached or deduped.** A note's `sourceURL` renders through `NoteCard → Embed → BookmarkCard` on the note page, the home page, `/notes`, and the RSS feed (which renders MDX via the Container API). One bookmarked URL is therefore fetched several times per build, every build, with a 10s timeout each. That makes builds slow, makes built HTML depend on who happened to be up and not rate-limiting at build time, and is the likely cause of the GitHub rate-limiting seen in practice. `fetchTweet.ts` already solves this exact problem with a disk cache and an in-flight map; this util never got the same treatment.

Parsing bugs confirmed by running the current parser against hand-written HTML:

| Input                                        | Current output                  | Problem                     |
| -------------------------------------------- | ------------------------------- | --------------------------- |
| `content="Wasn't it great"`                  | `Wasn`                          | silent truncation           |
| `content="Essential Until It Wasn&#x27;t"`   | unchanged                       | numeric entity not decoded  |
| `<title>Tom &amp; Jerry &#8212; a story</title>` | `&#8212;` left raw          | only named entities decoded |
| `og:image` = `/static/images/og.png`         | unchanged                       | relative URL not resolved   |
| `og:image:secure_url` only                   | `null`                          | tag not checked             |
| `content="A &lt;b&gt;bold&lt;/b&gt; claim"`  | `A <b>bold</b> claim`           | decodes into literal markup |

The truncation bug is the worst because it's invisible: the value regex is `["']([^"']+)["']`, so a double-quoted attribute containing a straight apostrophe stops at the apostrophe. Any title or description with an apostrophe is either truncated (raw `'`) or shows escape gibberish (escaped `&#x27;`).

## Decisions (agreed)

- **One fetcher.** `fetchLinkPreview.ts` is deleted and `Notion.astro` moves to the merged `fetchLinkMetadata`. Its test file is ported, not dropped.
- **No committed cache.** Everything lives in `node_modules/.astro/` alongside the OG and tweet caches, persisted between CI runs by the existing `actions/cache` step. Consequence, accepted deliberately: a cold cache means refetching everything, and a cold cache *plus* a site that has since died means we lose that card's metadata and image for good. So the degraded rendering path is not an edge case — it's what happens after every cache eviction, and it has to look deliberate.
- **Cache the raw `<head>`, not the parsed result.** Following `fetchTweet`'s "store the raw upstream payload" reasoning: every later improvement to extraction (new field, better heuristic, AT Proto rels) then applies to every cached bookmark instantly and offline, with no refetch of sites that may since have died or started blocking us. It also gives real captured HTML as test fixtures for free. Capture and derivation get separate version keys, so improving the parser doesn't invalidate the captures.
- **Status, not a boolean.** `isFallback` collapses five different situations into one apologetic line. Replace it with an explicit status that the card renders against:

  | Status      | Cause                          | Card renders                             |
  | ------------ | ------------------------------ | ---------------------------------------- |
  | ok           | 2xx, metadata parsed           | Full card.                               |
  | thin         | 2xx, nothing usable            | Derived title, no apology line.          |
  | blocked      | 403/429/challenge page         | Derived title; never marked dead.        |
  | dead         | 404/410                        | Stale cache if any + dead marker.        |
  | unreachable  | DNS/TLS/timeout                | Stale cache or derived; warn only.       |
  | non-html     | PDF/zip/image content-type     | Derived title + type hint.               |

- **Only 404/410 mark a link dead**, and the marker is visible on the card (design TBD in Phase 4). Other people's sites 403, rate-limit and time out for temporary reasons constantly; a 404 is a real signal. Link rot never fails the build — it warns, with an end-of-build summary listing dead URLs.
- **`Preview unavailable - click to visit` goes away.** It apologises for a card that is already a working link.
- **Self-host OG images.** Hotlinking fails five ways: relative URLs, 404s, rate-limited dynamic generators (GitHub), the URL changing between build and view, and every visitor's IP hitting a third-party CDN. Self-hosting kills all five, gives real dimensions (fixing CLS in the stacked layout), and lets us treat square logos differently from 16:9 banners. The staleness trade-off is the point: the card shows the page as it was when it was linked.
- **Not via Astro's `<Image>`.** Astro fetches remote images at build to read dimensions, and a dead one throws `Failed to retrieve remote image dimensions` — someone else's server failing our build. We download and process with `sharp` ourselves (already a dependency) and fail soft.
- **No scraping frameworks.** `metascraper` / `unfurl` / `open-graph-scraper` are plugin systems for a job that is a few hundred lines of `fetch` and parsing. One exception: `entities` (the package parse5 and cheerio use) for entity decoding — that part is a lookup table, not logic.
- **Display everything first, then pare back.** Phase 4 puts every extracted field on the card, then Danny iterates visually and cuts.

## Working method

- After **each phase**: eyeball `/scratchpad` (the test bench built in Phase 1 — keep it current as behaviour changes), check both themes, run `bun run check:all`. `bun run shoot` for width sweeps.
- Phases 1–3 and 3.5 need a **full `bun run build`** to verify cache, warnings and emitted images, not just `dev`.
- Danny commits manually after each phase.

---

## Phase 1 — One fetcher, cached, with a status taxonomy ✅

**Done.** `fetchLinkPreview.ts` deleted and `Notion.astro` moved over; captures cached to `node_modules/.astro/link-cache/` with in-flight dedup and a 30-day TTL. Cold build 32s, warm 13s, 84 captures. The build now reports link health at the end — which immediately found a genuinely dead link in published content (`www.adhdexperience.com`, in the AI-and-ADHD article).

1. Build the test bench first: `src/pages/scratchpad.astro` gets a `BookmarkCard` per failure mode — relative `og:image`, entity-escaped title, apostrophe title, 404, 403/Cloudflare challenge, redirect chain, no metadata at all, PDF, square-logo image, GitHub dynamic OG, `archive.ph` wrapper, malformed URL. Danny to supply real URLs for the awkward ones where useful.
2. Rewrite `src/utils/fetchLinkMetadata.ts` as the single fetcher:
   - Read only to `</head>`, capped (512KB, per `fetchLinkPreview`); bail early on non-HTML `Content-Type` with status `non-html`.
   - UA strategy: `facebookexternalhit/1.1` first, retry once with the Chrome UA on 403.
   - One retry on 429/5xx/timeout, honouring `Retry-After` up to a small bound.
   - `redirect: 'follow'`, capturing `response.url` as the base for relative URLs and the canonical identity.
   - Cap concurrent outbound fetches (Astro renders pages in parallel).
   - Map every outcome onto the status taxonomy above; return the status alongside the data instead of `null`.
3. Disk cache at `node_modules/.astro/link-cache/`, modelled on `fetchTweet.ts`:
   - Stores raw captured `<head>`, final URL, HTTP status, content-type, `fetchedAt`. Separate `CAPTURE_VERSION` and `DERIVE_VERSION`.
   - TTL (30 days) triggers revalidation; on any failure, keep serving the stale capture rather than degrading a card that worked yesterday.
   - Failures are not cached as successes (`fetchTweet` precedent).
   - In-flight `Map` dedupes within a build, so the several renders of one URL cost one fetch.
4. Delete `fetchLinkPreview.ts`; move `Notion.astro` onto the merged fetcher (it needs title + favicon, both covered).
5. Tests: port `tests/unit/fetchLinkPreview.test.ts`, add cases for each status, and add captured-HTML fixtures for the sites in the bench.
6. Verify with a full build: fetch count per URL, cache hit on a second build, warning output.

## Phase 2 — Extraction and cleanup quality ✅

**Done.** Single-pass head tokeniser, `entities` for decoding, candidate selection, URL-derived titles, archive unwrapping. The apostrophe-truncation and entity bugs are gone, and the archive.ph card that motivated the task now reads "How to spot ai writing" with the Economist URL under it. Also caught a real portability bug: Node 22 and Node 26 disagree about `windows-1252`, so build output depended on which ran it (see Phase 3.5 — the fix is to drop the feature).

1. Replace the per-name regexes with a single pass that tokenises `<meta>`, `<link>`, `<title>` and `<script type="application/ld+json">` from the captured head into one map, parsing attributes properly (fixes the apostrophe truncation and attribute-order fragility in one move).
2. Decode entities with `entities`; then strip tags, collapse whitespace, trim, and cap length at a word boundary.
3. Candidate selection rather than first-match:
   - **Title**: `og:title` → `twitter:title` → JSON-LD `headline` → `<title>`. Prefer `<title>` when `og:title` is just the site name. Strip a `| Site Name` / `- Site Name` suffix or a `GitHub - ` style prefix when it duplicates `og:site_name` or the domain.
   - **Description**: prefer the longer when one candidate is a truncated prefix of another; drop it entirely when it equals the title.
   - **Image**: `og:image` → `og:image:secure_url` / `og:image:url` → `twitter:image` / `twitter:image:src` → JSON-LD `image` → `link[rel=image_src]`. Resolve against the final URL; reject non-HTTP protocols and known tracking pixels.
4. URL handling:
   - Display URL cleanup: no scheme, no `www.`, no query or fragment, truncated path.
   - Derived title from the last meaningful path segment when nothing else exists (`.../how-to-spot-ai-writing#selection-1279` → "How to spot ai writing"), falling back to the domain only when there's no usable path.
   - Unwrap `archive.ph/<ts>/<original>` and `web.archive.org/web/<ts>/<original>`: fetch and display the original's identity, hinting that it's archived.
   - Normalise tracking params (`utm_*`, `fbclid`, `gclid`, `ref`, `si`) for the cache key and display; never alter the URL we actually fetch or link to.
5. `BookmarkCard` renders against the status taxonomy; the fallback italic line is removed.
6. Tests for every cleanup rule, over the captured fixtures.

## Phase 3 — Self-hosted images ✅

**Done.** Images are downloaded, re-encoded to webp with `sharp`, cached beside the captures and emitted to `dist/bookmark-images/` by an integration; dev serves them from the cache. 59–60 images, 1.4MB, and no bookmark image hotlinks a third party any more. Real dimensions on every `<img>`, and a logo/banner split at aspect ratio 1.2 so square avatars stop being cropped. **Item 5 (the client-side broken-image listener) was dropped** — self-hosting removes the failure it guarded against.

1. Download the chosen image inside the fetcher (we're already there), into the same cache dir, with its own timeout and size cap. A failed or 404ing image means "no image" for that card plus a build warning — the page metadata is unaffected.
2. Process with `sharp` into a webp derivative sized for the card; record real width/height.
3. Emit into `dist/` via a small integration in `src/lib/`, mirroring `pagefind-integration.mjs`'s two hooks: `astro:build:done` writes the files, `astro:server:setup` serves them from the cache in `dev`.
4. Card: set `width`/`height` on the `<img>` (fixes layout shift in the stacked layout, which currently has no aspect ratio), and branch the treatment on shape — square/small images are logos and get contained-and-padded rather than cropped to 16:9.
5. Safety net for any external image the site renders: a small capture-phase `error` listener that hides broken images. CSS alone can't suppress the browser's broken-image icon. With self-hosting this is belt-and-braces, so keep it minimal and site-wide rather than card-specific.
6. Verify with a full build: emitted files, no hotlinked third-party image URLs left in the HTML, dev serving works, cold-cache rebuild works.

## Phase 3.5 — Simplify and consolidate

Three phases in, the feature is ~1,235 source lines and ~560 test lines to render a link preview. A review (three agents, plus measurement against the 83 real pages captured in the cache) found roughly a third of it is machinery for conditions that don't occur, and four real bugs hiding in the parts that do. This lands **before** Phase 4, because Phase 4 adds fields to whatever shape we settle on here.

**Guiding principle:** aim for something that tends to work well with *most* URLs, not just the ones on the site today. Cheap generalisations stay even if they never fire on current content; speculative machinery goes even if it looks careful.

### Revised decisions (these supersede the ones at the top of this doc)

- **Prefix stripping is dropped**; suffix stripping stays. `Aha! | Seth's Blog` → `Aha!` is unambiguous; `GitHub - foo` → `foo` versus `Cap — Beautiful screen recordings` → `Beautiful screen recordings` is a coin-flip we can't call reliably. Six GitHub cards keep their prefix; that's the price.
- **Charset handling goes entirely** — the streaming early-abort read, the sniffing, and the hand-written windows-1252 table. `response.text()` is always UTF-8, which covers ~98% of the web. Two supporting facts: the failure mode is loud (replacement characters, immediately visible) rather than silent, and CI runs Node 22, which decodes `windows-1252` as latin1 anyway — so half that machinery was wrong exactly where it mattered. If a mangled title ever appears, add it back with a real example in hand; the test already exists in git history.
- **JSON-LD extraction goes.** Not because it never fires today, but structurally: HTML requires `<title>`, and `<title>` is always a candidate, so JSON-LD can essentially never be the only source of a title. Buying an occasional description isn't worth 47 lines of JSON parsing and `@graph` flattening.
- **`'thin'` status goes.** The card only ever branches on `dead`; `title === null` already says the rest.
- **One public call.** `fetchLinkPreview(url)` returns the preview image already downloaded, instead of handing back a remote URL that looks renderable but must never be rendered — the exact hazard self-hosting was meant to remove.

### 1. Restructure into one module

`src/utils/linkPreview/`, replacing `fetchLinkMetadata.ts`, `deriveLinkMetadata.ts`, `bookmarkImage.ts` and `linkHealth.ts`. Line counts are estimates after the deletions below.

| File        | Holds                                               | ~Lines |
|-------------|-----------------------------------------------------|-------:|
| `index.ts`  | `fetchLinkPreview(url)`, types, assembly            |    120 |
| `fetch.ts`  | network, retries, disk cache, dedup, concurrency    |    230 |
| `parse.ts`  | captured `<head>` → title/description/image/favicon |    260 |
| `image.ts`  | remote image URL → local webp                       |    195 |
| `health.ts` | build-time warning collector                        |     27 |

The directory name carries the "this is about fetching other people's pages" context, which is what lets the file names inside be short and unambiguous — `parse.ts` can only mean one thing in here. Precedent: `src/lib/file-tree/`, `src/lib/tabs/`. The site imports one path (`@utils/linkPreview/index`), and `astro.config.mjs` takes the image cache constants from the same place.

The current split is the thing to fix, not preserve: it divides on a property (pure vs impure) rather than a topic, the dependency runs backwards (`LinkCapture` is a cache concern defined in the "pure" module; `normaliseUrl` and `unwrapArchiveUrl` exist only to serve the fetcher), and the header comment claiming the split enables offline parser improvement is false — that comes from caching the raw head, which is a data decision.

Renames: `LinkMetadata` → `LinkPreview`, `BookmarkImage` → `PreviewImage`, `fetchBookmarkImage` → `fetchPreviewImage`, and `derive` → a name that says what it returns.

### 2. Deletions

| Cut                                                              |   Source |    Tests |
| ---------------------------------------------------------------- | -------: | -------: |
| Streaming read, `</head>` byte scan, charset sniff, cp1252 table |      109 |       86 |
| JSON-LD extraction (`parseJsonLd`, `jsonLdString`, candidates)   |       47 |       27 |
| `displayUrl` + `truncateMiddle` (duplicates the title line)      |       34 |       21 |
| Prefix stripping in `stripSiteName`                              |       18 |        6 |
| `siteNames`/`specific` filter (keep the rule, ~6 lines not 25)   |       19 |        0 |
| `Retry-After` / 429 special case (fold into the generic retry)   |       13 |        0 |
| `isExtensionOf` → longest-wins; simpler `truncate`               |       11 |        6 |
| `DERIVE_VERSION`, `'thin'`, the `LinkCapture.url` patch-on-read  |       12 |        2 |
| Image size cap, duplicate content-type guard, `imageVersion`     |       19 |        0 |
| `FILE_TYPES` map → derive a label from the MIME subtype          |        5 |        0 |
| **Total**                                                        | **~287** | **~148** |

### 3. Keep, deliberately

Written down so a future pass doesn't re-delete them: the disk cache and in-flight dedup, capture-the-raw-head, the concurrency limiter (84 fetches at once, six of them at GitHub, is the rate-limiting we already hit), `isChallengePage` (8 lines between us and a card titled "Just a moment…"), the 403 → browser-UA fallback, stale-capture-with-fresh-status, archive unwrapping (one real card uses it — the one that started this task), `titleFromUrl`, suffix stripping, and the full image-candidate list (`og:image` → `secure_url`/`url` → `twitter:image`/`twitter:image:src` → `rel=image_src`) — five array entries that generalise to arbitrary URLs for almost nothing.

### 4. Bugs found during the review

1. **The 70-char guard in `titleFromUrl` breaks the Medium card.** Added in Phase 2 for lore.kernel.org; Medium's 73-char slug trips it, the next segment is `@dannysmith` which the `@` check skips, so the blocked card falls back to a bare domain. The bench expects a derived title. Raise or drop the threshold — the `@` check already handles the case it was written for.
2. **`?s=` / `?ref=` / `?source=` collapse distinct URLs onto one cache key**, so two different pages can share a capture and one card silently renders the other's metadata. Narrow the list to unambiguous prefixes (`utm_*`, `fbclid`, `gclid`, `mc_*`, `igshid`).
3. **No title cap.** The tauri-template card renders a 258-character title above a near-identical 259-character description; the repeat-check misses it because the `dannysmith/tauri-template: ` prefix makes the strings unequal. Add a title cap and compare after stripping.
4. **`…/index.html` derives the title "Index".** A small stop-list of boilerplate segments.

### 5. Tests and fixtures

- **74 tests → ~30.** Most of the cuts are tests of internals that only exist to be tested (`truncate`'s `max * 0.6`, `normaliseUrl` asserting `new URL` behaviour, four `it.each` cases asserting a ternary) or of paths being deleted in this phase.
- **Add four that are missing**, all covering paths with no coverage today and real consequences: challenge-page detection, a stale capture stamped `dead`, failures not being cached, and two URLs differing only by a `utm_` tag sharing one capture. These need `fetch` stubbing — `vi.stubGlobal` plus an env-overridable cache dir.
- **Fixtures: 9 files/140KB → 5 files/~11KB.** Strip `<style>`, `<script>` and preload noise; keep every `<meta>`, `<title>` and icon `<link>` byte-for-byte as served, so they stay real captures. Drop `bricolage` and `seths-blog` (a third and fourth test of the same `decodeHTML` call), inline `cern` (42 meaningful bytes), and delete `lucumr` — no test references it.
- Split `LinkCapture` so `derive`'s input is only what it reads; the 14-line test factory becomes one line.

### 6. Verify

Behaviour should be unchanged apart from the four fixes and the dropped prefix stripping. `/scratchpad` is the check: same cards, same flags, same images. Then `bun run check:all`, a cold-cache build and a warm one.

## Phase 4 — Richer metadata and card design

1. Extract everything cheap from the captured head: `og:site_name`, `og:type`, `og:image:alt`, `og:image:width`/`height`, `article:published_time`, author (`article:author`, `meta[name=author]`, JSON-LD `author.name`), JSON-LD generally (headline, description, image, author, date, type), and the `twitter:label1`/`data1` pairs — the de-facto home of author-declared reading time.
2. Favicon: extract, fetch, self-host through the Phase 3 pipeline (the biggest visual improvement for cards with no OG image).
3. Consider oEmbed discovery (`link[rel=alternate][type="application/json+oembed"]`) for provider/author/thumbnail — costs an extra request, so only if the fixtures show it earning its place.
4. Put **all** of it on the card, then iterate with Danny's feedback and cut. Open questions for that pass: how many facts a card can carry before it reads as clutter; whether a fixed-priority meta line (favicon · site name · author · date) keeps cards visually consistent when some URLs are rich articles and others are bare pages; what the dead-link marker looks like; whether `og:type` video/audio deserves a distinct treatment.
5. Screenshot sweeps in both themes at the standard widths; check narrow containers (NoteCard on the home page) as well as full width.

## Phase 5 — Docs, styleguide, cleanup

1. Styleguide: update the BookmarkCard section for the new props and states, including a dead and a blocked example.
2. Review all code changes on this branch for opportunities to refactor, simplify, remove features which we think aren't worth the extra code, clean up and simplify all the code etc. (Phase 3.5 does the bulk of this; this is the final sweep over whatever is left.)
3. New `docs/developer/link-metadata.md` covering the fetcher, the cache and its version keys, the status taxonomy, and the image pipeline. Link it from `component-patterns.md`.
4. `src/utils/CLAUDE.md`: add the cache-version bumping rule (same class of gotcha as the OG cache). `docs/developer/deployment.md`: add the link cache to the caching section.
5. `bun run check:knip` and `check:dupes` — the two fetchers merging should reduce duplication, not move it.
6. Comment pass: evergreen, no transient references, explaining *why*.
7. Final `bun run check:all` plus a cold-cache full build.

## Out of scope / follow-up

- **AT Protocol.** Extracting `at://` rel links (`site.standard.document` and friends — the exact rel name needs verifying against standard.site's docs) and doing something with them is a separate task. Because Phase 1 caches the raw head, adding the extraction later costs nothing and requires no refetch.
- **Client-side metadata refresh.** Re-running the scraper in the browser to catch OG images that changed after build. Rejected: large client cost for a rare, low-stakes staleness.
- **Internal-URL cards.** Teaching `Embed.astro` to render `danny.is` URLs as ArticleCard/NoteCard — already noted as follow-up in the card consolidation task.
