/**
 * Everything a card needs to describe someone else's page, gathered at build
 * time: `fetchLinkPreview(url)` and nothing else.
 *
 * Inside, the work splits three ways — `fetch.ts` gets the page and remembers
 * it, `parse.ts` reads what the page says about itself, `image.ts` copies the
 * preview image onto our own domain. This file decides what the card sees,
 * including what to show when a page tells us nothing.
 *
 * It never throws and never returns null: check `status` to know how much of
 * the result to trust.
 */

import { capturePage, type CapturedPage, type LinkStatus } from '@utils/linkPreview/fetch'
import { fetchPreviewImage, type PreviewImage } from '@utils/linkPreview/image'
import { hostname, readMetadata, titleFromUrl, type PageMetadata } from '@utils/linkPreview/parse'

export type { LinkStatus } from '@utils/linkPreview/fetch'
export type { PreviewImage } from '@utils/linkPreview/image'
export { IMAGE_CACHE_DIR, IMAGE_URL_BASE } from '@utils/linkPreview/image'

export interface LinkPreview {
  status: LinkStatus
  /** The page's own title. Null when we never got one. */
  title: string | null
  /** Always renderable: the page's title, else derived from the URL, else the host. */
  displayTitle: string
  description: string | null
  /** The host, for the line under the title. */
  domain: string | null
  /** A label for a non-HTML target — 'PDF', 'ZIP'. Null for web pages. */
  fileType: string | null
  /** True when the authored URL was an archive link we read through. */
  archived: boolean
  /** Downloaded and re-encoded at build time; always a path on this site. */
  image: PreviewImage | null
  /** The author's own alt text for the image, when they wrote one. */
  imageAlt: string | null
  /** Also self-hosted, so cards don't call out to 60 different domains. */
  favicon: PreviewImage | null
  /** The icon URL the page declared. Notion encodes a page's emoji into it. */
  faviconUrl: string | null
  /** What the site calls itself. */
  siteName: string | null
  author: string | null
  published: Date | null
}

const NO_METADATA: PageMetadata = {
  title: null,
  description: null,
  imageUrl: null,
  imageAlt: null,
  favicon: null,
  siteName: null,
  author: null,
  published: null,
}

/** Big enough for a retina render of a ~20px icon, small enough to be nothing. */
const FAVICON_PX = 64

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const page = await capturePage(url)

  // A head is only ever stored from a successful capture, so a non-empty one is
  // trustworthy even when the status now says otherwise — that's what lets a
  // link that has started 404ing keep showing what it said when it worked. A
  // failed fetch's own HTML is never kept: a 404 page usually has a full head
  // (GitHub's advertises "Build software better, together") and reading it
  // would produce a confident, wrong card.
  const metadata = page.head ? readMetadata(page.head, page.finalUrl) : NO_METADATA

  return {
    status: page.status,
    title: metadata.title,
    displayTitle: metadata.title ?? titleFromUrl(page.finalUrl) ?? hostname(page.finalUrl) ?? url,
    description: metadata.description,
    domain: hostname(page.finalUrl),
    fileType: fileTypeOf(page),
    archived: page.archived,
    ...(await images(metadata, url)),
    siteName: metadata.siteName,
    author: metadata.author,
    published: metadata.published,
  }
}

/** Both images come from the same pipeline; fetch them together. */
async function images(metadata: PageMetadata, pageUrl: string) {
  const [image, favicon] = await Promise.all([
    fetchPreviewImage(metadata.imageUrl, pageUrl),
    fetchPreviewImage(metadata.favicon, pageUrl, FAVICON_PX),
  ])
  return { image, imageAlt: metadata.imageAlt, favicon, faviconUrl: metadata.favicon }
}

/**
 * Name the file behind a link that isn't a web page, from its MIME subtype:
 * `application/pdf` → PDF. Anything unrecognisable is still worth flagging as
 * not-a-page, so it falls back to a generic label.
 */
function fileTypeOf(page: CapturedPage): string | null {
  if (page.status !== 'non-html') return null
  const subtype = page.contentType?.split(';')[0].trim().toLowerCase().split('/')[1]
  if (!subtype) return 'File'
  const name = subtype.replace(/^x-/, '').replace(/\+.*$/, '')
  return /^[a-z0-9]{2,5}$/.test(name) ? name.toUpperCase() : 'File'
}
