# Lighthouse Audits

Site-wide Lighthouse audits powered by [Unlighthouse](https://unlighthouse.dev/guide/).

Unlighthouse wraps Google's Lighthouse engine and crawls the whole site (sitemap + internal links), scoring every page in one run. It is **not a project dependency** — it runs on demand via `bunx`, so nothing lands in `package.json` or `bun.lock`.

Run it against a **local preview build** (default, recommended) or the **live production site**.

## Local build (recommended)

`astro preview` serves the exact `dist/` artifact — byte-identical to what Vercel ships for this static, zero-JS site. So scores are representative, the run is reproducible, and every page gets scanned without being blocked (see [Why not always audit production?](#why-not-always-audit-production)).

You need **two terminals**.

**Terminal 1 — build and serve:**

```bash
bun run build     # generates dist/
bun run preview   # serves dist/ at http://localhost:4321 (leave running)
```

**Terminal 2 — audit it:**

```bash
UNLIGHTHOUSE_SITE=http://localhost:4321 bunx unlighthouse
```

`UNLIGHTHOUSE_SITE` overrides the `site` field in [`unlighthouse.config.ts`](../../unlighthouse.config.ts). Stop the preview server when you're done.

> **Don't audit `astro dev`.** It serves unminified assets, injects the HMR client, and ships source maps — its performance scores are meaningless for production.

> **Caveat:** `astro preview` serves uncompressed, whereas production gets Vercel's Brotli/gzip. Real transfer sizes are *better* than local, so ignore any "enable text compression" finding — it's a preview artifact.

## Production

```bash
bunx unlighthouse
```

With no env override, the config targets `https://danny.is`. Useful for an occasional real-world check, but expect it to be **incomplete**: Vercel 403s many pages partway through (see below), so it sample-scans rather than covering the site.

## Output

Both modes open an interactive dashboard and write reports (JSON + HTML, one per page) to `.unlighthouse/`, which is gitignored.

> **Tip:** the JSON reports under `.unlighthouse/` feed well into a Claude Code session for turning into actionable improvements.

## Why not always audit production?

A multi-sample crawl fires many repeated requests from one IP over several minutes. Vercel's **automatic L7 DDoS mitigation** — on by default for every plan including Hobby, and not disableable — reads this as abnormal traffic and returns `403 Forbidden` partway through. Real visitors never trigger it, since they don't burst from a single IP.

On a Hobby plan there's no audit-side fix:

- The `x-vercel-protection-bypass` token doesn't bypass DDoS mitigation (only Deployment Protection / Bot Protection).
- A Firewall **System Bypass Rule** would, but it's **Pro-only**.

Hence: audit the local build. Lab scores don't affect SEO either way — Google ranks on field/CrUX data, not Lighthouse lab scores. Lab audits are for catching regressions and diagnosing _why_, which a local build does perfectly.

## Configuration

[`unlighthouse.config.ts`](../../unlighthouse.config.ts) pins the [improving-accuracy recipe](https://unlighthouse.dev/guide/recipes/improving-accuracy) settings: 5 samples per page, network throttling, single-concurrency scanning. Default device is **mobile** (Google's ranking basis).

Keep `scanner.throttle` on even for localhost — Unlighthouse disables throttling for local URLs by default, and the explicit setting keeps local numbers comparable to a throttled production run.

Useful CLI overrides:

| Flag                         | Effect                                            |
| ---------------------------- | ------------------------------------------------- |
| `--desktop`                  | Audit as desktop instead of mobile                |
| `--urls /,/articles,/notes`  | Scan only specific paths (disables the crawler)   |
| `--disable-dynamic-sampling` | Audit every page instead of sampling similar ones |

Full reference: <https://unlighthouse.dev/guide/>.
