# Task x: Scrobbles as a second AT Protocol source

## Overview

The second source built on the atproto read system (see [atproto-data.md](../developer/atproto-data.md)). Books are a small collection edited in place; scrobbles are a large append-only one. That difference is the point — this is the test that the system generalises.

**Acceptance test:** beyond the two small additions to the shared layer (phases 1 and 2), adding scrobbles should need only a registry row, a collection schema and a render. If it needs more, the system isn't finished, and the fix belongs in the shared layer rather than in scrobble-specific code.

**What we're building:** `/scratchpad/listening` — the albums I've played most in the 24 hours before the build, with cover art. Deliberately small; the feature matters less than proving the pattern.

## Decisions made (2026-09-22)

- **Rocksky, not teal.fm.** teal.fm has no public product yet (its scraper, piper, is self-host only). Rocksky is a working hosted service, and it writes teal's `fm.teal.feed.play` record alongside its own anyway, so nothing is lost.
- **Plays get in via Last.fm.** Spotify → Last.fm (Spotify's built-in link, account-wide, no software) → Rocksky's Last.fm mirror (server-side, polls every 30s). Rocksky's direct Spotify connection is in beta; switch to it if/when access arrives. Apple Music is ignored for now.
- **Record type: `app.rocksky.scrobble`.** One per play, with `title`, `artist`, `album`, `albumArtist`, `albumArtUrl` (a plain URL on Spotify's image CDN — so `atprotoImage()` gets a string, the half of it books doesn't exercise), `createdAt` (the play time), `duration` in **milliseconds**, plus MusicBrainz ids, ISRC and a Spotify link we don't need.
- **Record order is write order, not play order.** The Last.fm backfill wrote plays out of sequence. Always sort on `createdAt`; never assume rkey order is chronological. A new play is still a new newest rkey, which is all change detection needs.
- **Deploy cadence is fine.** Change detection runs every two hours, so a listening session can trigger at most twelve deploys a day.
- **Known limitation:** whoever else plays on my Spotify account is counted, exactly as on Last.fm. Not worth engineering around.

## Phases

### Phase 1: `latest` watch strategy

Fingerprinting every record is `ceil(n/100)` requests per poll — fine for 388 books, silly for years of scrobbles. `latest` fingerprints only the newest record (`rkey:cid`), which catches creates, all an append-only log has.

- [x] `listRecords()` in `src/utils/atproto/pds.ts` takes an optional `limit` and stops once it has that many, requesting no more than needed per page. (Phase 2 needs this too.)
- [x] `watch: 'latest'` in `src/config/atproto.ts`; `SourceState.watch` widens to match.
- [x] `detectChanges()` reads one record for a `latest` source (`limit: 1`) and fingerprints just that. The manifest endpoint fingerprints the entry with the greatest rkey. Both go through the same `fingerprint()` so they can't disagree.
- [x] Unit tests: `listRecords` stops at `limit`; a `latest` source is one request; a new newest record changes the fingerprint and an edit to an older one doesn't.

### Phase 2: loader `limit`

- [x] `limit?: number` on `AtprotoSource`, passed by `atprotoLoader()` to `listRecords()`. The build shouldn't page through every play ever to render one day.
- [x] Unit test that the loader stops paging at the limit.

### Phase 3: the source, schema and page

- [x] Registry row: `scrobbles: { nsid: 'app.rocksky.scrobble', watch: 'latest', limit: 300 }`.
- [x] Collection in `src/content.config.ts`: `title`, `artist`, `album`, `albumArtist`, `albumArtUrl` (optional url), `createdAt` (coerced date). Nothing else.
- [x] `src/pages/scratchpad/listening.astro`: plays in the 24h before the build, grouped by album + album artist, counted, sorted, top handful. Art via `atprotoImage(albumArtUrl, { group: 'scrobbles', maxPx: 600 })`. Noindex like the rest of `/scratchpad`. Same shape as the books grid.

### Phase 4: prove it and write it down

- [ ] Watch one detect run: one request for `app.rocksky.scrobble`, and a new play dispatches exactly one deploy.
- [x] `atproto-data.md`: document `latest` and `limit`, and note the write-order caveat.
- [ ] `bun run check:all`.
