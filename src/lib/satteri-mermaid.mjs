/**
 * Sätteri HAST plugin to render ```mermaid fences into inline SVG at build
 * time — no client-side JavaScript.
 *
 * Renders via `mermaid-isomorphic` (headless Playwright browser) and replaces
 * the `<pre>` with the rendered `<svg>`. The SVG keeps mermaid's `mermaid-…`
 * id, which the site styles via `svg[id^='mermaid-']` in `_mermaid.css`.
 *
 * The SVG string is spliced in byte-for-byte, never parsed into hast
 * elements — parsing it camelCases SVG presentation attributes
 * (`marker-end` → `markerEnd`) and Sätteri's serializer only maps some of
 * them back, which silently drops arrowheads. The verbatim mechanism differs
 * per format:
 * - `.md`: a `raw` hast node — the HTML renderer emits its value untouched.
 * - `.mdx`: a `raw` node would be COMPILED TO ESCAPED TEXT (the JSX compiler
 *   has no raw-HTML output), so return a `Fragment` JSX element carrying the
 *   SVG via `set:html` — the same mechanism `@astrojs/mdx`'s own
 *   `optimizeStatic` uses; Astro's MDX runtime always provides `Fragment`.
 *
 * Mermaid fences must be excluded from syntax highlighting
 * (`markdown.syntaxHighlight.excludeLangs: ['mermaid']`) so this plugin
 * receives the untouched `<pre><code>`; the fence language arrives as
 * `data.lang` on the code element. A render failure throws, failing the
 * build.
 *
 * Theme-awareness: mermaid can't take var() in themeVariables, so diagrams
 * render with sentinel colors and `colorReplacements` rewrites each one to a
 * `--mermaid-*` variable (defined in _mermaid.css). Plain replaceAll is safe:
 * the sentinels are unique hex tokens, and mermaid's colors land in the SVG's
 * own <style> block, where var() resolves.
 *
 * Feed images: RSS readers mostly strip inline SVG, and the theme variables
 * mean nothing without the site's CSS. With `feedImages` set, each diagram is
 * also saved as an image for RSS feeds only: a 2x screenshot from the same
 * render (in the sentinel colors, which are the light theme), flattened onto
 * white and saved as lossless WebP, named by a hash of what it's drawn from
 * (diagram source, config and font CSS). The SVG gets
 * `data-feed-image` / `data-feed-image-width` attributes pointing at it, which
 * `cleanFeedHtml` (`src/utils/feed-html.ts`) swaps the SVG for. The site
 * itself never uses these images.
 */
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createMermaidRenderer } from 'mermaid-isomorphic'
import { chromium } from 'playwright'
import { defineHastPlugin } from 'satteri'
import sharp from 'sharp'

/** White margin around a feed image, in CSS pixels. */
const FEED_IMAGE_PADDING = 16

/** Pixel density of feed image screenshots. */
const FEED_IMAGE_SCALE = 2

/**
 * Chromium whose browser contexts render at FEED_IMAGE_SCALE. mermaid-isomorphic
 * creates its context with no options, so this is the only way to get a
 * high-density screenshot. It doesn't change the SVG.
 */
const hiDpiChromium = {
  async launch(options) {
    const browser = await chromium.launch(options)
    const newContext = browser.newContext.bind(browser)
    browser.newContext = contextOptions =>
      newContext({ ...contextOptions, deviceScaleFactor: FEED_IMAGE_SCALE })
    return browser
  },
}

/**
 * Save a diagram's screenshot as a feed image, unless one is already cached,
 * and return its URL. `key` is everything the image is drawn from, so the
 * file name only changes when the image would. (The SVG itself won't do: its
 * ids carry a per-build counter.)
 */
async function saveFeedImage(screenshot, key, { dir, urlBase }) {
  const file = `mermaid-${createHash('sha256').update(key).digest('hex').slice(0, 16)}.webp`
  const filePath = path.join(dir, file)
  try {
    await fs.access(filePath)
  } catch {
    const pad = FEED_IMAGE_PADDING * FEED_IMAGE_SCALE
    await fs.mkdir(dir, { recursive: true })
    // Written under a temporary name, then renamed, so an interrupted build
    // can't leave a truncated image that later builds treat as cached.
    const tmpPath = `${filePath}.${randomUUID()}.tmp`
    await sharp(screenshot)
      .flatten({ background: '#ffffff' })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
      .webp({ lossless: true })
      .toFile(tmpPath)
    await fs.rename(tmpPath, filePath)
  }
  return `${urlBase}/${file}`
}

/**
 * @param {object} [opts]
 * @param {object} [opts.mermaidConfig] Mermaid theme/config object passed to
 *   the renderer (see `src/config/mermaid.js`).
 * @param {string[][]} [opts.colorReplacements] `[bakedColor, cssVar]` pairs
 *   applied to the rendered SVG string (see `src/config/mermaid.js`).
 * @param {string} [opts.css] Stylesheet URL loaded into the render page
 *   (provides the site's fonts for label measurement).
 * @param {{ dir: string, urlBase: string }} [opts.feedImages] Where to save
 *   each diagram's RSS-only image, and the URL path that directory is served
 *   under. Omit to skip feed images.
 */
export function satteriMermaid({ mermaidConfig, colorReplacements = [], css, feedImages } = {}) {
  // One renderer shared across every document in the build.
  const renderer = createMermaidRenderer({ browserType: hiDpiChromium })

  // Each visit renders a single diagram, so the renderer's per-batch index is
  // always 0 — a shared counter keeps ids unique when a page has several
  // diagrams (duplicate ids would collide the SVGs' internal marker refs).
  let count = 0

  return defineHastPlugin({
    name: 'satteri-mermaid',
    element: {
      filter: ['pre'],
      async visit(node, ctx) {
        const codeChild = node.children?.find(
          child => child.type === 'element' && child.tagName === 'code',
        )
        if (!codeChild || codeChild.data?.lang !== 'mermaid') return

        const diagram = ctx.textContent(codeChild).replace(/\n$/, '')
        const [result] = await renderer([diagram], {
          css,
          mermaidConfig,
          prefix: `mermaid-${count++}`,
          screenshot: Boolean(feedImages),
        })
        if (result.status !== 'fulfilled') {
          throw new Error(
            `Mermaid rendering failed in ${ctx.fileURL ?? 'inline content'}: ${result.reason}`,
          )
        }

        let svg = result.value.svg
        for (const [from, to] of colorReplacements) svg = svg.replaceAll(from, to)
        if (feedImages && result.value.screenshot) {
          const key = [diagram, JSON.stringify(mermaidConfig), css].join('\n')
          const src = await saveFeedImage(result.value.screenshot, key, feedImages)
          const width = Math.round(result.value.width) + FEED_IMAGE_PADDING * 2
          svg = svg.replace(
            '<svg ',
            `<svg data-feed-image="${src}" data-feed-image-width="${width}" `,
          )
        }
        if (ctx.sourceFormat === 'mdx') {
          return {
            type: 'mdxJsxFlowElement',
            name: 'Fragment',
            attributes: [{ type: 'mdxJsxAttribute', name: 'set:html', value: svg }],
            children: [],
          }
        }
        return { type: 'raw', value: svg }
      },
    },
  })
}
