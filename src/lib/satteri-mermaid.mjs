/**
 * Sätteri HAST plugin to render ```mermaid fences into inline SVG at build
 * time. (Replaces `rehype-mermaid`, keeping its zero-client-JS behaviour.)
 *
 * Uses `mermaid-isomorphic` — the same headless-browser (Playwright) renderer
 * `rehype-mermaid` is built on — and replaces the `<pre>` with the rendered
 * `<svg>` (the equivalent of rehype-mermaid's default "inline-svg" strategy).
 * The SVG keeps mermaid's `mermaid-…` id, which the site styles via
 * `svg[id^='mermaid-']` in `global.css`.
 *
 * The SVG string is spliced in byte-for-byte, never parsed into hast
 * elements — parsing it (hast-util-from-html) camelCases SVG presentation
 * attributes (`marker-end` → `markerEnd`) and Sätteri's serializer only maps
 * some of them back, which silently dropped every arrowhead. The verbatim
 * mechanism differs per format:
 * - `.md`: a `raw` hast node — the HTML renderer emits its value untouched.
 * - `.mdx`: a `raw` node would be COMPILED TO ESCAPED TEXT (the JSX compiler
 *   has no raw-HTML output), so return a `Fragment` JSX element carrying the
 *   SVG via `set:html` — the same mechanism `@astrojs/mdx`'s own
 *   `optimizeStatic` uses; Astro's MDX runtime always provides `Fragment`.
 *
 * Notes:
 * - Sätteri visitors may be async, and a filtered visitor's return value
 *   replaces the visited node — the two capabilities that make a build-time
 *   port possible (the community package `@xingwangzhe/satteri-mermaid` is
 *   client-side: it ships the diagram source for the browser to render,
 *   which violates this site's no-runtime-JS rule).
 * - Mermaid fences must be excluded from syntax highlighting
 *   (`markdown.syntaxHighlight.excludeLangs: ['mermaid']`) so this plugin
 *   receives the untouched `<pre><code>` (Expressive Code also leaves it
 *   alone). The fence language arrives as `data.lang` on the code element,
 *   same as the built-in highlight plugin reads it.
 * - A render failure throws and fails the build, matching rehype-mermaid.
 *
 * @param {object} [opts]
 * @param {import('mermaid').MermaidConfig} [opts.mermaidConfig] Theme/config
 *   passed to mermaid (see `src/config/mermaid.js`).
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
