# Lighthouse Audits

Site-wide Lighthouse audits of the **production** site, powered by [Unlighthouse](https://unlighthouse.dev/guide/).

Unlighthouse wraps the official Google Lighthouse engine and crawls the whole site (sitemap + internal links), scoring every page in one run. It is **not a project dependency** — it runs on demand via `bunx`, so nothing is added to `package.json` or `bun.lock`.

## Running an audit

```bash
bunx unlighthouse
```

That's it. The target site and accuracy settings come from [`unlighthouse.config.ts`](../../unlighthouse.config.ts) at the repo root. It scans the live production site (`https://danny.is`), not your local dev server. This opens an interactive dashboard and writes reports (JSON + HTML, one per page) to `.unlighthouse/`, which is gitignored.

> **Tip:** the JSON reports under `.unlighthouse/` are well suited for feeding into a Claude Code session to turn into actionable improvements.

## Configuration

[`unlighthouse.config.ts`](../../unlighthouse.config.ts) pins the accuracy settings recommended by the [improving-accuracy recipe](https://unlighthouse.dev/guide/recipes/improving-accuracy): 5 samples per page, network throttling, and single-concurrency scanning so timing metrics stay stable between runs. The default device is **mobile** (Google's ranking basis).

Useful overrides via CLI flag:

| Flag                         | Effect                                            |
| ---------------------------- | ------------------------------------------------- |
| `--desktop`                  | Audit as desktop instead of mobile                |
| `--urls /,/articles,/notes`  | Scan only specific paths (disables the crawler)   |
| `--disable-dynamic-sampling` | Audit every page instead of sampling similar ones |

Full flag and config reference: <https://unlighthouse.dev/guide/>.
