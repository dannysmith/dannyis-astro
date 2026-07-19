/**
 * Sätteri HAST plugin to open external links in a new tab.
 *
 * Adds `target="_blank"` + `rel="noopener noreferrer"` to links that leave
 * the site. "External" deliberately mirrors SmartLink's semantics
 * (`src/components/mdx/SmartLink.astro`): an absolute http(s) URL whose host
 * isn't danny.is or a subdomain.
 *
 * In practice this only affects plain `.md` content — in `.mdx` the
 * `a -> SmartLink` remapping computes the same attributes itself (the
 * properties set here are spread into SmartLink and match what it renders).
 */
import { defineHastPlugin } from 'satteri'

export function satteriExternalLinks() {
  return defineHastPlugin({
    name: 'satteri-external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href
        if (typeof href !== 'string' || !/^https?:\/\//.test(href)) return
        const { hostname } = new URL(href)
        if (hostname === 'danny.is' || hostname.endsWith('.danny.is')) return

        ctx.setProperty(node, 'target', '_blank')
        ctx.setProperty(node, 'rel', 'noopener noreferrer')
      },
    },
  })
}
