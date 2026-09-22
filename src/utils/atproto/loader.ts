/**
 * A Content Layer loader for one collection of records on my PDS. Give it an
 * NSID; each record becomes an entry keyed by its rkey, validated against the
 * collection's schema in src/content.config.ts. With a `limit`, only the
 * newest that many records are loaded, and older entries leave the store.
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
import { getConfig } from '@config/config'
import { errorMessage, listRecords, rkeyOf, type PdsRecord } from '@utils/atproto/pds'

export function atprotoLoader({ nsid, limit }: { nsid: string; limit?: number }): Loader {
  return {
    name: 'atproto-loader',
    async load({ store, parseData, logger }) {
      const { did, pdsHost: host } = getConfig().atproto

      // Everything is fetched before the store is touched, so a failure part-way
      // through leaves the last build's entries intact rather than half of them.
      const records: PdsRecord[] = []
      try {
        for await (const record of listRecords(nsid, { did, host }, { limit })) {
          records.push(record)
        }
      } catch (error) {
        logger.warn(
          `Could not read ${nsid} (${errorMessage(error)}). Keeping the ${store.keys().length} entries from the last build.`,
        )
        return
      }

      const loaded = new Set<string>()
      for (const record of records) {
        const id = rkeyOf(record.uri)
        try {
          const data = await parseData({ id, data: record.value })
          // The CID is a hash of the record, so it is already the digest: set()
          // skips entries whose CID hasn't moved, and the state manifest
          // fingerprints the collection from it.
          store.set({ id, data, digest: record.cid })
          loaded.add(id)
        } catch (error) {
          logger.warn(
            `Skipping ${nsid}/${id}, which doesn't fit the schema: ${errorMessage(error)}`,
          )
        }
      }

      // Whatever wasn't loaded this time was deleted upstream, no longer fits,
      // or has aged past the limit.
      for (const id of store.keys()) {
        if (!loaded.has(id)) store.delete(id)
      }

      logger.info(`Loaded ${loaded.size} ${nsid} records`)
    },
  }
}
