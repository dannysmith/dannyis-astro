# Publish articles & notes to the ATmosphere (standard.site / AT Protocol)

## Goal

When an article or note is published on danny.is, also publish it as a `site.standard.document` record into my **existing Bluesky PDS** (the `danny.is` account), using the community [standard.site](https://standard.site/) lexicons. This puts my writing on the AT network so any AT-aware reader can index it, and so Bluesky renders enhanced link cards (publication icon, reading time, theme) when my URLs are shared.

Two things make this low-risk and a good fit for a static site:

- **No self-hosted PDS.** Custom-lexicon records can be written into the Bluesky-hosted PDS (`bsky.social`) with a normal account + an app password — `com.atproto.repo.createRecord`/`putRecord` validate only *known* lexicons by default, so unknown collections like `site.standard.document` are simply stored.
- **Edits need no stored state.** Each post maps to a record at a **deterministic record key (rkey)** computed purely from `(collection, postId, pubDate)`. Editing a post recomputes the *same* rkey, and `putRecord` is create-or-replace, so a re-sync overwrites in place. The AT-URI stays stable (so the page's verification `<link>` tag keeps pointing at the same record). No rkey↔post mapping, no commit-back loop, no database — the site stays fully static.

This is a faithful adaptation of Ben Balter's implementation:
- Commit: <https://github.com/benbalter/benbalter.github.com/commit/69703cee964ad27e79e58dce455bcd79fa4b8bed>
- Lexicon docs: <https://standard.site/docs/> · document lexicon: <https://standard.site/docs/lexicons/document/>

His site, like mine, is a statically-generated Astro site deployed from a GitHub Action, so the model ports directly. The differences (two content collections, `pubDate` in frontmatter rather than the filename, bun, Vercel, a shared `BaseHead`) are handled below.

## How it works (architecture)

1. **`src/utils/standard-site.ts`** — pure, testable helpers shared by the build *and* the sync script (single source of truth). Derives the deterministic TID rkey, the canonical path, the AT-URI, and the "does this post qualify?" predicate.
2. **`<link>` verification tags** — qualifying article/note pages emit `<link rel="site.standard.document" href="at://…">` in `<head>`; the homepage emits `<link rel="site.standard.publication" href="at://…">`. Because the rkey is deterministic, the tag is correct at build time even before the record exists (it self-heals once the sync runs).
3. **`/.well-known/site.standard.publication`** — serves the publication record's AT-URI as plain text; the other half of domain verification.
4. **`scripts/standard-site/*`** — `auth.ts` (app-password login), `create-publication.ts` (one-time publication record), `sync-document.ts` (upsert/delete `site.standard.document` records). Runnable locally and from CI.
5. **`.github/workflows/standard-site-sync.yml`** — runs after a successful production deploy, detects added/modified posts in the deploy's commit range, and upserts their records.

## Decisions

- **Scope:** articles **and** notes. Both map cleanly to `site.standard.document`.
- **Qualification = the site's existing "is this published?" rule.** Reuse the semantics of `filterContentForListing` (`src/utils/content.ts`): exclude `draft`, exclude `styleguide`. Centralised in one predicate (`qualifiesForStandardSite`) used by both the build and the sync script — no parallel reimplementation. **No future-date embargo:** the site does not embargo future-dated posts anywhere today (`filterContentForListing` filters only `draft`/`styleguide`), and a date embargo would break the deterministic/no-state model. If I ever want one, add it to the shared filter site-wide first, as a separate task, and let this inherit it.
- **Backfill:** yes. `since` is set before the first post (first article is 2012-06-05) so the whole corpus qualifies; run a one-time `--all` backfill.
- **Auto-sync on edit:** the CI workflow detects added **and modified** posts (`--diff-filter=AM`), so edits propagate automatically (this is why the rkey is deterministic).
- **Lexicon:** `standard.site` (`site.standard.publication` + `site.standard.document`).
- **Records live in my personal `danny.is` repo** (the same account I post from), exactly as Ben uses `ben.balter.com`.
- **`textContent` is public.** Each record carries a plaintext approximation of the post body — already-public content, noted consciously.
- **Record enrichment (beyond the minimum):** populate the optional lexicon fields we have good data for —
  - Document `updatedAt` ← `updatedDate` frontmatter (articles only; notes have none).
  - Document `coverImage` ← the post's **generated OG image** (`/writing/<id>/og-image.png` or `/notes/<id>/og-image.png`), fetched over HTTP after deploy and uploaded as a blob. Chosen over the article `cover` because it always exists (notes included) and needs no asset processing. Note this blob is for *other* AT readers' thumbnails (e.g. docs.surf); Bluesky's own card still uses the page `og:image` meta tag.
  - Publication `icon` ← `public/avatar-circle.png` (705 KB, under the 1 MB cap) — this is the icon Bluesky shows in enhanced link cards.
  - Publication `basicTheme` ← the brand palette as RGB integer objects.
  - **Deferred:** `bskyPostRef` (link a post to a Bluesky thread for comments) — a future phase once we decide how a post maps to a thread. Skip `content`/`links`/`labels`/`contributors`.
- **Dependencies (dev-only, never shipped to the browser):** `@atproto/api` (the SDK) and `gray-matter` (frontmatter parsing in the `tsx` sync script — not currently installed, even transitively; tiny and ubiquitous).

## Gotchas verified in the codebase (get these right)

These are real things checked against the repo that would otherwise bite during implementation:

1. **Deterministic timestamps come from `pubDate`'s UTC calendar date.** The rkey's timestamp bits derive from `Date.UTC(pubDate.getUTCFullYear(), getUTCMonth(), getUTCDate())`. `pubDate` is the only date source available identically on both sides (the build has `post.data.pubDate`; the sync reads frontmatter — neither reliably has the filename's date). All pubDates are date-only (verified — no time components), so collapsing to the UTC calendar date is timezone-independent: a **local backfill (London)** and a **UTC CI run** produce the same key. (We do *not* key off the post id's date prefix — see #7: ids are `slug ?? filename`, and ~half have a slug with no date prefix.)
2. **`--all` file-matching must allow date-only filenames.** One note is `2026-04-12.mdx` (date, no slug). Ben's enumeration regex `\d{4}-\d{2}-\d{2}-.+\.mdx?$` requires a trailing `-slug` and would silently skip such files. Use `/(^|\/)\d{4}-\d{2}-\d{2}(-.+)?\.mdx?$/`.
3. **Styleguide pages must not sync.** `article-styleguide.mdx` and `note-styleguide.mdx` carry `styleguide: true` (confirmed) and have no date prefix. They're excluded two ways: `qualifiesForStandardSite` rejects `styleguide: true` on the build side, and the date-prefix regex in `--all` skips them on the sync side. (Styleguide pages *do* render individually, so the build-side predicate check is what stops a link tag being emitted on those pages.)
4. **Config placeholders must be typed as `string`, not `as const` literals.** `CONFIG` in `src/config/site.ts` is `as const`, so a literal `did: ''` narrows to type `""` — which makes `if (!did) return null` mark the rest of the function unreachable and breaks `astro check`/`tsc`. Write the empty placeholders as `did: '' as string` and `publicationUri: '' as string` so reads are `string` and the guards type-check.
5. **`.well-known` must use the security.txt pattern (Vercel won't serve dotfile dirs).** Astro *builds* `dist/.well-known/…` fine, but Vercel does **not** serve a dotfile-directory route in this prebuilt setup — which is exactly why `/.well-known/security.txt` is shipped as a root `public/security.txt` plus a rewrite. So the publication endpoint lives at a normal path, `src/pages/standard-site-publication.ts` (emits `dist/standard-site-publication`, confirmed by build test), and `vercel.output-config.json` rewrites `^/\.well-known/site\.standard\.publication$` → `/standard-site-publication` (right after the security.txt rewrite, before `handle: filesystem`). The canonical URL indexers use is still `/.well-known/site.standard.publication`.
6. **CI needs Node for `tsx`.** `tsx` runs under Node (its bin has a `#!/usr/bin/env node` shebang). The sync workflow must set up **both** `oven-sh/setup-bun` and `actions/setup-node@v4` (node 22), mirroring `deploy.yml` — otherwise `bun run standard-site:sync` (which shells out to `tsx`) can fail.
7. **The canonical `postId` is `slug ?? filename`, NOT always the filename.** Astro's glob loader uses the `slug` frontmatter field as the entry `id` when present (32/68 articles, 33/105 notes have one), else the filename stem — so e.g. `2013-01-21-what-is-good-design.md` routes to `/writing/what-is-good-design/`. The build side is already correct: layouts pass `Astro.params.slug` (= `post.id`) to `getDocumentUri`. **The Phase 3 sync script must compute the same id** — read the `slug` frontmatter and fall back to the filename stem — or build/sync will disagree on the rkey *and* the path. (`getDocumentPath` then produces the real URL automatically.)
8. **`coverImage`/`icon` are blobs, not URLs.** Upload bytes via `agent.com.atproto.repo.uploadBlob(...)` and attach the returned blob ref to the record. Both have a **1 MB cap** — `avatar-circle.png` is 705 KB (fine); for the OG image, check `Content-Length`/byte length at runtime and skip-with-warning if it exceeds the cap rather than failing the `putRecord`. The OG image is fetched from the **live deployed URL** (`${site.url}${getDocumentPath(...)}og-image.png`), which is safe because the sync runs after deploy and OG routes already exist for every post; the blob is re-uploaded on each sync (small images, infrequent — acceptable).
9. **Theme colours are RGB integer objects, not hex.** `site.standard.theme.basic` takes `background`/`foreground`/`accent`/`accentForeground`, each `{ $type: 'site.standard.theme.color#rgb', r, g, b }` (0–255). The brand tokens (`_foundation.css`) are OKLCH + `light-dark()`; pick the **light-mode** values and convert to sRGB. Approximate starting values (verify the exact conversion at implementation): background/beige `rgb(244, 240, 230)`, foreground/ink `rgb(52, 48, 45)`, accent/coral `rgb(242, 122, 95)`, accentForeground `rgb(255, 255, 255)`.

## What this does NOT do (possible later phases)

- No rich/markdown body on-network. `standard.site`'s `content` field is currently an open union with no canonical body format, so (like Ben) we publish plaintext `textContent` + `path`/`site` pointing readers back to the canonical HTML on danny.is.
- No pulling records back into the site, and no Bluesky-replies-as-comments (`bskyPostRef`). Both are possible follow-ups.

---

## Manual steps (Danny) — required, can't be automated

Do these at Phase 5 (the plan calls out exactly when).

1. **Create a Bluesky app password.** Bluesky → Settings → Privacy & Security → App Passwords → Add. Copy it (format `xxxx-xxxx-xxxx-xxxx`). **Never the main password.**
2. **Add the GitHub Actions secret.** Repo → Settings → Secrets and variables → Actions → New repository secret: `ATPROTO_APP_PASSWORD`.
3. **Resolve and record my DID.** Visit `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=danny.is` (returns the `did:plc:…`) or read it from the `create-publication` script's login output. Paste it into `CONFIG.standardSite.did` in `src/config/site.ts`.
4. **Create the publication record (once).** `ATPROTO_APP_PASSWORD=xxxx bun run standard-site:publication` → paste the printed AT-URI into `CONFIG.standardSite.publicationUri`; commit.
5. **Backfill (once).** Dry-run first: `ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all --dry-run`. Then for real: `ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all`.
6. **Verify on the network.** Browse my repo on <https://pdsls.dev/> (search `danny.is`) and confirm the publication + document records exist; check `https://danny.is/.well-known/site.standard.publication` returns the AT-URI; view-source a post and confirm the `site.standard.document` link tag.

---

## Implementation plan

Run `bun run check:all` after each phase. Commit per phase. Phases 1–4 write **no records to any PDS** — nothing touches the live network until the Phase 5 manual steps.

### Phase 1 — Core util + tests (pure, no network)

**New: `src/utils/standard-site.ts`** — ported from Ben's `src/utils/standard-site.ts`, adapted for two collections:

- `s32encode(n)` and FNV-1a `hashString(input)` — copied verbatim (base32-sortable encoding + stable 32-bit hash).
- `getDocumentRkey(collection, postId, pubDate)` — builds a valid 13-char base32-sortable TID: 11-char timestamp prefix from `pubDate`'s UTC calendar date (microseconds since epoch via `Date.UTC`; see gotcha #1) + 2-char clock id from `hashString(`${collection}/${postId}`)`. **Deviation from Ben:** timestamp from `pubDate` not the filename (our ids are `slug ?? filename`), and the hash input is namespaced with the collection so an article and a note sharing a slug *and* date can't collide.
- `getDocumentPath(collection, postId)` — `/writing/${postId}/` for `articles`, `/notes/${postId}/` for `notes`. The single definition of the canonical path for standard.site (mirrors the inline patterns in the route/index files).
- `qualifiesForStandardSite({ draft, styleguide, pubDate })` — `true` when not a draft, not a styleguide page, and (`since` configured and `pubDate >= since`). **Note:** unlike `filterContentForListing` (which drops drafts only in PROD), this always drops drafts — we never push a draft to the network, even from a local dry-run.
- `getDocumentUri(collection, postId, { draft, styleguide, pubDate })` — `at://${did}/site.standard.document/${rkey}` or `null` when the post doesn't qualify or no `did` is configured.

Config access: `import { getConfig } from '@config/config'`; read `getConfig().standardSite`.

**New: `src/utils/standard-site.test.ts`** — port Ben's and extend:
- `getDocumentRkey` is deterministic and timezone-independent.
- rkey is a valid TID: matches `/^[234567abcdefghij][2-7a-z]{12}$/` (13 chars, sortable charset, top-bit-zero leading char).
- rkeys are time-sortable (later date → lexicographically greater rkey).
- same date / different `postId` → different rkey; same `postId` / different collection → different rkey.
- `qualifiesForStandardSite` honours draft/styleguide/`since`.
- `getDocumentPath` returns the right prefix per collection.

**Config block** — add to `CONFIG` in `src/config/site.ts` (sibling of `site`, `author`); it flows through `getConfig()` automatically (config.ts spreads `...CONFIG`). **Note the `as string` placeholders** (gotcha #4):

```ts
  // standard.site (AT Protocol) publishing — see docs for setup.
  standardSite: {
    // AT Protocol DID for danny.is. Filled in during setup (manual step 3).
    did: '' as string,
    // Bluesky handle that owns the records / used to log in.
    handle: 'danny.is',
    // AT-URI of the site.standard.publication record. Empty until created via
    // scripts/standard-site/create-publication.ts. When empty: /.well-known 404s
    // (best-effort on static hosting) and the homepage publication link tag is omitted.
    publicationUri: '' as string,
    // Only posts on/after this cutoff get a record + link tag. Set before the
    // first post (2012-06-05) so the whole backfilled corpus qualifies.
    since: '2000-01-01',
  },
```

**Verify:** `bun run test:unit`, `bun run check:types`.

### Phase 2 — Render verification tags + well-known endpoint (visible in build, still no PDS writes)

**`src/components/layout/BaseHead.astro`:**
- Add `standardSiteDocumentUri?: string` to the `Props` interface.
- Add `const isHomepage = Astro.url.pathname === '/';` near the existing `canonicalURL`.
- Beside the RSS auto-discovery `<link>`s (~line 94), add:
  ```astro
  {standardSiteDocumentUri && <link rel="site.standard.document" href={standardSiteDocumentUri} />}
  {isHomepage && config.standardSite.publicationUri && (
    <link rel="site.standard.publication" href={config.standardSite.publicationUri} />
  )}
  ```

**`src/layouts/Article.astro`:** `post.data` (spread into the layout) carries `draft`, `styleguide`, `pubDate`; `Astro.params.slug` is the post id.
  ```astro
  import { getDocumentUri } from '@utils/standard-site';
  const standardSiteDocumentUri =
    getDocumentUri('articles', Astro.params.slug!, { draft, styleguide, pubDate }) ?? undefined;
  ```
  Add `draft`/`styleguide` to the layout's destructure if needed, and pass `standardSiteDocumentUri={standardSiteDocumentUri}` into `<BaseHead>`.

**`src/layouts/Note.astro`:** same, with `'notes'`. Add `draft`, `styleguide` to the `const { … } = Astro.props` destructure and pass the URI into `<BaseHead>`.

**New: `src/pages/standard-site-publication.ts`** + **Vercel rewrite** — the endpoint returns the publication AT-URI (404 when unset). Served at the canonical `/.well-known/site.standard.publication` via a rewrite in `vercel.output-config.json` (security.txt pattern — see gotcha #5):
  ```ts
  import type { APIRoute } from 'astro';
  import { getConfig } from '@config/config';

  export const prerender = true;

  export const GET: APIRoute = () => {
    const { publicationUri } = getConfig().standardSite;
    if (!publicationUri) return new Response(null, { status: 404 });
    return new Response(publicationUri, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  };
  ```
  ```jsonc
  // vercel.output-config.json — after the security.txt rewrite, before `handle: filesystem`
  { "src": "^/\\.well-known/site\\.standard\\.publication$", "dest": "/standard-site-publication" },
  ```

**Verify (done):** with empty `did`/`publicationUri`, `bun run build` emits no endpoint file and no link tags (correct — nothing to point at). A build test with a dummy `publicationUri` confirmed `dist/standard-site-publication` is emitted with the URI, the homepage gets the publication tag, and non-homepage pages omit it. Real document/publication tags appear once `did`/`publicationUri` are set in Phase 5. After the first real deploy, `curl https://danny.is/.well-known/site.standard.publication` to confirm the rewrite serves it.

### Phase 3 — Auth + scripts (local only; dry-run safe)

`bun add -d @atproto/api gray-matter`.

Follow the existing `scripts/*.ts` convention: **relative imports into `src/` with explicit `.ts` extensions** (e.g. `../../src/utils/standard-site.ts`), matching `scripts/generate-og-image.ts`. (`scripts/generate-og-image.ts` already imports alias-using `src` code via `tsx`, so the `@config/config` alias inside `standard-site.ts` should resolve; if it doesn't, fall back to a relative config import inside the util.)

**New: `scripts/standard-site/auth.ts`** — port Ben's. Logs in with `ATPROTO_APP_PASSWORD` (required), `ATPROTO_HANDLE` (default `danny.is`), `ATPROTO_SERVICE` (default `https://bsky.social`); returns `{ agent, did }`.

**New: `scripts/standard-site/create-publication.ts`** — port Ben's. Builds the publication record from config (`url: site.url`, `name: site.name`, `description: descriptions.site`), reuses an existing publication record if present (idempotent), prints the AT-URI to paste into config. (Consider a friendlier `name` than `'Danny Smith'`, e.g. `'danny.is'` — decide on the day.) **Enrichment:** also set `icon` (read `public/avatar-circle.png`, `uploadBlob`, attach the ref) and `basicTheme` (the RGB colour objects from gotcha #9).

**New: `scripts/standard-site/sync-document.ts`** — port Ben's, adapted:
- Operate over both `src/content/articles` and `src/content/notes`; derive `collection` from the path.
- `postId` = the canonical content-layer id: `data.slug` (frontmatter) if present, else the filename stem (gotcha #7). This **must** match the build, which keys off `post.id`. Do *not* use the bare filename.
- `--all` enumeration regex must allow date-only filenames: `/(^|\/)\d{4}-\d{2}-\d{2}(-.+)?\.mdx?$/` (gotcha #2).
- Parse frontmatter with `gray-matter`; `pubDate = new Date(data.pubDate)`.
- `buildRecord`: `$type: 'site.standard.document'`, `site: publicationUri || site.url`, `title`, `publishedAt: pubDate.toISOString()`, `path: getDocumentPath(collection, postId)`, optional `description`, optional `tags` (from `data.tags` — danny.is uses `tags`, not Ben's `categories`), `textContent: stripMarkdown(body)` truncated to ~50 KB.
- **Enrichment:** add `updatedAt: new Date(data.updatedDate).toISOString()` when `data.updatedDate` is present (articles only). Add `coverImage` by fetching `${site.url}${getDocumentPath(collection, postId)}og-image.png`, `uploadBlob`-ing the bytes, and attaching the ref — guarded by the 1 MB check (gotcha #8); skip-with-warning on fetch failure or oversize so a missing/large image never fails the sync. Make `buildRecord` async (it now does network I/O), or upload the blob in `main` and pass the ref in.
- Skip `draft === true` and `styleguide === true`; skip posts failing `qualifiesForStandardSite` unless `--force`.
- Upsert via `putRecord` at `getDocumentRkey(collection, postId, pubDate)`.
- Flags: `--dry-run`, `--all`, `--force` (ignore the `since` cutoff), `--delete` (`--delete --all` enumerates and wipes the whole `site.standard.document` collection — the backfill undo).

**`package.json` scripts:**
```json
"standard-site:publication": "tsx scripts/standard-site/create-publication.ts",
"standard-site:sync": "tsx scripts/standard-site/sync-document.ts",
```

**Verify (no writes):** `ATPROTO_APP_PASSWORD=… bun run standard-site:sync -- --all --dry-run` and confirm the printed rkeys + paths for a few posts **exactly match** the `site.standard.document` link tags the built site emits for those same posts. This is the key check that build-time and sync-time agree.

### Phase 4 — CI workflow

**New: `.github/workflows/standard-site-sync.yml`** — adapted from Ben's:
- Trigger: `workflow_run` on `workflows: ["CI"]` (my deploy workflow's `name:`), `types: [completed]`, `branches: [main]`; plus `workflow_dispatch` with `dry_run` (default true) and optional `post_path`.
- Guard: run when `github.event_name == 'workflow_dispatch'` **or** `github.event.workflow_run.conclusion == 'success'`.
- Steps: `actions/checkout` (`fetch-depth: 0`) → detect changed posts → `oven-sh/setup-bun` **and** `actions/setup-node@v4` (node 22, gotcha #6) → `bun install --frozen-lockfile` → run sync.
- **Detect changed posts:** `git diff --name-only --diff-filter=AM <head>~1 <head>` scoped to `src/content/articles/` and `src/content/notes/`, where `<head>` = `github.event.workflow_run.head_commit.id`. (Limitation: only the deploy's tip commit is diffed; a multi-commit push only re-syncs files touched in the last commit — the `--all` backfill and `workflow_dispatch` cover the gaps.)
- **Run:** `xargs bun run standard-site:sync -- < /tmp/changed-posts.txt`, with `env: ATPROTO_APP_PASSWORD: ${{ secrets.ATPROTO_APP_PASSWORD }}`, `ATPROTO_HANDLE: danny.is`. Honour the `dry_run` input by appending `--dry-run`.
- `permissions: contents: read`.

**Verify:** push a no-op and confirm the workflow triggers after CI succeeds and reports "no new posts." Then `workflow_dispatch` with `dry_run: true` and a known `post_path` to confirm the record preview.

### Phase 5 — Go live (manual steps + backfill)

Do the **Manual steps** section above in order, then publish a brand-new test note and confirm the workflow auto-creates its record after deploy.

---

## Files touched (summary)

**New**
- `src/utils/standard-site.ts`
- `src/utils/standard-site.test.ts`
- `src/pages/standard-site-publication.ts` (+ a rewrite in `vercel.output-config.json`)
- `scripts/standard-site/auth.ts`
- `scripts/standard-site/create-publication.ts`
- `scripts/standard-site/sync-document.ts`
- `.github/workflows/standard-site-sync.yml`

**Modified**
- `src/config/site.ts` (add `standardSite` block; later fill `did` + `publicationUri`)
- `src/components/layout/BaseHead.astro` (prop + two link tags)
- `src/layouts/Article.astro`, `src/layouts/Note.astro` (compute + pass document URI)
- `package.json` (two scripts; `@atproto/api` + `gray-matter` devDeps)
- `vercel.output-config.json` (rewrite `/.well-known/site.standard.publication` → `/standard-site-publication`)

## Rollback / cleanup

- Records: `ATPROTO_APP_PASSWORD=… bun run standard-site:sync -- --delete --all` wipes every `site.standard.document` record; delete the publication record via pdsls.dev or a one-off `deleteRecord`.
- Code: revert the commits; the only new dependencies are dev-only.
- Knip: the new scripts are entry points — add them to `knip.config.ts` if Knip flags them as unused (`bun run check:knip`).
