/**
 * A Content Layer loader for one collection of records on my PDS. Give it an
 * NSID; each record becomes an entry keyed by its rkey, validated against the
 * collection's schema in src/content.config.ts.
 *
 * It never fails the build. The PDS belongs to someone else and the records are
 * often written by someone else's app, and neither should be able to stop an
 * article shipping:
 *
 *   • If the collection can't be read, the entries from the last build stay as
 *     they are — the content store persists in node_modules/.astro.
 *   • If one record doesn't fit the schema (an app changed its lexicon), that
 *     record is skipped and the rest load.
 *
 * Both are logged as warnings.
 */

import type { Loader } from 'astro/loaders'
import { z } from 'astro/zod'
import { getConfig } from '@config/config'
import { listRecords, rkeyOf, type PdsRecord } from '@utils/atproto/pds'

/**
 * A blob as it appears inside a record — a reference to bytes, not a URL. Use
 * it in a collection schema, and hand the parsed value to `atprotoImage()`.
 */
export const blobRef = z.object({
  $type: z.literal('blob'),
  ref: z.object({ $link: z.string() }),
  mimeType: z.string(),
  size: z.number(),
})

export type BlobRef = z.infer<typeof blobRef>

export function atprotoLoader({ nsid }: { nsid: string }): Loader {
  return {
    name: 'atproto-loader',
    async load({ store, parseData, logger }) {
      const { did, pdsHost: host } = getConfig().atproto

      // Everything is fetched before the store is touched, so a failure part-way
      // through leaves the last build's entries intact rather than half of them.
      const records: PdsRecord[] = []
      try {
        for await (const record of listRecords(nsid, { did, host })) records.push(record)
      } catch (error) {
        logger.warn(
          `Could not read ${nsid} (${reason(error)}). Keeping the ${store.keys().length} entries from the last build.`,
        )
        return
      }

      const loaded = new Set<string>()
      for (const record of records) {
        const id = rkeyOf(record.uri)
        try {
          const data = await parseData({ id, data: record.value })
          // The CID is a hash of the record, so it is already the digest: set()
          // skips entries whose CID hasn't moved, and routes can build a
          // cacheKey from it with contentCacheKey().
          store.set({ id, data, digest: record.cid })
          loaded.add(id)
        } catch (error) {
          logger.warn(`Skipping ${nsid}/${id}, which doesn't fit the schema: ${reason(error)}`)
        }
      }

      // Whatever wasn't loaded this time was deleted upstream, or no longer fits.
      for (const id of store.keys()) {
        if (!loaded.has(id)) store.delete(id)
      }

      logger.info(`Loaded ${loaded.size} ${nsid} records`)
    },
  }
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
