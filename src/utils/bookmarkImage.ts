/**
 * Build-time download and re-encode of the preview images BookmarkCards show.
 *
 * We serve these ourselves rather than pointing an <img> at someone else's CDN.
 * Hotlinking failed in five ways at once: relative paths that were never valid
 * on our pages, images that 404, rate-limited generators (GitHub builds its OG
 * images on demand), the URL changing between build and view, and every visitor
 * hitting a third-party host on page load. Copying the bytes at build time ends
 * all five, and gives us real dimensions so the card can reserve space.
 *
 * The trade-off is staleness: the card shows the image as it was when the site
 * was built. For a bookmark that's the honest thing to show anyway.
 *
 * Deliberately not Astro's <Image>: it fetches remote images during the build to
 * read their dimensions, and one dead image throws
 * `Failed to retrieve remote image dimensions` — someone else's server failing
 * our build. Everything here fails soft to "no image".
 *
 * Derivatives are cached beside the link captures and copied into `dist/` by
 * src/lib/bookmark-images-integration.mjs.
 */

/* global fetch */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { recordProblem } from '@utils/linkHealth'

/** Sits inside the link cache so one CI cache step covers captures and images. */
export const IMAGE_CACHE_DIR = path.join(
  process.cwd(),
  'node_modules',
  '.astro',
  'link-cache',
  'images',
)

/** Where the emitted files are served from, in dev and in the built site. */
export const IMAGE_URL_BASE = '/bookmark-images'

// Bump when the encoding below changes, so existing derivatives are replaced.
const IMAGE_VERSION = 'v1'

/** Twice the widest the card ever draws it (a full-width card in a narrow container). */
const TARGET_MAX_PX = 800
const WEBP_QUALITY = 78

const FETCH_TIMEOUT_MS = 15_000
/** OG images are page furniture; anything this big is a mistake on their end. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/**
 * Below this ratio an image is a logo or avatar rather than a banner, and
 * cropping it to 16:9 slices the middle out of it.
 *
 * Measured against every link on this site, the shapes fall into two clusters:
 * squares at 1.0 (about one link in ten — site logos and avatars) and
 * everything else at 1.33 and up. The boundary sits in the gap, so 4:3 photos
 * still get the banner crop, which is what they want.
 */
const LOGO_MAX_RATIO = 1.2

export interface BookmarkImage {
  /** Path on this site, not the origin's. */
  src: string
  width: number
  height: number
  shape: 'banner' | 'logo'
}

interface CachedImage extends BookmarkImage {
  imageVersion: string
}

/**
 * Fetch, re-encode and cache a preview image. Returns null — with a build
 * warning — for anything that doesn't resolve to a usable image, which leaves
 * the card to render without one.
 */
export async function fetchBookmarkImage(
  imageUrl: string | null,
  /** The page the image belongs to; only used to make warnings locatable. */
  pageUrl: string,
): Promise<BookmarkImage | null> {
  if (!imageUrl) return null

  const key = cacheKey(imageUrl)
  const cached = await readCache(key)
  if (cached) return cached

  let pending = inFlight.get(key)
  if (!pending) {
    pending = download(imageUrl, key, pageUrl)
    inFlight.set(key, pending)
  }
  return pending
}

/** One download per image per build, however many cards use it. */
const inFlight = new Map<string, Promise<BookmarkImage | null>>()

async function download(
  imageUrl: string,
  key: string,
  pageUrl: string,
): Promise<BookmarkImage | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1', Accept: 'image/*,*/*;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      recordProblem(pageUrl, 'image', `${response.status} on ${imageUrl}`)
      await response.body?.cancel()
      return null
    }

    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    if (type && !type.startsWith('image/')) {
      recordProblem(pageUrl, 'image', `${type} is not an image: ${imageUrl}`)
      await response.body?.cancel()
      return null
    }

    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) {
      recordProblem(
        pageUrl,
        'image',
        `${Math.round(bytes.length / 1024)}KB is too big: ${imageUrl}`,
      )
      return null
    }

    const image = await encode(bytes, key)
    if (!image) recordProblem(pageUrl, 'image', `could not be decoded: ${imageUrl}`)
    return image
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'failed'
    recordProblem(pageUrl, 'image', `${reason}: ${imageUrl}`)
    return null
  }
}

/** Re-encode to a single webp derivative, sized for the biggest the card draws it. */
async function encode(bytes: Uint8Array, key: string): Promise<BookmarkImage | null> {
  try {
    const { data, info } = await sharp(bytes)
      .resize({
        width: TARGET_MAX_PX,
        height: TARGET_MAX_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true })

    const image: BookmarkImage = {
      src: `${IMAGE_URL_BASE}/${key}.webp`,
      width: info.width,
      height: info.height,
      shape: classifyShape(info.width, info.height),
    }

    await writeCache(key, data, image)
    return image
  } catch {
    // Not an image, or an encoding sharp can't read. Either way: no image.
    return null
  }
}

/** A banner gets cropped to fill; a logo gets contained so it stays whole. */
export function classifyShape(width: number, height: number): 'banner' | 'logo' {
  return width / height < LOGO_MAX_RATIO ? 'logo' : 'banner'
}

function cacheKey(imageUrl: string): string {
  const hash = createHash('sha256').update(imageUrl).digest('hex').slice(0, 16)
  return `${IMAGE_VERSION}-${hash}`
}

async function readCache(key: string): Promise<BookmarkImage | null> {
  try {
    const meta = JSON.parse(
      await fs.readFile(path.join(IMAGE_CACHE_DIR, `${key}.json`), 'utf-8'),
    ) as CachedImage
    if (meta.imageVersion !== IMAGE_VERSION) return null
    // The sidecar is only true if the file it describes is still there.
    await fs.access(path.join(IMAGE_CACHE_DIR, `${key}.webp`))
    return { src: meta.src, width: meta.width, height: meta.height, shape: meta.shape }
  } catch {
    return null
  }
}

async function writeCache(key: string, data: Buffer, image: BookmarkImage): Promise<void> {
  // Best-effort: a cache we can't write is a slow build, not a broken one.
  try {
    await fs.mkdir(IMAGE_CACHE_DIR, { recursive: true })
    await fs.writeFile(path.join(IMAGE_CACHE_DIR, `${key}.webp`), data)
    await fs.writeFile(
      path.join(IMAGE_CACHE_DIR, `${key}.json`),
      JSON.stringify({ ...image, imageVersion: IMAGE_VERSION }),
      'utf-8',
    )
  } catch (error) {
    console.warn(`Bookmark image cache write failed for ${key}:`, error)
  }
}
