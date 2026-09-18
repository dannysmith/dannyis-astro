/**
 * A minimal client for reading public records from a PDS. Everything here is
 * unauthenticated, so there is no session, no SDK and no dependency — just
 * `fetch`.
 *
 * Keep it that way: no `astro:*` and no npm imports. The change-detection
 * script (scripts/atproto/detect-changes.ts) runs this file under bun in CI
 * with no install step.
 *
 * See docs/developer/atproto-data.md.
 */

/** Which repo to read, and the host to read it from. */
export interface Repo {
  did: string
  host: string
}

/** A record as `listRecords` returns it. `cid` changes whenever `value` does. */
export interface PdsRecord {
  uri: string
  cid: string
  value: Record<string, unknown>
}

/** Transient server and rate-limit errors, as opposed to a request that is simply wrong. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

/** The most `listRecords` allows; 101 is rejected. */
const PAGE_SIZE = 100

const REQUEST_TIMEOUT_MS = 15_000

/**
 * `fetch` with exponential backoff (0.5s, 1s, 2s by default).
 *
 * Not optional: `bsky.network` intermittently 500s on perfectly valid requests,
 * and without this a single blip loses the whole collection. Retryable statuses,
 * network errors and timeouts are retried; a genuine 4xx is returned at once.
 * When the attempts run out, the last response is returned, or the last error
 * thrown.
 */
export async function fetchWithRetry(
  url: string,
  { attempts = 4, delayMs = 500 }: { attempts?: number; delayMs?: number } = {},
): Promise<Response> {
  for (let i = 0; ; i++) {
    const last = i >= attempts - 1
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (response.ok || last || !RETRYABLE_STATUSES.has(response.status)) return response
      await response.body?.cancel()
    } catch (error) {
      if (last) throw error
    }
    await new Promise(resolve => setTimeout(resolve, delayMs * 2 ** i))
  }
}

/**
 * Every record in a collection, newest first, fetched a page at a time.
 *
 * Stops on a short page rather than waiting for the cursor to go missing: the
 * PDS can hand back a cursor on the final page, and following it costs a
 * request that returns nothing. Throws if any page fails, so a caller never
 * mistakes half a collection for all of it.
 */
export async function* listRecords(
  nsid: string,
  { did, host }: Repo,
): AsyncGenerator<PdsRecord, void, undefined> {
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({ repo: did, collection: nsid, limit: String(PAGE_SIZE) })
    if (cursor) params.set('cursor', cursor)

    const response = await fetchWithRetry(
      `https://${host}/xrpc/com.atproto.repo.listRecords?${params}`,
    )
    if (!response.ok) throw new Error(`listRecords ${nsid} returned ${response.status}`)

    const page = (await response.json()) as { records: PdsRecord[]; cursor?: string }
    yield* page.records
    cursor = page.records.length < PAGE_SIZE ? undefined : page.cursor
  } while (cursor)
}

/** Something to put in a log line, whatever was thrown. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** The record key: the last segment of `at://<did>/<collection>/<rkey>`. */
export function rkeyOf(uri: string): string {
  return uri.slice(uri.lastIndexOf('/') + 1)
}

/** Where a blob's bytes can be fetched from, given the CID in its `ref.$link`. */
export function blobUrl(cid: string, { did, host }: Repo): string {
  const params = new URLSearchParams({ did, cid })
  return `https://${host}/xrpc/com.atproto.sync.getBlob?${params}`
}
