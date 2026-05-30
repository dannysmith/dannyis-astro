# Lighthouse Audits

Site-wide Lighthouse audits powered by [Unlighthouse](https://unlighthouse.dev/guide/).

Unlighthouse wraps Google's Lighthouse engine and scores every page on the site in one run. It is **not a project dependency** — it runs on demand via `bunx`, so nothing lands in `package.json` or `bun.lock`.

Audits run against a **local production build**, not the live site (see [Why local, not production?](#why-local-not-production)).

## Running an audit

You need **two terminals**.

**Terminal 1 — build and serve:**

```bash
bun run audit:serve
```

This builds the site with a localhost URL (`astro build --site http://localhost:4321`) and serves it at `http://localhost:4321`. Leave it running.

**Terminal 2 — run the audit:**

```bash
bun run audit
```

This points Unlighthouse at the local server, opens an interactive dashboard, and writes reports to `.unlighthouse/`. Stop the preview server when you're done.

> **Why the localhost build?** `astro build` normally bakes the production `https://danny.is` URLs into the sitemap. Unlighthouse discovers pages from the sitemap but **ignores any sitemap whose URLs are a different origin** than the target — so a normal build's sitemap is useless against localhost, and the crawler finds nothing. Building with `--site http://localhost:4321` makes the sitemap list localhost URLs, so all routes are enumerated. This is why `audit:serve` rebuilds rather than reusing `bun run build`.

> **Don't audit `astro dev`.** The dev server serves unminified assets, injects the HMR client, and ships source maps — its performance scores are meaningless for production.

> **Caveat:** `astro preview` serves uncompressed, whereas production gets Vercel's Brotli/gzip. Real transfer sizes are *better* than local, so ignore any "enable text compression" finding — it's a preview artifact.

## Output

The audit opens an interactive dashboard and writes reports (JSON + HTML, one per page) to `.unlighthouse/`, which is gitignored.

> **Tip:** the JSON reports under `.unlighthouse/` feed well into a Claude Code session for turning into actionable improvements.

## Why local, not production?

Auditing the live site doesn't work reliably. A multi-sample crawl fires many repeated requests from one IP over several minutes, and Vercel's **automatic L7 DDoS mitigation** reads this as abnormal traffic and returns `403 Forbidden` partway through — so the run skips most pages. Real visitors never trigger it, since they don't burst from a single IP.

The controls that would fix this — pausing system mitigations, or a firewall bypass rule for the auditor's IP — are **Vercel Pro/Enterprise features**, not available on the Hobby plan this site runs on. (Note: this is a limit of *Vercel's hosting plans*, not of Unlighthouse, which is free and open-source.)

Auditing the local build sidesteps all of this, and costs nothing in representativeness: `astro preview` serves the byte-identical `dist/` artifact for this static, zero-JS site, and Lighthouse lab scores don't affect SEO anyway — Google ranks on field/CrUX data. Lab audits are for catching regressions and diagnosing _why_, which a local build does perfectly.

## Configuration

[`unlighthouse.config.ts`](../../unlighthouse.config.ts) pins the [improving-accuracy recipe](https://unlighthouse.dev/guide/recipes/improving-accuracy) settings — 5 samples per page, network throttling, single-concurrency scanning — plus `dynamicSampling: false` so every route is scanned rather than a representative sample. Default device is **mobile** (Google's ranking basis).

`scanner.throttle` stays on even for localhost: Unlighthouse disables throttling for local URLs by default, and the explicit setting keeps local numbers comparable to a throttled production run.

Useful CLI overrides (append to `bun run audit -- <flag>`):

| Flag                        | Effect                                          |
| --------------------------- | ----------------------------------------------- |
| `--desktop`                 | Audit as desktop instead of mobile              |
| `--urls /,/articles,/notes` | Scan only specific paths (disables the crawler) |

Full reference: <https://unlighthouse.dev/guide/>.
