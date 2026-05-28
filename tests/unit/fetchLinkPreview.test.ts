import { describe, it, expect } from 'vitest';
import { parseLinkPreview } from '@utils/fetchLinkPreview';

describe('parseLinkPreview', () => {
  it('extracts title, og:title and favicon from a Notion-shaped head', () => {
    const html = `
      <head>
        <title>Meetings | Notion</title>
        <meta property="og:title" content="Meetings | Notion">
        <link rel="shortcut icon" href="https://dannysmith.notion.site/icon.png">
      </head>`;
    expect(parseLinkPreview(html, 'https://dannysmith.notion.site/Meetings')).toEqual({
      title: 'Meetings | Notion',
      ogTitle: 'Meetings | Notion',
      favicon: 'https://dannysmith.notion.site/icon.png',
    });
  });

  it('matches both <link rel="icon"> and <link rel="shortcut icon">', () => {
    const a = `<link rel="icon" href="https://example.com/a.ico">`;
    const b = `<link rel="shortcut icon" href="https://example.com/b.ico">`;
    expect(parseLinkPreview(a, 'https://example.com/').favicon).toBe('https://example.com/a.ico');
    expect(parseLinkPreview(b, 'https://example.com/').favicon).toBe('https://example.com/b.ico');
  });

  it('matches og:title regardless of attribute order', () => {
    const propertyFirst = `<meta property="og:title" content="A">`;
    const contentFirst = `<meta content="B" property="og:title">`;
    expect(parseLinkPreview(propertyFirst, 'https://example.com/').ogTitle).toBe('A');
    expect(parseLinkPreview(contentFirst, 'https://example.com/').ogTitle).toBe('B');
  });

  it('tolerates single and double quotes on attributes', () => {
    const single = `<meta property='og:title' content='Single quotes'>`;
    const double = `<meta property="og:title" content="Double quotes">`;
    expect(parseLinkPreview(single, 'https://example.com/').ogTitle).toBe('Single quotes');
    expect(parseLinkPreview(double, 'https://example.com/').ogTitle).toBe('Double quotes');
  });

  it('decodes named, decimal, and hex HTML entities in titles', () => {
    const html = `<title>Tom &amp; Jerry &#39; &#34; &#x27; &lt;3</title>`;
    expect(parseLinkPreview(html, 'https://example.com/').title).toBe(`Tom & Jerry ' " ' <3`);
  });

  it('does not double-decode entities (& must not become &amp;-decoded again)', () => {
    const html = `<title>&amp;amp;</title>`;
    expect(parseLinkPreview(html, 'https://example.com/').title).toBe('&amp;');
  });

  it('resolves relative favicon URLs against the page URL', () => {
    const html = `<link rel="icon" href="/favicon.ico">`;
    expect(parseLinkPreview(html, 'https://example.com/blog/post').favicon).toBe(
      'https://example.com/favicon.ico'
    );
  });

  it('returns all undefined for a page with no relevant metadata', () => {
    expect(
      parseLinkPreview('<html><body>nothing here</body></html>', 'https://example.com/')
    ).toEqual({
      title: undefined,
      ogTitle: undefined,
      favicon: undefined,
    });
  });

  it('returns undefined for an empty <title>', () => {
    expect(parseLinkPreview('<title>   </title>', 'https://example.com/').title).toBeUndefined();
  });

  it('falls through to a later <link rel="icon"> if an earlier one has no href', () => {
    const html = `
      <link rel="icon">
      <link rel="shortcut icon" href="https://example.com/good.ico">
    `;
    expect(parseLinkPreview(html, 'https://example.com/').favicon).toBe(
      'https://example.com/good.ico'
    );
  });
});
