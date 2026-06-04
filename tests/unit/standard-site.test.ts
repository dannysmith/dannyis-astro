import { describe, it, expect } from 'vitest';
import {
  getDocumentRkey,
  getDocumentPath,
  getDocumentUri,
  qualifiesForStandardSite,
} from '@utils/standard-site';
import { getConfig } from '@config/config';

// A valid AT Protocol TID: 13 base32-sortable chars, with a leading char whose
// top bit is 0 (keeps the 64-bit value positive).
const TID_RE = /^[234567abcdefghij][2-7a-z]{12}$/;

const SINCE = new Date(getConfig().standardSite.since).getTime();

describe('standard-site', () => {
  describe('getDocumentRkey', () => {
    it('produces a valid 13-char TID', () => {
      const rkey = getDocumentRkey('articles', '2012-06-05-a-simpler-responsive-grid', new Date());
      expect(rkey).toHaveLength(13);
      expect(rkey).toMatch(TID_RE);
    });

    it('is deterministic for the same inputs', () => {
      const a = getDocumentRkey(
        'articles',
        '2013-01-21-what-is-good-design',
        new Date('2013-01-21')
      );
      const b = getDocumentRkey(
        'articles',
        '2013-01-21-what-is-good-design',
        new Date('2013-01-21')
      );
      expect(a).toBe(b);
    });

    it('is timezone-independent (timestamp comes from the pubDate UTC calendar date)', () => {
      // Same calendar date, different instant representations — the rkey keys off
      // the UTC y/m/d, so a London backfill and a UTC CI run must agree.
      const midnightUtc = getDocumentRkey('notes', 'a-note', new Date('2020-03-10T00:00:00Z'));
      const dateOnly = getDocumentRkey('notes', 'a-note', new Date('2020-03-10'));
      expect(midnightUtc).toBe(dateOnly);
    });

    it('sorts lexicographically by publish date, even for slug ids with no date prefix', () => {
      // Ids here are slugs (no date prefix) — the timestamp comes purely from pubDate.
      const earlier = getDocumentRkey('articles', 'an-older-post', new Date('2012-06-05'));
      const later = getDocumentRkey('articles', 'a-newer-post', new Date('2020-01-01'));
      expect(later > earlier).toBe(true);
    });

    it('gives same-date posts distinct keys (clock id from the id)', () => {
      const a = getDocumentRkey('notes', '2021-07-01-first', new Date('2021-07-01'));
      const b = getDocumentRkey('notes', '2021-07-01-second', new Date('2021-07-01'));
      expect(a).not.toBe(b);
    });

    it('namespaces by collection so a shared slug+date does not collide', () => {
      const article = getDocumentRkey('articles', '2021-07-01-shared', new Date('2021-07-01'));
      const note = getDocumentRkey('notes', '2021-07-01-shared', new Date('2021-07-01'));
      expect(article).not.toBe(note);
    });

    it('handles a date-only id (no slug after the date)', () => {
      const rkey = getDocumentRkey('notes', '2026-04-12', new Date('2026-04-12'));
      expect(rkey).toMatch(TID_RE);
    });
  });

  describe('getDocumentPath', () => {
    it('uses /writing/ for articles', () => {
      expect(getDocumentPath('articles', '2012-06-05-foo')).toBe('/writing/2012-06-05-foo/');
    });

    it('uses /notes/ for notes', () => {
      expect(getDocumentPath('notes', '2026-04-12')).toBe('/notes/2026-04-12/');
    });
  });

  describe('qualifiesForStandardSite', () => {
    const pubDate = new Date(SINCE + 1000); // safely after the cutoff

    it('accepts a published, non-styleguide post on/after the cutoff', () => {
      expect(qualifiesForStandardSite({ pubDate })).toBe(true);
      expect(qualifiesForStandardSite({ draft: false, styleguide: false, pubDate })).toBe(true);
    });

    it('rejects drafts', () => {
      expect(qualifiesForStandardSite({ draft: true, pubDate })).toBe(false);
    });

    it('rejects styleguide pages', () => {
      expect(qualifiesForStandardSite({ styleguide: true, pubDate })).toBe(false);
    });

    it('rejects externally-hosted posts (redirectURL)', () => {
      expect(qualifiesForStandardSite({ redirectURL: 'https://medium.com/x', pubDate })).toBe(
        false
      );
    });

    it('rejects posts before the cutoff', () => {
      expect(qualifiesForStandardSite({ pubDate: new Date(SINCE - 1000) })).toBe(false);
    });
  });

  describe('getDocumentUri', () => {
    const pubDate = new Date(SINCE + 1000);

    it('returns null when no DID is configured', () => {
      // The committed config ships with an empty DID until setup.
      const { did } = getConfig().standardSite;
      if (!did) {
        expect(getDocumentUri('articles', '2020-01-01-foo', { pubDate })).toBeNull();
      } else {
        expect(getDocumentUri('articles', '2020-01-01-foo', { pubDate })).toMatch(
          /^at:\/\/.+\/site\.standard\.document\/[234567a-z]{13}$/
        );
      }
    });

    it('returns null for a non-qualifying post regardless of DID', () => {
      expect(getDocumentUri('articles', '2020-01-01-foo', { draft: true, pubDate })).toBeNull();
    });
  });
});
