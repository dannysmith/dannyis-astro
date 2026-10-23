/**
 * The site's main navigation, rendered by MainNavigation and also used for the
 * command palette's Navigation group. The footer and homepage link list keep
 * their own links.
 *
 * The menu is a list of sections. The first has no heading; later ones can add
 * one. Items can nest via `children`.
 */

export interface NavItem {
  label: string
  href: string
  /** Leaves the site (shows ↗). */
  external?: boolean
  /** Extra words the command palette matches on. Not shown. */
  keywords?: string
  children?: NavItem[]
}

export interface NavSection {
  heading?: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Writing', href: '/writing', keywords: 'articles blog essays' },
      { label: 'Notes', href: '/notes', keywords: 'short posts' },
      { label: 'Toolbox', href: '/toolbox', keywords: 'remote work practices tools advice' },
      { label: 'Now', href: '/now', keywords: 'currently' },
      { label: 'Making', href: '/making', keywords: 'projects things' },
      { label: 'Work', href: '/working', external: true },
      ...(import.meta.env.DEV ? [{ label: 'Styleguide', href: '/styleguide' }] : []),
    ],
  },
]
