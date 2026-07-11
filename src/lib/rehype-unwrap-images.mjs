/**
 * Rehype plugin to unwrap images from their surrounding paragraph.
 *
 * Markdown renders a lone image as `<p><img></p>`. When our `img -> BasicImage`
 * remapping (see `src/config/mdx-components`) turns that image into a block-level
 * `<figure>`, the invalid `<p><figure></p>` is hoisted by the HTML parser into
 * `<p></p><figure/><p></p>` — leaving empty paragraphs that pollute layout. This
 * is invisible in normal prose but breaks the `Grid` component: each image would
 * otherwise occupy three grid cells (empty-p, figure, empty-p). Stripping the
 * wrapping `<p>` here, at the hast stage (before component substitution), means
 * images become clean direct children of their parent in every context.
 *
 * Only paragraphs whose non-whitespace children are ALL images (optionally
 * wrapped in a single link, e.g. `[![alt](img)](href)`) are unwrapped, so inline
 * images sitting inside a run of text are left exactly where they are.
 *
 * Vendored from `rehype-unwrap-images` (MIT © Titus Wormer and contributors,
 * https://github.com/rehypejs/rehype-unwrap-images) with its `hast-util-whitespace`
 * dependency inlined — it's a ~20-line transform, not worth another package.
 *
 * @returns {Function} Rehype transformer function
 */
import { visit } from 'unist-util-visit';

export function rehypeUnwrapImages() {
  return function (tree) {
    visit(tree, 'element', function (node, index, parent) {
      if (node.tagName === 'p' && parent && typeof index === 'number') {
        const relevant = node.children.filter(child => !isWhitespace(child));
        if (relevant.length > 0 && relevant.every(isImageContent)) {
          // Replace the paragraph with its children, then re-visit from here so
          // the newly-lifted nodes are processed in place.
          parent.children.splice(index, 1, ...node.children);
          return index;
        }
      }
    });
  };
}

/** An `<img>`, or an `<a>` whose only content is image(s). */
function isImageContent(node) {
  if (node.type !== 'element') return false;
  if (node.tagName === 'img') return true;
  if (node.tagName === 'a') {
    const relevant = node.children.filter(child => !isWhitespace(child));
    return relevant.length > 0 && relevant.every(isImageContent);
  }
  return false;
}

/** A text node containing only whitespace. */
function isWhitespace(node) {
  return node.type === 'text' && /^\s*$/.test(node.value);
}
