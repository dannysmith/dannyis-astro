# Reduce npm dependency surface

## Goal

Shrink the production dependency tree to reduce supply-chain attack surface and long-term maintenance load. This is a static site built via GitHub Actions, so most current `dependencies` are actually build-time only.

Reference: GitHub issue [#113](https://github.com/dannysmith/dannyis-astro/issues/113). This document supersedes that issue (it captures verification and decisions made after the issue was filed).

## Scope

Dependency cleanup **only**. The Astro 6.4 upgrade and broader dep version bumps are a separate follow-up task (`task-x-astro-6-4-upgrade.md`, to be written when this lands).

## Verification done

- `grep` across `src/`, `scripts/`, `tests/`, `astro.config.mjs`, `knip.config.ts`, `vitest.config.ts` for every dep listed below.
- Confirmed `@astrojs/compiler-rs` is still experimental in Astro 6.4 and has not been promoted out of `experimental.rustCompiler`. The previous attempt to enable it (logged in `task-2026-03-12-astro-6-upgrade.md`) failed on `Embed.astro`'s inline `<script>`; nothing has changed. The Astro 6.2 release notes also confirm that in **Astro 7** the Rust compiler becomes the default and the `experimental.rustCompiler` flag is deprecated — i.e. when 7 lands, the compiler will be bundled with `astro` itself, so a separate `@astrojs/compiler-rs` dep is even less likely to be useful long-term.
- Confirmed `rehype-mermaid` uses Playwright (optional peer), not Puppeteer.
- Confirmed `@playwright/test` and `playwright` are already devDeps.

## How this is split

The work is in **two PRs**. PR 1 is pure cleanup — deletions, renames, and a small readline swap. PR 2 replaces `unfurl.js` with new in-repo code that runs at build time and needs more careful verification. Keeping them separate means one risky change isn't hiding inside a wall of trivial diffs.

Run `bun run check:all` and `bun run build` after each phase. Commit per phase to keep the diff bisectable.

---

## PR 1 — Cleanup, browser swap, and CLI prompt swap

### Phase 1 — Pure removals (zero behaviour change)

1. **Remove `@vercel/og`.**
   - Delete from `package.json`.
   - Remove the `@vercel/og` line from `ignoreDependencies` in `knip.config.ts`.
   - Update `docs/developer/content-system.md` so the OG-image section lists `satori` + `@resvg/resvg-js` + `sharp` (the actual stack used by `src/utils/og-image-generator.ts`) instead of `@vercel/og`.

2. **Remove `@astrojs/compiler-rs`.**
   - Delete from `package.json`. No code references; no `astro.config.mjs` flag enables it.

3. **Remove `zod` from `devDependencies`.**
   - Change `tests/unit/schemas.test.ts` first line of imports from `import { z } from 'zod'` to `import { z } from 'astro/zod'`.
   - Delete `zod` from `package.json`. `src/content.config.ts` already uses `astro/zod`.

4. **Remove `happy-dom`.**
   - **First verify** no test actually uses DOM APIs:
     ```bash
     grep -rnE 'document\.|window\.|HTMLElement|globalThis\.|navigator\.' tests/
     ```
     If anything turns up, do not remove `happy-dom` — re-scope this step.
   - Remove the `environment: 'happy-dom'` line from `vitest.config.ts` (default is `node`).
   - Delete `happy-dom` from `package.json`.

5. **Move `@types/react` and `@types/react-dom` to `devDependencies`.**
   - Type-only packages; stripped at build time. They stay installed for local typechecking and the React island used by `DatePickerDemo`.

### Phase 2 — Move `puppeteer` to a Playwright-based dev script

`puppeteer` is the single largest prod dep (Chromium download + deep tree) and is only used by `scripts/get-toolbox-json.ts` (a manual scraper for `betterat.work/tool`). The target page is a Notion-rendered SPA, so a real browser is required — `fetch` + cheerio won't work.

**Gotcha:** Puppeteer downloads Chromium at `npm install` time; Playwright does not. Browsers come from a separate `bunx playwright install chromium` step. Locally this is fine — Playwright browsers are already installed for e2e tests. CI doesn't run this script (`toolboxPages.json` is checked in). But anyone else running `bun run scrape-toolbox` for the first time will need to run `playwright install` first. Add a one-line header comment in `scripts/get-toolbox-json.ts` documenting this.

1. Rewrite `scripts/get-toolbox-json.ts` to use `playwright` (`import { chromium } from 'playwright'`). Direct API translation:
   - `puppeteer.launch({ headless: true, args: [...] })` → `chromium.launch({ headless: true })` (most of the puppeteer arg list is no longer needed under Playwright).
   - `page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })` → `page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })`.
   - `page.waitForSelector('.notion-collection-card__anchor', { visible: true, timeout: 20000 })` → `page.waitForSelector('.notion-collection-card__anchor', { state: 'visible', timeout: 20000 })`.
   - `page.waitForFunction(...)` and `page.evaluate(...)` translate 1:1.
2. Delete `puppeteer` from `package.json` (it moves into the Playwright surface already in devDeps).
3. Test by running `bun run scrape-toolbox` and confirming `src/content/toolboxPages.json` regenerates correctly.

### Phase 3 — Replace `inquirer` with `node:readline/promises`

`scripts/create-note.ts` uses `inquirer` for a single text prompt with non-empty validation. Replace with built-in:

```ts
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const rl = createInterface({ input: stdin, output: stdout });
try {
  let title = '';
  while (!title.trim()) {
    title = await rl.question('What is the title of your note? ');
    if (!title.trim()) console.log('Title cannot be empty');
  }
  // ...
} finally {
  rl.close();
}
```

Delete `inquirer` from `package.json`.

### Phase 4 — Verify and tidy (PR 1)

1. `bun run check:all` clean.
2. `bun run build` clean.
3. `bun run check:knip` — confirm no new warnings, no stale `ignoreDependencies` entries (`@vercel/og` line must be gone).
4. Diff `bun.lock`. The top-level removals from this PR (`@vercel/og`, `@astrojs/compiler-rs`, `puppeteer`, `inquirer`, `happy-dom`, `zod`) should all be gone. Their transitive subtrees (`chromium-bidi`, `puppeteer-core`, etc.) will mostly disappear, but a few may stick around if other kept packages depend on them — that's fine.

---

## PR 2 — Replace `unfurl.js` with a small in-repo helper

`unfurl.js` is used in two places, both for very narrow purposes:

- `src/components/mdx/Notion.astro` — needs page `<title>` and the favicon URL (used either as image-src or as a string the existing code mines for an emoji codepoint).
- `scripts/create-note.ts` — needs the `og:title` (with fallback to `<title>`) from an arbitrary URL.

Build a single utility instead of pulling in `unfurl.js` (which transitively brings `node-fetch`, `htmlparser2`, `iconv-lite`, `he`, `debug`).

### Phase 1 — Critical pre-implementation check: Notion bot detection

`unfurl.js` sends a recognisable UA (something like `facebookexternalhit/1.1`). Notion may return different or stripped HTML to a default Node `fetch` UA, in which case our replacement will silently fall back to `"Notion Page"` and lose favicons. **Before writing any code**, run something like:

```bash
curl -sA "Mozilla/5.0 (compatible; danny.is-link-preview/1.0)" \
  https://www.notion.so/<a-real-public-notion-page-url> \
  | grep -iE '<title>|rel="(shortcut )?icon"'
```

Try the default `fetch` UA too (no `-A` flag). Pick a UA that reliably returns both a `<title>` and an `<link rel="icon">` from at least three different public Notion pages currently embedded in the site (find them with `grep -rn '<Notion' src/content/`). Lock in that UA as a constant in `url-meta.ts`. If no UA works reliably, stop and reconsider — `unfurl.js` may be doing something we can't easily replicate, and keeping the dep might be the right call.

### Phase 2 — Build the helper

Add `src/utils/url-meta.ts` with one async function:

```ts
export interface UrlMeta {
  title?: string;
  ogTitle?: string;
  favicon?: string;
}

export async function fetchUrlMeta(url: string, signal?: AbortSignal): Promise<UrlMeta> {
  // fetch with the UA locked in during Phase 1, AbortController timeout (~8s default),
  // bail on non-2xx, read response.text() with a max byte cap (~512KB).
  // Parse with regexes:
  //   <title>([^<]*)</title>          → title (decode HTML entities)
  //   <meta property="og:title" content="(...)">  → ogTitle
  //   <link rel="(shortcut )?icon" ... href="(...)">  → favicon (resolve relative URLs against the page URL)
  // Be tolerant of single/double quotes and attribute ordering.
}
```

Notes:
- Decode the small set of HTML entities that matter for titles (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, numeric `&#NNN;` and `&#xHH;`).
- For favicon: return the raw href string. `Notion.astro` already does its own checks (`includes('amazonaws.com')`, `decodeURIComponent` + emoji regex), so the helper should not try to be clever.
- **Do not** invent any features `unfurl.js` doesn't already provide here.

### Phase 3 — Wire up the call sites

1. Update `src/components/mdx/Notion.astro`:
   - Replace `const result = await unfurl(href)` with `const meta = await fetchUrlMeta(href)`.
   - `result.title` → `meta.title`.
   - `result.favicon` → `meta.favicon`.
   - **Do not** require a manual `title=` prop on Notion embeds — auto-fetch behaviour must remain identical.
   - Keep the existing `try/catch` and the `manualTitle` override (it's still useful as an escape hatch).
   - On fetch failure, the helper should throw (or return all-undefined) so the existing `catch` branch in `Notion.astro` triggers the same `"Notion Page"` fallback as before — error semantics must match.

2. Update `scripts/create-note.ts`:
   - Replace `result.open_graph?.title || result.title` with `meta.ogTitle || meta.title`.

3. Delete `unfurl.js` from `package.json`.

### Phase 4 — Verify and tidy (PR 2)

1. `bun run check:all` clean.
2. `bun run build` clean. Inspect built HTML for any visible regressions on Notion-embed pages.
3. Manual verification:
   - Inspect at least three pages that use `<Notion>` MDX components — check the title and icon render the same as before. Compare against `main` (a screenshot diff is enough).
   - Watch the build output for any warnings logged from `Notion.astro`'s `catch` branch — silent failures here are the main regression risk, so consider temporarily upgrading the `console.warn` to also log the URL or rendering a visible debug marker during the verification PR.
   - Run `bun run newnote https://example.com/some-article-with-og-tags` and confirm the title is auto-populated.
4. Diff `bun.lock` — `unfurl.js` should be gone along with its transitive subtree (`node-fetch`, `htmlparser2`, `iconv-lite`, `he`, `debug`), though some of those may stick around if other kept packages depend on them.

## Out of scope

- **React + `@dannysmith/datepicker` + `@astrojs/react`** — keep as-is. The infrastructure may be used by future demos and components. Revisit if a year passes with no second React island.
- **`mermaid` + `rehype-mermaid`** — keep. Rarely used but the option to drop a Mermaid block into an article is worth the install cost.
- **`sharp`, `marked`, `reading-time`, `mdast-util-to-string`, `rehype-autolink-headings`, `rehype-external-links`, `astro-embed`** — keep, as per issue #113.

## Follow-up

The Astro 6.4 upgrade and remaining dependency bumps are tracked separately in [`task-2-astro-6-4-upgrade.md`](./task-2-astro-6-4-upgrade.md). Do not start that task until this one is shipped.
