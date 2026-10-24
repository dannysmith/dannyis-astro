/**
 * Render a file-tree comment string as inline markdown.
 *
 * Comments in a `tree` block (the text after ` # `) may contain inline
 * markdown — bold, code spans, and links. This renders that to an HTML
 * string suitable for `set:html`, with the wrapping `<p>` removed so it sits
 * inline. A comment that starts like a block (`- `, `1. `, `> `) renders as
 * that block, as it would anywhere else in markdown.
 *
 * Comment strings don't pass through the site's main markdown pipeline, so
 * this is a standalone Sätteri render that adds back `satteriExternalLinks`
 * (the same pattern as MarkdownBlock).
 */
import { markdownToHtml } from 'satteri'
import { satteriExternalLinks } from '../satteri-external-links.mjs'

export function renderInlineMarkdown(text: string): string {
  const { html } = markdownToHtml(text.trim(), { hastPlugins: [satteriExternalLinks()] })
  return html.trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1')
}
