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
 * MDX components that look up *other* content entries while rendering.
 *
 * Astro's incremental cache tracks the entry a page renders, not entries it
 * looks up with `getEntry()`/`getCollection()`, so a body using one of these
 * can go stale when the entry it points at changes. Add any new component of
 * that shape here. (`SeriesCallout` is the other case, but it's driven by
 * frontmatter rather than the body, so the articles route handles it.)
 */
const CROSS_ENTRY_COMPONENTS = ['<ContentCard']

/**
 * Build the `cacheKey` a route returns from `getStaticPaths()` under
 * `experimental.incrementalBuild` (see docs/developer/deployment.md).
 *
 * The glob loader derives `digest` from file contents, so it changes whenever
 * the entry does. Returns `undefined` in two cases, both of which mean "always
 * re-render this page", which is the safe default:
 *
 * 1. The entry has no digest — the `file()` loader doesn't set one.
 * 2. The body renders a component that reads another entry, so the digest
 *    alone doesn't describe everything the page displays.
 *
 * Never fall back to a constant string here. `String(undefined)` is a stable
 * key that never invalidates, so the page would be served from cache forever.
 */
export function contentCacheKey(entry: {
  digest?: string | number
  body?: string
}): string | undefined {
  if (entry.digest === undefined) return undefined
  const body = entry.body
  if (body && CROSS_ENTRY_COMPONENTS.some(component => body.includes(component))) return undefined
  return String(entry.digest)
}
