import { describe, it, expect } from 'vitest';
import {
  filterContentForPage,
  filterContentForListing,
  getPublishedSeriesArticles,
} from '@utils/content';

// Mock content entries
type MockEntry = {
  id: string;
  data: {
    draft?: boolean;
    styleguide?: boolean;
    title?: string;
  };
};

function createMockEntry(id: string, data: MockEntry['data']): MockEntry {
  return { id, data };
}

describe('Content Filtering Functions', () => {
  describe('filterContentForPage (Individual Pages)', () => {
    const entries: MockEntry[] = [
      createMockEntry('draft', { draft: true, title: 'Draft Article' }),
      createMockEntry('published', { draft: false, title: 'Published Article' }),
      createMockEntry('no-draft-field', { title: 'No Draft Field' }),
      createMockEntry('styleguide', { styleguide: true, title: 'Styleguide' }),
      createMockEntry('draft-styleguide', {
        draft: true,
        styleguide: true,
        title: 'Draft Styleguide',
      }),
    ];

    describe('Production behavior', () => {
      it('excludes drafts', () => {
        const filtered = filterContentForPage(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).not.toContain('draft');
        expect(ids).not.toContain('draft-styleguide');
      });

      it('includes published content', () => {
        const filtered = filterContentForPage(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('published');
        expect(ids).toContain('no-draft-field');
      });

      it('allows styleguide pages individually', () => {
        const filtered = filterContentForPage(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('styleguide');
      });
    });

    describe('Development behavior', () => {
      it('includes all content including drafts', () => {
        const filtered = filterContentForPage(entries, false);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('draft');
        expect(ids).toContain('published');
        expect(ids).toContain('no-draft-field');
        expect(ids).toContain('styleguide');
        expect(ids).toContain('draft-styleguide');
      });

      it('returns all entries', () => {
        const filtered = filterContentForPage(entries, false);
        expect(filtered).toHaveLength(entries.length);
      });
    });
  });

  describe('filterContentForListing (Lists and RSS)', () => {
    const entries: MockEntry[] = [
      createMockEntry('draft', { draft: true, title: 'Draft Article' }),
      createMockEntry('published', { draft: false, title: 'Published Article' }),
      createMockEntry('no-draft-field', { title: 'No Draft Field' }),
      createMockEntry('styleguide', { styleguide: true, title: 'Styleguide' }),
      createMockEntry('draft-styleguide', {
        draft: true,
        styleguide: true,
        title: 'Draft Styleguide',
      }),
    ];

    describe('Production behavior', () => {
      it('excludes drafts', () => {
        const filtered = filterContentForListing(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).not.toContain('draft');
        expect(ids).not.toContain('draft-styleguide');
      });

      it('excludes styleguide pages', () => {
        const filtered = filterContentForListing(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).not.toContain('styleguide');
        expect(ids).not.toContain('draft-styleguide');
      });

      it('includes only published, non-styleguide content', () => {
        const filtered = filterContentForListing(entries, true);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('published');
        expect(ids).toContain('no-draft-field');
        expect(filtered).toHaveLength(2);
      });
    });

    describe('Development behavior', () => {
      it('includes drafts', () => {
        const filtered = filterContentForListing(entries, false);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('draft');
      });

      it('excludes styleguide pages even in development', () => {
        const filtered = filterContentForListing(entries, false);
        const ids = filtered.map(e => e.id);

        expect(ids).not.toContain('styleguide');
        expect(ids).not.toContain('draft-styleguide');
      });

      it('includes drafts but excludes styleguide', () => {
        const filtered = filterContentForListing(entries, false);
        const ids = filtered.map(e => e.id);

        expect(ids).toContain('draft');
        expect(ids).toContain('published');
        expect(ids).toContain('no-draft-field');
        expect(filtered).toHaveLength(3);
      });
    });

    describe('Edge cases', () => {
      it('handles empty array', () => {
        expect(filterContentForPage([], true)).toEqual([]);
        expect(filterContentForListing([], true)).toEqual([]);
      });

      it('handles entries with no draft or styleguide fields', () => {
        const entries = [createMockEntry('normal', { title: 'Normal Article' })];

        const pageFiltered = filterContentForPage(entries, true);
        const listFiltered = filterContentForListing(entries, true);

        expect(pageFiltered).toHaveLength(1);
        expect(listFiltered).toHaveLength(1);
      });

      it('handles draft: false explicitly', () => {
        const entries = [
          createMockEntry('explicit-false', { draft: false, title: 'Explicit False' }),
        ];

        const pageFiltered = filterContentForPage(entries, true);
        const listFiltered = filterContentForListing(entries, true);

        expect(pageFiltered).toHaveLength(1);
        expect(listFiltered).toHaveLength(1);
      });
    });
  });
});

describe('getPublishedSeriesArticles', () => {
  type SeriesEntry = {
    id: string;
    data: {
      draft?: boolean;
      styleguide?: boolean;
      title: string;
      pubDate: Date;
      series?: { id: string };
    };
  };

  const entries: SeriesEntry[] = [
    {
      id: 'part-2',
      data: { title: 'Part 2', pubDate: new Date('2020-02-01'), series: { id: 'redesign' } },
    },
    {
      id: 'part-1',
      data: { title: 'Part 1', pubDate: new Date('2020-01-01'), series: { id: 'redesign' } },
    },
    {
      id: 'part-3-draft',
      data: {
        draft: true,
        title: 'Part 3',
        pubDate: new Date('2020-03-01'),
        series: { id: 'redesign' },
      },
    },
    {
      id: 'other-series',
      data: { title: 'Elsewhere', pubDate: new Date('2020-01-15'), series: { id: 'loomclone' } },
    },
    { id: 'no-series', data: { title: 'Standalone', pubDate: new Date('2020-01-20') } },
  ];

  it('returns only articles in the requested series', () => {
    const ids = getPublishedSeriesArticles('redesign', entries, true).map(e => e.id);
    expect(ids).not.toContain('other-series');
    expect(ids).not.toContain('no-series');
  });

  it('orders by pubDate ascending (reading order)', () => {
    const ids = getPublishedSeriesArticles('redesign', entries, false).map(e => e.id);
    expect(ids).toEqual(['part-1', 'part-2', 'part-3-draft']);
  });

  it('excludes drafts in production', () => {
    const ids = getPublishedSeriesArticles('redesign', entries, true).map(e => e.id);
    expect(ids).toEqual(['part-1', 'part-2']);
  });

  it('includes drafts in development', () => {
    const ids = getPublishedSeriesArticles('redesign', entries, false).map(e => e.id);
    expect(ids).toContain('part-3-draft');
  });

  it('tie-breaks same pubDate by title', () => {
    const sameDate: SeriesEntry[] = [
      { id: 'b', data: { title: 'Beta', pubDate: new Date('2020-01-01'), series: { id: 's' } } },
      { id: 'a', data: { title: 'Alpha', pubDate: new Date('2020-01-01'), series: { id: 's' } } },
    ];
    const ids = getPublishedSeriesArticles('s', sameDate, true).map(e => e.id);
    expect(ids).toEqual(['a', 'b']);
  });

  it('excludes styleguide entries', () => {
    const withStyleguide: SeriesEntry[] = [
      ...entries,
      {
        id: 'sg',
        data: {
          styleguide: true,
          title: 'Guide',
          pubDate: new Date('2020-01-05'),
          series: { id: 'redesign' },
        },
      },
    ];
    const ids = getPublishedSeriesArticles('redesign', withStyleguide, true).map(e => e.id);
    expect(ids).not.toContain('sg');
  });
});
