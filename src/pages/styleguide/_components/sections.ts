/**
 * Canonical list of top-level styleguide sections.
 *
 * Single source of truth for the cross-page navigation (rendered by
 * `StyleguideLayout`). Each section
 * is its own page under `/styleguide` (the rework splits the old monolith into
 * one page per section); `slug` is used to mark the active item server-side.
 */
export interface StyleguideSection {
  /** Stable id passed to the layout as `current` to highlight the active nav item. */
  slug: string;
  /** Page route. */
  href: string;
  /** Short nav label. */
  label: string;
}

export const STYLEGUIDE_SECTIONS: StyleguideSection[] = [
  { slug: 'overview', href: '/styleguide', label: 'Overview' },
  { slug: 'foundations', href: '/styleguide/foundations', label: 'Foundations' },
  { slug: 'typography', href: '/styleguide/typography', label: 'Typography' },
  { slug: 'components', href: '/styleguide/components', label: 'Content' },
  { slug: 'ui', href: '/styleguide/ui', label: 'UI' },
  { slug: 'html', href: '/styleguide/html', label: 'HTML' },
];
