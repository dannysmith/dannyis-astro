/**
 * standard.site (https://standard.site/) helpers.
 *
 * standard.site links posts to AT Protocol records so indexers can verify
 * authorship. Each post maps to a `site.standard.document` record keyed by a TID
 * (a timestamp-ordered AT Protocol record key). We *derive* that key
 * deterministically from the post — timestamp bits from the publish date (for
 * sortability), clock-id bits from a hash of the post id (for uniqueness among
 * same-day posts) — so the document's AT-URI is computable at build time with no
 * stored state. The sync script generates the same key, making `putRecord`
 * idempotent and edits a no-op re-sync.
 *
 * See the lexicon: https://standard.site/docs/lexicons/document/
 */

import { getConfig } from '@config/config';

/** The content collections that map to standard.site documents. */
export type StandardSiteCollection = 'articles' | 'notes';

/** The post fields the qualification rule and rkey derivation need. */
export interface StandardSitePost {
  draft?: boolean;
  styleguide?: boolean;
  pubDate: Date;
}

// AT Protocol base32-sortable alphabet (a.k.a. s32). Lexicographic order of the
// encoded string matches numeric order of the value.
const S32_CHARS = '234567abcdefghijklmnopqrstuvwxyz';
const TID_LEN = 13;
const TID_CLOCKID_MAX = 1024; // 10 bits

/** Encode a non-negative integer as a base32-sortable string. */
function s32encode(value: number): string {
  let n = value;
  let out = '';
  while (n > 0) {
    out = S32_CHARS.charAt(n % 32) + out;
    n = Math.floor(n / 32);
  }
  return out;
}

/**
 * Stable, deterministic 32-bit string hash (FNV-1a). Used to derive a TID
 * clock identifier from the post id so same-day posts get distinct keys.
 */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime, kept in 32-bit range via Math.imul.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Microseconds since the UNIX epoch for a post's publish date. Derived from the
 * `YYYY-MM-DD` prefix of the post id at UTC midnight so the value is independent
 * of the machine's timezone (the build and the CI sync must agree on the rkey,
 * and a local backfill runs in a different zone). Falls back to `pubDate` for
 * ids without a date prefix.
 */
function postTimestampMicros(postId: string, pubDate: Date): number {
  const match = postId.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const millis = match
    ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : pubDate.getTime();
  return millis * 1000;
}

/**
 * Build a valid AT Protocol TID for a post's `site.standard.document` record.
 *
 * The TID is 13 base32-sortable chars: an 11-char timestamp prefix (microseconds
 * since the UNIX epoch, from the post's publish date) plus a 2-char clock
 * identifier derived from `collection`/`postId`. Deterministic and
 * timezone-independent: the same inputs always yield the same key on any machine.
 * The collection is folded into the hash so an article and a note that share a
 * slug *and* date can't collide on the same key.
 *
 * @param collection - The content collection (`articles` or `notes`)
 * @param postId - Post id/slug (e.g. "2012-06-05-a-simpler-responsive-grid")
 * @param pubDate - Publish date (fallback when `postId` has no date prefix)
 */
export function getDocumentRkey(
  collection: StandardSiteCollection,
  postId: string,
  pubDate: Date
): string {
  const timestampMicros = postTimestampMicros(postId, pubDate);
  const clockid = hashString(`${collection}/${postId}`) % TID_CLOCKID_MAX;
  const tid =
    s32encode(timestampMicros).padStart(TID_LEN - 2, '2') + s32encode(clockid).padStart(2, '2');
  return tid;
}

/**
 * The canonical site path for a post — the single definition used for the
 * document record's `path` field. Mirrors the route patterns in
 * `src/pages/{writing,notes}/[...slug]`.
 */
export function getDocumentPath(collection: StandardSiteCollection, postId: string): string {
  const base = collection === 'articles' ? 'writing' : 'notes';
  return `/${base}/${postId}/`;
}

/**
 * Whether a post should be published to standard.site. Mirrors the site's
 * existing "is this published?" rule (`filterContentForListing`): excludes
 * drafts and styleguide pages. Adds the `since` cutoff so backfill scope is
 * configurable. Unlike `filterContentForListing`, drafts are *always* excluded
 * (never push a draft to the network, even from a local dry-run). Returns false
 * when no cutoff is configured.
 */
export function qualifiesForStandardSite({
  draft,
  styleguide,
  pubDate,
}: StandardSitePost): boolean {
  if (draft || styleguide) return false;
  const { since } = getConfig().standardSite;
  if (!since) return false;
  return pubDate.getTime() >= new Date(since).getTime();
}

/**
 * Full AT-URI of a post's `site.standard.document` record, or null when the post
 * doesn't qualify or no DID is configured. Used to render the document link tag.
 */
export function getDocumentUri(
  collection: StandardSiteCollection,
  postId: string,
  post: StandardSitePost
): string | null {
  const { did } = getConfig().standardSite;
  if (!did || !qualifiesForStandardSite(post)) return null;
  return `at://${did}/site.standard.document/${getDocumentRkey(collection, postId, post.pubDate)}`;
}
