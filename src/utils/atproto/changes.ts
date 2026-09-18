/**
 * Has anything the site shows changed on the PDS since it was last built?
 *
 * The build publishes a manifest (src/pages/atproto-state.json.ts) with one
 * fingerprint per watched collection. `detectChanges()` fetches it from the
 * live site, recomputes each fingerprint from the PDS, and compares. There is
 * no other state, so it heals itself: a deploy that fails leaves the old
 * manifest in place, and the difference is still there next time.
 *
 * Runs under bun in CI with no install step (scripts/atproto/detect-changes.ts),
 * hence no npm imports, and relative imports rather than path aliases:
 * tsconfig.json extends a file in node_modules, which isn't there.
 */

import { createHash } from 'node:crypto'
import { errorMessage, fetchWithRetry, listRecords, rkeyOf } from './pds.ts'

export interface SourceState {
  nsid: string
  /** How the fingerprint was made. Only 'digest' exists: every record's rkey and CID. */
  watch: 'digest'
  fingerprint: string
  count: number
}

export interface StateManifest {
  version: 1
  did: string
  host: string
  /** When the build that emitted this ran, as an ISO timestamp. */
  builtAt: string
  sources: SourceState[]
}

export type Detection =
  | { changed: false; reason: string }
  | {
      changed: true
      changedSources: string[]
      /**
       * A short hash of the PDS's state across every watched collection. The
       * workflow names the deploy it dispatches after this, so it can tell that
       * a given state has already been tried and not dispatch it twice.
       */
      state: string
      builtAt: string
    }

/**
 * A short hash standing for the exact state of a collection: which records it
 * holds, and which version of each. The build and `detectChanges()` must both
 * use this, or they will never agree.
 */
export function fingerprint(records: Iterable<{ rkey: string; cid: string }>): string {
  // Sorted, because the PDS and the content store don't promise the same order.
  const lines = Array.from(records, ({ rkey, cid }) => `${rkey}:${cid}`).sort()
  return shortHash(lines, 16)
}

/**
 * Anything that stops us knowing for sure — no manifest yet, the PDS down, one
 * collection failing — is reported as "not changed", with the reason. A rebuild
 * is only ever triggered by a difference we actually observed.
 */
export async function detectChanges(manifestUrl: string): Promise<Detection> {
  let manifest: StateManifest
  try {
    const response = await fetchWithRetry(manifestUrl)
    if (!response.ok) return noRebuild(`the manifest returned ${response.status}`)
    manifest = (await response.json()) as StateManifest
  } catch (error) {
    return noRebuild(`the manifest could not be read (${errorMessage(error)})`)
  }
  if (manifest.version !== 1 || !Array.isArray(manifest.sources)) {
    return noRebuild('the manifest is not in a shape this script understands')
  }

  const { did, host } = manifest
  const current: string[] = []
  const changedSources: string[] = []

  for (const source of manifest.sources) {
    const records: { rkey: string; cid: string }[] = []
    try {
      for await (const { uri, cid } of listRecords(source.nsid, { did, host })) {
        records.push({ rkey: rkeyOf(uri), cid })
      }
    } catch (error) {
      return noRebuild(`${source.nsid} could not be read (${errorMessage(error)})`)
    }

    const now = fingerprint(records)
    current.push(`${source.nsid}=${now}`)
    if (now !== source.fingerprint) changedSources.push(source.nsid)
  }

  if (changedSources.length === 0) return noRebuild('nothing has changed')
  return {
    changed: true,
    changedSources,
    state: shortHash(current.sort(), 12),
    builtAt: manifest.builtAt,
  }
}

function noRebuild(reason: string): Detection {
  return { changed: false, reason }
}

function shortHash(lines: string[], length: number): string {
  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, length)
}
