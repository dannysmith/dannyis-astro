/**
 * Sätteri HAST plugin to open external links in a new tab.
 * (Replaces `rehype-external-links`.)
 *
 * Adds `target="_blank"` + `rel="noopener noreferrer"` to links that leave
 * the site. "External" deliberately mirrors SmartLink's semantics
 * (`src/components/mdx/SmartLink.astro`): the href starts with `http` and
 * does not contain `danny.is`. This is a small improvement over the old
 * `rehype-external-links` config, which blank-targeted *all* absolute URLs
 * including danny.is ones.
 *
 * In practice this only affects plain `.md` content — in `.mdx` the
 * `a -> SmartLink` remapping computes the same attributes itself (the
 * properties set here are spread into SmartLink and match what it renders).
 */
import { defineHastPlugin } from 'satteri';

export function satteriExternalLinks() {
  return defineHastPlugin({
    name: 'satteri-external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string') return;
        if (!href.startsWith('http') || href.includes('danny.is')) return;

        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  });
}
