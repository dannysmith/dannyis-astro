/**
 * Sätteri MDAST plugin to inject reading time into frontmatter.
 * (Port of `remark-reading-time.mjs`.)
 *
 * Calculates reading time from the document text at build time and writes it
 * to the frontmatter bag as `minutesRead` (e.g. "5 min read"), where it
 * surfaces exactly as before:
 * - `remarkPluginFrontmatter.minutesRead` when using render()
 * - `entry.data.minutesRead` when using getCollection()
 *
 * The write round-trips for BOTH formats on Astro 7: the `.md` processor
 * returns `data.astro.frontmatter` as its metadata, and `@astrojs/mdx` v7
 * exports the read-back bag (unlike v6, which dropped plugin writes for
 * `.mdx` — the Task 1 spike caveat that no longer applies).
 *
 * Register this FIRST in `mdastPlugins` so it measures the document as
 * parsed — before `satteri-mdx-imports` queues its injected import
 * statements, which would otherwise inflate the word count.
 */
import getReadingTime from 'reading-time';
import { defineRootPlugin } from './satteri-root-plugin.mjs';

export function satteriReadingTime() {
  return defineRootPlugin('satteri-reading-time', (root, ctx) => {
    const frontmatter = ctx.data.astro?.frontmatter;
    if (!frontmatter) return;

    const textOnPage = ctx.textContent(root);
    frontmatter.minutesRead = getReadingTime(textOnPage).text;
  });
}
