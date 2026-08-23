/**
 * Build-time download and re-encode of the preview image a card shows.
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
 * src/lib/link-preview-images-integration.mjs.
 */

/* global process */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { recordProblem } from '@utils/linkPreview/health'
import { fetchPublic, isPublicHttpUrl, withNetworkSlot } from '@utils/linkPreview/fetch'

/**
 * Sits inside the link cache so one CI cache step covers captures and images,
 * and follows the same override, so a test that redirects one redirects both.
 */
export const IMAGE_CACHE_DIR = path.join(
  process.env.LINK_CACHE_DIR ?? path.join(process.cwd(), 'node_modules', '.astro', 'link-cache'),
  'images',
)

/** Where the emitted files are served from, in dev and in the built site. */
export const IMAGE_URL_BASE = '/link-previews'

// Bump when the encoding below changes, so existing derivatives are replaced.
const IMAGE_VERSION = 'v1'

/** Twice the widest the card ever draws it (a full-width card in a narrow container). */
const TARGET_MAX_PX = 800
/** Big enough for a retina render of a ~20px icon, small enough to be nothing. */
const FAVICON_PX = 64
const WEBP_QUALITY = 78

const FETCH_TIMEOUT_MS = 15_000
/** Generous for an OG banner; anything larger is a mistake we shouldn't buffer. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

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

export interface PreviewImage {
  /** Path on this site, not the origin's. */
  src: string
  width: number
  height: number
  shape: 'banner' | 'logo'
}

/**
 * Fetch, re-encode and cache an image, returning null for anything that doesn't
 * resolve to a usable one — which leaves the card to render without it.
 *
 * A missing *preview* image is worth a build warning; a missing favicon isn't.
 * We already skip undecodable `.ico` icons without a word, and a quarter of
 * cards have no favicon at all, so reporting the ones that fail mid-download
 * would only teach you to ignore the report. Notion's emoji icons land here
 * every build: the icon URL encodes an emoji rather than an image, and
 * `Notion.astro` renders the emoji instead.
 */
export async function fetchPreviewImage(
  imageUrl: string | null,
  /** The page the image belongs to; only used to make warnings locatable. */
  pageUrl: string,
  kind: 'preview' | 'favicon' = 'preview',
): Promise<PreviewImage | null> {
  if (!imageUrl) return null

  const maxPx = kind === 'favicon' ? FAVICON_PX : TARGET_MAX_PX
  const key = cacheKey(imageUrl, maxPx)
  let pending = inFlight.get(key)
  if (!pending) {
    // The slot is taken only around the download, so a cache hit never queues.
    pending = readCache(key).then(
      cached => cached ?? withNetworkSlot(() => download(imageUrl, key, pageUrl, maxPx, kind)),
    )
    inFlight.set(key, pending)
  }
  return pending
}

/** One download per image per build, however many cards use it. */
const inFlight = new Map<string, Promise<PreviewImage | null>>()

async function download(
  imageUrl: string,
  key: string,
  pageUrl: string,
  maxPx: number,
  kind: 'preview' | 'favicon',
): Promise<PreviewImage | null> {
  const report = (detail: string) => {
    if (kind === 'preview') recordProblem(pageUrl, 'image', detail)
  }

  if (!isPublicHttpUrl(imageUrl)) {
    report(`is not a public URL: ${imageUrl}`)
    return null
  }

  try {
    const hit = await fetchPublic(imageUrl, {
      // A browser UA, not the social-crawler one the page fetch uses: that
      // sentinel earns better metadata from pages, but WordPress hosts 403 it
      // for image files.
      headers: { 'User-Agent': BROWSER_UA, Accept: 'image/*,*/*;q=0.8' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!hit) {
      report(`redirected off the public internet, or never stopped: ${imageUrl}`)
      return null
    }

    if (!hit.response.ok) {
      report(`${hit.response.status} on ${imageUrl}`)
      await hit.response.body?.cancel()
      return null
    }

    const bytes = await readCapped(hit.response, MAX_IMAGE_BYTES)
    if (!bytes) {
      report(`is larger than ${MAX_IMAGE_BYTES / 1e6}MB: ${imageUrl}`)
      return null
    }

    const image = await encode(bytes, key, maxPx)
    if (!image) report(`is not a decodable image: ${imageUrl}`)
    return image
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'failed'
    report(`${reason}: ${imageUrl}`)
    return null
  }
}

/**
 * Read a body with a running byte count, returning null once it goes over.
 *
 * `content-length` is a claim, not a fact: it is absent on a chunked response
 * and can simply be wrong, so the limit has to be enforced against what
 * actually arrives rather than what was promised.
 */
async function readCapped(response: Response, max: number): Promise<Uint8Array | null> {
  const reader = response.body?.getReader()
  if (!reader) return null

  const chunks: Uint8Array[] = []
  let size = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(size)
  let at = 0
  for (const chunk of chunks) {
    bytes.set(chunk, at)
    at += chunk.length
  }
  return bytes
}

/** Re-encode to a single webp derivative, sized for the biggest the card draws it. */
async function encode(bytes: Uint8Array, key: string, maxPx: number): Promise<PreviewImage | null> {
  try {
    const { data, info } = await sharp(bytes)
      .resize({
        width: maxPx,
        height: maxPx,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true })

    const image: PreviewImage = {
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

/** Decides the shape of the panel the card draws; both are cropped to fill it. */
export function classifyShape(width: number, height: number): 'banner' | 'logo' {
  return width / height < LOGO_MAX_RATIO ? 'logo' : 'banner'
}

function cacheKey(imageUrl: string, maxPx: number): string {
  const hash = createHash('sha256').update(`${imageUrl}@${maxPx}`).digest('hex').slice(0, 16)
  return `${IMAGE_VERSION}-${hash}`
}

async function readCache(key: string): Promise<PreviewImage | null> {
  try {
    const meta = JSON.parse(
      await fs.readFile(path.join(IMAGE_CACHE_DIR, `${key}.json`), 'utf-8'),
    ) as PreviewImage
    // The sidecar is only true if the file it describes is still there; cache
    // directories do get partially clobbered.
    await fs.access(path.join(IMAGE_CACHE_DIR, `${key}.webp`))
    return meta
  } catch {
    return null
  }
}

async function writeCache(key: string, data: Buffer, image: PreviewImage): Promise<void> {
  // Best-effort: a cache we can't write is a slow build, not a broken one.
  try {
    await fs.mkdir(IMAGE_CACHE_DIR, { recursive: true })
    await fs.writeFile(path.join(IMAGE_CACHE_DIR, `${key}.webp`), data)
    await fs.writeFile(path.join(IMAGE_CACHE_DIR, `${key}.json`), JSON.stringify(image), 'utf-8')
  } catch (error) {
    console.warn(`Link preview image cache write failed for ${key}:`, error)
  }
}
