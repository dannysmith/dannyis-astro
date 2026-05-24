/**
 * Render a file-tree comment string as inline markdown.
 *
 * Comments in a `tree` block (the text after ` # `) may contain inline
 * markdown — bold, code spans, and links. This renders that to an HTML
 * string suitable for `set:html`. `parseInline` is used so the output
 * isn't wrapped in a block-level `<p>`.
 *
 * External links get `target="_blank"` + `rel="noopener noreferrer"`.
 * This substitutes for `rehype-external-links`, which only runs on the
 * site's main markdown pipeline — comment strings don't pass through it.
 */
import { Marked } from 'marked';

/** HTML-escape untrusted string values before interpolating into attributes. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Configured once at module load. Only `parseInline` (a read-only
// operation) is called afterward, so sharing the instance across
// concurrent SSR renders is safe.
const md = new Marked({ gfm: true, async: false });
md.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href);
      const hrefAttr = escapeAttr(href ?? '');
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
      const securityAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${hrefAttr}"${titleAttr}${securityAttrs}>${text}</a>`;
    },
  },
});

export function renderInlineMarkdown(text: string): string {
  return md.parseInline(text.trim()) as string;
}
