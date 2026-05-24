/**
 * Remark plugin to transform `tree` fenced code blocks into a FileTree
 * component.
 *
 * Authors write a standard fenced code block with `tree` as the language.
 * The block body is a `tree(1)`-style plain-text file tree:
 *
 *     ```tree
 *     src/
 *     ├── index.ts
 *     └── lib/
 *         └── helper.ts
 *     ```
 *
 * At build time, this plugin walks the MDAST, finds matching code nodes,
 * and rewrites them into `mdxJsxFlowElement` nodes referencing the
 * `file-tree` tag. That tag is remapped to the FileTree Astro component
 * via MDX_COMPONENT_REMAPPING, which receives the raw tree text as a
 * `code` prop (plus optional `title`, `frame` and `highlight`).
 *
 * This mirrors the `remark-markdown-preview` plugin — fenced code blocks
 * are the only place in MDX where raw content survives compilation
 * verbatim, and a dashed custom element name (`file-tree`) is treated by
 * MDX as an HTML tag, matching the existing remapping pattern.
 *
 * Meta string syntax supported (Expressive-Code-compatible where it
 * makes sense):
 *   ```tree title="My Project"      — filename/label in the frame header
 *   ```tree frame="none"            — suppress the window frame + title
 *   ```tree {2,5-7}                 — highlight rows 2, 5, 6 and 7
 *
 * The `frame` attribute is only emitted for the value `"none"`; any other
 * value falls back to the default framed rendering. Highlight ranges are
 * expanded, de-duplicated and sorted here, then passed to the component
 * as a comma-separated string (e.g. `highlight="2,5,6,7"`).
 *
 * @returns {Function} Remark transformer function
 */
import { visit } from 'unist-util-visit';

/**
 * Expand a highlight spec like `2,5-7` into a sorted, de-duplicated array
 * of 1-based line numbers. Reversed ranges (`5-3`) are normalised.
 * Non-numeric junk and non-positive line numbers (line 0 doesn't exist)
 * are ignored.
 */
function parseHighlightRanges(spec) {
  const lines = new Set();
  for (const part of spec.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = trimmed.match(/^(\d+)-(\d+)$/);
    if (range) {
      let start = Number(range[1]);
      let end = Number(range[2]);
      if (start > end) [start, end] = [end, start];
      for (let i = start; i <= end; i++) {
        if (i > 0) lines.add(i);
      }
    } else if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (n > 0) lines.add(n);
    }
  }
  return [...lines].sort((a, b) => a - b);
}

/**
 * Parse a fenced code block meta string. Extracts a `{…}` highlight spec,
 * then `key="value"` pairs (`title`, `frame`) from the remainder.
 */
function parseMeta(meta) {
  const result = { highlight: [] };
  if (!meta) return result;

  let rest = meta;

  const brace = rest.match(/\{([^}]*)\}/);
  if (brace) {
    result.highlight = parseHighlightRanges(brace[1]);
    rest = rest.slice(0, brace.index) + rest.slice(brace.index + brace[0].length);
  }

  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(rest)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

export function remarkTreeBlock() {
  return function (tree) {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.lang !== 'tree') return;

      const meta = parseMeta(node.meta);

      const attributes = [{ type: 'mdxJsxAttribute', name: 'code', value: node.value }];

      if (typeof meta.title === 'string' && meta.title.length > 0) {
        attributes.push({ type: 'mdxJsxAttribute', name: 'title', value: meta.title });
      }

      if (meta.frame === 'none') {
        attributes.push({ type: 'mdxJsxAttribute', name: 'frame', value: 'none' });
      }

      if (meta.highlight.length > 0) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'highlight',
          value: meta.highlight.join(','),
        });
      }

      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'file-tree',
        attributes,
        children: [],
      };
    });
  };
}
