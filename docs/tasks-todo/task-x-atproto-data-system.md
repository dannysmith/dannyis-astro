# Task x: A system for reading AT Protocol data into this site

## Overview

This site already **writes** to the ATmosphere — `site.standard.document` records for every article and note, via `scripts/standard-site/` and a post-deploy workflow. See [standard-site.md](../developer/standard-site.md).

This task builds the other direction: **reading** public records from the PDS and rendering them at build time.

The point is not any one feature. It's that adding a new atproto-backed data source should be close to free. If I start using an app that writes restaurants or recipes to my PDS, or I define a lexicon of my own for Apple Watch data and write it from somewhere, putting that on this site should be: add a row to a registry, write a schema, render it. Everything else — fetching, paginating, mirroring blobs, noticing changes, rebuilding — should already be handled.

So this is three pieces of plumbing and two features that exercise them:

1. **A read layer** — paginated record fetching, PDS host resolution, blob mirroring.
2. **A registry** — one list of watched collections that both the build and CI read.
3. **Change detection** — a cheap poll that fires a rebuild when watched data actually moves.

Books first, because there's real data there already (248 records). Scrobbles second, because they're shaped differently enough to prove the system generalises.

### Why build-time, and what that costs

The site stays statically generated and host-agnostic — see [deployment.md](../developer/deployment.md). No adapter, no serverless functions, no server islands. The data lands in `dist/` as HTML like everything else.

The cost is staleness, bounded by how often we rebuild. For books, scrobble history and daily metrics that's invisible — nobody notices a reading list that's twenty minutes behind. The one thing it genuinely can't serve is **"currently listening"**, because the now-playing records carry a ~10 minute expiry and are stale before a deploy finishes. That's client-side or nothing, and it's out of scope here.

There's a conceptual line worth holding onto, which also predicts where client-side work will eventually land: **`dist/` should contain HTML derived from my data.** Books, scrobbles, health, whatever I write to my own repo. It should probably *not* contain other people's — Bluesky posts mentioning a page, annotations on an article. Those are comments on my site rather than content of it, and fetching them in the browser is both more honest and always current. Out of scope here, but it's why the read layer is built for build-time use and not generalised to the browser yet.

### Prior art

[Barry Frost](https://barryfrost.com) has the closest working equivalent — Astro 7, static, nine PDS-backed collections, [writeup](https://barryfrost.com/articles/atmospheric), source at [barryf/barryfrost-v7](https://github.com/barryf/barryfrost-v7). Worth reading before starting. Two things to take from it:

- **`src/lib/pds.ts` is ~80 lines and has no atproto dependencies.** Just `fetch`, an async generator that pages `listRecords`, and backoff on 429/5xx. His `package.json` contains no `@atproto/*` or `@atcute/*` at all. Every Astro atproto loader package I looked at is pre-1.0, single-maintainer and under 100 weekly downloads; none of them is a better dependency than 80 lines we can read.
- **`cloudflare/pds-poller/`** is a 426-line Worker doing the change detection described below. We're doing the same thing in GitHub Actions instead, but his edge cases are real and hard-won — particularly the comment explaining why `rev` can't be advanced when a collection fetch fails.

We keep `@atproto/api` for the existing write path. It isn't deprecated and there's no reason to churn it. The read path takes no new dependency.

## What the network actually looks like

Verified against `did:plc:aes3lokiqtv63fk62nwnjeuf` on 2026-09-11. These are the details that shape the design.

**The PDS host is not `bsky.social`.** It's `bankera.us-west.host.bsky.network`, resolved from the DID document at `https://plc.directory/<did>` via the `#atproto_pds` service endpoint. This matters more than it looks: `listRecords` works fine against the `bsky.social` entryway, but **`com.atproto.sync.*` returns `401 AuthMissing` there** and only works against the real shard. Bluesky reassigns accounts between shards, so resolve it rather than hardcoding — and cache the result.

**Everything we need is unauthenticated.** `listRecords`, `getLatestCommit`, `getRepoStatus`, `describeRepo` and `getBlob` all work with no credentials. The PDS also sends `access-control-allow-origin: *`, so the same calls work from a browser — which is what makes the future client-side work cheap.

**`getLatestCommit` is the cheapest change signal there is:**

```
GET https://<pds>/xrpc/com.atproto.sync.getLatestCommit?did=<did>
→ 200, 91 bytes, {"cid":"bafyrei…","rev":"3mv72toilkn2a"}
→ with If-None-Match: <etag>  →  304, 0 bytes
```

Rate limit is `3000;w=300` — 3000 per 5 minutes. Polling every 10 minutes uses a rounding error of that. Note the ETag comes from the PDS; relays serve the same endpoint but **don't** send one, so prefer the PDS.

**`rev` is noisy.** It's a logical clock that bumps on *any* write to the repo. There are 1,987 likes and 655 follows in there as of 2026-09-11, so it moves constantly for reasons we don't care about. It's a good negative gate — an unchanged `rev` definitively means nothing changed — but a changed `rev` means almost nothing on its own. Hence the second tier.

**`listRecords` semantics:** `limit` max is 100 (101 is rejected), the default order is reverse-chronological by rkey, and `cursor` is the rkey of the last record returned. It also honours `If-None-Match`.

**Current state of the collections we care about:**

| Collection             | Records | Shape                                       |
| ---------------------- | ------- | ------------------------------------------- |
| `buzz.bookhive.book`   | 248     | 61 finished, 35 want-to-read, 4 reading     |
| `app.bsky.feed.post`   | many    | grows monotonically                         |
| `site.standard.document` | —     | **written by our own CI — never watch it**  |

## Design

### 1. The read layer — `src/utils/atproto/`

A small module, shaped like `src/utils/linkPreview/` (which is the existing precedent for "fetches the network at build time, caches on disk, degrades honestly").

| File        | Does                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `pds.ts`    | Host resolution, `fetchWithRetry`, `listRecords` async generator          |
| `blob.ts`   | Blob ref → mirrored local webp, content-addressed disk cache              |
| `loader.ts` | `atprotoLoader()` — a Content Layer loader built on the above             |
| `index.ts`  | Barrel                                                                    |

`pds.ts` carries the whole client surface:

- `resolvePdsHost(did)` — DID doc lookup, memoised per build.
- `fetchWithRetry(url)` — exponential backoff on 429/500/502/503/504 and network errors, immediate return on genuine 4xx. Not optional: `bsky.network` shards intermittently 500 on valid requests, and without this a single blip fails the whole build.
- `listRecords(collection, { did })` — async generator, pages at `limit=100` until the cursor runs out. Terminate on a short page rather than trusting the cursor to be absent.

`loader.ts` wraps that into an Astro [Content Layer loader](https://docs.astro.build/en/reference/content-loader-reference/):

```ts
store.set({
  id: rkey,
  data: transform(record.value),
  digest: generateDigest(record.cid),
})
```

Using the record CID as the digest is what plugs this into `experimental.incrementalBuild` (already on — see [deployment.md](../developer/deployment.md#incremental-builds)). Routes return `cacheKey` from `contentCacheKey()` in `src/utils/content.ts`, exactly as the markdown collections do, so a rebuild triggered by one changed book re-renders only the pages that book touches.

### 2. Blob mirroring

Book covers are blobs, not URLs — `{$type: 'blob', ref: {$link: 'bafkrei…'}, mimeType, size}`, capped at 1MB by BookHive's lexicon. They're fetched from `com.atproto.sync.getBlob?did=<did>&cid=<link>`, which is public (verified: 200, `image/jpeg`, 23,464 bytes).

Not everything is a blob, though — Rocksky puts a plain `albumCoverUrl` on its CDN instead. So `blob.ts` takes either a blob ref or a URL and returns a local path.

The mechanism copies `linkPreview/image.ts` and its integration almost exactly, because that pattern is already proven twice in this repo:

- Download, re-encode to webp with `sharp`, write content-addressed into `node_modules/.astro/atproto-blobs/`.
- An inline integration mirroring `src/lib/link-preview-images-integration.mjs`: `astro:build:done` copies the cache into `dist/atproto-blobs/`, `astro:server:setup` serves it from the cache in dev.
- Rides the existing `actions/cache` step for `node_modules/.astro`, so CI needs no new setup.

This means no page ever hotlinks `bsky.network`, and covers survive a book being deleted upstream.

### 3. The registry — `src/config/atproto.ts`

The single source of truth, read by three consumers: the content config, the freshness checker, and the state manifest.

```ts
export const ATPROTO_SOURCES = [
  { collection: 'books', nsid: 'buzz.bookhive.book', watch: 'digest' },
] as const
```

**The one real constraint: this module must not import anything from `astro:`.** The freshness checker runs under bun in CI with no Astro context. `src/utils/standard-site.ts` already has this property and is imported by both the build and `scripts/standard-site/`, so the shape is established.

Zod schemas stay in `src/content.config.ts` with the other collections; the registry carries only what both consumers need.

### 4. Change detection

Two tiers, because the cheap one is nearly free and the expensive one shouldn't run most of the time.

**Tier 1 — has anything at all changed?** `getLatestCommit` with `If-None-Match`. A 304 ends the check in zero bytes. This is the common case overnight.

**Tier 2 — did anything we care about change?** Only runs when `rev` moved. Per-collection, with the strategy declared in the registry, because the right answer differs by collection shape:

| `watch`    | Method                            | Requests     | Catches                | Use for        |
| ---------- | --------------------------------- | ------------ | ---------------------- | -------------- |
| `digest`   | Full `rkey → cid` map, diffed     | `ceil(n/100)`| create, update, delete | Books, curated |
| `latest`   | Newest rkey only (`limit=1`)      | 1            | create only            | Scrobbles, logs|

`digest` is Barry's approach and is the correct one where records get edited in place — a book's status changes from `reading` to `finished` without its rkey moving, and a "newest record" check would miss that entirely. `latest` exists because append-only collections make the full scan pathological: 248 books is 3 requests, but a few years of scrobbles would be dozens, every poll, to detect something a single request proves.

**Two rules that are easy to get wrong:**

- **Never watch `site.standard.document`.** Our own post-deploy workflow writes those records, so watching them means every deploy triggers another deploy. Barry hit this and left a comment about it.
- **Don't advance the stored `rev` if any collection fetch failed.** Advancing it means tier 1 short-circuits every later run until something unrelated changes, silently deferring detection of whatever is already sitting in the failed collection. Withhold it and the next run rescans.

**If this ever gets slow**, the escape hatch is `com.atproto.sync.getRepo?did=<did>&since=<rev>`, which returns a CAR of everything changed since a revision in **one** request regardless of collection count — verified at 59 bytes for no change and 105KB for a week's worth, against a full repo of only 1.7MB. It needs a CAR parser (`@atcute/car`), and the PDS rejects revisions it no longer retains, so it needs a full-scan fallback. Not worth the dependency yet. Worth knowing it's there.

### 5. State — `dist/atproto-state.json`

The checker needs to know what the last successful build actually saw. Three options were considered:

- **A committed file** — works, but adds bot commits and a push-loop guard.
- **The Actions cache** — entries are immutable (you can't overwrite a stable key, you have to encode the value *in* the key and use `restore-keys`), and anything untouched for 7 days is evicted.
- **A build-emitted manifest** — the build writes what it loaded; the checker fetches it from the live site.

The third is the best fit and follows `dist/redirects.json`, which already exists for exactly this reason — deploy-target-neutral state emitted by the build. It needs no CI state at all, and it's **self-healing**: if a build fails, the deployed manifest doesn't advance, so the next check still sees a difference and retries.

The manifest must record **what the build actually loaded**, not a fresh fetch at the end — otherwise a record written during the build gets marked as shipped when it isn't in the output. So the loaders accumulate fingerprints and an integration writes them out at `astro:build:done`, the same hook Pagefind and link previews already use.

```json
{
  "rev": "3mv72toilkn2a",
  "collections": {
    "buzz.bookhive.book": { "watch": "digest", "fingerprint": "a1b2c3…", "count": 248 }
  }
}
```

### 6. The CI workflow

`.github/workflows/atproto-freshness.yml`, modelled on the existing `update-toolbox.yml`, which already does scheduled-check → detect-change → trigger-deploy.

Runs on a schedule every ~10 minutes at an offset minute (the top of the hour is when GitHub's scheduler is most congested), plus `workflow_dispatch`. On a detected change it calls `gh workflow run deploy.yml`, which `deploy.yml` already accepts via its bare `workflow_dispatch:` trigger — so no new plumbing there, and `GITHUB_TOKEN` with `actions: write` is enough. No PAT.

GitHub's `on: schedule` is documented as delayable under load and runs are occasionally dropped outright; reports of 50-60 minute delays are common. That's fine here and explicitly accepted — none of this data is urgent. If something ever needs to-the-minute freshness, the upgrade is a small always-on Jetstream consumer firing `repository_dispatch`, not a tighter cron.

Two things to get right: `concurrency` with `cancel-in-progress: true`, since a superseded check is worthless; and note that **scheduled workflows on public repos are auto-disabled after 60 days of repository inactivity**, which is worth knowing even though this repo is active.

## Proposed approach

### Phase 1 — The read layer

- [ ] `src/utils/atproto/pds.ts`: `resolvePdsHost`, `fetchWithRetry`, `listRecords` generator. Read Barry's `src/lib/pds.ts` first.
- [ ] `src/utils/atproto/loader.ts`: `atprotoLoader()` returning an Astro `Loader`, setting `digest` from the record CID.
- [ ] `src/config/atproto.ts` with the registry, `buzz.bookhive.book` as its only entry. Keep it free of `astro:` imports.
- [ ] Wire a `books` collection into `src/content.config.ts` with a Zod schema. Status is a four-value enum — `buzz.bookhive.defs#` + `wantToRead` / `reading` / `finished` / `abandoned`. Rating is `stars`, 1–10.
- [ ] Unit tests in `tests/unit/atproto.test.ts`: pagination across a cursor boundary, short-page termination, retry on 500 then success, immediate return on 404, DID doc parsing.
- [ ] Confirm `bun run build` loads 248 books and that a second build reuses them.

### Phase 2 — Blob mirroring

- [ ] `src/utils/atproto/blob.ts`: blob ref *or* URL → mirrored webp, content-addressed in `node_modules/.astro/atproto-blobs/`. Mirror `linkPreview/image.ts`, including its `IMAGE_VERSION`-style cache key.
- [ ] `src/lib/atproto-blobs-integration.mjs`: `astro:build:done` copies to `dist/`, `astro:server:setup` serves from cache in dev. Register in `astro.config.mjs`.
- [ ] Add a note to `src/utils/CLAUDE.md` covering the new cache and when its version needs bumping — it sits alongside two existing caches with opposite bump rules, so the distinction needs writing down.
- [ ] Verify no page hotlinks `bsky.network`, and that a cold cache doesn't fail the build when a blob 404s.

### Phase 3 — The reading page

- [ ] A route rendering current reads, recently finished, and the shelf. Decide the URL (see Decisions).
- [ ] Return `cacheKey` from `getStaticPaths()` via `contentCacheKey()` so incremental builds can skip it.
- [ ] Reuse existing card patterns rather than inventing a component — check `src/components/ui/` and the `/making` page first.
- [ ] Styleguide entry for any new visual component, per the house rule.
- [ ] `bun run shoot /reading` in both themes at 375, 768 and 1440.

### Phase 4 — Freshness

- [ ] Extend the loaders to accumulate per-collection fingerprints during load.
- [ ] An integration writing `dist/atproto-state.json` at `astro:build:done` from those fingerprints.
- [ ] Exclude it from the sitemap in `astro.config.mjs`, alongside the existing `redirects.json` filter.
- [ ] `scripts/atproto/check-freshness.ts`: fetch the deployed manifest, tier-1 ETag check, tier-2 per-collection check, exit code or `GITHUB_OUTPUT` signalling whether to build.
- [ ] `.github/workflows/atproto-freshness.yml` on a ~10 minute offset schedule plus `workflow_dispatch`, dispatching `deploy.yml` on change.
- [ ] Test the failure paths deliberately: PDS unreachable, manifest 404 (first run, before the first deploy carrying one), a collection 404ing. None should trigger a build loop, and none should advance `rev`.
- [ ] Watch it for a day and confirm it fires on a real book status change and stays quiet otherwise.

### Phase 5 — Generalise, with scrobbles as the test

Sign up for teal.fm and Rocksky first and let some history accumulate — this phase needs real records to be a real test.

- [ ] Add a scrobbles source to the registry with `watch: 'latest'`. **If adding it needs more than a registry row, a schema and a render, the system isn't finished** — that's the acceptance test for this whole task.
- [ ] Pick a service. `fm.teal.feed.play` is the more widely-read schema (Rocksky writes it too, as does multi-scrobbler); `app.rocksky.scrobble` has a working public API and puts album art on a plain URL rather than needing MusicBrainz lookups. Running multi-scrobbler feeds both.
- [ ] Mind the unit mismatch: **teal's `duration` is seconds, Rocksky's is milliseconds.**
- [ ] Something small on the site — recently played, or top artists this month. The feature matters less than proving the pattern.
- [ ] Confirm the `latest` watch strategy behaves: one request per poll, and a new scrobble triggers a build.

### Phase 6 — Documentation

- [ ] `docs/developer/atproto-data.md`: the read layer, the registry and how to add a source, the two watch strategies, the state manifest contract, and the gotchas from *What the network actually looks like* above.
- [ ] Cross-link from [standard-site.md](../developer/standard-site.md) — one doc covers writing, the other reading, and neither should be found without the other.
- [ ] A line in [deployment.md](../developer/deployment.md) covering the new cache directory and the freshness workflow.
- [ ] `AGENTS.md` under key features, matching how the command palette is listed.
- [ ] `bun run check:all`, plus `check:knip` and `check:dupes` since this adds a util module, an integration and a script.

## Decisions taken

| Decision          | Call                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| Client library    | None. ~80 lines of `fetch`, following Barry Frost                     |
| Write path        | Unchanged — `@atproto/api` stays for standard.site                    |
| Rendering         | Build-time only. No adapter, no server islands, no runtime JS          |
| Change detection  | ETag gate, then per-collection strategy from the registry              |
| State             | Build-emitted `dist/atproto-state.json`, fetched from the live site    |
| Trigger           | GitHub Actions schedule → `workflow_dispatch` on `deploy.yml`          |
| Cadence           | ~10 minutes, offset from the hour. Delays accepted                     |
| Blobs             | Mirrored to webp at build time. Nothing hotlinks `bsky.network`        |
| First source      | `buzz.bookhive.book` — 248 real records already there                  |
| Second source     | Scrobbles, as the test that the system generalises                     |

**On the reading page URL** — `/reading` and `/books` both work; `/making` sets the precedent of a bare gerund. Decide in Phase 3, but decide before building the route, because it's in the sitemap and RSS considerations follow from it.

## Out of scope

- **Now playing.** The records expire in ~10 minutes, so a build-time render is always wrong. Client-side, later, or not at all.
- **Comments and backlinks.** Bluesky posts and annotations mentioning a page. When it happens it's client-side, for the reason in the Overview. Notes below.
- **Health and quantified-self data.** The system should make it trivial later; this task doesn't build it.
- **Notes or articles as atproto records.** Markdown in git stays canonical. Both Barry Frost and Paul Frazee evaluated the alternative and reached the same conclusion.
- **Private data / atproto Spaces.** Everything this site reads is a public record. Spaces are alpha-only and can't be read by a static page by definition.
- **Authenticated reads.** Nothing we need requires them.
- **Publishing a lexicon of my own.** Not needed until there's data to write.

## Notes for later

Kept here because they were expensive to establish and will be wanted when the out-of-scope items come round.

**Comments, when we get there.** Don't use `app.bsky.feed.searchPosts` — it has `url` and `domain` filters that look perfect for this and it returns **403 unauthenticated**, verified while `getPostThread` and `getProfile` return 200 on the same host in the same second. `public.api.bsky.app` supports no authentication at all, so a token can't fix it.

Use [Constellation](https://constellation.microcosm.blue) instead — a network-wide backlink index (18bn links, 590 days) with `blue.microcosm.links.getBacklinks`, unauthenticated. It indexes links in *every* collection, not just Bluesky posts, so the real question it answers is "what in the atmosphere points at this page" — annotations, bookmarks, reading-list saves. Hydrate the `{did, collection, rkey}` stubs it returns with `app.bsky.feed.getPostThread`, which does work unauthenticated. Two traps, both verified:

- The discovery endpoint reports JSON paths **with** a leading dot; the `source` parameter needs them **without**. Wrong form returns an empty response, not an error.
- Targets match exactly. `https://danny.is` returns 1, `https://danny.is/` returns 0. Query both.

**Minting a lexicon, when there's something to write.** Writing arbitrary records to my own PDS needs exactly two things: a syntactically valid NSID, and a matching `$type`. `createRecord`'s `validate` parameter defaults to validating only against lexicons the PDS already knows, so unknown ones are accepted unvalidated.

Publishing the schema is optional and buys interop rather than permission — a `com.atproto.lexicon.schema` record with rkey set to the NSID, plus a DNS TXT record at `_lexicon.<authority-domain>` holding `did=<did>`. Note the authority is the NSID minus its final segment, reversed: `is.danny.health.steps` resolves via `_lexicon.health.danny.is`, not `_lexicon.danny.is`.

There is no shared health namespace to adopt. The complete set of health-related NSIDs on the network is seven, the largest has two users, and there is **nothing at all** for sleep, HRV or weight. `dev.baileytownsend.health.rings` is the only Apple-Watch-shaped precedent and is worth copying in one respect: it keys records by **date** (`2026-01-05`) rather than a TID, which makes a daily metric an idempotent upsert that sorts correctly and never needs deduplicating.
