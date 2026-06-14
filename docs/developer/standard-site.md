# standard.site / AT Protocol publishing

This site syncs its articles and notes onto the [ATmosphere](https://atproto.com/) using the [standard.site](https://standard.site/) lexicons so any AT-aware reader can index it and Bluesky can show a richer card when someone shares a danny.is URL. Danny usesd Bluesky as his PDS so records live in his normal Bluesky account (`@danny.is`), written with a Bluesky **app password**.

## What it does

Two kinds of record get written to the PDS:

- **One `site.standard.publication` record** describing the site itself — name, URL, icon, theme. Created once.
- **One `site.standard.document` record per published post**: title, canonical path, plain-text body, tags, cover image, dates.

Key points that may be non-obvious:

- A post's record key is computed from the post itself, so the same post always lands at the same record.
- Editing a post is just a re-sync: The write is an upsert at that computed key, so re-syncing an edited post overwrites its record in place and the record's address never moves.
- The verification link tag is rendered at build time; the record is written separately, by CI, after deploy.

## How the record key works

Every record has an address: `at://<did>/<collection>/<rkey>`. The `rkey` is a TID (13 characters, base-32, sortable by time) and is built from:

- The **timestamp** from the post's `pubDate`, reduced to its UTC calendar date, which keeps the key identical whether it's computed during build, in CI, or in a local backfill in another timezone.
- The **uniqueness suffix** is a short hash of `"<collection>/<postId>"`. Two posts on the same day get different keys, and an article can't collide with a note that happens to share its slug.

Because the key is a pure function of the post, the build can render a link tag pointing at the record's address before the record exists. The sync job computes the same key and writes the record there. They agree as long as both resolve `postId` the same way.

That `postId` is the post's **canonical id: the `slug` frontmatter when set, otherwise the filename stem** (ie what Astro uses for the URL). The build reads it from `Astro.params.slug`; the sync reads it via `canonicalPostId`.

## What gets published

We follow the site's normal "is this published?" rules with two extra exclusions:

- **Skipped:** drafts, styleguide pages, and externally-hosted posts — anything with a `redirectURL` (e.g. an article that lives on Medium and whose danny.is page only redirects away). External posts stay skipped even under `--force`.
- **Cutoff:** only posts on or after `CONFIG.standardSite.since`, which is set before the first post so the whole archive qualifies.

If `CONFIG.standardSite.did` is empty, `getDocumentUri` returns nothing and no tags render — the integration sits dormant until configured. It is currently configured and live (`did` and `publicationUri` are set in `src/config/site.ts`).

**Fields on a document record.** Always `site`, `title`, `publishedAt`, `path`, and `textContent` (a plain-text rendering of the body, with markdown and MDX imports/JSX stripped). When present: `description`, `tags`, `updatedAt` (from `updatedDate`, articles only), and `coverImage`.

The cover is the post's generated OG image. The sync fetches it from the live URL and uploads it as a blob, which is why it has to run after deploy. If the fetch fails or the image is over the 1 MB blob limit, the cover is skipped with a warning rather than failing the sync. This blob is only for other readers' thumbnails; Bluesky's own card still uses the page's `og:image` tag.

## When records get written

1. The build renders the link tag (address known, record may not exist yet).
2. Deploy ships the static site.
3. The sync workflow runs after deploy, diffs that deploy's commit for added/changed files under `src/content/`, and upserts a record for each.
4. Edits flow through the same path and overwrite in place.
5. Deletes are manual: removing a post does not remove its record (see Troubleshooting).

## Operating it

All commands run from the repo root. The app password is passed as `ATPROTO_APP_PASSWORD` and never committed.

```bash
# Create or update the publication record (one-time setup; idempotent)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:publication

# Preview every post without writing
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all --dry-run

# Backfill / re-sync every post
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all

# Sync specific posts (what CI does automatically)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- src/content/notes/2026-06-15-example.mdx

# Delete one record, or wipe all document records (full undo)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete src/content/notes/2026-06-15-example.mdx
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete --all
```

Flags: `--dry-run` (preview, no writes; also skips the cover upload), `--all` (every post in both collections), `--force` (ignore the `since` cutoff; still never publishes drafts, styleguides, or external posts), `--delete` (remove instead of upsert).

In CI the same script runs from `.github/workflows/standard-site-sync.yml`, reading the app password from the `ATPROTO_APP_PASSWORD` repository secret. You can also trigger it by hand from the Actions tab, with a single `post_path` and a `dry_run` toggle that defaults on. To see what's actually on the network, look up `danny.is` at <https://pdsls.dev/>.

## Configuration

`CONFIG.standardSite` in `src/config/site.ts`:

- `did` — the AT Protocol DID for `danny.is`. Public.
- `handle` — the login handle (`danny.is`).
- `publicationUri` — the `at://…` URI of the publication record, printed by `standard-site:publication`. Public.
- `since` — only posts on or after this date are published.

`did` and `publicationUri` are typed `as string` on purpose (see below) so the "is it configured?" checks work whether or not they're populated.

## Troubleshooting

**`/.well-known/site.standard.publication` returns 404.** Either `publicationUri` isn't set yet (the endpoint 404s by design until it is), or the deploy carrying it hasn't shipped. Once set and deployed, it's served via a rewrite in `vercel.output-config.json` that must sit before the `filesystem` handler. The endpoint deliberately lives at a normal path, not under `src/pages/.well-known/`: Vercel won't serve files from a dotfile directory here, so we rewrite to it — the same trick as `/.well-known/security.txt`.

**A link tag points at a record that doesn't exist, or vice versa.** The build and the sync must compute the same `postId` and `pubDate`. The usual culprit is the id: if a post has a `slug`, that _is_ its id. Re-run the sync for that file and compare its printed rkey to the `href` in the page's link tag. Changing a post's `slug` or `pubDate` changes its rkey and orphans the old record — delete the old one by hand.

**A record has no `coverImage`.** The sync skips the cover (with a warning) if the OG image fails to fetch or is over 1 MB. Check the image resolves at `<site>/writing/<id>/og-image.png` (or `/notes/…`) and is under the limit.

**CI didn't sync when you expected it to.** The workflow only runs after the `CI` workflow succeeds on `main`, and it diffs only that deploy's _tip_ commit. A post added in an earlier commit of a multi-commit push won't be picked up — sync it by hand (`workflow_dispatch` with its `post_path`, or `--all` locally).

**Login fails.** Confirm `ATPROTO_APP_PASSWORD` is set (repo secret in CI, env var locally) and is an _app password_, not the account password. The handle defaults to `danny.is`; override with `ATPROTO_HANDLE`.

**Backfilled records have stale data.** Re-running overwrites in place, so fix the source and re-run (`--all`, or the specific files). To start clean, `--delete --all` then re-sync.

## If you change this

- **Keep the key deterministic.** The timestamp comes from `pubDate`'s UTC date and the id is the canonical `slug ?? filename`. If the build and sync ever compute keys differently, tags and records drift apart. The unit tests in `tests/unit/standard-site.test.ts` guard this — keep them green.
- **Keep the qualification rule in one place.** Change `qualifiesForStandardSite` and both the build and the sync follow. Don't reimplement it.
- **Leave the config placeholders typed `as string`.** `CONFIG` is `as const`, so an empty literal would narrow to a type that breaks the "is it configured?" checks.
- **Don't move the publication endpoint into a dotfile directory.** It has to stay a normal route with the rewrite in front of the `filesystem` handler.

## References

- standard.site docs and lexicons: <https://standard.site/docs/>
- AT Protocol custom records: <https://atproto.com/>
- Record browser: <https://pdsls.dev/>
- Decision history: `docs/tasks-done/` (search for `standard-site`).
