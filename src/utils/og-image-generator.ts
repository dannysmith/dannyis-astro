import satori from 'satori'
import sharp from 'sharp'
import { Resvg } from '@resvg/resvg-js'
import { createHash } from 'node:crypto'
import fs from 'fs/promises'
import path from 'path'
import { templates, type OGTemplateData } from '@utils/og-templates.js'

// Astro does not cache endpoint output, so every build re-runs satori + resvg
// for every post (~90s on this site). We cache the rendered PNGs ourselves,
// content-addressed by everything that affects the output. The cache lives
// inside Astro's own cache dir so a single CI cache step covers both.
//
// Bump CACHE_VERSION whenever the templates (og-templates.ts), branding
// (og-branding.ts), the baked background (src/assets/og/background.svg), the
// embedded fonts, or the renderer itself (the satori/resvg versions) change —
// those aren't part of the per-image key, so a bump is how we invalidate every
// cached image at once.
const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.astro', 'og-cache')
const CACHE_VERSION = 'v6'

// The decorative blobs background never changes per page, so we rasterise the
// source SVG to a PNG once per build (per output size) and reuse the data URI.
const BACKGROUND_SVG = path.join(process.cwd(), 'src', 'assets', 'og', 'background.svg')
const backgroundCache = new Map<string, Promise<string>>()

function getBackgroundDataUri(width: number, height: number): Promise<string> {
  const key = `${width}x${height}`
  let pending = backgroundCache.get(key)
  if (!pending) {
    pending = (async () => {
      const svg = await fs.readFile(BACKGROUND_SVG)
      const png = await sharp(svg, { density: 200 }).resize(width, height).png().toBuffer()
      return `data:image/png;base64,${png.toString('base64')}`
    })()
    backgroundCache.set(key, pending)
  }
  return pending
}

// Embed the avatar as a data URI rather than letting satori fetch it over the
// network at build time — the file is local, and a network round-trip per
// build (which can fail and leave the avatar missing) is both fragile and slow.
const AVATAR_PNG = path.join(process.cwd(), 'public', 'avatar-circle.png')
let avatarUriPromise: Promise<string> | null = null

function getAvatarDataUri(): Promise<string> {
  if (!avatarUriPromise) {
    avatarUriPromise = (async () => {
      const png = await fs.readFile(AVATAR_PNG)
      return `data:image/png;base64,${png.toString('base64')}`
    })()
  }
  return avatarUriPromise
}

// Font type definition matching Satori's expected format
interface Font {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}

// Satori can't consume WOFF2 (it parses fonts via opentype.js), so the OG
// pipeline keeps a separate set of static TTFs in public/fonts/ even though
// the rest of the site loads Geist + Figtree as WOFF2 via CSS.
const FONT_FILES: Array<{ name: string; file: string; weight: 400 | 700 }> = [
  { name: 'Geist', file: 'Geist-Bold.ttf', weight: 700 },
  { name: 'Figtree', file: 'Figtree-Regular.ttf', weight: 400 },
  { name: 'Figtree', file: 'Figtree-Bold.ttf', weight: 700 },
  // The site's monospace (used for code); a static 400 instance derived from
  // the @fontsource-variable/fira-code WOFF2. Used for the URL on covers.
  { name: 'Fira Code', file: 'FiraCode-Regular.ttf', weight: 400 },
]

// A missing font file throws, failing the build rather than quietly rendering
// covers in the wrong face.
async function loadFonts(): Promise<Font[]> {
  return Promise.all(
    FONT_FILES.map(async ({ name, file, weight }) => {
      const buffer = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', file))
      const data = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer
      return { name, data, weight, style: 'normal' as const }
    }),
  )
}

// Generate options for Satori
interface GenerateOptions {
  template?: 'article' | 'note' | 'default' | 'profile'
  width?: number
  height?: number
}

// Main OG image generation function
export async function generateOGImage(
  data: OGTemplateData,
  options: GenerateOptions = {},
): Promise<Buffer> {
  const { template = 'default', width = 1200, height = 630 } = options

  // Content-addressed cache key: any change to the data, template, or
  // dimensions produces a different key, so edits regenerate the image.
  const cacheKey = createHash('sha256')
    .update(JSON.stringify({ data, template, width, height, v: CACHE_VERSION }))
    .digest('hex')
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.png`)

  // Cache hit — return the previously rendered PNG.
  try {
    return await fs.readFile(cachePath)
  } catch {
    // Miss (or unreadable) — fall through and generate.
  }

  // No try/catch: a failed render fails the build, so a broken template or
  // font is noticed rather than shipped.
  const fonts = await loadFonts()

  const templateFn = templates[template]
  if (!templateFn) {
    throw new Error(`Template "${template}" not found`)
  }

  // Bake the decorative background + avatar (memoised, computed once).
  const [background, avatar] = await Promise.all([
    getBackgroundDataUri(width, height),
    getAvatarDataUri(),
  ])

  // Generate the React element structure
  const element = templateFn(data, { background, avatar })

  // Generate SVG using Satori
  // @ts-expect-error - satori accepts { type, props } objects at runtime, but types only expose ReactNode
  const svg = await satori(element, {
    width,
    height,
    fonts,
  })

  // Convert SVG to PNG using Resvg
  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  const pngBuffer = Buffer.from(pngData.asPng())

  // Cache the render (best-effort; never fail a build over this).
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cachePath, pngBuffer)
  } catch (cacheError) {
    console.warn('Failed to write OG image cache:', cacheError)
  }

  return pngBuffer
}
