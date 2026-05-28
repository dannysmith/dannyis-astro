# Static Output, Delivery & SEO Hardening (Black-Box Review Remediation)

## Background

This task captures the actionable findings from an outside-in ("black-box") review of the **generated** site — the live responses from `https://danny.is` and the production `dist/` from `bun run build` (the same command CI runs). No application source was reviewed; everything here is about what ships to browsers, crawlers, and AI agents.

A second, independent review session surfaced a near-identical list. A third pass cross-checked every finding against the **source code** (not just the build output) and refined several fixes — those refinements are folded inline below. Findings are tagged:

- **[verified]** — confirmed against live responses, local production build, AND source code.
- **[confirm]** — reported but not independently reproduced here; verify before acting.

## Guiding constraint (read this first)

Danny wants to **keep deploying a fully self-generated static build and simply hand it to Vercel** — no heavy framework-level wiring into Vercel, so the site stays easy to move to any static host later with minimal changes.

That shapes every recommendation here:

- **`dist/` stays 100% pure static output.** Nothing host-specific gets baked into it.
- **All host behaviour (caching, 404, security headers) lives in ONE small, swappable file** — the Build Output API config that CI already writes. Moving hosts later = rewrite that one file (or produce an nginx `location` block / Netlify `_headers`); the build itself never changes.
- **The most portable mechanisms win.** Where something already works in a host-agnostic way (e.g. the HTML meta-refresh redirects), we keep it rather than trading portability for a marginal SEO gain.

## Keystone finding: nothing is configured at the edge

CI builds `dist/`, copies it to `.vercel/output/static/`, and writes `.vercel/output/config.json` as a bare `{"version":3}` (see `.github/workflows/deploy.yml:54` — literally `echo '{"version":3}' > .vercel/output/config.json`). With `vercel deploy --prebuilt`, **only `.vercel/output/config.json` is consulted** — a root `vercel.json` is NOT read (that's only processed by `vercel build`, which we deliberately don't run). So today there are zero header rules, zero error-page wiring, and Vercel applies its generic static default to everything.

Consequences, all stemming from this one bare config:

- **[verified] Nothing is cacheable.** Every asset — including content-hashed `/_astro/*.[hash].js|css`, version-stamped `/fonts/*`, images, even RSS — is served `cache-control: public, max-age=0, must-revalidate`. Fingerprinted URLs can never change content, so they should be `immutable`. Today every repeat visit, every View Transition, and every speculation-rules prefetch re-validates the entire asset graph. **This is the single biggest performance lever.**
- **[verified] The custom 404 is built but never served.** `dist/404.html` exists (branded), but live `danny.is/<missing>` returns Vercel's generic plain-text "404: NOT_FOUND". The bare config never registers the error page.
- **[verified] No security headers.** No CSP, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` — only Vercel's default HSTS.

### Recommended fix — enrich the generated `config.json` (keeps the build pure)

Keep the exact current pipeline (`astro build` → copy `dist/` → `vercel deploy --prebuilt`). Only change the **"Prepare Vercel output"** step so it writes a richer `config.json` instead of `{"version":3}`. The Build Output API `routes` use the same syntax as `vercel.json` routes; header routes with `"continue": true` attach headers and then fall through to the filesystem.

Starting point to validate on a **preview deploy** (the CI already has a `preview`-label path):

```json
{
  "version": 3,
  "routes": [
    { "src": "^/_astro/(.*)$", "headers": { "cache-control": "public, max-age=31536000, immutable" }, "continue": true },
    { "src": "^/fonts/(.*)$",  "headers": { "cache-control": "public, max-age=31536000, immutable" }, "continue": true },
    { "src": "^/(.*)$", "headers": {
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "geolocation=(), microphone=(), camera=()"
      }, "continue": true },
    { "handle": "filesystem" },
    { "src": "^/.*$", "status": 404, "dest": "/404.html" }
  ]
}
```

Notes:

- The `immutable` rules only target `/_astro/*` and `/fonts/*` (both content-/version-stamped). HTML keeps revalidating, which is correct.
- **Scope is deliberately narrow.** Stable-but-unhashed assets (`favicon.*`, `avatar.jpg`, `icon.jpg`, `end-mark.svg`, and per-post `og-image.png`) are intentionally left revalidating — their URLs don't change when content does, so `immutable` would risk serving a stale image after a regeneration. Only fingerprinted paths are safe to freeze.
- The final two entries serve `dist/404.html` with a real `404` status on any filesystem miss. **Routing phases have edge cases — confirm on a preview deploy** (check both a real asset 200 with the cache header AND a missing URL returning 404 + the branded page) before promoting to prod.
- While wiring the 404, **add `noindex` to `src/pages/404.astro`**. Today it renders through `BaseHead` and inherits the global `index, follow, max-image-preview:large…` directive from `src/config/config.ts`. In practice a real 404 status keeps it out of the index, but explicit `noindex` is the safe belt-and-braces — and `BaseHead` doesn't currently expose a `robotsDirective` prop, so this is the moment to add one (see "Codebase-level additions" below).
- Keep this config in the repo as a committed file (e.g. `vercel.output-config.json`) that the CI step copies into place, so it's reviewable and version-controlled rather than echoed inline.
- A CSP is intentionally omitted from the starter (the inline theme script + Simple Analytics + speculation-rules make a strict CSP fiddly). Add later if desired; nosniff + referrer-policy are the cheap, safe wins.

### Alternative considered — `vercel.json` + `vercel build` (NOT recommended)

`vercel.json` has friendlier `headers`/`redirects`/`cleanUrls` arrays, but it's only honoured if we switch the pipeline to `vercel build`, which re-runs the build through Vercel's framework detection (the Astro Vercel adapter) — exactly the "heavy wiring" Danny wants to avoid, and it reduces portability. Rejected in favour of the config.json approach above.

---

## Phase 1 — Edge delivery (caching, 404, security headers)

Implement the enriched `config.json` above. Outcome: immutable caching on fingerprinted assets, the branded 404 actually served, and baseline security headers — all without touching `dist/`.

**Acceptance:** on a preview deploy, `/_astro/*` and `/fonts/*` return `cache-control: …immutable`; a bogus URL returns HTTP 404 with the branded page; `x-content-type-options: nosniff` present on HTML.

## Phase 2 — Content metadata & structured data

- **[verified] Empty descriptions on content pages (high impact).** Every article and note renders empty `<meta name="description">`, `og:description`, and `twitter:description` (section pages like `/writing`, `/notes`, `/now` have them; individual posts don't). Spot-check of the corpus: **15 of 68 articles** have a `description:` frontmatter field; the rest ship empty meta. Result: no controlled SERP snippet and blank social/Slack/iMessage link previews on ~all posts. **The helper already exists**: `src/utils/content-summary.ts` exports `generateSummary(entry, maxLength)` which does frontmatter → first meaningful paragraph → sentence-boundary truncation, and is already used elsewhere (ContentCard). It just isn't plumbed into the layout chain. **Fix:** in `src/layouts/Article.astro` and `src/layouts/Note.astro`, pass `description={description ?? generateSummary(entry)}` into `<BaseHead>`. ~2 lines total. Highest-value SEO/social fix after caching.
- **[verified] `BlogPosting` JSON-LD has no `datePublished`/`dateModified` — root cause is not what it looks like.** The schema generator in `src/utils/seo.ts:154-164` already emits both fields correctly *if* `pubDate`/`updatedDate` are passed in. The actual bug is in the layouts: `src/layouts/Article.astro` and `src/layouts/Note.astro` call `<BaseHead title=… description=… type="article" pageType="article" image=… />` and **never pass `pubDate`, `updatedDate`, or `tags`**. So `validateSEOData` sees them as undefined and the data is silently dropped from the `@graph`. **Fix:** thread `pubDate`, `updatedDate`, and `tags` into `<BaseHead>` from both layouts. Same one-line fix per layout also restores the currently-missing `article:tag` OG meta (`generateArticleMeta` in `seo.ts:204` iterates `pageData.tags`, but tags never arrive) and `keywords` in the JSON-LD.
- **[verified] `SearchAction` points to a dead endpoint.** `src/config/config.ts:36-39` hardcodes `searchAction.target: ${siteUrl}/search?q={search_term_string}`; no `/search` route exists. **Recommendation: remove the `potentialAction` from `websiteSchema` in `seo.ts` and drop the `searchAction` block from config.** Building a search page for a static personal site with ~70 articles is overkill, and the current sitelinks-search-box claim is a real (if minor) misleading signal to Google.
- **[verified] `article:section` is hardcoded "Remote Work & Leadership"** in `src/config/config.ts:35` on every post regardless of topic (it appears on a 2005 Firefox note and a 2025 Astro article alike). The doc's original suggestion was "drive it from tags" — but tags are inconsistently applied across the corpus, so this would still mis-categorise many posts. **Recommendation: drop `article:section` from `generateArticleMeta` entirely** unless a real per-post category exists. It's a low-signal field (Google largely ignores it); lying about it is worse than omitting it.
- **[verified — decision for Danny, not a bug] Identity vs. content mismatch.** All metadata frames Danny purely as a remote-work/operations consultant, while most recent content is AI/coding/dev/writing/design. The framing is baked into multiple fields: `CONFIG.author.jobTitle`, `extendedTitle`, all three `descriptions.*`, `seo.articleSection`, *and* `pageTitleTemplates`. **The `pageTitleTemplates` entry is the highest-leverage single field**: every article SERP title currently ends `"| Danny Smith - Operations & Leadership Expert"` regardless of whether the post is about Astro, ADHD, or org health. `llms.txt` is also stamped `Updated: 2025-10-04`. **This is a positioning call Danny owns** — flagging only so the metadata can be made deliberate. (See Open Questions.)

## Phase 3 — Crawl surface & well-known files

- **[verified] Dev/playground pages are indexable and in the sitemap.** `/scratchpad/` and `/toolboxtest/` (and arguably `/styleguide/`) appear in `sitemap-0.xml` and are crawlable, diluting the indexed surface. **Fix has two parts**: (a) in `astro.config.mjs:59`, pass a `filter` to `sitemap()` excluding `/scratchpad`, `/toolboxtest` (and `/styleguide` if you decide); (b) suppress indexing on the pages themselves. The cleanest way is to extend `<BaseHead>` with a `robotsDirective?: string` prop (needed for the 404 page too — see Keystone). The dirtier-but-faster way is an inline `<meta name="robots" content="noindex">` in each page's `<head>`. Keep `styleguide` deliberate — the article/note styleguides are linked.
- **[verified] `/favicon.ico` 404s on every page.** `src/components/layout/BaseHead.astro:60` declares `<link rel="icon" href="/favicon.ico" sizes="any">` but `public/` only contains `favicon.svg` (960B) and `favicon.png` (892B). **Removing the `<link>` line alone is not sufficient**: browsers also auto-request `/favicon.ico` by convention regardless of declared icons. **Fix:** add a real `favicon.ico` to `public/` *and* keep (or drop) the link — both are needed to silence the 404.
- **[verified] `security.txt` is at the wrong path.** It exists at `public/security.txt` with valid content (Contact + Expires), but RFC 9116 requires `/.well-known/security.txt`, which 404s. Move it to `public/.well-known/security.txt` and update its `Canonical:` line (currently `https://danny.is/security.txt`). Fully portable, no host config.
- **[verified — correction] `site.webmanifest` IS present** (200, valid). The second session flagged it as possibly missing; it isn't. It does point its largest icon at the 606KB `icon.jpg` (see Phase 4) and is `display: browser`.

## Phase 4 — Images & fonts

The responsive image pipeline itself is genuinely good — `<picture>` with `avif → webp → jpg → png` and a full srcset ladder; modern browsers get small files. The issues are around the fallbacks and a few oversized public assets.

- **[verified — root cause refined] PNG fallback ladder is dead weight + slow build.** `dist/_astro` holds ~73MB of PNGs (single Minecraft variants are 4–5MB at 3840w), and image generation dominates the ~200s build. The doc's original framing — "screenshot sources are PNG, so the ladder is PNG" — is right about the symptom but wrong about the configuration gap. `src/components/mdx/BasicImage.astro:71` already passes `formats={['avif', 'webp', 'jpg']}`. The `formats` array controls `<source>` elements; the fallback `<img>` is governed by `fallbackFormat`, which **defaults to the source image's format**. With PNG sources, the fallback ladder is PNG regardless of `formats`. **Fix: add `fallbackFormat="jpg"` to the `<Picture>` in `BasicImage.astro`.** One prop, fixes every current and future PNG source. Strongly preferred over "convert sources to JPEG" — that puts the burden on every author forever.
- **[verified] The `<img>` fallback `src` is the 3840px PNG.** Anything that uses the fallback (older clients, some crawlers, email previews) can pull a multi-MB image. The `fallbackFormat="jpg"` change above resolves this for format; pair with a sensible mid-width default if Astro doesn't already pick one.
- **[verified — needs layout check] `sizes` over-declares width.** In-article images use `sizes="(min-width: 3840px) 3840px, 100vw"`, but the prose column is `--measure-standard: 70ch` (~640–700px) and images sit in `.image-wrapper`. If that wrapper stays within the reading column (rather than full-bleed), browsers fetch a far larger variant than rendered on desktop. **Verify the actual rendered width**, then set `sizes` to match (e.g. the measure, or the breakout width) — bytes saved on every content image.
- **[verified] Oversized `public/` assets.** Measured directly from the working tree: `avatar-circle.png` is **1.9MB** (worst offender by far), `avatar.jpg` is **602KB**, `icon.jpg` is **592KB**. These are used only in metadata/OG/manifest/apple-touch-icon. `og-default.png` is **64KB** — that one is fine. Compress/resize the three large ones. Worth `rg`-ing for `avatarCircleUrl` before resizing `avatar-circle.png` — its actual rendered size is probably tiny.
- **[verified] Homepage avatar `srcset` is a no-op:** `srcset="/icon.jpg 200w, /icon.jpg 400w"` lists the same file twice. Harmless but pointless.
- **[verified] Fonts: weight + no preload.** Measured from `public/fonts/`: `Literata-v3.103-…woff2` is **394KB**, italic **391KB** (italic only loads when italic text renders); `LeagueSpartan-Regular.ttf` and `-Bold.ttf` are **56KB each** as TTF (woff2 is ~40% smaller). Figtree (28K/27K) and Geist (72K/68K) are already woff2. Nothing is preloaded, so the body serif loads only after CSS parse (visible swap). The Fira Code subsets (`/_astro`) also ship cyrillic/greek variants, but `unicode-range` means browsers won't fetch them for English text — not a problem. **Fix:** convert League Spartan to woff2, consider subsetting Literata to Latin Extended (likely halves it), and `<link rel="preload">` the primary body font. **Order this work BEFORE shipping Phase 1's immutable cache headers** — once `/fonts/*` is `immutable`, font updates require URL changes. The existing version stamps in the filenames make that fine, but plan accordingly.

## Phase 5 — Accessibility & content hygiene

- **[verified] Invalid nested `<time>` in the note header.** `src/components/layout/NoteCard.astro:18-22` wraps `<FormattedDate>` (which itself renders `<time datetime="…" class="dt-published">…</time>` — see `src/components/ui/FormattedDate.astro`) inside another `<time class="date">`. Generated markup ends up as `<time>…<time>…</time>…</time>` — invalid HTML and breaks microformats. **Fix: drop the outer `<time>` in `NoteCard.astro`** — the inner one already carries `datetime`. The `.date` class needs to move to a wrapping element (or be passed to `FormattedDate` as a class prop).
- **[verified] Filename-as-alt text** on 8 images across 3 pages (`alt="mc-bluemap-structures.png"`, `alt="AE Screenshot 1.png"`, `alt="istream-radio.jpg"`, etc.). Add real alt text in the source content for those images. (Site-wide this is rare — most images are fine.)
- **[verified — worse than the doc implied] `.DS_Store` files leak into the build.** `.gitignore` already contains `.DS_Store`, but the files are physically present in `public/.DS_Store`, `public/styleguide/.DS_Store`, `public/fonts/.DS_Store` (untracked locally, so git is clean). Astro copies `public/` verbatim into `dist/`, so they ship. Vercel currently blocks dotfiles so they 404 live — but this is a portability landmine: a host that serves dotfiles (plain nginx, S3) would expose them. **Fix: `find public -name .DS_Store -delete`**, plus consider a tiny pre-build step or an editor-level setting that prevents macOS from re-creating them in `public/`.
- **[verified — spot-check] 271 `alt=""` (empty alt) across the build.** Most are almost certainly decorative (icons/UI), which is correct — but the count is high enough to be worth confirming no *content* image accidentally has empty alt.
- **[confirm] Archival notes contain `http://` / possibly dead links** (incl. `http://danny.is`). Low priority content hygiene; worth a sweep of the oldest notes.

## Phase 6 — Build reliability (nuanced — fail-hard is partly deliberate)

The doc's original framing was "make external fetches fail-soft." Reading the code complicates that:

- **`src/utils/fetchLinkMetadata.ts` is already fail-soft.** All errors are caught; failures return `null`. `BookmarkCard` unfurls cannot break a build.
- **`src/utils/fetchLoomCloneVideo.ts` is fail-hard by deliberate design.** The header comment says so explicitly: *"Failures (404, non-complete, private) throw and fail the build — typos in slugs and stale references should not silently ship to production."* So an `<LCVid>` failure breaking a deploy is a feature, not a bug.
- **`astro-embed`'s YouTube/Tweet/Vimeo helpers** fetch oEmbed at build time and behave variably depending on the third party. Less controllable.

So the real question is narrower than "make it all fail-soft": **do we want `<LCVid>` to keep failing-hard even when `v.danny.is` is down (vs. a missing slug)?** A reasonable compromise that preserves the safety-net intent:

- **Cache LoomClone JSON snapshots at the repo level** (committed JSON files, refreshed by a scheduled GitHub Action — the `update-toolbox` job is a precedent). Builds read the snapshot; a `v.danny.is` outage no longer blocks deploys; stale-slug errors still fire at *snapshot refresh time* rather than at every deploy.

**Acceptance for Phase 6 should be reframed:** instead of "all fetches fail-soft," it's "deploys don't depend on `v.danny.is` being reachable at build time, but stale `<LCVid>` slug references still fail loudly somewhere."

---

## Codebase-level additions (surfaced by reading the source)

These weren't visible from the live HTML alone and only emerged from looking at the code:

- **`BaseHead` doesn't expose a `robotsDirective` prop.** Every page inherits the global `index, follow, max-image-preview:large…` from `getConfig().seo.robotsDirective`. That means the 404 page, scratchpad, toolboxtest, and (potentially) styleguide can't opt out of indexing without inline `<meta name="robots">` hacks. **Recommendation: add an optional `robotsDirective?: string` prop to `BaseHead`** that overrides the config default. Unblocks the 404 noindex (Keystone) and Phase 3 (scratchpad/toolboxtest). Tiny change; high leverage across multiple phases.
- **`article:tag` OG meta is silently missing — same root cause as JSON-LD dates.** `seo.ts:204` iterates `pageData.tags` to emit `<meta property="article:tag" content="…">`, but tags are never passed in. Plumbing `tags` through from layouts (Phase 2 fix) restores this automatically. Free win.
- **`generateMetaDescription` appends `" | Danny Smith"` to every description** (`seo.ts:43`). With descriptions empty on ~78% of articles today, this suffix is currently invisible. **Once Phase 2 lands and `generateSummary` populates fallback descriptions, suddenly every article meta description gains the suffix** — eating into the 155–160 char SERP cap and the social preview budget. Worth a taste-check: do you want the suffix? If yes, keep. If no, drop it from `generateMetaDescription` before shipping Phase 2.

## Minor / noted (low priority, recorded for completeness)

Things observed in the black-box pass that are real but not worth prioritising — captured so nothing from the investigation is silently dropped:

- **`/cv.pdf` 404s, but `/cv` works** (redirects to `/cv-danny-smith.pdf`). `AGENTS.md` still references `danny.is/cv.pdf`; that's internal-doc staleness, not a live problem — only matters if something external links to `/cv.pdf`. **Cheapest fix: add a one-line redirect** in `src/config/redirects.ts` (`'/cv.pdf': '/cv-danny-smith.pdf'`) rather than auditing every external link.
- **`<meta name="generator" content="Astro v6.1.1">`** discloses the framework version. Negligible; remove only if you care.
- **`access-control-allow-origin: *`** on HTML responses (Vercel default). Harmless for a public static site.
- **`rss.xml` is ~926KB** (120 full-content items). This is a deliberate, nice choice (full-text feed); noted only so it isn't mistaken for bloat.
- **Core Web Vitals / Lighthouse were not measured** this session — performance findings are inferred from payloads and caching headers, not a lab run. A real Lighthouse pass would be the natural confirmation step.

## Explicitly good — do not touch

Responsive AVIF/WebP `<picture>` pipeline; three valid full-content RSS feeds; `llms.txt` for AI agents; rich h-card/microformats + JSON-LD `@graph`; speculation-rules prefetch/prerender; `fediverse:creator`; canonical tags everywhere; valid sitemap; HSTS; inline theme-flash-prevention script; portable HTML meta-refresh redirects (`/working`, `/meeting`, etc. — they carry `noindex` + canonical and work on any host with zero config; the 301 upgrade is deliberately **not** pursued to preserve portability).

## Suggested order

Phase 1 (biggest perf + the dead 404, one file) → Phase 2 (descriptions + JSON-LD dates + tags, biggest SEO/social) → Phase 4 (build-time + payload wins) → Phase 3 → Phase 5 → Phase 6.

**Fold these tiny mechanical fixes into the Phase 1 PR** — they're trivial and unrelated enough to ride along: nested-`<time>` in `NoteCard.astro`, deleting `.DS_Store` from `public/`, adding the `/cv.pdf` redirect, adding the `robotsDirective?` prop to `BaseHead` (which Phase 1's 404 noindex needs anyway).

**Important sequencing note for Phase 4**: do the woff2/subsetting/preload font work *before* Phase 1's immutable cache headers go live. Once `/fonts/*` is `immutable`, updating a font requires a new URL — the existing version stamps in filenames make that fine in principle, but it's cleaner to land the font optimisations first.

## Verification checklist

- [ ] Preview deploy: `/_astro/*` and `/fonts/*` return `cache-control: …immutable`; HTML still revalidates.
- [ ] Preview deploy: a bogus URL returns HTTP **404** and the branded `404.html`.
- [ ] Preview deploy: `x-content-type-options: nosniff` + `referrer-policy` present.
- [ ] `src/pages/404.astro` renders with `<meta name="robots" content="noindex">` (via the new `BaseHead` prop).
- [ ] A sampled article and note expose non-empty `description`/`og:description`/`twitter:description` (sourced from `generateSummary` fallback where frontmatter is absent).
- [ ] `BlogPosting` JSON-LD includes `datePublished`/`dateModified` AND `keywords` (validate in Google's Rich Results Test).
- [ ] Sampled article HTML contains `<meta property="article:tag" content="…">` for each tag.
- [ ] `WebSite` JSON-LD no longer contains a `potentialAction`/`SearchAction` block.
- [ ] `article:section` is either omitted or driven by real per-post data — no "Remote Work & Leadership" on off-topic posts.
- [ ] Meta description suffix decision made (keep `" | Danny Smith"` or drop) — confirm chosen behavior on sampled posts.
- [ ] `/scratchpad/` and `/toolboxtest/` are `noindex` AND absent from `sitemap-0.xml`.
- [ ] `/.well-known/security.txt` returns 200; its `Canonical:` line points at `/.well-known/security.txt`.
- [ ] `/favicon.ico` returns 200 (real file added).
- [ ] `dist/` contains no `.DS_Store` files (`find dist -name .DS_Store` returns nothing).
- [ ] Build-output PNG total drops sharply after `fallbackFormat="jpg"` change; build time improves.
- [ ] `sizes` matches measured rendered width of in-article images.
- [ ] `public/avatar-circle.png`, `public/avatar.jpg`, `public/icon.jpg` all under 100KB after compression.
- [ ] Note pages: HTML validator reports no nested-`<time>` error; microformats parser (e.g. indiewebify.me) sees a single `dt-published`.

## Open questions / decisions for Danny

1. **Positioning:** should the SEO identity (titles, description, JSON-LD, manifest, `llms.txt`) keep the remote-work/operations framing, broaden to reflect the AI/coding/writing content mix, or split (consultant identity on the homepage, topic-accurate metadata per post)? This drives Phase 2's identity items. The single highest-leverage field is `pageTitleTemplates` in `src/config/site.ts` — every article SERP title currently suffixes "Operations & Leadership Expert" regardless of topic.
2. **Search:** Recommendation is **remove** the `SearchAction` (a search page for ~70 articles is overkill). Confirm before doing it, in case there's a plan for a search UI later.
3. **Description suffix:** `generateMetaDescription` currently appends `" | Danny Smith"`. Once `generateSummary` populates fallback descriptions in Phase 2, this becomes visible on every article. Keep it or drop it before Phase 2 ships?
4. **CSP:** worth the effort given inline theme script + Simple Analytics, or defer indefinitely?
5. **Phase 6 (LCVid):** the current fail-hard behaviour is documented and intentional. Do you want a snapshot-based compromise (deploys survive `v.danny.is` outages; stale slugs still fail loudly at snapshot-refresh time), or leave the fail-hard guarantee as-is?
