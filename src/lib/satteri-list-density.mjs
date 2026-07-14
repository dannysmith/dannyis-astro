/**
 * Sätteri HAST plugin to detect lists with long/paragraph-like items.
 *
 * Adds the class `long-list-items` to top-level ul/ol elements where the
 * average text length per list item exceeds a threshold. This allows CSS
 * to apply more generous spacing between items in prose-heavy lists.
 *
 * - Only applies to top-level lists (not nested lists) — checked via
 *   `ctx.parent()` (skip when the parent is an `li`)
 * - Excludes text inside nested lists when calculating item length
 *   (hand-rolled recursion; `ctx.textContent` is whole-subtree)
 * - Threshold defaults to 120 characters average per item
 *
 * @param {Object} options
 * @param {number} [options.threshold=120] - Average chars per item to trigger class
 */
import { defineHastPlugin } from 'satteri';

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

export function satteriListDensity(options = {}) {
  const threshold = options.threshold ?? 120;

  return defineHastPlugin({
    name: 'satteri-list-density',
    element: {
      filter: ['ul', 'ol'],
      visit(node, ctx) {
        // Skip if nested inside a list item (not a top-level list)
        if (ctx.parent(node)?.tagName === 'li') return;

        // Get all direct li children
        const items = node.children.filter(c => c.type === 'element' && c.tagName === 'li');
        if (items.length === 0) return;

        // Calculate total text length across all items
        let totalChars = 0;
        for (const li of items) {
          totalChars += getDirectTextLength(li);
        }

        const avgChars = totalChars / items.length;

        if (avgChars > threshold) {
          const existing = node.properties?.className;
          const classes = Array.isArray(existing)
            ? existing
            : existing
              ? String(existing).split(/\s+/)
              : [];
          ctx.setProperty(node, 'className', [...classes, 'long-list-items']);
        }
      },
    },
  });
}
