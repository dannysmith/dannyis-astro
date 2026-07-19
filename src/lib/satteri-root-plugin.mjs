/**
 * Helper for Sätteri MDAST plugins that need the whole document once.
 *
 * Sätteri has no `root` visitor — plugins subscribe to node types and are
 * dispatched in pre-order. `defineRootPlugin` subscribes to every node type
 * that can appear as a direct child of the root, so the first node visited
 * (whatever it is) triggers `fn(root, ctx)` exactly once per document, with
 * the root reached via `ctx.parent()`. Because tree mutations are buffered
 * until each visit completes, `fn` sees the document as parsed — before any
 * changes queued by plugins earlier in the array.
 *
 * Returned in factory form so the fire-once flag resets between documents.
 */
import { defineMdastPlugin } from 'satteri'

/** Every node type that can appear as a direct child of the mdast root. */
const ROOT_CHILD_TYPES = [
  'yaml',
  'mdxjsEsm',
  'heading',
  'paragraph',
  'blockquote',
  'list',
  'code',
  'html',
  'table',
  'thematicBreak',
  'definition',
  'footnoteDefinition',
  'mdxJsxFlowElement',
  'mdxFlowExpression',
]

/**
 * @param {string} name  Plugin name.
 * @param {(root: object, ctx: object) => void} fn  Called once per document.
 */
export function defineRootPlugin(name, fn) {
  return () => {
    let done = false

    function visit(node, ctx) {
      if (done) return
      done = true

      let root = ctx.parent(node)
      while (root && root.type !== 'root') root = ctx.parent(root)
      if (root) fn(root, ctx)
    }

    return defineMdastPlugin({
      name,
      ...Object.fromEntries(ROOT_CHILD_TYPES.map(type => [type, visit])),
    })
  }
}
