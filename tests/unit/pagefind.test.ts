import { describe, it, expect } from 'vitest';
import { normalize, search } from '@utils/pagefind';

// Only the browser-independent parts of the client search helper are unit-tested
// here: the `.data()` → SearchResult normalization (the contract the palette
// renders) and the empty-query short-circuit (which returns before touching the
// Pagefind runtime). The runtime-dependent paths — dynamic import, debounce,
// superseded/unavailable — are covered by e2e, since they need a real browser.

describe('normalize', () => {
  it('maps a fully-populated Pagefind record', () => {
    const result = normalize({
      url: '/notes/some-note/',
      excerpt: 'a <mark>matched</mark> phrase',
      meta: {
        title: 'Some Note',
        type: 'note',
        date: '2025-07-08',
        image: '/img/thumb.png',
        image_alt: 'a thumbnail',
      },
    });

    expect(result).toEqual({
      url: '/notes/some-note/',
      title: 'Some Note',
      type: 'note',
      excerpt: 'a <mark>matched</mark> phrase',
      date: '2025-07-08',
      image: '/img/thumb.png',
      imageAlt: 'a thumbnail',
    });
  });

  it('falls back to the url when no title meta is present', () => {
    const result = normalize({ url: '/writing/x/', excerpt: '', meta: {} });
    expect(result.title).toBe('/writing/x/');
  });

  it("defaults type to 'page' when no type meta is present", () => {
    const result = normalize({ url: '/colophon/', excerpt: '', meta: { title: 'Colophon' } });
    expect(result.type).toBe('page');
  });

  it('leaves optional fields undefined when absent (e.g. undated pages)', () => {
    const result = normalize({ url: '/now/', excerpt: '', meta: { title: 'Now', type: 'page' } });
    expect(result.date).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.imageAlt).toBeUndefined();
  });
});

describe('search (browser-independent behaviour)', () => {
  it('short-circuits an empty query to an empty ok result without hitting the runtime', async () => {
    await expect(search('')).resolves.toEqual({ status: 'ok', results: [] });
  });

  it('treats a whitespace-only query as empty', async () => {
    await expect(search('   ')).resolves.toEqual({ status: 'ok', results: [] });
  });
});
