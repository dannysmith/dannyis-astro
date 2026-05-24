import { describe, it, expect } from 'vitest';
import { truncateFileName } from '../../src/lib/file-tree/truncate-name';

const long = (n: number, ch = 'a') => ch.repeat(n);

describe('truncateFileName', () => {
  it('returns short names unchanged', () => {
    expect(truncateFileName('index.ts')).toBe('index.ts');
  });

  it('returns a name exactly at the limit unchanged', () => {
    const name = long(96) + '.ts'; // 99 chars
    expect(truncateFileName(name, 100)).toBe(name);
  });

  it('truncates an over-long name while preserving the extension', () => {
    const name = long(150) + '.json';
    const result = truncateFileName(name, 100);
    expect(result.length).toBe(100);
    expect(result.endsWith('.json')).toBe(true);
    expect(result).toContain('…');
    expect(result.startsWith('aaaa')).toBe(true);
  });

  it('preserves a compound-looking extension by keeping only the last segment', () => {
    const name = long(150) + '.tar.gz';
    const result = truncateFileName(name, 100);
    expect(result.endsWith('.gz')).toBe(true);
  });

  it('truncates extensionless names with a trailing ellipsis and no suffix', () => {
    const name = long(150);
    const result = truncateFileName(name, 100);
    expect(result.length).toBe(100);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toContain('.');
  });

  it('treats a dotfile with no further dot as having no extension', () => {
    const name = '.' + long(150);
    const result = truncateFileName(name, 100);
    expect(result.endsWith('…')).toBe(true);
    // No false "extension" extracted from the leading dot.
    expect(result.slice(0, -1)).not.toContain('…');
  });

  it('still finds the real extension on a dotfile that has one', () => {
    const name = '.' + long(150) + '.json';
    const result = truncateFileName(name, 100);
    expect(result.endsWith('.json')).toBe(true);
  });

  it('ignores a trailing dot (not a real extension)', () => {
    const name = long(150) + '.';
    const result = truncateFileName(name, 100);
    expect(result.endsWith('…')).toBe(true);
  });

  it('falls back to a head cut when the extension is as long as the budget', () => {
    const name = long(50) + '.' + long(120); // ext longer than max
    const result = truncateFileName(name, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith('…')).toBe(true);
  });

  it('respects a custom max', () => {
    const name = long(40) + '.ts';
    expect(truncateFileName(name, 20).length).toBe(20);
    expect(truncateFileName(name, 20).endsWith('.ts')).toBe(true);
  });
});
