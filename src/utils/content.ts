/**
 * Content Filtering Utilities
 *
 * Centralized filtering logic for draft and styleguide content.
 * Used across RSS feeds, individual pages, and listing pages.
 */

/**
 * Filter content for individual pages
 *
 * In production: excludes drafts
 * In development: includes everything
 *
 * Note: Styleguide pages are allowed to render individually
 */
export function filterContentForPage<
  T extends { id: string; data: { draft?: boolean; styleguide?: boolean } },
>(entries: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  return isProduction ? entries.filter(entry => entry.data.draft !== true) : entries;
}

/**
 * Filter content for listing pages (indexes, RSS feeds, etc.)
 *
 * In production: excludes drafts AND styleguide pages
 * In development: includes drafts, but still excludes styleguide pages
 *
 * Styleguide pages should never appear in listings, even in development
 */
export function filterContentForListing<
  T extends { id: string; data: { draft?: boolean; styleguide?: boolean } },
>(entries: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  const draftFilter = (entry: T) => (isProduction ? entry.data.draft !== true : true);
  return entries.filter(entry => draftFilter(entry) && !entry.data.styleguide);
}

/**
 * Select and order the articles belonging to a series, for the series callout.
 *
 * Reuses filterContentForListing, so drafts are excluded in production but kept
 * in development (where the callout prefixes them with "[draft]"). Ordered by
 * pubDate ascending (reading order — part 1 first), tie-broken by title.
 */
export function getPublishedSeriesArticles<
  T extends {
    id: string;
    data: {
      draft?: boolean;
      styleguide?: boolean;
      title: string;
      pubDate: Date;
      series?: { id: string };
    };
  },
>(seriesId: string, allArticles: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  return filterContentForListing(allArticles, isProduction)
    .filter(entry => entry.data.series?.id === seriesId)
    .sort((a, b) => {
      const byDate = a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
      return byDate !== 0 ? byDate : a.data.title.localeCompare(b.data.title);
    });
}
