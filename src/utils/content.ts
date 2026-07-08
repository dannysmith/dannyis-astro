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

/**
 * Project stage metadata — plain data shared by the ordering helper, the
 * `/making` page (group headings) and ProjectCard (badge label + colour).
 * PROJECT_STAGE_ORDER also defines the top→bottom display order of groups.
 */
export type ProjectStage =
  | 'active-development'
  | 'actively-maintained'
  | 'finished'
  | 'paused'
  | 'archived';

export const PROJECT_STAGE_ORDER: ProjectStage[] = [
  'active-development',
  'actively-maintained',
  'finished',
  'paused',
  'archived',
];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  'active-development': 'In active development',
  'actively-maintained': 'Actively maintained',
  finished: 'Finished',
  paused: 'Paused',
  archived: 'Archived',
};

export const PROJECT_STAGE_COLORS: Record<ProjectStage, string> = {
  'active-development': 'var(--color-accent)',
  'actively-maintained': 'var(--color-green)',
  finished: 'var(--color-blue)',
  paused: 'var(--color-orange)',
  archived: 'var(--color-charcoal)',
};

/**
 * Group projects for the /making page: one group per stage in
 * PROJECT_STAGE_ORDER, empty groups dropped. Within a group, newest first by
 * startDate with undated projects floating to the top (tie-broken by title).
 * Reuses filterContentForListing, so drafts show in dev but not in production.
 */
export function groupProjectsByStage<
  T extends {
    id: string;
    data: {
      draft?: boolean;
      styleguide?: boolean;
      title: string;
      stage: ProjectStage;
      startDate?: Date;
    };
  },
>(
  projects: T[],
  isProduction: boolean = import.meta.env.PROD,
): { stage: ProjectStage; label: string; projects: T[] }[] {
  const filtered = filterContentForListing(projects, isProduction);

  return PROJECT_STAGE_ORDER.map(stage => ({
    stage,
    label: PROJECT_STAGE_LABELS[stage],
    projects: filtered
      .filter(entry => entry.data.stage === stage)
      .sort((a, b) => {
        const da = a.data.startDate;
        const db = b.data.startDate;
        if (!da && !db) return a.data.title.localeCompare(b.data.title);
        if (!da) return -1; // undated floats to the top
        if (!db) return 1;
        const byDate = db.valueOf() - da.valueOf(); // newest first
        return byDate !== 0 ? byDate : a.data.title.localeCompare(b.data.title);
      }),
  })).filter(group => group.projects.length > 0);
}
