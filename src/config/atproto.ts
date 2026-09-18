/**
 * Every AT Protocol collection this site reads from my PDS — the one place to
 * add a new source. Each key is also the name of its content collection in
 * src/content.config.ts, which is where the schema lives.
 *
 * `watch` says whether a change to the collection should rebuild the site:
 *
 *   • 'digest' — yes. Every record's rkey and CID is fingerprinted, so creates,
 *     edits and deletes are all noticed.
 *   • false    — no. The data still loads, and refreshes whenever the site is
 *     next built for some other reason.
 *
 * Never watch `site.standard.document`: our own post-deploy sync writes those
 * records, so every deploy would trigger another.
 *
 * See docs/developer/atproto-data.md.
 */

export interface AtprotoSource {
  /** The collection's NSID on the PDS, e.g. `buzz.bookhive.book`. */
  nsid: string
  watch: 'digest' | false
}

export const ATPROTO_SOURCES = {
  // Books tracked in BookHive (https://bookhive.buzz).
  books: { nsid: 'buzz.bookhive.book', watch: 'digest' },
} as const satisfies Record<string, AtprotoSource>
