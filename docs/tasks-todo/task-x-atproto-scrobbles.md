# Task x: Scrobbles as a second AT Protocol source

## Overview

The second source built on the atproto read system (see [atproto-data.md](../developer/atproto-data.md), delivered by the atproto data system task). Books are a small collection edited in place; scrobbles are a large append-only one. That difference is the point — this is the test that the system generalises.

**Acceptance test:** beyond the two small additions to the shared layer listed below, adding scrobbles should need only a registry row, a collection schema and a render. If it needs more, the system isn't finished, and the fix belongs in the shared layer rather than in scrobble-specific code.

**Before starting:** sign up for teal.fm and/or Rocksky and let some history accumulate. This needs real records to be a real test.

## What append-only collections need from the shared layer

- **A `latest` watch strategy.** Fingerprinting every record is `ceil(n/100)` requests per poll, which is fine for 248 books and silly for years of scrobbles. `latest` fingerprints only the newest record (`limit=1`, one request). It catches creates only, which is all an append-only log has. Both sides need it: `fingerprint()` and `detectChanges()` in `src/utils/atproto/changes.ts`, and the state manifest endpoint.
- **A loader `limit`.** The build shouldn't page through every scrobble ever to render "recently played". `atprotoLoader({ nsid, limit: 200 })` stops the generator early. If top-artists-this-month ever needs more history, revisit with incremental loading via the loader's `meta` store (remember the newest rkey, fetch only past it).

## Choices to make

- **Which record type.** `fm.teal.feed.play` is the more widely-read schema (Rocksky and multi-scrobbler write it too). `app.rocksky.scrobble` has a working public API and puts album art on a plain URL rather than needing MusicBrainz lookups. Running multi-scrobbler feeds both.
- **Mind the unit mismatch:** teal's `duration` is seconds, Rocksky's is milliseconds.
- **What to show.** Something small — recently played, or top artists this month. The feature matters less than proving the pattern. Hidden under `/scratchpad` is fine to start.

## Proposed approach

- [ ] Add `latest` to `src/utils/atproto/changes.ts` and the manifest endpoint, with unit tests.
- [ ] Add `limit` to `atprotoLoader`, with a unit test that it stops paging.
- [ ] Registry row with `watch: 'latest'`, collection schema, a small render.
- [ ] Album art through `atprotoImage(url, 'scrobbles')` — a plain URL here, not a blob, which exercises the other half of that helper.
- [ ] Confirm one request per poll for this source, and that a new scrobble triggers exactly one deploy.
- [ ] Decide whether scrobble-triggered deploys are too frequent at the current cadence. If a listening session means a deploy every 10 minutes, consider `watch: false` plus relying on other deploys, or a slower cadence for this source.
- [ ] Update `atproto-data.md` with the `latest` strategy and `limit`.
