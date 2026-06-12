// Registry of non-collection pages that get a dynamically generated cover
// (OG) image. Articles and notes get theirs from their content collections;
// this covers standalone pages like /now or /styleguide.
//
// The `title` here is the text drawn on the cover — chosen for the cover, not
// taken from the page's HTML <title> (which is often longer / SEO-oriented).
// It is rendered in all caps by the template.
//
// Any route not listed here (and not an article/note) falls back to the
// static default OG image — including the home page.

export interface OgImagePage {
  /** Page route, no trailing slash, e.g. "/now". */
  path: string;
  /** Cover text (rendered uppercase). */
  title: string;
}

export const OG_IMAGE_PAGES: OgImagePage[] = [
  { path: '/now', title: 'Now' },
  { path: '/writing', title: 'Writing' },
  { path: '/notes', title: 'Short Notes' },
  { path: '/styleguide', title: 'Site Styleguide' },
  { path: '/styleguide/foundations', title: 'Styleguide: Foundations' },
  { path: '/styleguide/typography', title: 'Styleguide: Typography' },
  { path: '/styleguide/components', title: 'Styleguide: Content' },
  { path: '/styleguide/ui', title: 'Styleguide: UI' },
  { path: '/styleguide/html', title: 'Styleguide: HTML' },
  { path: '/privacy', title: 'Privacy Policy' },
  { path: '/colophon', title: 'Colophon' },
  { path: '/ai', title: 'AI Statement' },
];

/** Strip a trailing slash (but keep the root "/"). */
function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
}

function getOgImagePage(pathname: string): OgImagePage | undefined {
  const path = normalizePath(pathname);
  return OG_IMAGE_PAGES.find(page => page.path === path);
}

/**
 * The og-image URL for a page path (matching the article/note convention of
 * `<page>/og-image.png`), or undefined if the page isn't registered.
 */
export function getOgImageUrlForPath(pathname: string): string | undefined {
  const page = getOgImagePage(pathname);
  return page ? `${page.path}/og-image.png` : undefined;
}
