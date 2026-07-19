/**
 * Sätteri HAST plugin to unwrap images from their surrounding paragraph.
 *
 * Markdown renders a lone image as `<p><img></p>`. When our `img -> BasicImage`
 * remapping (see `src/config/mdx-components`) turns that image into a block-level
 * `<figure>`, the invalid `<p><figure></p>` is hoisted by the HTML parser into
 * `<p></p><figure/><p></p>` — leaving empty paragraphs that pollute layout. This
 * is invisible in normal prose but breaks the `Grid` component: each image would
 * otherwise occupy three grid cells (empty-p, figure, empty-p). Stripping the
 * wrapping `<p>` here, at the hast stage (before the img→component conversion,
 * which runs after user hastPlugins), means images become clean direct children
 * of their parent in every context.
 *
 * Only paragraphs whose non-whitespace children are ALL images (optionally
 * wrapped in a single link, e.g. `[![alt](img)](href)`) are unwrapped, so inline
 * images sitting inside a run of text are left exactly where they are.
 *
 * Logic vendored from `rehype-unwrap-images` (MIT © Titus Wormer and
 * contributors, https://github.com/rehypejs/rehype-unwrap-images) with its
 * `hast-util-whitespace` dependency inlined.
 */
import { defineHastPlugin } from 'satteri'

export function satteriUnwrapImages() {
  return defineHastPlugin({
    name: 'satteri-unwrap-images',
    element: {
      filter: ['p'],
      visit(node, ctx) {
        const relevant = node.children.filter(child => !isWhitespace(child))
        if (relevant.length > 0 && relevant.every(isImageContent)) {
          // Sätteri nodes are read-only views over Rust memory — they can't be
          // re-inserted directly (and `replaceNode` only takes a single node),
          // so lift plain spec-shaped copies of the children out and drop the
          // wrapper. Later plugins (e.g. the native img→component one) still
          // visit freshly-built nodes.
          ctx.insertBefore(node, node.children.map(toPlain))
          ctx.removeNode(node)
        }
      },
    },
  })
}

/**
 * Recursively copy a read-only Sätteri hast node into a plain spec-shaped
 * object (`structuredClone` would drag internal view fields along with it).
 */
function toPlain(node) {
  const plain = { type: node.type }
  if (node.type === 'element') {
    plain.tagName = node.tagName
    plain.properties = { ...node.properties }
    plain.children = node.children.map(toPlain)
  } else if ('value' in node && node.value != null) {
    plain.value = node.value
  }
  return plain
}

/** An `<img>`, or an `<a>` whose only content is image(s). */
function isImageContent(node) {
  if (node.type !== 'element') return false
  if (node.tagName === 'img') return true
  if (node.tagName === 'a') {
    const relevant = node.children.filter(child => !isWhitespace(child))
    return relevant.length > 0 && relevant.every(isImageContent)
  }
  return false
}

/** A text node containing only whitespace. */
function isWhitespace(node) {
  return node.type === 'text' && /^\s*$/.test(node.value)
}
