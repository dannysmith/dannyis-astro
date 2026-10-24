import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'

/**
 * Serves images made at build time and cached in Astro's cache directory.
 * Used twice: for the images `src/utils/mirrorImage.ts` downloads and
 * re-encodes (`/mirrored`), and for the RSS-only diagram images
 * `src/lib/satteri-mermaid.mjs` saves (`/feed-images`). Same two-hook shape as
 * the pagefind integration:
 *
 *   • astro:build:done  — copy the cached WebP files into `dist<urlBase>/`,
 *     keeping their subdirectories, so they ship as ordinary static files, on
 *     Vercel or anywhere else.
 *
 *   • astro:server:setup — in `bun run dev` nothing is copied, so serve them
 *     straight out of the cache directory. Images not made yet 404 until the
 *     page that makes them renders; reload and they appear.
 *
 * The whole cache is copied, not just what this build referenced. Tracking
 * references would mean threading state from a util into an integration, and
 * the images a removed link or diagram leaves behind are a few KB of
 * unreferenced files that the next CI cache rotation clears anyway.
 *
 * @param {string} cacheDir Absolute path to the cached images.
 * @param {string} urlBase Path they're served under.
 * @param {string} name Integration name, which also labels its log output.
 * @returns {import('astro').AstroIntegration}
 */
export function cachedImages(cacheDir, urlBase, name) {
  return {
    name,
    hooks: {
      'astro:server:setup': ({ server }) => {
        const serve = sirv(cacheDir, { dev: true, etag: true })
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(`${urlBase}/`)) return next()
          // The cache directory is the root of what's served, so the prefix
          // comes off — and goes back on if sirv has no such file, or Astro's
          // router would report the miss against a path nobody requested.
          const requested = req.url
          req.url = requested.slice(urlBase.length)
          serve(req, res, () => {
            req.url = requested
            next()
          })
        })
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = path.join(fileURLToPath(dir), urlBase.replace(/^\//, ''))

        let files
        try {
          files = (await fs.readdir(cacheDir, { recursive: true })).filter(name =>
            name.endsWith('.webp'),
          )
        } catch {
          // No cache directory means nothing made an image for it.
          return
        }

        for (const file of files) {
          const dest = path.join(outDir, file)
          await fs.mkdir(path.dirname(dest), { recursive: true })
          await fs.copyFile(path.join(cacheDir, file), dest)
        }

        logger.info(`Copied ${files.length} image(s) → dist${urlBase}/`)
      },
    },
  }
}
