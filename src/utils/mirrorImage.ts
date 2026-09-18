/**
 * Build-time copies of other people's images, served from our own domain:
 * `mirrorImage(url, { group, maxPx })` downloads, re-encodes to webp and caches.
 *
 * We serve these ourselves rather than pointing an <img> at someone else's
 * host. Hotlinking failed in five ways at once: relative paths that were never
 * valid on our pages, images that 404, rate-limited generators (GitHub builds
 * its OG images on demand), the URL changing between build and view, and every
 * visitor hitting a third-party host on page load. Copying the bytes at build
 * time ends all five, and gives us real dimensions so the page can reserve space.
 *
 * The trade-off is staleness: the page shows the image as it was when the site
 * was built.
 *
 * Deliberately not Astro's <Image>: it fetches remote images during the build to
 * read their dimensions, and one dead image throws
 * `Failed to retrieve remote image dimensions` — someone else's server failing
 * our build. Everything here fails soft to "no image".
 *
 * Images are filed under a `group` named for the feature using them (`links`,
 * `books`), on disk and in their URL. The whole tree is copied into `dist/` by
 * src/lib/mirrored-images-integration.mjs.
 */

/* global process */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { fetchPublic, isPublicHttpUrl, withNetworkSlot } from '@utils/linkPreview/fetch'

/**
 * Inside Astro's cache directory, so the CI cache step that persists it covers
 * these too. Overridable so tests can point at a temp directory.
 */
export const MIRROR_CACHE_DIR =
  process.env.MIRROR_CACHE_DIR ??
  path.join(process.cwd(), 'node_modules', '.astro', 'mirrored-images')

/** Where the emitted files are served from, in dev and in the built site. */
export const MIRROR_URL_BASE = '/mirrored'

// Bump when the encoding below changes, so existing derivatives are replaced.
const IMAGE_VERSION = 'v1'

const WEBP_QUALITY = 78

const FETCH_TIMEOUT_MS = 15_000
/** Generous for an OG banner; anything larger is a mistake we shouldn't buffer. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
/** A browser's, because WordPress hosts 403 crawler UAs for image files. */
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface MirroredImage {
  /** Path on this site, not the origin's. */
  src: string
  width: number
  height: number
}

export interface MirrorOptions {
  /** Subdirectory the image is filed under — name it for the feature. */
  group: string
  /** Longest edge of the derivative; smaller originals are never enlarged. */
  maxPx: number
  /** Told why an image couldn't be mirrored, for callers that report it. */
  onProblem?: (detail: string) => void
}

/**
 * Fetch, re-encode and cache an image, returning null for anything that doesn't
 * resolve to a usable one — which leaves the caller to render without it.
 */
export async function mirrorImage(
  imageUrl: string | null,
  { group, maxPx, onProblem }: MirrorOptions,
): Promise<MirroredImage | null> {
  if (!imageUrl) return null

  const file = path.join(group, cacheKey(imageUrl, maxPx))
  let pending = inFlight.get(file)
  if (!pending) {
    // The slot is taken only around the download, so a cache hit never queues.
    pending = readCache(file).then(
      cached => cached ?? withNetworkSlot(() => download(imageUrl, file, maxPx, onProblem)),
    )
    inFlight.set(file, pending)
  }
  return pending
}

/** One download per image per build, however many places use it. */
const inFlight = new Map<string, Promise<MirroredImage | null>>()

async function download(
  imageUrl: string,
  file: string,
  maxPx: number,
  report: (detail: string) => void = () => {},
): Promise<MirroredImage | null> {
  if (!isPublicHttpUrl(imageUrl)) {
    report(`is not a public URL: ${imageUrl}`)
    return null
  }

  try {
    const hit = await fetchPublic(imageUrl, {
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

    const encoded = await encode(bytes, maxPx)
    if (!encoded) {
      report(`is not a decodable image: ${imageUrl}`)
      return null
    }

    // Not reported as a problem with the image: writeCache has already said why.
    if (!(await writeCache(file, encoded))) return null
    return { src: srcOf(file), width: encoded.width, height: encoded.height }
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

interface Encoded {
  data: Buffer
  width: number
  height: number
}

/** Re-encode to a single webp derivative, no larger than `maxPx` on either edge. */
async function encode(bytes: Uint8Array, maxPx: number): Promise<Encoded | null> {
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

    return { data, width: info.width, height: info.height }
  } catch {
    // Not an image, or an encoding sharp can't read. Either way: no image.
    return null
  }
}

function cacheKey(imageUrl: string, maxPx: number): string {
  const hash = createHash('sha256').update(`${imageUrl}@${maxPx}`).digest('hex').slice(0, 16)
  return `${IMAGE_VERSION}-${hash}`
}

function srcOf(file: string): string {
  return `${MIRROR_URL_BASE}/${file.split(path.sep).join('/')}.webp`
}

/**
 * The sidecar holds only what can't be derived — `src` comes from where the
 * file is now, so the cache directory can be moved without rewriting it.
 */
async function readCache(file: string): Promise<MirroredImage | null> {
  try {
    const { width, height } = JSON.parse(
      await fs.readFile(path.join(MIRROR_CACHE_DIR, `${file}.json`), 'utf-8'),
    ) as { width: number; height: number }
    // The sidecar is only true if the file it describes is still there; cache
    // directories do get partially clobbered.
    await fs.access(path.join(MIRROR_CACHE_DIR, `${file}.webp`))
    return { src: srcOf(file), width, height }
  } catch {
    return null
  }
}

/**
 * False when the image itself couldn't be written. The built site ships images
 * from this directory, so a `src` for a file that isn't there would be a broken
 * image on the page — the caller renders without one instead.
 *
 * The sidecar is only a cache: without it the next build downloads again.
 */
async function writeCache(file: string, { data, width, height }: Encoded): Promise<boolean> {
  const base = path.join(MIRROR_CACHE_DIR, file)

  try {
    await fs.mkdir(path.dirname(base), { recursive: true })
    await fs.writeFile(`${base}.webp`, data)
  } catch (error) {
    console.warn(`Mirrored image could not be written for ${file}:`, error)
    return false
  }

  try {
    await fs.writeFile(`${base}.json`, JSON.stringify({ width, height }), 'utf-8')
  } catch (error) {
    console.warn(`Mirrored image sidecar could not be written for ${file}:`, error)
  }
  return true
}
