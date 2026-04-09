/**
 * Remark plugin to transform `md preview` fenced code blocks into a
 * MarkdownBlock component.
 *
 * This is the mechanism that powers the <MarkdownBlock> experience. Authors
 * write a standard fenced code block with `md` as the language and `preview`
 * in the meta string:
 *
 *     ```md preview
 *     ## My included markdown
 *     Some text.
 *     ```
 *
 * At build time, this plugin walks the MDAST, finds matching code nodes, and
 * rewrites them into `mdxJsxFlowElement` nodes that reference the
 * `markdown-preview` tag. That tag is remapped to the MarkdownBlock Astro
 * component via MDX_COMPONENT_REMAPPING, which receives the raw markdown as
 * a `code` prop (plus an optional `title`).
 *
 * Why a custom element name with a dash? MDX treats dashed lowercase names
 * as HTML tags, which matches the existing remapping pattern used for `a`
 * and `img`. Using a dashed name avoids MDX component-name resolution
 * quirks while still being a unique identifier no real HTML element uses.
 *
 * Why fenced code blocks? Because fenced code blocks are the only place in
 * MDX where raw content is preserved verbatim through compilation. Any
 * other form (slot children, template literals) either gets pre-parsed or
 * requires per-file imports and escaping.
 *
 * Meta string syntax supported:
 *   ```md preview
 *   ```md preview title="README.md"
 *   ```md preview defaultView="source"
 *   ```markdown preview
 *
 * @example
 * // In astro.config.mjs
 * import { remarkMarkdownPreview } from './src/lib/remark-markdown-preview.mjs';
 *
 * export default defineConfig({
 *   markdown: {
 *     remarkPlugins: [remarkMarkdownPreview],
 *   },
 * });
 *
 * @returns {Function} Remark transformer function
 */
import { visit } from 'unist-util-visit';

const MARKDOWN_LANGS = new Set(['md', 'markdown']);

/**
 * Parse a fenced code block meta string into a simple object.
 * Supports bare flags (`preview`) and quoted key="value" pairs (`title="foo"`).
 */
function parseMeta(meta) {
  if (!meta) return {};
  const result = {};
  // Matches: key="value" OR bareFlag
  const regex = /(\w+)="([^"]*)"|(\w+)/g;
  let match;
  while ((match = regex.exec(meta)) !== null) {
    if (match[1]) {
      result[match[1]] = match[2];
    } else if (match[3]) {
      result[match[3]] = true;
    }
  }
  return result;
}

export function remarkMarkdownPreview() {
  return function (tree) {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (!node.lang || !MARKDOWN_LANGS.has(node.lang)) return;

      const meta = parseMeta(node.meta);
      if (!meta.preview) return;

      const attributes = [{ type: 'mdxJsxAttribute', name: 'code', value: node.value }];

      if (typeof meta.title === 'string' && meta.title.length > 0) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'title',
          value: meta.title,
        });
      }

      if (meta.defaultView === 'source' || meta.defaultView === 'rendered') {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'defaultView',
          value: meta.defaultView,
        });
      }

      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'markdown-preview',
        attributes,
        children: [],
      };
    });
  };
}
