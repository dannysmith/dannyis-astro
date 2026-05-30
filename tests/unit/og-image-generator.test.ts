import { describe, it, expect } from 'vitest';
import { generateOGImage } from '../../src/utils/og-image-generator';

// PNG files start with this 8-byte signature.
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPng(buffer: Buffer): boolean {
  return PNG_SIGNATURE.every((byte, i) => buffer[i] === byte);
}

describe('generateOGImage', () => {
  const templates = ['article', 'note', 'default', 'profile'] as const;

  for (const template of templates) {
    it(`renders a valid PNG for the "${template}" template`, async () => {
      const buffer = await generateOGImage(
        { title: 'A Test Title', url: 'https://danny.is/test' },
        { template }
      );
      expect(isPng(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 20000);
  }

  it('renders a very long title (truncation path) without throwing', async () => {
    const longTitle = 'Some Words Here '.repeat(20).trim();
    const buffer = await generateOGImage(
      { title: longTitle, url: 'https://danny.is/a-very-long-slug-that-keeps-going-and-going' },
      { template: 'article' }
    );
    expect(isPng(buffer)).toBe(true);
  }, 20000);

  it('renders an empty title using the fallback text', async () => {
    const buffer = await generateOGImage(
      { title: '', url: 'https://danny.is' },
      { template: 'default' }
    );
    expect(isPng(buffer)).toBe(true);
  }, 20000);
});
