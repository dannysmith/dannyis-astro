/**
 * Images that belong to a record, copied onto our own domain at build time.
 *
 * Apps disagree about how to attach one. Some store a blob on the PDS
 * (BookHive's covers); others just store a URL on their own CDN (Rocksky's
 * album art). `atprotoImage()` takes either, so a page doesn't have to care.
 *
 * Call it where the image is rendered, not in the loader: only images a page
 * actually shows are ever downloaded.
 *
 * A blob is fetched from my repo unless `repo` says otherwise — an app's own
 * repo, say, when it keeps the image there rather than on each user's record.
 */

import { z } from 'astro/zod'
import { getConfig } from '@config/config'
import { blobUrl, type Repo } from '@utils/atproto/pds'
import { mirrorImage, type MirroredImage, type MirrorOptions } from '@utils/mirrorImage'

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

export async function atprotoImage(
  source: z.infer<typeof blobRef> | string | undefined,
  { group, maxPx, repo = myRepo() }: Pick<MirrorOptions, 'group' | 'maxPx'> & { repo?: Repo },
): Promise<MirroredImage | null> {
  if (!source) return null

  const url = typeof source === 'string' ? source : blobUrl(source.ref.$link, repo)

  return mirrorImage(url, {
    group,
    maxPx,
    // Leading newline: these land mid-render, in the middle of Astro's progress lines.
    onProblem: detail => console.warn(`\nCould not mirror an image for ${group}: ${detail}`),
  })
}

function myRepo(): Repo {
  const { did, pdsHost: host } = getConfig().atproto
  return { did, host }
}
