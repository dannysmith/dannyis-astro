/**
 * Remark plugin to turn a markdown image's title into a figure caption.
 *
 * Authors write a standard markdown image with the optional title string:
 *
 *     ![Alt text for accessibility](./photo.jpg "A caption shown to readers.")
 *
 * The third quoted string is the CommonMark image `title`. This plugin moves
 * it onto the image node as a `caption` hProperty, which surfaces as the
 * `caption` prop on the BasicImage component (see MDX_COMPONENT_REMAPPING).
 * BasicImage then renders it inside the `<figcaption>`, taking precedence over
 * `showAlt` (see `src/components/mdx/BasicImage.astro`). The original `title`
 * is removed so it doesn't also emit a redundant HTML `title` attribute.
 *
 * MDX-only: the `img -> BasicImage` remapping is an MDX feature and never fires
 * in plain `.md` files, so this transform is gated to `.mdx`. In `.md` the
 * title is left untouched and renders as a standard HTML `title` attribute.
 *
 * @returns {Function} Remark transformer function
 */
import { visit } from 'unist-util-visit';

export function remarkImageCaption() {
  return function (tree, file) {
    const path = file?.path ?? file?.history?.at(-1) ?? '';
    if (!path.endsWith('.mdx')) return;

    visit(tree, 'image', node => {
      if (!node.title) return;

      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.hProperties.caption = node.title;
      node.title = null;
    });
  };
}
