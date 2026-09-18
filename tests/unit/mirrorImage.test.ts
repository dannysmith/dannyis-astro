import { describe, it, expect, vi, afterAll, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

// The cache directory is read once, when the module first loads — so it has to
// be redirected at a temp dir before anything imports it.
const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mirrored-images-'))
process.env.MIRROR_CACHE_DIR = cacheDir
afterAll(() => fs.rmSync(cacheDir, { recursive: true, force: true }))

const { mirrorImage } = await import('@utils/mirrorImage')

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#c00' } })
    .png()
    .toBuffer()

const serve = async (body: Buffer) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () => new Response(new Uint8Array(body), { headers: { 'content-type': 'image/png' } }),
    ),
  )

describe('mirrorImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('files a resized webp under its group, and reports the real dimensions', async () => {
    await serve(await png(1200, 600))

    const image = await mirrorImage('https://images.test/banner.png', {
      group: 'books',
      maxPx: 800,
    })

    expect(image).toMatchObject({ width: 800, height: 400 })
    expect(image?.src).toMatch(/^\/mirrored\/books\/v1-[0-9a-f]{16}\.webp$/)
    const onDisk = path.join(cacheDir, image!.src.replace('/mirrored/', ''))
    expect((await sharp(onDisk).metadata()).format).toBe('webp')
  })

  it('never enlarges a small original', async () => {
    await serve(await png(40, 60))

    const image = await mirrorImage('https://images.test/small.png', { group: 'books', maxPx: 800 })

    expect(image).toMatchObject({ width: 40, height: 60 })
  })

  it('serves a relocated cache entry from where it is now, without the network', async () => {
    await serve(await png(300, 300))
    const url = 'https://images.test/moved.png'
    const original = await mirrorImage(url, { group: 'old-home', maxPx: 800 })

    // Move the group, and leave the sidecar as an older version wrote it — with
    // a `src` that is no longer true.
    fs.renameSync(path.join(cacheDir, 'old-home'), path.join(cacheDir, 'new-home'))
    const key = path.basename(original!.src, '.webp')
    fs.writeFileSync(
      path.join(cacheDir, 'new-home', `${key}.json`),
      JSON.stringify({ src: `/link-previews/${key}.webp`, width: 300, height: 300, shape: 'logo' }),
    )
    const fetch = vi.fn(async () => Response.error())
    vi.stubGlobal('fetch', fetch)

    const moved = await mirrorImage(url, { group: 'new-home', maxPx: 800 })

    expect(moved).toEqual({ src: `/mirrored/new-home/${key}.webp`, width: 300, height: 300 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns null and says why when the image will not load, caching nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('gone', { status: 404 })),
    )
    const onProblem = vi.fn()

    const image = await mirrorImage('https://images.test/gone.png', {
      group: 'missing',
      maxPx: 800,
      onProblem,
    })

    expect(image).toBeNull()
    expect(onProblem).toHaveBeenCalledWith('404 on https://images.test/gone.png')
    expect(fs.existsSync(path.join(cacheDir, 'missing'))).toBe(false)
  })

  it('reports bytes that are not an image', async () => {
    await serve(Buffer.from('<html>not an image</html>'))
    const onProblem = vi.fn()

    const image = await mirrorImage('https://images.test/page.html', {
      group: 'missing',
      maxPx: 800,
      onProblem,
    })

    expect(image).toBeNull()
    expect(onProblem).toHaveBeenCalledWith(expect.stringContaining('not a decodable image'))
  })
})
