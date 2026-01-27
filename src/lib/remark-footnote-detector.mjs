/**
 * Remark plugin to detect footnotes in Markdown/MDX content
 *
 * This plugin runs at build time during MDX processing and checks whether
 * the content contains any footnotes. The result is injected into frontmatter
 * as `hasFootnotes` (boolean) and becomes available in:
 * - `remarkPluginFrontmatter.hasFootnotes` when using render()
 *
 * This is useful for conditionally loading footnote-related components or
 * scripts only on pages that actually contain footnotes.
 *
 * The detection is AST-based, meaning it correctly ignores footnote-like
 * syntax (e.g., `[^1]`) that appears inside code blocks or inline code.
 *
 * @example
 * // In astro.config.mjs
 * import { remarkFootnoteDetector } from './src/lib/remark-footnote-detector.mjs';
 *
 * export default defineConfig({
 *   markdown: {
 *     remarkPlugins: [remarkFootnoteDetector]
 *   }
 * });
 *
 * @example
 * // Accessing hasFootnotes in page components
 * const { Content, remarkPluginFrontmatter } = await render(post);
 * const hasFootnotes = remarkPluginFrontmatter.hasFootnotes; // true or false
 *
 * @example
 * // Conditionally rendering a component
 * {hasFootnotes && <InlineFootnotes />}
 *
 * @returns {Function} Remark transformer function
 */

/**
 * Recursively checks if any node in the tree matches the given type
 * @param {Object} node - MDAST node to check
 * @param {string} type - Node type to search for
 * @returns {boolean} True if a matching node is found
 */
function hasNodeType(node, type) {
  if (node.type === type) return true;
  if (node.children) {
    return node.children.some(child => hasNodeType(child, type));
  }
  return false;
}

export function remarkFootnoteDetector() {
  return function (tree, { data }) {
    // Check for footnoteDefinition nodes (the [^label]: content part)
    // If these exist, the content has footnotes
    const frontmatter = data.astro?.frontmatter;
    if (frontmatter) {
      frontmatter.hasFootnotes = hasNodeType(tree, 'footnoteDefinition');
    }
  };
}
