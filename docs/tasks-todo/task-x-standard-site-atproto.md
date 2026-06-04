# Publish articles & notes to the ATmosphere (standard.site / AT Protocol)

## Status

Phases 1–4 are built and committed on branch `standard-site-atproto`; the publication record and a 132-record backfill are already written to the PDS. **Remaining: merge the PR, then verify and test the automation on the live site** (the checklist in Phase 5). Complete the task with `bun task:complete standard-site-atproto` once verified.

How the shipped system works day-to-day (and troubleshooting) lives in [`docs/developer/standard-site.md`](../developer/standard-site.md) — that's the reference; this doc is the record of how we got here.

## What this does

When an article or note is published on danny.is, it's mirrored into the `danny.is` Bluesky PDS as a `site.standard.document` record (plus one `site.standard.publication` record for the site), using the community [standard.site](https://standard.site/) lexicons. This puts the writing on the AT network and lets Bluesky render enhanced link cards.

It's a faithful adaptation of [Ben Balter's implementation](https://github.com/benbalter/benbalter.github.com/commit/69703cee964ad27e79e58dce455bcd79fa4b8bed). Two properties keep it low-risk: no self-hosted PDS (a normal account + app password can write custom-lexicon records), and no stored state (each post's record key is derived deterministically from `(collection, slug, pubDate)`, so the build can render the verification `<link>` tag before the record exists and edits are just an idempotent re-sync). The site stays fully static.

## Key decisions

- **Scope:** articles and notes.
- **Qualification** reuses the site's "is this published?" rule (`filterContentForListing`: no drafts, no styleguides) plus an exclusion for externally-hosted posts (`redirectURL`), all centralised in `qualifiesForStandardSite`. No future-date embargo (the site doesn't embargo future dates anywhere, and it would break the deterministic model).
- **Backfill** the whole archive (`since` set before the first post).
- **Auto-sync** added *and* modified posts after each deploy, so edits propagate.
- **Enrichment** beyond the minimum: `updatedAt` (articles), `coverImage` (the post's generated OG image), and on the publication, `icon` (avatar) + `basicTheme` (brand palette).
- **Deferred:** `bskyPostRef` (Bluesky thread as comments) and a rich/markdown body — `standard.site` has no canonical body format yet, so we publish plaintext `textContent` and point `path`/`site` at the canonical HTML.
- **Dependencies:** `@atproto/api` and `gray-matter`, both dev-only (build/CI scripts, never shipped to the browser).

## How it was built

- **Phase 1 — core logic ✅** `src/utils/standard-site.ts` (+ tests): the deterministic rkey, canonical path, qualification predicate, and AT-URI builder, shared by the build and the sync script.
- **Phase 2 — verification surface ✅** `<link>` tags via `BaseHead.astro` + the two layouts, and the publication endpoint at `src/pages/standard-site-publication.ts` (served at `/.well-known/site.standard.publication` through a `vercel.output-config.json` rewrite).
- **Phase 3 — scripts ✅** `scripts/standard-site/{auth,create-publication,sync-document}.ts` and the `standard-site:*` package scripts (app-password auth, one-time publication record, document upsert/delete with `--all`/`--force`/`--delete`/`--dry-run`).
- **Phase 4 — CI ✅** `.github/workflows/standard-site-sync.yml` runs after a successful deploy, diffs the commit for added/modified posts, and syncs them.
- **Phase 5 — go-live (manual) ⬜** the checklist below.

### Non-obvious things we hit (detail in the dev doc)

- The rkey timestamp comes from `pubDate`'s **UTC calendar date**, not the filename — post ids are `slug ?? filename` and ~half have no date prefix. Build and sync must resolve that id identically.
- The `.well-known` route uses the `security.txt` pattern (a normal route + rewrite) because Vercel won't serve a dotfile-directory route here.
- `icon`/`coverImage` are blobs (uploaded, 1 MB cap), and theme colours are RGB integer objects, not hex.
- `CONFIG` is `as const`, so the empty `did`/`publicationUri` placeholders are typed `as string` to keep the null-checks working.

## Phase 5 — go-live checklist (manual)

Done so far: ✅ app password + GitHub secret `ATPROTO_APP_PASSWORD`, ✅ `did` + `publicationUri` set in `src/config/site.ts`, ✅ publication record created, ✅ `--all` backfill (132 records). Remaining:

1. **Merge** `standard-site-atproto` → `main` and let it deploy. The live site then renders the link tags (pointing at the already-written records) and serves the `.well-known` endpoint.
2. **Verify:** `curl https://danny.is/.well-known/site.standard.publication` returns the publication AT-URI; records show up for `danny.is` on <https://pdsls.dev/>; view-source a post for its `site.standard.document` tag; optionally share a danny.is link on Bluesky to see the enhanced card.
3. **Test the automation:** publish a new note (`bun run newnote`), push, and confirm the *Sync posts to standard.site* workflow creates its record after deploy. (A manual `workflow_dispatch` with a `post_path` and `dry_run: true` previews without writing.)
4. **Complete:** `bun task:complete standard-site-atproto`.

If anything looks wrong, see the troubleshooting section of the [dev doc](../developer/standard-site.md).

## Rollback

`ATPROTO_APP_PASSWORD=… bun run standard-site:sync -- --delete --all` wipes every document record; delete the publication record via pdsls.dev. The code reverts cleanly — the only new deps are dev-only.
