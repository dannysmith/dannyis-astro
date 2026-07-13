import { describe, it, expect } from 'vitest';
import { markdownToHtml, mdxToJs } from 'satteri';
import { satteriReadingTime } from '../../src/lib/satteri-reading-time.mjs';
import { astroData } from './satteri-helpers';

type Frontmatter = Record<string, unknown>;

async function readMd(source: string): Promise<Frontmatter> {
  const data = astroData();
  await markdownToHtml(source, { mdastPlugins: [satteriReadingTime()], data });
  return data.astro.frontmatter;
}

async function readMdx(source: string): Promise<Frontmatter> {
  const data = astroData();
  await mdxToJs(source, { mdastPlugins: [satteriReadingTime()], data });
  return data.astro.frontmatter;
}

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('satteriReadingTime', () => {
  it('writes minutesRead into the frontmatter bag for markdown', async () => {
    const frontmatter = await readMd('# Title\n\nHello world, this is body text.\n');
    expect(frontmatter.minutesRead).toBe('1 min read');
  });

  it('writes minutesRead for MDX (round-trips on @astrojs/mdx v7)', async () => {
    const frontmatter = await readMdx('# Title\n\nBody paragraph here.\n');
    expect(frontmatter.minutesRead).toBe('1 min read');
  });

  it('scales with document length', async () => {
    // reading-time defaults to 200 wpm, so ~900 words ≈ 5 minutes.
    const frontmatter = await readMd(`# Title\n\n${words(900)}\n`);
    expect(frontmatter.minutesRead).toBe('5 min read');
  });

  it('preserves other frontmatter values', async () => {
    const data = astroData({ title: 'Kept' });
    await markdownToHtml('Some text.\n', { mdastPlugins: [satteriReadingTime()], data });
    expect(data.astro.frontmatter.title).toBe('Kept');
    expect(data.astro.frontmatter.minutesRead).toBe('1 min read');
  });

  it('measures each document independently (factory form)', async () => {
    const short = await readMd('One short sentence.\n');
    const long = await readMd(`${words(900)}\n`);
    const shortAgain = await readMd('One short sentence.\n');
    expect(short.minutesRead).toBe('1 min read');
    expect(long.minutesRead).toBe('5 min read');
    expect(shortAgain.minutesRead).toBe('1 min read');
  });
});
