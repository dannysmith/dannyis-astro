# standard.site / AT Protocol publishing

This site mirrors its articles and notes onto the **AT Protocol network** (the "ATmosphere" — the same network Bluesky runs on) using the community [standard.site](https://standard.site/) lexicons. When a post is published, a matching record is written into Danny's Personal Data Server (PDS), so any AT-aware reader can discover and index the writing, and Bluesky can render a richer link card when a danny.is URL is shared.

This doc explains how the integration works, how to operate it, and how to fix the things most likely to go wrong. It's written to stay true over time — it points at files and functions by name rather than line numbers.

## The big picture

Two record types are written to the PDS:

- **One `site.standard.publication` record** — describes the site itself (name, URL, icon, theme). Created once.
- **One `site.standard.document` record per published post** — title, canonical path, plain-text body, tags, cover image, dates.

The site does **not** run its own PDS. Records live in Danny's normal Bluesky account (`danny.is`), written with a Bluesky **app password**. A custom lexicon like `site.standard.document` is allowed because a PDS stores any record whose lexicon it doesn't specifically know about.

Three properties keep this simple and robust:

1. **No database, no stored mapping.** Each post's record key (the "rkey") is *computed* from the post itself, so the same post always maps to the same record. Nothing needs to remember "post X → record Y".
2. **Edits are free.** Re-writing a post's record uses the same computed key, and the write is an upsert (`putRecord` = create-or-replace). So syncing an edited post just overwrites its record in place; the record's address never changes.
3. **The site stays fully static.** No runtime code. The page's verification link tag is rendered at build time; the actual record is written by a separate CI job after deploy.

## How a record's key is derived (the core idea)

Every record lives at an address: `at://<did>/<collection>/<rkey>`. The `rkey` is a **TID** — a 13-character, time-sortable, base-32 key.

We derive that rkey deterministically in `src/utils/standard-site.ts` (`getDocumentRkey`):

- The **timestamp half** comes from the post's `pubDate`, reduced to its **UTC calendar date**. Using the UTC date (not the raw timestamp, and not the filename) means the key is identical whether it's computed during the build, in CI, or in a local backfill in a different timezone.
- The **uniqueness half** is a short hash of `"<collection>/<postId>"`, so two posts published on the same day still get distinct keys, and an article and a note that happen to share a slug can't collide.

Because the rkey is a pure function of the post, the build can render a link tag pointing at the record's future address *before the record exists* — and the sync job, computing the same key, writes the record to exactly that address. They always agree.

> **`postId` is the post's canonical id**, which is the `slug` frontmatter field when present, otherwise the filename stem. This is the same id Astro uses for the URL. Both the build (via `Astro.params.slug`) and the sync script (via `canonicalPostId`) must resolve it the same way — if they ever diverge, the link tag and the record would point at different addresses.

## The moving parts

| File | Responsibility |
| --- | --- |
| `src/utils/standard-site.ts` | The single source of truth for the shared logic: `getDocumentRkey`, `getDocumentPath`, `qualifiesForStandardSite`, `getDocumentUri`. Imported by both the build and the sync script. |
| `src/components/layout/BaseHead.astro` | Renders the `<link rel="site.standard.document">` tag on qualifying posts and `<link rel="site.standard.publication">` on the homepage. |
| `src/layouts/Article.astro`, `src/layouts/Note.astro` | Compute each post's document AT-URI (via `getDocumentUri`) and pass it to `BaseHead`. |
| `src/pages/standard-site-publication.ts` | An endpoint that returns the publication AT-URI as plain text. Reached at the canonical `/.well-known/site.standard.publication` via a rewrite (see below). |
| `vercel.output-config.json` | Rewrites `/.well-known/site.standard.publication` to the endpoint above. |
| `scripts/standard-site/auth.ts` | Logs into the PDS with an app password; returns an authenticated agent + DID. |
| `scripts/standard-site/create-publication.ts` | Creates/updates the one `site.standard.publication` record (with icon + theme). Run once during setup. |
| `scripts/standard-site/sync-document.ts` | Creates/updates/deletes `site.standard.document` records. Run by CI and for backfill. |
| `.github/workflows/standard-site-sync.yml` | After a successful deploy, finds added/modified posts and syncs their records. |
| `src/config/site.ts` → `CONFIG.standardSite` | Configuration: the DID, handle, publication AT-URI, and the `since` cutoff. |

## What gets published

A post qualifies for a record when `qualifiesForStandardSite` returns true. That mirrors the site's normal "is this published?" rule and adds a couple of exclusions:

- **Excluded:** drafts, styleguide pages, and **externally-hosted posts** (anything with a `redirectURL` — e.g. articles that live on Medium, whose danny.is page only redirects away). External posts are excluded even with `--force`.
- **Cutoff:** only posts on or after `CONFIG.standardSite.since` qualify. It's intentionally set before the first post so the entire corpus is covered.

When `CONFIG.standardSite.did` is empty (the pre-go-live state), `getDocumentUri` returns nothing and no link tags render — the integration is dormant until configured.

### Fields on a document record

Always: `site` (the publication), `title`, `publishedAt`, `path` (the canonical URL path), and `textContent` (a plain-text approximation of the body — markdown and MDX `import`/JSX are stripped). When available: `description`, `tags`, `updatedAt` (from `updatedDate`, articles only), and `coverImage`.

`coverImage` is the post's **generated OG image**, fetched over HTTP from the live site and uploaded as a blob. It's fetched at sync time (after deploy), so the image is already published. The cover is for other AT readers' thumbnails; Bluesky's own card still uses the page's `og:image` meta tag.

## The lifecycle of a post

1. **Build** renders the verification link tag into the page `<head>` (address computed, record may not exist yet).
2. **Deploy** ships the static site.
3. **The sync workflow** runs after the deploy completes, diffs the deploy's commit for added/modified files under `src/content/`, and upserts a record for each.
4. **Edits** to an existing post flow through the same path: the workflow detects the modified file and re-writes the record at the same key.
5. **Deletes** are not automatic. If a post is removed or unpublished, delete its record by hand (see below).

## Operating it

All commands run from the repo root. The app password is passed as an environment variable (`ATPROTO_APP_PASSWORD`); it is never committed.

```bash
# Create or update the publication record (one-time setup; idempotent)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:publication

# Preview what would be written for every post, without writing
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all --dry-run

# Backfill / re-sync every post
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all

# Sync specific posts (what CI does, automatically)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- src/content/notes/2026-06-15-example.mdx

# Delete one post's record, or wipe all document records (full undo)
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete src/content/notes/2026-06-15-example.mdx
ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete --all
```

Flags: `--dry-run` (preview, no writes — also skips the cover upload), `--all` (every post in both collections), `--force` (ignore the `since` cutoff; still never publishes drafts/styleguides/external posts), `--delete` (remove instead of upsert).

In CI, the same `sync-document.ts` runs from `.github/workflows/standard-site-sync.yml`, reading the app password from the `ATPROTO_APP_PASSWORD` repository secret. It can also be triggered by hand from the Actions tab (with a single `post_path` and a `dry_run` toggle that defaults on).

To inspect what's actually on the network, browse the repo at <https://pdsls.dev/> (look up `danny.is`).

## Configuration

`CONFIG.standardSite` in `src/config/site.ts`:

- `did` — the AT Protocol DID for `danny.is`. Public. Empty until set up.
- `handle` — the login handle (`danny.is`).
- `publicationUri` — the `at://…` URI of the publication record, produced by `standard-site:publication`. Public. Empty until set up.
- `since` — only posts on/after this date are published.

`did` and `publicationUri` ship empty as placeholders typed `as string` — this is deliberate (see "Things to respect" below).

## Troubleshooting

**`/.well-known/site.standard.publication` returns 404.**
Either `publicationUri` isn't set in config (the endpoint returns 404 by design until it is), or the deploy that includes the value hasn't shipped. After it's set and deployed, the URL is served via a rewrite in `vercel.output-config.json` — if the rewrite is missing or reordered (it must sit before the `filesystem` handler), the dotfile path won't resolve. Note the file is *not* under `src/pages/.well-known/`: Vercel doesn't serve files from dotfile directories in this setup, so the endpoint lives at a normal path and is rewritten, mirroring `/.well-known/security.txt`.

**A post's link tag points at a record that doesn't exist (or vice-versa).**
The build and the sync must compute the same `postId` and `pubDate`. The usual cause is the canonical id: if a post has a `slug` in frontmatter, that *is* its id. Re-run the sync for that file and compare its printed rkey to the `href` in the page's link tag — they must match. Changing a post's `slug` or `pubDate` changes its rkey, which orphans the old record; delete the old one by hand.

**`coverImage` is missing on a record.**
The sync fetches the OG image from the live URL and skips it (with a warning) if the fetch fails or the image exceeds the 1 MB blob cap. A missing cover never fails the sync. If you expect one, check the OG image actually resolves at `<site>/writing/<id>/og-image.png` (or `/notes/…`) and is under 1 MB.

**CI sync didn't run / "no posts" when you expected a sync.**
The workflow triggers only after the `CI` workflow concludes successfully on `main`, and it diffs only the *tip* commit of that deploy. A post added in an earlier commit of a multi-commit push won't be detected — sync it manually (`workflow_dispatch` with its `post_path`, or `--all` locally).

**Login fails in CI or locally.**
Confirm `ATPROTO_APP_PASSWORD` is set (repo secret for CI; env var locally) and is an **app password**, not the account password. The handle defaults to `danny.is`; override with `ATPROTO_HANDLE` if needed.

**Backfilled records have wrong/old data.**
Re-running the sync overwrites in place, so just fix the source and re-run `--all` (or the specific files). To start clean, `--delete --all` then re-sync.

## Things to respect when changing this

- **Don't break rkey determinism.** The timestamp must come from `pubDate`'s UTC calendar date and the id must be the canonical `slug ?? filename`. If the build and sync ever compute keys differently, link tags and records drift apart. There are unit tests in `src/utils/standard-site.test.ts` guarding this — keep them green.
- **Keep the `.well-known` rewrite.** The endpoint must stay at a normal route with the rewrite in front of the `filesystem` handler. Don't move it into a dotfile directory.
- **Config placeholders stay typed `as string`.** `CONFIG` is `as const`; an empty literal would narrow to a type that breaks the "is it configured?" checks.
- **Blobs have a 1 MB cap.** The avatar icon and OG covers must stay under it; oversize images are skipped, not uploaded.
- **The qualification rule is shared.** Change `qualifiesForStandardSite` once and both the build and the sync follow — don't reimplement the rule in two places.

## References

- standard.site docs and lexicons: <https://standard.site/docs/>
- AT Protocol custom records: <https://atproto.com/>
- Record browser: <https://pdsls.dev/>
- Task/decision history: `docs/tasks-done/` (search for `standard-site`).
