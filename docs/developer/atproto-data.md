# Reading AT Protocol data

The site can render public records from my PDS at build time — books from BookHive today, and anything else an app writes there later. [standard-site.md](./standard-site.md) covers the other direction, writing.

It stays static: records are fetched during `astro build`, and a scheduled workflow rebuilds the site when they change. There is no atproto dependency on the read side, just `fetch`.

## Adding a source

1. **Add a row** to `ATPROTO_SOURCES` in `src/config/atproto.ts`. The key is the collection name. `watch` is `'digest'` for a collection that is edited in place (every record is fingerprinted, so edits and deletes count), `'latest'` for one that only grows (just the newest record is, in one request), or `false` for no rebuilds at all. Add `limit` to a growing collection so a build loads only the newest that many records.
2. **Define the collection** in `src/content.config.ts`, with a schema listing only the fields you'll use:

   ```ts
   const books = defineCollection({
     loader: atprotoLoader(ATPROTO_SOURCES.books),
     schema: z.object({ title: z.string(), cover: blobRef.optional() }),
   })
   ```

3. **Render it** with `getCollection('books')`. For an image, call `atprotoImage()` where it's drawn:

   ```ts
   const cover = await atprotoImage(book.data.cover, { group: 'books', maxPx: 800 })
   // → { src: '/mirrored/books/…webp', width, height } | null
   ```

Entries are keyed by rkey. `src/components/ui/CurrentlyReading.astro` (shown on `/now`) is a complete, small example of an edited-in-place collection, and `src/pages/scratchpad/listening.astro` of an append-only one.

## How it works

**The loader never fails the build.** The PDS is someone else's server and the records are usually written by someone else's app. If a collection can't be read, the entries from the last build are kept (the content store persists in `node_modules/.astro`). If one record doesn't fit the schema, that record is skipped. Both log a warning.

**Images are mirrored, never hotlinked.** `atprotoImage()` takes a blob ref or a plain URL — apps differ — and passes it to the shared `src/utils/mirrorImage.ts`, which downloads, re-encodes to webp and caches it, grouped by feature. Mirroring happens at render time, so only images a page actually shows are downloaded. See [link-metadata.md](./link-metadata.md) for the mirror itself. A blob can live in another repo (`repo: { did, host }`): `CurrentlyReading` falls back to the cover on BookHive's own catalog record when mine has none. Because the mirror is keyed by source URL, and a blob's URL contains its CID, a cover added to my record later is picked up on the next build rather than shadowed by the cached fallback.

**Change detection** has three parts:

- The build emits `/atproto-state.json`: a fingerprint for each watched collection, plus when it was built. For `digest` that is a hash of every rkey and CID; for `latest` it is the newest record's alone, which the PDS also returns first, so checking it is a single request however large the collection.
- `.github/workflows/atproto-detect-changes.yml` runs every two hours. It fetches that manifest from the live site, recomputes the fingerprints from the PDS, and dispatches `deploy.yml` if they differ. It needs no config — the manifest says what to check — and no `bun install`, so a run takes seconds.
- It won't dispatch while a deploy is already running (a dispatch would cancel it), or if that exact PDS state has already been tried since the site was built (so a broken build can't loop). Dispatched deploys are named `atproto <state>`, which is how it tells.

If it can't be sure — no manifest, PDS down — it does nothing and tries again next time. GitHub's cron runs late and skips runs on quiet repos (a 10-minute schedule ran every 2–5 hours in practice), which is why it is only asked for every two hours; nothing here is urgent.

**For an instant rebuild**, anything of mine that writes to the PDS can dispatch the deploy itself straight after writing, with a fine-grained token that has Actions write access to this repo:

```bash
gh workflow run deploy.yml --ref main -f reason="steps updated"
```

## Things worth knowing

- **Reads go to the `bsky.social` entryway** (`atproto.pdsHost` in `src/config/site.ts`), not the shard the account lives on. It serves `listRecords` itself and redirects `getBlob`, so it follows shard moves for us. Other `com.atproto.sync.*` calls return 401 there and need the real host from the DID document; we don't use them.
- **`bsky.network` intermittently 500s on valid requests**, which is why every request retries with backoff.
- **`listRecords` can return a cursor on the last page**, so paging stops on a short page instead.
- **Record order is write order, not event order.** Rkeys are timestamps of when the record was written, and an app backfilling history writes out of sequence (Rocksky's Last.fm import did). Sort on the record's own date field; `latest` still works because a new event is a new newest rkey.
- **The repo's `rev` is useless as a change signal.** It bumps on every like and follow.
- **Never watch `site.standard.document`.** Our own post-deploy sync writes those records, so every deploy would trigger another.
- **`pds.ts` and `changes.ts` must not import from npm**, and use relative imports. The workflow runs them with no `node_modules`, and `tsconfig.json` (where the path aliases live) extends a file inside it.

## Where things live

- `src/config/atproto.ts` — the registry. `src/config/site.ts` — DID, handle, PDS host.
- `src/utils/atproto/` — `pds.ts` (network), `loader.ts` (content loader), `image.ts` (`atprotoImage`, `blobRef`), `changes.ts` (fingerprints and change detection).
- `src/pages/atproto-state.json.ts` — the manifest.
- `scripts/atproto/detect-changes.ts` and `.github/workflows/atproto-detect-changes.yml`.
- `tests/unit/atproto.test.ts`.
