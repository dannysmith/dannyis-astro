/**
 * Sätteri MDAST plugin to detect footnotes in Markdown/MDX content.
 *
 * Checks at build time whether the content contains any footnote definitions
 * (the `[^label]: content` part) and writes the result to the frontmatter bag
 * as `hasFootnotes` (boolean, always set), where it surfaces as
 * `remarkPluginFrontmatter.hasFootnotes` via render(). Used to conditionally
 * render footnote-related components (e.g. `<InlineFootnotes />` in the
 * Article layout) only on pages that actually contain footnotes.
 *
 * The detection is AST-based, meaning it correctly ignores footnote-like
 * syntax (e.g., `[^1]`) that appears inside code blocks or inline code —
 * a body-text regex could not.
 */
import { defineRootPlugin } from './satteri-root-plugin.mjs'

/** Recursively check whether any node in the subtree has the given type. */
function hasNodeType(node, type) {
  if (node.type === type) return true
  if (node.children) {
    return node.children.some(child => hasNodeType(child, type))
  }
  return false
}

export function satteriFootnoteDetector() {
  return defineRootPlugin('satteri-footnote-detector', (root, ctx) => {
    const frontmatter = ctx.data.astro?.frontmatter
    if (!frontmatter) return

    frontmatter.hasFootnotes = hasNodeType(root, 'footnoteDefinition')
  })
}
