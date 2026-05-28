# Static Output, Delivery & SEO Hardening

## Background

Actionable findings from a black-box review of the generated site (live responses from `https://danny.is` and the production `dist/` from `bun run build`), cross-checked against source. Every item below was reproduced against live + build + source. Unverified items have been dropped.

## Guiding constraint (read first)

Keep deploying a fully self-generated static build and hand it to Vercel as-is — no framework-level wiring into Vercel, so the site stays easy to move to any static host later. That shapes every recommendation:

- **`dist/` stays 100% pure static output.** Nothing host-specific gets baked into it.
- **All host behaviour (caching, 404, security headers) lives in ONE small, swappable file** — the Build Output API config that CI already writes. Moving hosts later = rewrite that one file (or produce an nginx `location` block / Netlify `_headers`); the build itself never changes.
- **The most portable mechanisms win.** Where something already works in a host-agnostic way (e.g. the HTML meta-refresh redirects), we keep it rather than trading portability for a marginal SEO gain.

## Decisions baked into this plan

- **SearchAction removed.** Drop `potentialAction` from `websiteSchema` and `searchAction` from `config.ts`. No `/search` route exists; the current claim is a misleading signal.
- **Description suffix dropped.** Remove the `" | Danny Smith"` suffix appended by `generateMetaDescription` (`src/utils/seo.ts:43`) before Phase 2 ships — otherwise it becomes visible on every article once fallback descriptions are populated.
- **Identity strings stay centralized in `src/config/site.ts`.** That file already holds `jobTitle`, `extendedTitle`, `descriptions.*`, `pageTitleTemplates`, `pageDescriptions`. Phase 2's identity edits are pure text changes in `site.ts`. Two strays to fix as part of Phase 2: `seo.articleSection` in `config.ts` is being removed entirely (see Phase 2), and `AI_SUMMARY` in `src/pages/llms.txt.ts:15` is partially hardcoded ("remote work, leadership, and technology") — move that string into `site.ts` (e.g. `descriptions.aiSummary`) so all identity copy lives in one file.
- **CSP deferred indefinitely.** Inline theme script + Simple Analytics + speculation-rules make a strict CSP fiddly. `nosniff` + `referrer-policy` are the cheap wins.
- **LCVid fail-hard kept.** No snapshot mechanism. The current behaviour is documented and intentional; deploys failing on stale `<LCVid>` slugs is a feature.

---

## Phase 1 — Edge delivery (caching, 404, security headers) + ride-alongs

**The keystone.** CI builds `dist/`, copies it to `.vercel/output/static/`, and writes `.vercel/output/config.json` as a bare `{"version":3}` (`.github/workflows/deploy.yml:54`). With `vercel deploy --prebuilt`, only that file is consulted — a root `vercel.json` is NOT read. So today: zero header rules, zero error-page wiring, Vercel's generic static default applies to everything.

Consequences from this single bare config:

- **Nothing is cacheable.** Every asset — including content-hashed `/_astro/*.[hash].js|css`, version-stamped `/fonts/*`, images, RSS — is served `cache-control: public, max-age=0, must-revalidate`. Fingerprinted URLs can never change content, so they should be `immutable`. Every repeat visit, View Transition, and speculation-rules prefetch re-validates the entire asset graph. **Biggest single performance lever.**
- **The custom 404 is built but never served.** `dist/404.html` exists (branded), but live `danny.is/<missing>` returns Vercel's generic plain-text "404: NOT_FOUND".
- **No security headers.** No CSP, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` — only Vercel's default HSTS.

### Implementation

Keep the exact current pipeline (`astro build` → copy `dist/` → `vercel deploy --prebuilt`). Only change the "Prepare Vercel output" step so it copies a richer `config.json` instead of `echo`ing `{"version":3}`. Commit the config as `vercel.output-config.json` (reviewable, version-controlled) and have CI copy it into `.vercel/output/config.json`.

Starting config to validate on a preview deploy:

```json
{
  "version": 3,
  "routes": [
    { "src": "^/_astro/(.*)$", "headers": { "cache-control": "public, max-age=31536000, immutable" }, "continue": true },
    { "src": "^/fonts/(.*)$",  "headers": { "cache-control": "public, max-age=31536000, immutable" }, "continue": true },
    { "src": "^/(favicon|avatar|avatar-circle|icon|end-mark|og-default).*$",
      "headers": { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" }, "continue": true },
    { "src": "^/.*\\.xml$",
      "headers": { "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" }, "continue": true },
    { "src": "^/(.*)$", "headers": {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "geolocation=(), microphone=(), camera=()"
      }, "continue": true },
    { "handle": "filesystem" },
    { "src": "/(.*)", "status": 404, "dest": "/404.html" }
  ]
}
```

Notes:

- **HSTS is auto-added by Vercel** (`strict-transport-security: max-age=63072000`) — don't set it manually.
- **Three cache tiers, by stability:**
  - `/_astro/*` and `/fonts/*` are content-/version-stamped → `immutable`, 1 year.
  - Stable-but-unhashed assets in `public/` (`favicon.*`, `avatar*`, `icon.jpg`, `end-mark.svg`, `og-default.png`) → 1 hour browser, 1 day edge, SWR. URLs don't change when content does, so `immutable` would risk staleness; doing nothing leaves them revalidating on every request.
  - RSS feeds (`*.xml`) → 10 min browser, 1 hour edge, SWR. RSS clients poll on their own cadence; edge caching is invisible to them.
  - `s-maxage` is consumed by Vercel's CDN and stripped from the response sent to clients, so the browser only sees `public, max-age=…`.
- **Per-post `og-image.png` is deliberately NOT in the cache regex.** Per-article OG images regenerate when post titles or images change; the safer default is to leave them revalidating. If their byte volume becomes a concern, add `og-image` to the regex — the risk is a stale OG preview after a post-title edit until the cache expires.
- **Security headers**: `nosniff`, `x-frame-options: DENY` (clickjacking — no legitimate reason for danny.is to be framed), `referrer-policy`, `permissions-policy`. CSP intentionally omitted (decision recorded above).
  - Optional: `cross-origin-opener-policy: same-origin` for process isolation. Trade-off: `window.opener` is nulled for any popup the site opens — almost certainly fine here. Add if you want the principle; skip if you don't want to think about it.
- **The final two entries** serve `dist/404.html` with a real 404 status on any filesystem miss. This is the pattern Vercel's own KB recommends for static sites on the prebuilt path. Verify on a preview deploy: a real asset returns 200 + cache header AND a missing URL returns 404 + branded page.

### Ride-along fixes (same PR — tiny and unrelated enough to bundle)

1. **Add `robotsDirective?: string` prop to `BaseHead`** (`src/components/layout/BaseHead.astro`). Currently every page inherits the global `index, follow, max-image-preview:large…` from `getConfig().seo.robotsDirective`. The 404 page (and Phase 4's scratchpad/toolboxtest) needs to override it. Needed here because:
2. **Set `noindex` on `src/pages/404.astro`** via the new prop. A real 404 status keeps it out of the index, but explicit `noindex` is the safe belt-and-braces.
3. **Fix nested `<time>` in `src/components/layout/NoteCard.astro:18-22`.** Drops the outer `<time>` wrapping `<FormattedDate>` (which already renders `<time datetime="…" class="dt-published">`). Move the `.date` class onto a wrapping element or pass it to `FormattedDate` as a class prop. Invalid HTML; breaks microformats.
4. **Delete `.DS_Store` files from `public/`.** They're untracked locally (gitignored) but physically present in `public/.DS_Store`, `public/styleguide/.DS_Store`, `public/fonts/.DS_Store`. Astro copies `public/` verbatim into `dist/`, so they ship. Vercel blocks dotfiles in responses, so they 404 live — but it's a portability landmine (nginx, S3 would expose them). Run `find public -name .DS_Store -delete`. Add a pre-build step or editor setting to stop macOS recreating them.
5. **Add `/cv.pdf` → `/cv-danny-smith.pdf` redirect** in `src/config/redirects.ts`. Cheapest fix for the stale external-link risk; `AGENTS.md` references `danny.is/cv.pdf`.

**Acceptance:** on a preview deploy, `/_astro/*` and `/fonts/*` return `cache-control: …immutable`; `/favicon.svg`, `/avatar.jpg`, `/og-default.png` return `cache-control: public, max-age=3600` (with `s-maxage` stripped); `/rss.xml` returns `cache-control: public, max-age=600`; a bogus URL returns HTTP 404 with the branded page; `x-content-type-options: nosniff`, `x-frame-options: DENY`, and `referrer-policy` present on HTML; 404 page contains `<meta name="robots" content="noindex">`; `dist/` contains no `.DS_Store`; `/cv.pdf` redirects.

---

## Phase 2 — Content metadata & structured data

Five issues, all with the same root cause pattern: helpers and config exist but aren't plumbed through.

1. **Empty descriptions on content pages (highest-impact item after caching).** Every article and note renders empty `<meta name="description">`, `og:description`, `twitter:description`. Spot-check: only **15 of 68 articles** have a `description:` frontmatter field; the rest ship empty meta. Section pages (`/writing`, `/notes`, `/now`) have them; individual posts don't. Result: no controlled SERP snippet, blank social/Slack/iMessage previews. The helper already exists: `src/utils/content-summary.ts` exports `generateSummary(entry, maxLength)` (frontmatter → first meaningful paragraph → sentence-boundary truncation) and is already used by `ContentCard`. **Fix:** in `src/layouts/Article.astro` and `src/layouts/Note.astro`, pass `description={description ?? generateSummary(entry)}` into `<BaseHead>`. ~2 lines total.

2. **`BlogPosting` JSON-LD missing `datePublished`/`dateModified`/`keywords`, and `article:tag` OG meta missing.** Root cause is the same: `src/utils/seo.ts:154-164` (`BlogPosting`) and `seo.ts:204` (`article:tag`) already produce the right output *if* given the data. The bug is in the layouts: `src/layouts/Article.astro` and `src/layouts/Note.astro` call `<BaseHead title= description= type="article" pageType="article" image= />` and never pass `pubDate`, `updatedDate`, or `tags`. `validateSEOData` sees them as undefined and the data is silently dropped from the `@graph`. **Fix:** thread `pubDate`, `updatedDate`, `tags` into `<BaseHead>` from both layouts. One-line fix per layout restores all four missing fields.

3. **Drop the description suffix.** Remove `" | Danny Smith"` from `generateMetaDescription` in `src/utils/seo.ts:43`. Do this BEFORE shipping the layout changes above — otherwise it becomes visible on every article once fallback descriptions populate.

4. **Remove `SearchAction`.** Drop `potentialAction` from `websiteSchema` in `src/utils/seo.ts` and `searchAction` from `src/config/config.ts:31-34`. No `/search` route exists.

5. **Drop `article:section` entirely.** `src/config/config.ts:30` hardcodes `"Remote Work & Leadership"` on every post, regardless of topic — it appears on a 2005 Firefox note and a 2025 Astro article alike. Tags are too inconsistent across the corpus to drive this from frontmatter, and the field is low-signal (Google largely ignores it). Remove from `generateArticleMeta` and delete `seo.articleSection` from `config.ts`.

### Identity copy (text-only edits in `src/config/site.ts`)

All identity strings are already centralized in `site.ts`. Phase 2 just edits text there. Two cleanup items so this stays true:

- Remove `seo.articleSection` from `config.ts` (per item 5 above).
- Move `AI_SUMMARY` from `src/pages/llms.txt.ts:15` into `site.ts` (e.g. `descriptions.aiSummary`). Currently mixes `config.author.jobTitle` with hardcoded "remote work, leadership, and technology" — splits identity copy across two files.

Then revise the strings in `site.ts` so per-article SERP titles, social previews, JSON-LD, manifest, and `llms.txt` don't all stamp every post as "Operations & Leadership Expert" regardless of topic. Highest-leverage single field is `pageTitleTemplates.article` — every article SERP title currently ends `"| Danny Smith - Operations & Leadership Expert"`. Wording is Danny's to decide; the mechanism is just text edits in one file.

**Acceptance:** sampled article and note expose non-empty `description`/`og:description`/`twitter:description`; `BlogPosting` JSON-LD includes `datePublished`/`dateModified`/`keywords` (validate in Google's Rich Results Test); sampled article HTML contains `<meta property="article:tag" …>` for each tag; `WebSite` JSON-LD has no `potentialAction`; no `article:section` meta; meta descriptions don't end with `" | Danny Smith"`; identity copy reads coherently for both an ops post and an Astro post.

---

## Phase 3 — Images & fonts

The responsive image pipeline itself is good — `<picture>` with `avif → webp → jpg → png` and a full srcset ladder. Issues are around fallbacks, sizing, oversized public assets, and font weight.

### Images

1. **PNG fallback ladder is dead weight + slows the build.** `dist/_astro` holds ~73MB of PNGs (single Minecraft variants are 4–5MB at 3840w); image generation dominates the ~200s build. `src/components/mdx/BasicImage.astro:71` passes `formats={['avif', 'webp', 'jpg']}` — but `formats` only controls `<source>` elements. The fallback `<img>` is governed by `fallbackFormat`, which defaults to the source image's format. With PNG sources, the fallback ladder is PNG. **Fix:** add `fallbackFormat="jpg"` to the `<Picture>` in `BasicImage.astro`. One prop, fixes every current and future PNG source. Strongly preferred over "convert sources to JPEG" — that puts the burden on every author forever.

2. **`<img>` fallback `src` is the 3840px PNG.** Older clients, some crawlers, email previews pull a multi-MB image. The `fallbackFormat="jpg"` change above resolves the format; pair with a sensible mid-width default if Astro doesn't already pick one.

3. **`sizes` over-declares width.** In-article images use `sizes="(min-width: 3840px) 3840px, 100vw"`, but the prose column is `--measure-standard: 70ch` (~640–700px) and images sit in `.image-wrapper`. Verify the actual rendered width (.image-wrapper inside the measure vs full-bleed), then set `sizes` to match. Bytes saved on every content image.

4. **Oversized `public/` assets.** Measured from working tree:
   - `avatar-circle.png` — **1.9MB** (worst offender)
   - `avatar.jpg` — **602KB**
   - `icon.jpg` — **592KB**
   - `og-default.png` — 64KB (fine, leave it)

   Used only in metadata/OG/manifest/apple-touch-icon. Compress/resize the three large ones. Before resizing `avatar-circle.png`, `rg` for `avatarCircleUrl` — actual rendered size is probably tiny.

5. **Homepage avatar `srcset` is a no-op.** `srcset="/icon.jpg 200w, /icon.jpg 400w"` lists the same file twice. Harmless but pointless; clean up.

### Fonts

Measured from `public/fonts/`: Literata-Regular **394KB**, Literata-Italic **391KB**, LeagueSpartan-Regular and -Bold **56KB each as TTF** (woff2 is ~40% smaller). Figtree (28K/27K), Geist (72K/68K) already woff2. Nothing preloaded — body serif loads only after CSS parse (visible swap). Fira Code subsets in `/_astro` ship cyrillic/greek but `unicode-range` prevents fetch for English text — not a problem.

- Convert League Spartan TTF → woff2.
- Consider subsetting Literata to Latin Extended (likely halves it).
- `<link rel="preload">` the primary body font.

Note: the original review flagged "do font work before Phase 1's `immutable` cache headers ship." In practice the font filenames already carry version stamps — updating a font means a new URL anyway, which is the whole point of stamps. Order doesn't really matter; do it whenever convenient.

**Acceptance:** build-output PNG total drops sharply after `fallbackFormat="jpg"`; build time improves; `sizes` matches measured rendered width; `avatar-circle.png`, `avatar.jpg`, `icon.jpg` all under 100KB; League Spartan is woff2; body font is preloaded.

---

## Phase 4 — Crawl surface & well-known files

1. **Dev/playground pages are indexable and in the sitemap.** `/scratchpad/` and `/toolboxtest/` appear in `sitemap-0.xml` and are crawlable, diluting the indexed surface. Two-part fix:
   - In `astro.config.mjs:59`, pass a `filter` to `sitemap()` excluding `/scratchpad`, `/toolboxtest`.
   - Set `robotsDirective="noindex"` on the pages themselves (uses the prop added in Phase 1).
   - Leave `/styleguide/` indexable — the article/note styleguides are deliberately linked.

2. **`/favicon.ico` 404s on every page.** `src/components/layout/BaseHead.astro:60` declares `<link rel="icon" href="/favicon.ico" sizes="any">` but `public/` only contains `favicon.svg` and `favicon.png`. Browsers auto-request `/favicon.ico` regardless of declared icons, so removing the `<link>` line alone is not sufficient. **Fix:** add a real `favicon.ico` to `public/`.

3. **`security.txt` is at the wrong path.** Exists at `public/security.txt` with valid content, but RFC 9116 requires `/.well-known/security.txt`. Move to `public/.well-known/security.txt` and update its `Canonical:` line (currently `https://danny.is/security.txt`).

**Acceptance:** `/scratchpad/` and `/toolboxtest/` are `noindex` AND absent from `sitemap-0.xml`; `/favicon.ico` returns 200; `/.well-known/security.txt` returns 200 with correct `Canonical:`.

---

## Phase 5 — Accessibility & content hygiene

Most accessibility work has been folded into Phase 1 (nested `<time>`, `.DS_Store`). Remaining items:

1. **Filename-as-alt text on 8 images across 3 pages** (`alt="mc-bluemap-structures.png"`, `alt="AE Screenshot 1.png"`, `alt="istream-radio.jpg"`, etc.). Add real alt text in the source content for those images. Site-wide rare — most images are fine.

2. **Sanity-check the 271 `alt=""` (empty alt) across the build.** Most are decorative (icons/UI), which is correct, but the count is high enough to confirm no content image accidentally has empty alt.

**Acceptance:** the 8 filename-alt images have descriptive alt text; spot-check of empty-alt images confirms no content images affected.

---

## Codebase additions surfaced by source review

These weren't visible from live HTML alone and are folded into the phases above for clarity:

- **`BaseHead` needs a `robotsDirective?: string` prop** — added in Phase 1; consumed by Phase 1 (404) and Phase 4 (scratchpad/toolboxtest).
- **`article:tag` OG meta missing is the same root cause as JSON-LD dates** — fixed by Phase 2's layout plumbing.
- **`generateMetaDescription` suffix removal must precede Phase 2's description population** — explicit step inside Phase 2.

## Minor / noted (not in scope, recorded so nothing is silently dropped)

- `<meta name="generator" content="Astro v6.1.1">` discloses the framework version. Negligible; remove only if you care.
- `access-control-allow-origin: *` on HTML responses (Vercel default). Harmless for a public static site.
- `rss.xml` is ~926KB (120 full-content items). Deliberate full-text feed; noted only so it's not mistaken for bloat.
- Core Web Vitals / Lighthouse were not measured in the review — performance findings are inferred from payloads and caching headers. A real Lighthouse pass would be the natural confirmation step after Phases 1 + 3 ship.

## Explicitly good — do not touch

Responsive AVIF/WebP `<picture>` pipeline; three valid full-content RSS feeds; `llms.txt` for AI agents; rich h-card/microformats + JSON-LD `@graph`; speculation-rules prefetch/prerender; `fediverse:creator`; canonical tags everywhere; valid sitemap; HSTS; inline theme-flash-prevention script; portable HTML meta-refresh redirects (`/working`, `/meeting`, etc. — they carry `noindex` + canonical and work on any host with zero config; the 301 upgrade is deliberately **not** pursued to preserve portability); LCVid fail-hard fetch behaviour (`src/utils/fetchLoomCloneVideo.ts` — documented design choice to catch stale slugs at deploy time).

## Suggested order

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5. Each phase ships independently; nothing in a later phase depends on an earlier one beyond the `robotsDirective` prop (Phase 1 → Phase 4).

## Verification checklist

- [ ] Preview deploy: `/_astro/*` and `/fonts/*` return `cache-control: …immutable`; HTML still revalidates.
- [ ] Preview deploy: `/favicon.svg`, `/avatar.jpg`, `/og-default.png` return `cache-control: public, max-age=3600` (browser only sees `max-age`; CDN gets the longer `s-maxage`).
- [ ] Preview deploy: `/rss.xml` and other `.xml` feeds return `cache-control: public, max-age=600`.
- [ ] Preview deploy: a bogus URL returns HTTP **404** and the branded `404.html`.
- [ ] Preview deploy: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, and `permissions-policy` present on HTML.
- [ ] `src/pages/404.astro` renders with `<meta name="robots" content="noindex">` (via the new `BaseHead` prop).
- [ ] `dist/` contains no `.DS_Store` files (`find dist -name .DS_Store` returns nothing).
- [ ] `/cv.pdf` redirects to `/cv-danny-smith.pdf`.
- [ ] Note pages: HTML validator reports no nested-`<time>` error; microformats parser (indiewebify.me) sees a single `dt-published`.
- [ ] A sampled article and note expose non-empty `description`/`og:description`/`twitter:description` (sourced from `generateSummary` fallback where frontmatter is absent).
- [ ] `BlogPosting` JSON-LD includes `datePublished`, `dateModified`, `keywords` (validate in Google's Rich Results Test).
- [ ] Sampled article HTML contains `<meta property="article:tag" content="…">` for each tag.
- [ ] `WebSite` JSON-LD no longer contains a `potentialAction`/`SearchAction` block.
- [ ] No `article:section` meta on any page.
- [ ] No meta description ends with `" | Danny Smith"`.
- [ ] All identity copy (titles, descriptions, llms.txt summary) lives in `src/config/site.ts` — no hardcoded strays in `config.ts` or `llms.txt.ts`.
- [ ] Build-output PNG total drops sharply after `fallbackFormat="jpg"`; build time improves.
- [ ] `sizes` matches measured rendered width of in-article images.
- [ ] `public/avatar-circle.png`, `public/avatar.jpg`, `public/icon.jpg` all under 100KB after compression.
- [ ] League Spartan is woff2; primary body font is preloaded.
- [ ] `/scratchpad/` and `/toolboxtest/` are `noindex` AND absent from `sitemap-0.xml`.
- [ ] `/favicon.ico` returns 200 (real file added).
- [ ] `/.well-known/security.txt` returns 200; its `Canonical:` line points at `/.well-known/security.txt`.
- [ ] 8 filename-alt images now have descriptive alt text.
