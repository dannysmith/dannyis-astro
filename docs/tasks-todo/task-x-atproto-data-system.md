# Task x: A system for reading AT Protocol data into this site

## Overview

This site already **writes** to the ATmosphere — `site.standard.document` records for every article and note. See [standard-site.md](../developer/standard-site.md). This task builds the other direction: **reading** public records from my PDS and rendering them at build time.

The point is not any one feature. It's the wiring, so that adding a new atproto-backed source later — books, scrobbles, saved articles, step counts written to a lexicon of my own — is three steps:

1. Add a row to the registry.
2. Define a collection with a schema.
3. Render it.

Fetching, pagination, surviving a PDS outage, mirroring images onto our own domain, noticing changes and rebuilding should all be handled already.

Books are the worked example because the data exists (248 `buzz.bookhive.book` records). The page itself is deliberately tiny and hidden: **currently-reading only, at `/scratchpad/books`**. A real reading page is a separate piece of work once I know what I want from it.

### Why build-time, and what that costs

The site stays statically generated and host-agnostic — see [deployment.md](../developer/deployment.md). No adapter, no serverless functions. The cost is staleness, bounded by how quickly we notice a change and rebuild (see Change detection below). The one thing this can't serve is "currently listening", whose records expire in ~10 minutes. That's client-side or nothing, and out of scope.

A line worth holding: **`dist/` contains HTML derived from _my_ data.** Other people's records (Bluesky replies, annotations on an article) are comments on the site rather than content of it, and belong client-side. Out of scope here.

### Prior art

[Barry Frost](https://barryfrost.com) has the closest equivalent — Astro 7, static, nine PDS-backed collections ([writeup](https://barryfrost.com/articles/atmospheric), [source](https://github.com/barryf/barryfrost-v7)). His `src/lib/pds.ts` is ~80 lines of plain `fetch` with no atproto dependency, and we follow it: **the read path takes no new dependency**. `@atproto/api` stays for the existing write path.

## What the network actually looks like

Verified against `did:plc:aes3lokiqtv63fk62nwnjeuf` on 2026-09-11 and re-checked 2026-09-18.

- **Everything we need is unauthenticated**, and the PDS sends `access-control-allow-origin: *`.
- **The `bsky.social` entryway is enough.** `listRecords` works against it directly, and `com.atproto.sync.getBlob` 302s to the real shard (`bankera.us-west.host.bsky.network` today). So we hardcode `bsky.social` in site config and let the entryway follow shard moves for us. If I ever move PDS, it's a one-line config change. Other `com.atproto.sync.*` calls (e.g. `getLatestCommit`) return `401 AuthMissing` at the entryway and need the real host from the DID doc — we don't use them.
- **`bsky.network` intermittently 500s on valid requests.** Retry with backoff is not optional.
- **`listRecords`:** `limit` max 100, reverse-chronological by rkey, `cursor` is the last rkey returned. A cursor can come back even on the final page, so terminate on a short page.
- **Repo `rev` is noisy** — it bumps on every like and follow (~2,600 of those in the repo). That's why change detection compares per-collection fingerprints and ignores `rev` entirely.
- **Rate limit** is 3000 requests per 5 minutes. Nothing here gets near it.
- **Book covers are blobs**, not URLs: `{$type: 'blob', ref: {$link: 'bafkrei…'}, mimeType, size}`, capped at 1MB. Other apps put images on a plain URL instead (Rocksky's `albumCoverUrl`), so the image helper takes either.

## Design

### 1. A generic image mirror (generalising the link-preview one)

`src/utils/linkPreview/image.ts` already does everything a blob needs: download, re-encode to webp with `sharp`, content-addressed disk cache, real dimensions, and it never fails the build. A blob is just a URL (`…/xrpc/com.atproto.sync.getBlob?did=…&cid=…`). So rather than copy ~300 lines, lift the core out and make link previews one consumer of it.

- **`src/utils/mirrorImage.ts`** — `mirrorImage(url, { group, maxPx, onProblem? })` → `{ src, width, height } | null`. Owns the download, size cap, encode, cache read/write and in-flight dedup.
- **`linkPreview/image.ts`** shrinks to a thin `fetchPreviewImage` wrapper: group `links`, the preview/favicon sizes, banner-vs-logo `shape` (derived from width/height), and link-health reporting via `onProblem`.
- **`src/lib/link-preview-images-integration.mjs` → `mirrored-images-integration.mjs`**, copying the tree recursively at `astro:build:done` and serving it in dev.
- **Sidecars stop storing `src`** — derive it from the key on read. That makes the cache relocatable, which the migration below relies on.

Everything is organised by group, on disk and in the URL. Groups are named for the feature: `links`, `books`, later `scrobbles`. The cache stays inside `node_modules/.astro`, so the existing `actions/cache` step covers it.

| Where  | Path                                                     |
| ------ | -------------------------------------------------------- |
| Cache  | `node_modules/.astro/mirrored-images/<group>/<key>.webp` |
| Served | `/mirrored/<group>/<key>.webp`                           |

**Migration.** The cached images for links that have since died are irreplaceable, so don't orphan them: a one-off step in `deploy.yml` before the build moves `link-cache/images/` to `mirrored-images/links/` if the old directory exists. Remove the step once it has run. `IMAGE_VERSION` does not change, so keys still match.

### 2. The read layer — `src/utils/atproto/`

| File             | Does                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `pds.ts`         | `fetchWithRetry`, `listRecords` async generator. Plain `fetch`        |
| `fingerprint.ts` | `fingerprint(records)` — hash of sorted `rkey:cid` pairs              |
| `loader.ts`      | `atprotoLoader({ nsid })` — a Content Layer loader                    |
| `image.ts`       | `atprotoImage()` — blob ref or URL → mirrored image; `blobRef` schema |

`pds.ts` and `fingerprint.ts` must stay free of `astro:*` and npm imports — the change-detection script runs them under bun with **no install step**.

**The loader must never fail the build.** Astro's example loader clears the store then fetches, so a PDS blip would stop me shipping an article. The store persists in `node_modules/.astro` between builds, so instead:

- Fetch every record first. Only then reconcile the store: `set` what came back, `delete` ids that didn't.
- If the fetch fails after retries: warn, leave the store as the last build left it.
- If one record fails the schema (a third-party app changed its lexicon): warn and skip that record.
- `digest` is the record CID, so `store.set` skips unchanged entries and per-record routes can use `contentCacheKey()` later.

**Images are mirrored at render time**, the way `BookmarkCard` does it — `await atprotoImage(entry.data.cover, 'books')` in the template. Only covers a page actually shows get downloaded (4 today, not 248), and the loader needs no transform hook.

### 3. The registry — `src/config/atproto.ts`

```ts
export const ATPROTO_SOURCES = {
  books: { nsid: 'buzz.bookhive.book', watch: 'digest' },
} as const
```

Two consumers: `src/content.config.ts` (`loader: atprotoLoader(ATPROTO_SOURCES.books)`, schema alongside the other collections) and the state manifest. `watch: false` loads a collection without triggering rebuilds for it.

DID, handle and PDS host move to a new `atproto` block in `src/config/site.ts`; `standardSite` keeps `publicationUri` and `since`.

### 4. Change detection

**Polling from GitHub Actions is the right fit.** atproto has no webhooks — everything push-shaped (firehose, Jetstream) is a WebSocket needing an always-on consumer, and I found no hosted service that turns it into an HTTP call. The repo is public, so Actions minutes are free; the only real costs are GitHub's cron jitter and noise in the Actions tab.

**State: a build-emitted manifest.** `src/pages/atproto-state.json.ts`, an endpoint like `redirects.json.ts`, reads each registry source with `getCollection()` and emits:

```json
{
  "did": "did:plc:…",
  "host": "bsky.social",
  "builtAt": "2026-09-18T10:00:00Z",
  "sources": [{ "nsid": "buzz.bookhive.book", "fingerprint": "a1b2…", "count": 248 }]
}
```

It's computed from the content store, which is by definition what the build loaded — no state threaded between loaders and integrations. It's self-healing (a failed build doesn't advance it), and it makes the detection script config-free: everything it needs to know is in the manifest, so a newly added source is watched from its first deploy with no workflow change.

**The script — `scripts/atproto/detect-changes.ts`.** Fetch `https://danny.is/atproto-state.json`; for each source, page `listRecords`, compute the same `fingerprint()`, compare. For books that's 1 + 3 requests. Any error — manifest 404 (before the first deploy carrying one), PDS unreachable, a collection failing — means **no dispatch**, a logged warning, exit 0.

**The workflow — `.github/workflows/atproto-detect-changes.yml`.** Sparse checkout of `scripts/atproto` and `src/utils/atproto`, `setup-bun`, run the script. No `bun install`, no node_modules. Scheduled every 10 minutes on an offset minute, plus `workflow_dispatch`. On a change it runs `gh workflow run deploy.yml` with `GITHUB_TOKEN` and `actions: write`, as `update-toolbox.yml` already does.

**The guard — one deploy attempt per detected state.** Needed for two reasons: a deploy takes longer than it sounds, and `deploy.yml` has `cancel-in-progress: true`, so a second dispatch while the first is still running would cancel it, potentially forever; and a broken build or a schema-skipped record would otherwise mean a deploy every 10 minutes indefinitely. So the dispatch carries the detected state as an input (`reason: atproto <hash>`), `deploy.yml` surfaces it via `run-name`, and before dispatching the workflow checks for a run with that name created after the manifest's `builtAt`. If one exists, it's in flight or already failed — skip.

**Instant rebuilds for writers I control.** Anything of mine that writes to the PDS (a steps pusher, say) can call the `workflow_dispatch` API on `deploy.yml` straight after writing, with a fine-grained PAT. No polling delay, nothing to build here — just a recipe for the docs. Polling stays as the path for third-party apps like BookHive.

**Two rules:**

- **Never put `site.standard.document` in the registry with a `watch`.** Our own post-deploy sync writes those, so every deploy would trigger another.
- **`standard-site-sync.yml` should skip dispatched deploys.** It diffs the tip commit, so a deploy dispatched by change detection would re-sync whatever posts were in my last push. Idempotent, but pointless work — add `github.event.workflow_run.event != 'workflow_dispatch'` to its `if`.

**If this ever gets slow or GitHub's cron jitter annoys:** a Cloudflare Worker cron running the same comparison (Barry's approach), or `com.atproto.sync.getRepo?since=<rev>` for a one-request diff of the whole repo (needs a CAR parser and the real PDS host). Neither is worth it yet.

## Proposed approach

### Phase 1 — Generalise the image mirror

- [x] Lift the core of `linkPreview/image.ts` into `src/utils/mirrorImage.ts`; leave `fetchPreviewImage` as a thin wrapper. Derive `src` on read instead of storing it.
- [x] Rename the integration, make the copy recursive, update `astro.config.mjs`.
- [x] One-off cache migration step in `deploy.yml`; run the same `mv` locally.
- [x] Update `tests/unit/linkPreview.test.ts`, [link-metadata.md](../developer/link-metadata.md), [deployment.md](../developer/deployment.md) and `src/utils/CLAUDE.md` for the new names. Added `tests/unit/mirrorImage.test.ts`.
- [x] Build and confirm every bookmark card still has its image, served from `/mirrored/links/`.
- [ ] Once this has deployed from `main`, delete the migration step from `deploy.yml`.

### Phase 2 — Read layer and the books collection

- [ ] `atproto` block in `src/config/site.ts`; update the `standardSite.did` / `.handle` usages.
- [ ] `pds.ts`, `fingerprint.ts`, `loader.ts`, `image.ts` as above. Read Barry's `pds.ts` first.
- [ ] `src/config/atproto.ts` with books as its only row.
- [ ] `books` collection in `src/content.config.ts`. Status is `buzz.bookhive.defs#` + `wantToRead` / `reading` / `finished` / `abandoned` — strip the prefix in the schema. `stars` is 1–10, optional. `cover` is an optional `blobRef`.
- [ ] Unit tests: pagination across a cursor, short-page termination, retry on 500 then success, immediate return on 404; loader sets digest from CID, deletes vanished records, keeps the store when the fetch fails, skips a schema-invalid record; fingerprint is order-independent and moves on create, update and delete.
- [ ] Confirm `bun run build` loads 248 books, and that a build with the network off still succeeds with the previous data.

### Phase 3 — The hidden books page

- [ ] `src/pages/scratchpad/books.astro`: books with status `reading` only — cover, title, author. Same shell as `scratchpad.astro`, `noindex, nofollow`. The sitemap filter already excludes `/scratchpad*`.
- [ ] No new components, no styleguide entry. Check it in both themes.

### Phase 4 — Change detection

- [ ] `src/pages/atproto-state.json.ts`; exclude it from the sitemap alongside `redirects.json`.
- [ ] `scripts/atproto/detect-changes.ts`, with unit tests for the comparison and each no-dispatch failure path.
- [ ] `reason` input and `run-name` on `deploy.yml`; skip-on-dispatch condition on `standard-site-sync.yml`.
- [ ] `atproto-detect-changes.yml` with the guard. `concurrency` with `cancel-in-progress: true` — a superseded check is worthless.
- [ ] Prove it for real: change a book's status in BookHive and confirm one deploy fires; confirm it stays quiet otherwise, and that a deliberately broken build doesn't loop.

### Phase 5 — Documentation

- [ ] `docs/developer/atproto-data.md`: the add-a-source recipe first, then the read layer, the image mirror, how change detection works (manifest contract, the guard, the instant-dispatch recipe, upgrade paths), and the network gotchas above. Move *Notes for later* from this doc into it so they outlive the task.
- [ ] Cross-link with [standard-site.md](../developer/standard-site.md); a line in [deployment.md](../developer/deployment.md) for the change-detection workflow.
- [ ] `bun run check:all`, plus `check:knip` and `check:dupes`.

## Decisions taken

| Decision         | Call                                                               |
| ---------------- | ------------------------------------------------------------------ |
| Client library   | None. Plain `fetch`, following Barry Frost                         |
| PDS host         | Hardcoded `bsky.social` entryway in site config. No DID resolution |
| Images           | One generic mirror, grouped by feature. Link previews use it too   |
| Mirroring point  | Render time, so only displayed images are fetched                  |
| Loader failures  | Never fail the build: keep last data, skip invalid records         |
| Change detection | Per-collection fingerprint vs. build manifest. No `rev`, no ETag   |
| Trigger          | Actions cron, ~10 min, no install → dispatches `deploy.yml`        |
| Loop protection  | One deploy attempt per detected state, via named dispatch runs     |
| Books page       | Currently-reading only, hidden at `/scratchpad/books`              |

## Out of scope

- **A real reading page.** Shelf, finished books, ratings, design. Later, once I know what I want.
- **Scrobbles.** Own task: [task-x-atproto-scrobbles.md](./task-x-atproto-scrobbles.md). It adds the `latest` watch strategy and a loader `limit`, which append-only collections need.
- **Now playing**, **comments and backlinks**, **health data**, **notes or articles as atproto records**, **private data / Spaces**, **authenticated reads**, **publishing a lexicon of my own**.

## Notes for later

Kept because they were expensive to establish. Move into `atproto-data.md` in Phase 5.

**Comments, when we get there.** Don't use `app.bsky.feed.searchPosts` — its `url` and `domain` filters look perfect and it returns **403 unauthenticated**, while `getPostThread` and `getProfile` return 200 on the same host. `public.api.bsky.app` supports no authentication at all, so a token can't fix it.

Use [Constellation](https://constellation.microcosm.blue) instead — a network-wide backlink index with `blue.microcosm.links.getBacklinks`, unauthenticated. It indexes links in *every* collection, so it answers "what in the atmosphere points at this page". Hydrate the `{did, collection, rkey}` stubs with `app.bsky.feed.getPostThread`. Two traps, both verified:

- The discovery endpoint reports JSON paths **with** a leading dot; the `source` parameter needs them **without**. The wrong form returns an empty response, not an error.
- Targets match exactly. `https://danny.is` returns 1, `https://danny.is/` returns 0. Query both.

**Minting a lexicon, when there's something to write.** Writing arbitrary records to my own PDS needs a syntactically valid NSID and a matching `$type`. `createRecord`'s `validate` defaults to validating only against lexicons the PDS knows, so unknown ones are accepted unvalidated.

Publishing the schema is optional and buys interop, not permission — a `com.atproto.lexicon.schema` record with rkey set to the NSID, plus a DNS TXT record at `_lexicon.<authority-domain>` holding `did=<did>`. The authority is the NSID minus its final segment, reversed: `is.danny.health.steps` resolves via `_lexicon.health.danny.is`.

There is no shared health namespace to adopt — seven health-related NSIDs network-wide, the largest with two users, nothing for sleep, HRV or weight. `dev.baileytownsend.health.rings` is worth copying in one respect: it keys records by **date** (`2026-01-05`) rather than a TID, which makes a daily metric an idempotent upsert that sorts correctly and never needs deduplicating.
