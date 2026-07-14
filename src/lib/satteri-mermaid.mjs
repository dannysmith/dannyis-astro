/**
 * Sätteri HAST plugin to render ```mermaid fences into inline SVG at build
 * time — no client-side JavaScript.
 *
 * Renders via `mermaid-isomorphic` (headless Playwright browser) and replaces
 * the `<pre>` with the rendered `<svg>`. The SVG keeps mermaid's `mermaid-…`
 * id, which the site styles via `svg[id^='mermaid-']` in `global.css`.
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
 * @param {object} [opts]
 * @param {object} [opts.mermaidConfig] Mermaid theme/config object passed to
 *   the renderer (see `src/config/mermaid.js`).
 */
import { createMermaidRenderer } from 'mermaid-isomorphic';
import { defineHastPlugin } from 'satteri';

export function satteriMermaid({ mermaidConfig } = {}) {
  // One renderer shared across every document in the build.
  const renderer = createMermaidRenderer();

  // Each visit renders a single diagram, so the renderer's per-batch index is
  // always 0 — a shared counter keeps ids unique when a page has several
  // diagrams (duplicate ids would collide the SVGs' internal marker refs).
  let count = 0;

  return defineHastPlugin({
    name: 'satteri-mermaid',
    element: {
      filter: ['pre'],
      async visit(node, ctx) {
        const codeChild = node.children?.find(
          child => child.type === 'element' && child.tagName === 'code',
        );
        if (!codeChild || codeChild.data?.lang !== 'mermaid') return;

        const diagram = ctx.textContent(codeChild).replace(/\n$/, '');
        const [result] = await renderer([diagram], {
          mermaidConfig,
          prefix: `mermaid-${count++}`,
        });
        if (result.status !== 'fulfilled') {
          throw new Error(
            `Mermaid rendering failed in ${ctx.fileURL ?? 'inline content'}: ${result.reason}`,
          );
        }

        const svg = result.value.svg;
        if (ctx.sourceFormat === 'mdx') {
          return {
            type: 'mdxJsxFlowElement',
            name: 'Fragment',
            attributes: [{ type: 'mdxJsxAttribute', name: 'set:html', value: svg }],
            children: [],
          };
        }
        return { type: 'raw', value: svg };
      },
    },
  });
}
