/**
 * Remark plugin to inject reading time into frontmatter
 *
 * This plugin runs at build time during MDX processing and automatically
 * calculates reading time for articles and notes. The reading time is injected
 * into the frontmatter as `minutesRead` and becomes available in:
 * - `entry.data.minutesRead` when using getCollection()
 * - `remarkPluginFrontmatter.minutesRead` when using render()
 *
 * @example
 * // In astro.config.mjs
 * markdown: {
 *   remarkPlugins: [remarkReadingTime]
 * }
 *
 * @example
 * // Accessing reading time in components
 * const { Content, remarkPluginFrontmatter } = await render(post);
 * const readingTime = remarkPluginFrontmatter.minutesRead; // "5 min read"
 *
 * @returns {Function} Remark transformer function
 */
import getReadingTime from 'reading-time';
import { toString as mdastToString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = mdastToString(tree);
    const readingTime = getReadingTime(textOnPage);
    // Inject reading time into frontmatter (e.g., "5 min read")
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
