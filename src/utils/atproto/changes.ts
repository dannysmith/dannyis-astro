/**
 * Has anything the site shows changed on the PDS since the site was last built?
 *
 * The build publishes what it loaded as a manifest (src/pages/atproto-state.json.ts):
 * one fingerprint per watched collection. `detectChanges()` fetches that from
 * the live site, recomputes each fingerprint from the PDS, and compares. There
 * is no other state, which makes it self-healing: a deploy that fails leaves
 * the old manifest in place, so the difference is still there next time.
 *
 * Everything it needs is in the manifest — the repo, the host, which
 * collections — so a new source is watched from its first deploy with nothing
 * to configure here.
 *
 * Runs under bun in CI with no install step (scripts/atproto/detect-changes.ts),
 * hence no npm imports, and relative imports rather than path aliases:
 * tsconfig.json extends a file in node_modules, which isn't there.
 */

import { createHash } from 'node:crypto'
import { fingerprint } from './fingerprint.ts'
import { fetchWithRetry, listRecords, rkeyOf } from './pds.ts'

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
      /** Which collections differ, for the log. */
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
 * Anything that stops us knowing for sure — no manifest yet, the PDS down, one
 * collection failing — is reported as "not changed" with the reason. A rebuild
 * is only ever triggered by a difference we actually observed; the next run
 * tries again.
 */
export async function detectChanges(manifestUrl: string): Promise<Detection> {
  let manifest: StateManifest
  try {
    const response = await fetchWithRetry(manifestUrl)
    if (!response.ok) return unsure(`the manifest returned ${response.status}`)
    manifest = (await response.json()) as StateManifest
  } catch (error) {
    return unsure(`the manifest could not be read (${reason(error)})`)
  }
  if (manifest.version !== 1 || !Array.isArray(manifest.sources)) {
    return unsure('the manifest is not in a shape this script understands')
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
      return unsure(`${source.nsid} could not be read (${reason(error)})`)
    }

    const now = fingerprint(records)
    current.push(`${source.nsid}=${now}`)
    if (now !== source.fingerprint) changedSources.push(source.nsid)
  }

  if (changedSources.length === 0) return { changed: false, reason: 'nothing has changed' }

  const state = createHash('sha256').update(current.sort().join('\n')).digest('hex').slice(0, 12)
  return { changed: true, changedSources, state, builtAt: manifest.builtAt }
}

function unsure(why: string): Detection {
  return { changed: false, reason: why }
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
