/**
 * What this build loaded from my PDS: a fingerprint of every watched
 * collection in src/config/atproto.ts.
 *
 * Change detection (.github/workflows/atproto-detect-changes.yml) fetches this
 * from the live site, recomputes the fingerprints from the PDS, and rebuilds
 * the site when they differ. See src/utils/atproto/changes.ts for the other
 * half, and docs/developer/atproto-data.md.
 *
 * It is computed from the content store, which is by definition what the build
 * rendered — not from a fresh fetch, which could include a record written
 * half-way through the build and mark it as shipped when it isn't.
 *
 * Deploy-target-neutral, like redirects.json. Excluded from the sitemap
 * (astro.config).
 */
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getConfig } from '@config/config'
import { ATPROTO_SOURCES } from '@config/atproto'
import { fingerprint } from '@utils/atproto/fingerprint'
import type { SourceState, StateManifest } from '@utils/atproto/changes'

export const prerender = true

export const GET: APIRoute = async () => {
  const { did, pdsHost: host } = getConfig().atproto

  const sources: SourceState[] = []
  for (const [collection, { nsid, watch }] of Object.entries(ATPROTO_SOURCES)) {
    if (!watch) continue

    // The loader stores each record under its rkey, with its CID as the digest
    // (which Astro types loosely, hence the String).
    const entries = await getCollection(collection as keyof typeof ATPROTO_SOURCES)
    sources.push({
      nsid,
      watch,
      fingerprint: fingerprint(
        entries.map(entry => ({ rkey: entry.id, cid: String(entry.digest) })),
      ),
      count: entries.length,
    })
  }

  const manifest: StateManifest = {
    version: 1,
    did,
    host,
    builtAt: new Date().toISOString(),
    sources,
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
