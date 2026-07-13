/**
 * Sätteri HAST plugin to append a hover anchor link to every heading.
 * (Replaces `rehype-autolink-headings`.)
 *
 * Appends `<a href="#slug" aria-label="Link to “…”"></a>` to `h1`–`h6`. The
 * `#` glyph is rendered via CSS `::after` (see the heading-anchor rules in
 * `src/styles/_typography.css`), NOT as a text child. That matters: the
 * built-in heading-IDs plugin is hardcoded to run *after* user `hastPlugins`
 * and records each heading's TOC text via `textContent` — a literal `#`
 * child would pollute every `TableOfContents` entry ("My Heading#").
 *
 * Heading `id`s: this plugin reads `node.properties.id` and never slugs
 * anything itself. Register `satteriHeadingIdsPlugin()` (a public export of
 * `@astrojs/markdown-satteri`) immediately before it — as a FACTORY
 * (`() => satteriHeadingIdsPlugin()`), since the plugin creates its slugger
 * at construction and a shared instance would leak slug deduplication across
 * documents. Running heading-IDs early is the officially supported pattern
 * (made idempotent for exactly this in withastro/astro#17165): the trailing
 * built-in run respects existing `id`s and records them into
 * `astro.headings` without duplication.
 *
 * Headings without an `id` (heading-IDs not registered upstream) are left
 * untouched rather than given a dead link.
 */
import { defineHastPlugin } from 'satteri';

export function satteriAutolinkHeadings() {
  return defineHastPlugin({
    name: 'satteri-autolink-headings',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        const id = node.properties?.id;
        if (typeof id !== 'string' || id.length === 0) return;

        const text = ctx.textContent(node).trim();
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#${id}`,
            ariaLabel: text ? `Link to “${text}”` : 'Link to this section',
          },
          children: [],
        });
      },
    },
  });
}
