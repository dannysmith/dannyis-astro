# Task: Better Cover Images

## Goal

Redesign the dynamic Open Graph / social-share ("cover") images for danny.is to match a new, more characterful visual identity, and extend dynamic generation to cover more of the site. The work is primarily **aesthetic** (a new look, inspired by the cover generator built for Danny's video platform) plus a **coverage** expansion (generate covers for pages that aren't backed by content collections).

We keep the existing **Satori → resvg → PNG** build-time pipeline and evolve it. No new rendering engine, no headless browser in the build.

## The Elements (unchanged from today)

The information shown on a cover stays the same — we're changing how it looks, not what it contains:

- Danny's name / handle
- Profile image (avatar)
- The title of the content piece
- The URL of the content piece
- A marker indicating when something is a **note** (rather than an article), done in a nicer, more integrated way than today's badge.

## Visual Design Target

The target look is the cover generator from Danny's video platform (prototyped in the `~/scratchpad/thumbnail-creator/` React spike). Reference images live temporarily in `docs/tasks-todo/` (see [Working Notes](#working-notes)).

Design description:

- **Dark background** with soft, organic **"blobs"** of colour bleeding in from the corners — pink/coral top-left (behind the avatar) and peach/coral bottom-right. The blobs are **static decoration**; they don't change per-page.
- **Avatar** in a white-bordered circle, top-left.
- **Title** in **all caps**, left-aligned, occupying the main body of the image, vertically centred.
- **URL** just above the name, near the bottom, always on one line.
- **Name / handle** at the very bottom, prefixed with `@`, the `@` picked out in the coral accent colour.
- **Note marker** integrated tastefully into the design (replacing today's separate yellow "NOTE" badge).

Reference palette from the spike (the design's intent — exact final hexes can be tuned against both themes):

- Background: `#2f3437`
- Blob pink: `#ffd5d5`
- Blob coral / accent: `#ff7369`
- Blob peach: `#fed9b7`
- Title / text: `#ffffff`

The spike is a **visual and structural reference**, not a literal source: it used Inter / Fira Code on a 16:9 canvas, and we are deliberately not copying those (see [Decisions](#decisions)).

## Aesthetic Requirements

- **Title vertically centred** within its area, regardless of line count.
- **Balanced wrapping** when the title wraps (the effect of CSS `text-wrap: balance` — Satori supports `textWrap: 'balance'`).
- **Title auto-shrinks.** Font size tops out at the reference size and shrinks for longer titles so everything fits. This does **not** need to be perfect — it just needs to stop long titles from looking terrible. Start with the simplest approach that works; only add complexity (e.g. glyph measurement) if a simple heuristic isn't good enough.
- **URL on a single line**, and ideally shrinks too if a URL is unusually long, so it never wraps or overflows.
- **All caps** title treatment.

## Coverage Requirements

- **Articles and notes** — continue to get dynamically generated covers (as today).
- **Non-collection pages** — *also* get dynamic covers where it makes sense (e.g. `/now`, `/about`, and similar pages added later).
- **Default fallback** — keep a static default cover, restyled to match the new design, for anything without a generated image (e.g. the home page, or pages we deliberately skip). This must always exist as a backstop.

### Title sourcing for non-collection pages

These pages don't have content-collection frontmatter, and the HTML `<title>` isn't always right for a cover. Planned approach:

- Default to **title-casing the last segment of the URL** (a sensible default for the current and planned page set).
- Provide a small **per-page override** (e.g. an optional prop) so important pages can set cover text explicitly.

## Current State (how covers work today)

A **Satori → resvg → PNG** pipeline, generated at build time, cached across builds. It works well; this task evolves it.

Key files:

- `src/utils/og-image-generator.ts` — the engine. Loads fonts, runs Satori (JSX → SVG), then resvg (SVG → PNG). Content-addressed caching in `node_modules/.astro/og-cache`, keyed on `{ data, template, width, height, CACHE_VERSION }`. Sharp is a last-resort fallback if Satori/resvg throws.
- `src/utils/og-templates.ts` — three templates (`article`, `note`, `default`) as Satori element trees.
- `src/utils/og-branding.ts` — author name + profile image.
- `src/pages/writing/[...slug]/og-image.png.ts` and `src/pages/notes/[...slug]/og-image.png.ts` — build-time endpoints (`getStaticPaths`) emitting one PNG per item.
- `src/components/layout/BaseHead.astro` + `src/utils/seo.ts` (`generateOGImageUrl`) — wire the image URL into `og:image` / `twitter:image`; fall back to `/og-default.png` when a page passes no image.
- `public/og-default.png` — the static default.
- `public/fonts/*.ttf` — Satori needs TTF (it can't read WOFF2). Currently `Geist-Bold.ttf`, `Figtree-Regular.ttf`, `Figtree-Bold.ttf`. (The site itself serves WOFF2/variable versions of Geist, Figtree, Literata.)

Facts that matter:

- Dimensions are already **1200×630**.
- Cover generation was historically the slowest part of CI; the content-addressed cache (restored across builds via the `astro-cache-*` GitHub Actions cache) now makes unchanged covers near-free. **Bump `CACHE_VERSION`** whenever templates, branding, or fonts change.
- Satori embeds text as vector `<path>` outlines, so resvg never resolves fonts at render time — this avoids the font-rendering problems we hit before with hand-authored `<text>` SVGs rasterised via sharp.
- The browser (Playwright/Chromium) is used **only for e2e tests and Lighthouse audits**, never in the build (`bun run build` is just `astro build`). We're keeping it that way.

## Decisions

1. **Aspect ratio / size: keep 1200×630.** Current value and still the 2026 standard. The spike's 16:9 layout gets re-tuned for the wider 1.91:1 frame. Keep critical content within a ~60px safe-zone margin (some platforms crop slightly).
2. **Fonts: use this site's existing brand fonts** (Geist / Figtree as used today), not the spike's Inter / Fira Code. Grab additional TTFs if the design needs them (e.g. a weight we don't have, or a monospace face for the URL).
3. **Engine: stay with Satori + resvg**, evolving the current pipeline. No headless browser in the build. (Takumi — a Rust Satori-alternative with native WOFF2/variable-font support — was evaluated and set aside: its main win, avoiding TTF conversion, is near-zero value here since our TTFs change almost never, and it adds single-maintainer dependency risk. Worth revisiting only if it matures or Satori stalls.)
4. **Title auto-shrink need not be perfect** — just good enough that long titles don't look broken. Mechanism chosen at implementation time, simplest-first; avoid adding `opentype.js` unless genuinely needed.
5. **Blobs are baked as a static background**, not rendered per-image — they never change, so they shouldn't cost anything per cover or rely on Satori rendering arbitrary paths.

## Open Questions (small, resolve during implementation)

- **Note marker treatment** — what the integrated note indicator looks like in the new design.
- **URL typeface** — the reference shows a monospace URL, but the site has no monospace brand font (today's cover uses Figtree). Add a monospace TTF, or render the URL in a brand font?
- **Title auto-shrink mechanism** — exact approach (size tiers by length/line-count vs measurement).
- **Title sourcing mechanism** — URL-segment title-casing + optional override; finalise when building coverage for non-collection pages.

---

## Phased Plan

Each phase is designed to end with something viewable, so progress can be checked on real pages as we go. Remember to **bump `CACHE_VERSION`** in `og-image-generator.ts` whenever a phase changes how covers look.

### Phase 1 — New design for article & note covers

The core visual win. Rebuild the `article` and `note` Satori templates to the new look, at 1200×630, using the site's brand fonts:

- Create the **static blobs + background** asset (a baked image or fixed SVG) sized for 1200×630.
- Lay out avatar circle (top-left), all-caps title (vertically centred, single fixed/max size for now), URL line, and `@handle` line with coral `@`.
- Wire the new templates through the existing endpoints and branding.

**End state:** every article and note serves the new-look cover (assuming a title that fits at max size). Viewable on real posts. Long-title handling and the note marker are still rough — that's fine.

### Phase 2 — Title fitting (auto-shrink + balance)

Make long titles behave:

- Enable balanced wrapping (`textWrap: 'balance'`).
- Add the auto-shrink: drop the font size for longer / multi-line titles using the simplest approach that looks acceptable. Keep vertical centring correct as size changes.

**End state:** posts with long titles look good, not terrible; short titles unchanged.

### Phase 3 — Note marker & URL polish

- Redesign the note indicator into something integrated and tasteful (replacing the old badge).
- Resolve the URL typeface question and add single-line URL shrink so long URLs always fit.

**End state:** notes are clearly and nicely distinguished from articles; URLs always fit cleanly.

### Phase 4 — Coverage for non-collection pages

- Add a shared way to generate covers for pages outside content collections (e.g. `/now`, `/about`).
- Implement title sourcing: title-case the last URL segment by default, with an optional per-page override prop.

**End state:** the chosen non-collection pages serve generated covers; others still fall back to the default.

### Phase 5 — Default fallback & ship

- Regenerate `public/og-default.png` in the new style.
- Final pass: confirm both themes look right, bump `CACHE_VERSION`, update docs (`docs/developer/deployment.md`, `src/utils/CLAUDE.md` if relevant), add a basic test for the generator, and delete the temporary reference images from `docs/tasks-todo/`.

**End state:** feature complete and shipped; the whole site has a consistent, characterful cover-image identity.

## Working Notes

- Temporary reference images in `docs/tasks-todo/` (all deleted when this ships):
  - `cover-example.png` — the target design (a real export from the video platform's generator).
  - `cover-example.svg` — the SVG source of that example.
  - `current-cover-example.png` — a current article cover, for comparison.
  - `current-default-cover.png` — the current static default cover.
- Save any new throwaway review images here too.
