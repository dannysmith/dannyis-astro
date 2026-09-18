/**
 * A short hash standing for the exact state of a collection: which records it
 * holds, and which version of each.
 *
 * The build computes it from what it loaded and publishes it; change detection
 * computes it from the PDS and compares. They agree only if nothing was
 * created, edited or deleted in between. Both sides must use this function —
 * and like pds.ts, it runs under bun with no install step, so no npm imports.
 */

import { createHash } from 'node:crypto'

export function fingerprint(records: Iterable<{ rkey: string; cid: string }>): string {
  // Sorted, because the PDS and the content store don't promise the same order.
  const lines = Array.from(records, ({ rkey, cid }) => `${rkey}:${cid}`).sort()
  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16)
}
