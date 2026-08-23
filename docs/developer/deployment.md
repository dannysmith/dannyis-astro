# Deployment

This is a starting point for understanding how the site ships. It covers the mental model and the moving parts; for exact detail, follow the pointers into the code at the end.

## The core principle: build anywhere, deploy anywhere

The site is **statically generated**. `astro build` turns the content and components into a folder of plain HTML, CSS, JS, and images (`dist/`) with no server runtime required. That output is just files — any static host, CDN, or even a local web server can serve it.

We deploy to Vercel today, but **nothing about the build depends on Vercel**. This is a deliberate constraint, not an accident: the build uses no Vercel-specific features. If we ever change hosts, we point the new host at `dist/` and we're done. Keep it that way — see [What not to do](#what-not-to-do).

## The shape of the pipeline

Every push runs a single GitHub Actions workflow (`.github/workflows/deploy.yml`) with three logical stages:

1. **Check** — type-checks, linting, formatting, and the unit + e2e tests (`bun run check:all`).
2. **Build** — runs `astro build`, packages the output for Vercel, and uploads it as a workflow artifact.
3. **Deploy** — downloads that artifact and ships it to Vercel.

Check and Build run **in parallel** — neither depends on the other. Deploy waits for **both** to pass. A broken test and a broken build each block the deploy on their own, but neither holds up the other.

## How the GitHub Action works

**Triggers.** A push to `main` deploys to production (`danny.is`). A pull request labelled `preview` deploys to a throwaway preview URL and comments the link on the PR.

**Checks gate the deploy even on `main`.** Most commits land directly on `main` rather than via PR, so the Check stage is the only safety net. It must pass before anything ships — that's why Deploy depends on it and not just on Build.

**A separate workflow runs after a successful production deploy.** `.github/workflows/standard-site-sync.yml` mirrors new/changed posts to the AT Protocol network; it triggers on this workflow completing and does not affect the deploy itself. See [standard-site.md](./standard-site.md).

**Build → artifact → deploy.** The Build job never deploys directly. It produces `dist/`, rearranges it into the layout Vercel expects under `.vercel/output/`, and uploads that as an artifact. The Deploy jobs download the artifact and run `vercel deploy --prebuilt`, which tells Vercel "this is already built — just host it." Vercel does no building of its own. This split is what keeps deploys fast and host-agnostic: the artifact is the same portable static output, and the deploy step is a thin shipping wrapper around it.

## What gets configured for Vercel

Two pieces translate the static output into a working site:

- **`.vercel/output/`** — created in CI, never committed. It's Vercel's [Build Output API](https://vercel.com/docs/build-output-api) layout: the Build job copies `dist/` into `.vercel/output/static/` and writes `.vercel/output/config.json` beside it.
- **`vercel.output-config.json`** — committed; the **base** routing config. At deploy time `scripts/build-vercel-config.mjs` reads it, injects the generated redirects (see [Redirects](#redirects)), and writes the final `.vercel/output/config.json`. The base covers: long-lived cache-control headers for hashed assets and fonts, security and `Link` headers on every response, content-negotiation rewrites (serve the `.md` when an agent sends `Accept: text/markdown`), the `/.well-known/*` rewrite (see [Serving `.well-known`](#serving-well-known)), and the filesystem handler plus 404 fallback.

These are the only Vercel-shaped things in the repo — the base config, the script that finalises it, and the routing they describe. They configure headers and routing, not build behaviour; another host would express the same intent in its own config.

## Search index (Pagefind)

Full-text search is [Pagefind](https://pagefind.app): a static index generated **at build time** and served entirely client-side — no runtime, no serverless, consistent with "deploy anywhere". An inline integration (`src/lib/pagefind-integration.mjs`) runs Pagefind's Node indexer in the `astro:build:done` hook, writing `dist/pagefind/`. Because it rides `astro build`, the index lands in `dist/` before the Build job copies it into `.vercel/output/static/` — it ships like any other static asset, with no Vercel-specific handling. `dist/` is gitignored, so the index is never committed.

Two consequences for the pipeline:

- **Dev has no index unless you've built.** `astro dev` doesn't build, so the same integration's `astro:server:setup` hook serves a _previously built_ `dist/pagefind/`; with no prior build, search degrades to "unavailable" (nothing breaks). Run `bun run build` once, or use `bun run preview`, to search locally.
- **The Check stage has no index.** Check runs in parallel with Build (see [The shape of the pipeline](#the-shape-of-the-pipeline)), so `dist/pagefind/` doesn't exist there — e2e tests must not depend on it.

See [command-palette-and-search.md](./command-palette-and-search.md) for the why behind the whole setup.

## Link preview images

`BookmarkCard` fetches the pages it links to at build time and copies their preview images onto our own domain. A second inline integration (`src/lib/link-preview-images-integration.mjs`) mirrors Pagefind's two-hook shape: `astro:build:done` copies the cached derivatives into `dist/link-previews/`, `astro:server:setup` serves them from the cache in dev.

Two consequences for the pipeline:

- **A cold cache makes the build reach every linked host.** Nothing external can fail it — a link that 404s, blocks us or times out is reported, not thrown — but the build is slower and its output depends on who was up. The cache (below) is what keeps that rare.
- **Every build prints a link-health summary**, which is how link rot in published content gets noticed. Two entries are permanent and deliberate: `/styleguide` renders a dead and a blocked example.

See [link-metadata.md](./link-metadata.md).

## Serving `.well-known`

Web- and agent-standard files (`security.txt`, the standard.site publication record, and more over time) belong at `/.well-known/…`. Two quirks shape how we get them there: **Vercel won't serve a dotfile directory** (anything under `dist/.well-known/` 404s), and **Astro won't reliably build routes placed in a dotfile directory** under `src/pages/`.

So we author everything under a non-dot `well-known/` instead — static files in `public/well-known/`, generated ones as routes in `src/pages/well-known/` — which builds to `dist/well-known/` and is served directly by Vercel. A `postbuild` step (in `package.json`) copies that tree to `dist/.well-known/` so the canonical path works on any other static host, and the single `/.well-known/* → /well-known/*` rewrite maps the canonical path onto the served one on Vercel.

The upshot: one place to add a well-known file — `well-known/`, static or generated — and it works both on Vercel and on a plain static host.

## Redirects

Two kinds exist: short links (`/meeting`, `/cv`, … in `src/config/redirects.ts`) and cross-posted articles that live elsewhere (old Medium posts, via a `redirectURL` in frontmatter). Both render as **meta-refresh** pages in the static build — the portable fallback that works on any host.

On Vercel we upgrade them to real HTTP redirects. The build emits a host-agnostic manifest at **`dist/redirects.json`** (`src/pages/redirects.json.ts`) that unions both sources. Because it's generated from `getCollection`, each article source uses the same `id` the `/writing` route uses, so it matches the real URL even when an article has a custom slug. At deploy, `scripts/build-vercel-config.mjs` turns each entry into a `302` route, injected ahead of the content-negotiation and filesystem routes.

Keeping the manifest deploy-target-neutral means another host could read `dist/redirects.json` and set up the same redirects. And because the routes are generated, `vercel.output-config.json` never carries the per-article list — `redirects.ts` and frontmatter stay the single source of truth.

## Why builds are fast (caching)

OG image generation (Satori + Resvg) and image optimization (Sharp) dominate build time. Both are cached across CI runs so unchanged work is skipped:

- **`node_modules/.astro/`** — Astro's own cache. It content-addresses optimized images, so unchanged source images aren't re-processed by Sharp.
- **`node_modules/.astro/og-cache/`** — our own OG image cache. Astro doesn't cache endpoint output, so `og-image-generator.ts` caches the rendered PNGs itself. It rides along inside Astro's cache directory, so one `actions/cache` step persists both between runs.
- **`node_modules/.astro/link-cache/`** — captured `<head>`s from the pages `BookmarkCard` links to, plus their preview images (in `images/`). Rides along in the same cache step. This one is about more than speed: it's what stops a build depending on other people's servers being up, and what lets a link that has since died keep the metadata it had when it worked.
- The **Vercel CLI** is also cached in the Deploy jobs so `npx` doesn't re-download it on every deploy.

**Correctness note:** the OG cache is keyed on each image's content. If you change the OG **template, branding, or fonts**, bump `CACHE_VERSION` in `src/utils/og-image-generator.ts` (also flagged in `src/utils/CLAUDE.md`).

**The link cache is the other way round.** It stores the raw captured `<head>`, not the fields parsed out of it, so changing `linkPreview/parse.ts` needs **no** version bump. Its two keys are for stored shape only (also flagged in `src/utils/CLAUDE.md`).

## What not to do

To preserve "deployable anywhere":

- ❌ Don't add runtime, serverless, or edge functions, or `@vercel/og`-style on-demand generation. Everything is generated at build time.
- ❌ Don't rely on Vercel Image Optimization or any host-specific image pipeline — images are optimized at build time by Sharp.
- ❌ Don't commit generated assets (OG images, optimized image derivatives). They're CI artifacts.
- ❌ Don't add host-specific config beyond the thin routing/header layer in `vercel.output-config.json`.
