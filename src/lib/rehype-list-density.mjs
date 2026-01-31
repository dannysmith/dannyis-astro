/**
 * Rehype plugin to detect lists with long/paragraph-like items
 *
 * Adds the class `long-list-items` to top-level ul/ol elements where the
 * average text length per list item exceeds a threshold. This allows CSS
 * to apply more generous spacing between items in prose-heavy lists.
 *
 * - Only applies to top-level lists (not nested lists)
 * - Excludes text inside nested lists when calculating item length
 * - Threshold defaults to 120 characters average per item
 *
 * @example
 * // In astro.config.mjs
 * import { rehypeListDensity } from './src/lib/rehype-list-density.mjs';
 *
 * export default defineConfig({
 *   markdown: {
 *     rehypePlugins: [rehypeListDensity]
 *   }
 * });
 *
 * @param {Object} options
 * @param {number} [options.threshold=120] - Average chars per item to trigger class
 * @returns {Function} Rehype transformer function
 */
import { visit } from 'unist-util-visit';

/**
 * Get the text length of a node, excluding nested lists
 */
function getDirectTextLength(node) {
  let length = 0;
  for (const child of node.children || []) {
    if (child.type === 'text') {
      length += child.value.length;
    } else if (child.type === 'element' && child.tagName !== 'ul' && child.tagName !== 'ol') {
      // Recurse into inline elements (em, strong, a, code, etc.) but not lists
      length += getDirectTextLength(child);
    }
  }
  return length;
}

export function rehypeListDensity(options = {}) {
  const threshold = options.threshold ?? 120;

  return tree => {
    visit(tree, 'element', (node, _index, parent) => {
      // Only process ul/ol
      if (node.tagName !== 'ul' && node.tagName !== 'ol') return;

      // Skip if nested inside another list item (not a top-level list)
      if (parent?.tagName === 'li') return;

      // Get all direct li children
      const items = node.children.filter(c => c.tagName === 'li');
      if (items.length === 0) return;

      // Calculate total text length across all items
      let totalChars = 0;
      for (const li of items) {
        totalChars += getDirectTextLength(li);
      }

      const avgChars = totalChars / items.length;

      if (avgChars > threshold) {
        node.properties = node.properties || {};
        const existing = node.properties.className;
        const classes = Array.isArray(existing) ? existing : existing ? existing.split(/\s+/) : [];
        node.properties.className = [...classes, 'long-list-items'];
      }
    });
  };
}
