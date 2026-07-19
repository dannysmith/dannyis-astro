import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createIndex } from 'pagefind'
import sirv from 'sirv'

/**
 * Pagefind Astro integration. Rather than depend on `astro-pagefind`, we crib
 * its two-hook pattern so the whole thing lives in one small module:
 *
 *   • astro:build:done  — run Pagefind's Node indexer over the freshly-built `dist/`
 *     and emit `dist/pagefind/` (the WASM + sharded index the browser fetches). This
 *     travels with `astro build` on any host, so it works in our CI-then-Vercel-prebuilt
 *     pipeline where the index must exist in `dist/` before CI copies it to the deploy.
 *
 *   • astro:server:setup — in `bun run dev` there is no build, so serve a *previously
 *     built* `dist/pagefind/` at `/pagefind/*` (correct wasm mime types via sirv). No
 *     prior build → 404s, and search simply returns nothing; nothing else breaks.
 *
 * We run static (no adapter), so the output dir is always `dist/`.
 *
 * @returns {import('astro').AstroIntegration}
 */
export function pagefind() {
  return {
    name: 'pagefind',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const outDir = path.join(server.config.root, server.config.build.outDir)
        const serve = sirv(outDir, { dev: true, etag: true })
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/pagefind/')) serve(req, res, next)
          else next()
        })
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir)
        const { index, errors } = await createIndex()
        if (!index) {
          errors.forEach(e => logger.error(e))
          throw new Error('Pagefind failed to create index')
        }
        const { page_count, errors: addErrors } = await index.addDirectory({ path: outDir })
        if (addErrors.length) {
          addErrors.forEach(e => logger.error(e))
          throw new Error('Pagefind failed to index the built site')
        }
        const { errors: writeErrors } = await index.writeFiles({
          outputPath: path.join(outDir, 'pagefind'),
        })
        if (writeErrors.length) {
          writeErrors.forEach(e => logger.error(e))
          throw new Error('Pagefind failed to write the index')
        }
        logger.info(`Indexed ${page_count} pages → dist/pagefind/`)
      },
    },
  }
}
