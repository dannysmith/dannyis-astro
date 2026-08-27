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
  return isProduction ? entries.filter(entry => entry.data.draft !== true) : entries
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
  const draftFilter = (entry: T) => (isProduction ? entry.data.draft !== true : true)
  return entries.filter(entry => draftFilter(entry) && !entry.data.styleguide)
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
    id: string
    data: {
      draft?: boolean
      styleguide?: boolean
      title: string
      pubDate: Date
      series?: { id: string }
    }
  },
>(seriesId: string, allArticles: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  return filterContentForListing(allArticles, isProduction)
    .filter(entry => entry.data.series?.id === seriesId)
    .sort((a, b) => {
      const byDate = a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
      return byDate !== 0 ? byDate : a.data.title.localeCompare(b.data.title)
    })
}

/**
 * Filter projects for listing (drafts excluded in production, kept in dev) and
 * return them in display order: newest first by startDate, with undated
 * projects floating to the top, tie-broken by title.
 *
 * Returns a flat list — callers filter()/map() it for whatever subset they need
 * (featured, a given stage, etc.). Mirrors the filter-then-sort pattern used for
 * the article/note indexes.
 */
export function getSortedProjects<
  T extends {
    id: string
    data: {
      draft?: boolean
      styleguide?: boolean
      title: string
      startDate?: Date
    }
  },
>(projects: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  return filterContentForListing(projects, isProduction).sort((a, b) => {
    const da = a.data.startDate
    const db = b.data.startDate
    if (!da && !db) return a.data.title.localeCompare(b.data.title)
    if (!da) return -1 // undated floats to the top
    if (!db) return 1
    const byDate = db.valueOf() - da.valueOf() // newest first
    return byDate !== 0 ? byDate : a.data.title.localeCompare(b.data.title)
  })
}

/**
 * The `cacheKey` a route returns from `getStaticPaths()` under
 * `experimental.incrementalBuild`. See docs/developer/deployment.md.
 *
 * The glob loader derives `digest` from file contents, so it changes whenever
 * the entry does. Returns `undefined` when there is no digest — the `file()`
 * loader sets none — which makes the page re-render every build.
 *
 * Never fall back to a constant string. `String(undefined)` is a key that can
 * never change, so the page would be served from cache forever.
 */
export function contentCacheKey(entry: { digest?: string | number }): string | undefined {
  return entry.digest === undefined ? undefined : String(entry.digest)
}

/** MDX components that resolve another content entry while rendering. */
const CROSS_ENTRY_COMPONENTS = ['<ContentCard']

/**
 * Whether rendering this entry's body pulls in *other* content entries.
 *
 * Astro's incremental cache tracks the entry a page renders, not entries it
 * looks up with `getEntry()`/`getCollection()`, so such a page can go stale
 * when the entry it points at changes. Callers that render the body drop the
 * `cacheKey` when this is true; routes emitting the raw body don't need to.
 *
 * Add any new component of that shape to `CROSS_ENTRY_COMPONENTS`.
 */
export function rendersOtherEntries(entry: { body?: string }): boolean {
  const body = entry.body
  return body !== undefined && CROSS_ENTRY_COMPONENTS.some(name => body.includes(name))
}
