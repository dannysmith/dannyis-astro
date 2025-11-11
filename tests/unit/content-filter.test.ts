import { describe, it, expect } from 'vitest';
import { filterContentForPage, filterContentForListing } from '@utils/content';

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
      createMockEntry('draft-styleguide', { draft: true, styleguide: true, title: 'Draft Styleguide' }),
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
      createMockEntry('draft-styleguide', { draft: true, styleguide: true, title: 'Draft Styleguide' }),
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
        const entries = [createMockEntry('explicit-false', { draft: false, title: 'Explicit False' })];

        const pageFiltered = filterContentForPage(entries, true);
        const listFiltered = filterContentForListing(entries, true);

        expect(pageFiltered).toHaveLength(1);
        expect(listFiltered).toHaveLength(1);
      });
    });
  });
});
