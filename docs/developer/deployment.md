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

- **`.vercel/output/`** — created in CI, never committed. It's Vercel's [Build Output API](https://vercel.com/docs/build-output-api) layout: the Build job copies `dist/` into `.vercel/output/static/` and drops the config file beside it.
- **`vercel.output-config.json`** — committed; copied to `.vercel/output/config.json` at deploy time. It's a list of routing rules applied at the edge: long-lived cache-control headers for hashed assets and fonts, security headers on every response, a few redirects (e.g. `/cv.pdf`), the `/.well-known/*` rewrite (see [Serving `.well-known`](#serving-well-known)), and the filesystem handler plus 404 fallback.

These are the only Vercel-shaped things in the repo, and they only describe headers and routing — not build behaviour. Another host would express the same intent in its own config.

## Serving `.well-known`

Web- and agent-standard files (`security.txt`, the standard.site publication record, and more over time) belong at `/.well-known/…`. Two quirks shape how we get them there: **Vercel won't serve a dotfile directory** (anything under `dist/.well-known/` 404s), and **Astro won't reliably build routes placed in a dotfile directory** under `src/pages/`.

So we author everything under a non-dot `well-known/` instead — static files in `public/well-known/`, generated ones as routes in `src/pages/well-known/` — which builds to `dist/well-known/` and is served directly by Vercel. A `postbuild` step (in `package.json`) copies that tree to `dist/.well-known/` so the canonical path works on any other static host, and the single `/.well-known/* → /well-known/*` rewrite maps the canonical path onto the served one on Vercel.

The upshot: one place to add a well-known file — `well-known/`, static or generated — and it works both on Vercel and on a plain static host.

## Why builds are fast (caching)

OG image generation (Satori + Resvg) and image optimization (Sharp) dominate build time. Both are cached across CI runs so unchanged work is skipped:

- **`node_modules/.astro/`** — Astro's own cache. It content-addresses optimized images, so unchanged source images aren't re-processed by Sharp.
- **`node_modules/.astro/og-cache/`** — our own OG image cache. Astro doesn't cache endpoint output, so `og-image-generator.ts` caches the rendered PNGs itself. It rides along inside Astro's cache directory, so one `actions/cache` step persists both between runs.
- The **Vercel CLI** is also cached in the Deploy jobs so `npx` doesn't re-download it on every deploy.

**Correctness note:** the OG cache is keyed on each image's content. If you change the OG **template, branding, or fonts**, bump `CACHE_VERSION` in `src/utils/og-image-generator.ts` (also flagged in `src/utils/CLAUDE.md`).

## What not to do

To preserve "deployable anywhere":

- ❌ Don't add runtime, serverless, or edge functions, or `@vercel/og`-style on-demand generation. Everything is generated at build time.
- ❌ Don't rely on Vercel Image Optimization or any host-specific image pipeline — images are optimized at build time by Sharp.
- ❌ Don't commit generated assets (OG images, optimized image derivatives). They're CI artifacts.
- ❌ Don't add host-specific config beyond the thin routing/header layer in `vercel.output-config.json`.
