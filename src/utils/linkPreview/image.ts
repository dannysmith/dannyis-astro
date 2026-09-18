/**
 * The preview image and favicon a card shows, copied onto our own domain by
 * `@utils/mirrorImage` — see there for why we don't hotlink, and why this
 * isn't Astro's <Image>.
 *
 * What's added here is what's particular to a link card: the two sizes, whether
 * the image is a banner or a logo, and which failures are worth a build warning.
 */

import { recordProblem } from '@utils/linkPreview/health'
import { mirrorImage, type MirroredImage } from '@utils/mirrorImage'

/** Twice the widest the card ever draws it (a full-width card in a narrow container). */
const TARGET_MAX_PX = 800
/** Big enough for a retina render of a ~20px icon, small enough to be nothing. */
const FAVICON_PX = 64

/**
 * Below this ratio an image is a logo or avatar rather than a banner, and
 * cropping it to 16:9 slices the middle out of it.
 *
 * Measured against every link on this site, the shapes fall into two clusters:
 * squares at 1.0 (about one link in ten — site logos and avatars) and
 * everything else at 1.33 and up. The boundary sits in the gap, so 4:3 photos
 * still get the banner crop, which is what they want.
 */
const LOGO_MAX_RATIO = 1.2

export interface PreviewImage extends MirroredImage {
  shape: 'banner' | 'logo'
}

/**
 * Mirror a card's image, returning null for anything that doesn't resolve to a
 * usable one — which leaves the card to render without it.
 *
 * A missing *preview* image is worth a build warning; a missing favicon isn't.
 * We already skip undecodable `.ico` icons without a word, and a quarter of
 * cards have no favicon at all, so reporting the ones that fail mid-download
 * would only teach you to ignore the report. Notion's emoji icons land here
 * every build: the icon URL encodes an emoji rather than an image, and
 * `Notion.astro` renders the emoji instead.
 */
export async function fetchPreviewImage(
  imageUrl: string | null,
  /** The page the image belongs to; only used to make warnings locatable. */
  pageUrl: string,
  kind: 'preview' | 'favicon' = 'preview',
): Promise<PreviewImage | null> {
  const image = await mirrorImage(imageUrl, {
    group: 'links',
    maxPx: kind === 'favicon' ? FAVICON_PX : TARGET_MAX_PX,
    onProblem: kind === 'preview' ? detail => recordProblem(pageUrl, 'image', detail) : undefined,
  })
  return image && { ...image, shape: classifyShape(image.width, image.height) }
}

/** Decides the shape of the panel the card draws; both are cropped to fill it. */
export function classifyShape(width: number, height: number): 'banner' | 'logo' {
  return width / height < LOGO_MAX_RATIO ? 'logo' : 'banner'
}
