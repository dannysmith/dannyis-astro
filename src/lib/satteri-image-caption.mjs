/**
 * Sätteri HAST plugin to turn a markdown image's title into a figure caption.
 *
 * Authors write a standard markdown image with the optional title string:
 *
 *     ![Alt text for accessibility](./photo.jpg "A caption shown to readers.")
 *
 * The third quoted string is the CommonMark image `title`. This plugin moves
 * it onto the `img` element as a `caption` property, which surfaces as the
 * `caption` prop on the BasicImage component (see MDX_COMPONENT_REMAPPING).
 * BasicImage then renders it inside the `<figcaption>`, taking precedence over
 * `showAlt` (see `src/components/mdx/BasicImage.astro`). The original `title`
 * is removed so it doesn't also emit a redundant HTML `title` attribute.
 *
 * Why the HAST stage? `@astrojs/mdx`'s img→component plugin runs *after* user
 * `hastPlugins` and copies every `img` property verbatim into JSX attributes,
 * so a property set here is guaranteed to arrive as a component prop.
 *
 * MDX-only: the `img -> BasicImage` remapping is an MDX feature and never
 * fires in plain `.md` files, so this transform is gated via
 * `ctx.sourceFormat`. In `.md` the title is left untouched and renders as a
 * standard HTML `title` attribute.
 */
import { defineHastPlugin } from 'satteri'

export function satteriImageCaption() {
  return defineHastPlugin({
    name: 'satteri-image-caption',
    element: {
      filter: ['img'],
      visit(node, ctx) {
        if (ctx.sourceFormat !== 'mdx') return

        const title = node.properties?.title
        if (typeof title !== 'string' || title.length === 0) return

        ctx.setProperty(node, 'caption', title)
        ctx.setProperty(node, 'title', null)
      },
    },
  })
}
