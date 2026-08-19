import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'

/**
 * Serves the link-preview images that `src/utils/linkPreview/image.ts`
 * downloads and re-encodes at build time. Same two-hook shape as the pagefind
 * integration:
 *
 *   • astro:build:done  — copy the cached derivatives into `dist/bookmark-images/`
 *     so they ship as ordinary static files, on Vercel or anywhere else.
 *
 *   • astro:server:setup — in `bun run dev` nothing is copied, so serve them
 *     straight out of the cache directory. Images not yet downloaded 404 until
 *     the page that uses them renders; reload and they appear.
 *
 * The whole cache is copied, not just what this build referenced. Tracking
 * references would mean threading state from a util into an integration, and
 * the images a removed link leaves behind are a few KB of unreferenced
 * files that the next CI cache rotation clears anyway.
 *
 * @param {string} cacheDir Absolute path to the cached derivatives.
 * @param {string} urlBase Path they're served under.
 * @returns {import('astro').AstroIntegration}
 */
export function linkPreviewImages(cacheDir, urlBase) {
  return {
    name: 'link-preview-images',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const serve = sirv(cacheDir, { dev: true, etag: true })
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(`${urlBase}/`)) return next()
          req.url = req.url.slice(urlBase.length)
          serve(req, res, next)
        })
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = path.join(fileURLToPath(dir), urlBase.replace(/^\//, ''))

        let files
        try {
          files = (await fs.readdir(cacheDir)).filter(name => name.endsWith('.webp'))
        } catch {
          // No cache directory means no bookmark had a usable image.
          return
        }

        await fs.mkdir(outDir, { recursive: true })
        for (const file of files) {
          await fs.copyFile(path.join(cacheDir, file), path.join(outDir, file))
        }

        logger.info(`Copied ${files.length} link preview image(s) → dist${urlBase}/`)
      },
    },
  }
}
