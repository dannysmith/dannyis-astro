/**
 * Images that belong to a record, copied onto our own domain at build time.
 *
 * Apps disagree about how to attach one. Some store a blob on the PDS
 * (BookHive's covers); others just store a URL on their own CDN (Rocksky's
 * album art). `atprotoImage()` takes either, so a page doesn't have to care.
 *
 * Call it where the image is rendered, not in the loader: only images a page
 * actually shows are ever downloaded.
 */

import { getConfig } from '@config/config'
import { blobUrl } from '@utils/atproto/pds'
import type { BlobRef } from '@utils/atproto/loader'
import { mirrorImage, type MirroredImage, type MirrorOptions } from '@utils/mirrorImage'

export async function atprotoImage(
  source: BlobRef | string | undefined,
  { group, maxPx }: Pick<MirrorOptions, 'group' | 'maxPx'>,
): Promise<MirroredImage | null> {
  if (!source) return null

  const { did, pdsHost: host } = getConfig().atproto
  const url = typeof source === 'string' ? source : blobUrl(source.ref.$link, { did, host })

  return mirrorImage(url, {
    group,
    maxPx,
    // Leading newline: these land mid-render, in the middle of Astro's progress lines.
    onProblem: detail => console.warn(`\nCould not mirror an image for ${group}: ${detail}`),
  })
}
