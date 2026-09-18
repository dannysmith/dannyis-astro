/**
 * Reading public AT Protocol records from my PDS into the site at build time.
 * The other direction — writing — is src/utils/standard-site.ts.
 *
 * `loader.ts` turns a collection into content entries, `image.ts` brings a
 * record's images onto our domain, and underneath them `pds.ts` talks to the
 * network and `fingerprint.ts` summarises a collection's state.
 *
 * Scripts import `pds.ts` and `fingerprint.ts` directly rather than from here:
 * they run without node_modules, and this barrel reaches Astro and sharp.
 *
 * See docs/developer/atproto-data.md for how to add a source.
 */

export { atprotoLoader, blobRef } from '@utils/atproto/loader'
export { atprotoImage } from '@utils/atproto/image'
