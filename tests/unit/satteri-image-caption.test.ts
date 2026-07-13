import { describe, it, expect } from 'vitest';
import { mdxToJs, markdownToHtml } from 'satteri';
import { satteriImageCaption } from '../../src/lib/satteri-image-caption.mjs';

/** The `data.astro` bag as `@astrojs/mdx` seeds it before plugins run. */
function astroData() {
  return {
    astro: {
      frontmatter: {},
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };
}

/** Compile MDX with the plugin and return the compiled JS. */
async function compileMdx(source: string): Promise<string> {
  const result = await mdxToJs(source, {
    hastPlugins: [satteriImageCaption()],
    data: astroData(),
  });
  return result.code;
}

describe('satteriImageCaption', () => {
  it('moves the image title onto a caption prop in MDX', async () => {
    const code = await compileMdx('![Alt text](https://example.com/a.jpg "A lovely caption.")\n');
    expect(code).toContain('caption: "A lovely caption."');
    expect(code).not.toContain('title:');
  });

  it('leaves images without a title untouched', async () => {
    const code = await compileMdx('![Alt text](https://example.com/a.jpg)\n');
    expect(code).not.toContain('caption');
    expect(code).not.toContain('title');
  });

  it('preserves alt and src', async () => {
    const code = await compileMdx('![Alt text](https://example.com/a.jpg "Cap")\n');
    expect(code).toContain('alt: "Alt text"');
    expect(code).toContain('src: "https://example.com/a.jpg"');
  });

  it('does nothing in plain markdown (title renders as a title attribute)', async () => {
    const result = await markdownToHtml('![Alt text](https://example.com/a.jpg "A title.")\n', {
      hastPlugins: [satteriImageCaption()],
    });
    expect(result.html).toContain('title="A title."');
    expect(result.html).not.toContain('caption');
  });
});
