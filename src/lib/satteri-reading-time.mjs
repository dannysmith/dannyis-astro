/**
 * Sätteri MDAST plugin to inject reading time into frontmatter.
 *
 * Calculates reading time from the document text at build time and writes it
 * to the frontmatter bag as `minutesRead` (e.g. "5 min read"). It surfaces
 * ONLY as `remarkPluginFrontmatter.minutesRead` on the render() result —
 * that's Astro's current public name for the injected-frontmatter bag, kept
 * from the remark era. It does NOT appear on `entry.data` from
 * getCollection(): the zod schema strips keys it doesn't know about.
 *
 * Register this FIRST in `mdastPlugins` so it measures the document as
 * parsed — before `satteri-mdx-imports` queues its injected import
 * statements, which would otherwise inflate the word count.
 */
import getReadingTime from 'reading-time'
import { defineRootPlugin } from './satteri-root-plugin.mjs'

export function satteriReadingTime() {
  return defineRootPlugin('satteri-reading-time', (root, ctx) => {
    const frontmatter = ctx.data.astro?.frontmatter
    if (!frontmatter) return

    const textOnPage = ctx.textContent(root)
    frontmatter.minutesRead = getReadingTime(textOnPage).text
  })
}
