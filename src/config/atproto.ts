/**
 * Every AT Protocol collection this site reads from my PDS — the one place to
 * add a new source. Each key is also the name of its content collection in
 * src/content.config.ts, which is where the schema lives.
 *
 * `watch` says whether a change to the collection should rebuild the site:
 *
 *   • 'digest' — yes. Every record's rkey and CID is fingerprinted, so creates,
 *     edits and deletes are all noticed. One request per hundred records, so
 *     for collections that stay small.
 *   • 'latest' — yes, but only the newest record is fingerprinted, in one
 *     request however large the collection. Catches creates only, which is all
 *     an append-only log ever has.
 *   • false    — no. The data still loads, and refreshes whenever the site is
 *     next built for some other reason.
 *
 * `limit` caps how many records a build loads (newest first). Set it for
 * collections that only grow, so a page of recent activity doesn't fetch the
 * whole history.
 *
 * Never watch `site.standard.document`: our own post-deploy sync writes those
 * records, so every deploy would trigger another.
 *
 * See docs/developer/atproto-data.md.
 */

export interface AtprotoSource {
  /** The collection's NSID on the PDS, e.g. `buzz.bookhive.book`. */
  nsid: string
  watch: 'digest' | 'latest' | false
  limit?: number
}

export const ATPROTO_SOURCES = {
  // Books tracked in BookHive (https://bookhive.buzz).
  books: { nsid: 'buzz.bookhive.book', watch: 'digest' },
  // Plays scrobbled by Rocksky (https://rocksky.app). Append-only; a day's
  // listening is a few dozen records.
  scrobbles: { nsid: 'app.rocksky.scrobble', watch: 'latest', limit: 300 },
} as const satisfies Record<string, AtprotoSource>
