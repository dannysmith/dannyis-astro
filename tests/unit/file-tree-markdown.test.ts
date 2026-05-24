import { describe, it, expect } from 'vitest';
import { renderInlineMarkdown } from '../../src/lib/file-tree/markdown';

describe('renderInlineMarkdown', () => {
  it('renders plain text unchanged', () => {
    expect(renderInlineMarkdown('just a comment')).toBe('just a comment');
  });

  it('does not wrap output in a block-level <p>', () => {
    expect(renderInlineMarkdown('hello')).not.toContain('<p>');
  });

  it('renders bold and code spans', () => {
    const html = renderInlineMarkdown('the **main** `config` file');
    expect(html).toContain('<strong>main</strong>');
    expect(html).toContain('<code>config</code>');
  });

  it('renders a link', () => {
    const html = renderInlineMarkdown('see [the spec](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('>the spec</a>');
  });

  it('adds security attributes to external links', () => {
    const html = renderInlineMarkdown('[ext](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('does not add target/rel to relative links', () => {
    const html = renderInlineMarkdown('[internal](/about)');
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toContain('rel="noopener');
  });
});
