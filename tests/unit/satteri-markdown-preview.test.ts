import { describe, it, expect } from 'vitest';
import { mdxToJs, markdownToHtml } from 'satteri';
import { satteriMarkdownPreview } from '../../src/lib/satteri-markdown-preview.mjs';
import { astroData, attr, mdastCapturer } from './satteri-helpers';

/** Compile MDX with the plugin followed by a capture plugin. */
async function transform(source: string) {
  const capturer = mdastCapturer();
  const result = await mdxToJs(source, {
    mdastPlugins: [satteriMarkdownPreview(), capturer.plugin],
    data: astroData(),
  });
  return { jsx: capturer.jsx, code: capturer.code, compiled: result.code };
}

describe('satteriMarkdownPreview', () => {
  describe('transformation', () => {
    it('transforms `md preview` fenced block into mdxJsxFlowElement', async () => {
      const { jsx, code } = await transform('```md preview\n# hello\n```\n');
      expect(jsx).toHaveLength(1);
      expect(jsx[0].name).toBe('markdown-preview');
      expect(code).toHaveLength(0);
    });

    it('transforms `markdown preview` (long form language) as well', async () => {
      const { jsx } = await transform('```markdown preview\n# hello\n```\n');
      expect(jsx).toHaveLength(1);
      expect(jsx[0].name).toBe('markdown-preview');
    });

    it('preserves the raw code verbatim as the `code` attribute', async () => {
      const raw = '# Heading\n\nA paragraph with **bold**.\n\n- one\n- two';
      const { jsx } = await transform('```md preview\n' + raw + '\n```\n');
      expect(attr(jsx[0], 'code')).toBe(raw);
    });

    it('preserves nested triple-backticks when the outer fence is quadruple', async () => {
      const raw = '# readme\n\n```bash\nnpm install\n```';
      const { jsx } = await transform('````md preview\n' + raw + '\n````\n');
      expect(jsx).toHaveLength(1);
      expect(attr(jsx[0], 'code')).toBe(raw);
    });

    it('does not transform in plain markdown (remapping is MDX-only)', async () => {
      const result = await markdownToHtml('```md preview\n# hello\n```\n', {
        mdastPlugins: [satteriMarkdownPreview()],
        data: astroData(),
      });
      expect(result.html).not.toContain('markdown-preview');
      expect(result.html).toContain('<pre');
    });
  });

  describe('meta attributes', () => {
    it('extracts title="..." into a title attribute', async () => {
      const { jsx } = await transform('```md preview title="README.md"\nbody\n```\n');
      expect(attr(jsx[0], 'title')).toBe('README.md');
    });

    it('extracts defaultView="source" into a defaultView attribute', async () => {
      const { jsx } = await transform('```md preview defaultView="source"\nbody\n```\n');
      expect(attr(jsx[0], 'defaultView')).toBe('source');
    });

    it('extracts defaultView="rendered" when explicitly set', async () => {
      const { jsx } = await transform('```md preview defaultView="rendered"\nbody\n```\n');
      expect(attr(jsx[0], 'defaultView')).toBe('rendered');
    });

    it('ignores invalid defaultView values', async () => {
      const { jsx } = await transform('```md preview defaultView="wrong"\nbody\n```\n');
      expect(attr(jsx[0], 'defaultView')).toBeUndefined();
    });

    it('supports multiple meta attributes in any order', async () => {
      const { jsx } = await transform(
        '```md preview defaultView="source" title="foo.md"\nbody\n```\n',
      );
      expect(attr(jsx[0], 'title')).toBe('foo.md');
      expect(attr(jsx[0], 'defaultView')).toBe('source');
    });

    it('omits title attribute when not present', async () => {
      const { jsx } = await transform('```md preview\nbody\n```\n');
      expect(attr(jsx[0], 'title')).toBeUndefined();
    });
  });

  describe('non-matching blocks', () => {
    it('leaves md fences without the preview flag alone', async () => {
      const { jsx, code } = await transform('```md\n# hello\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code).toHaveLength(1);
      expect(code[0].lang).toBe('md');
    });

    it('leaves non-md fences with a preview flag alone', async () => {
      const { jsx, code } = await transform('```js preview\nconsole.log(1);\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code[0].lang).toBe('js');
    });

    it('leaves fences with no language alone', async () => {
      const { jsx, code } = await transform('```\nsome text\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code).toHaveLength(1);
    });

    it('leaves surrounding content untouched', async () => {
      const { jsx, compiled } = await transform(
        '# Before\n\n```md preview\n# inside\n```\n\nAfter paragraph.\n',
      );
      expect(jsx).toHaveLength(1);
      expect(compiled).toContain('Before');
      expect(compiled).toContain('After paragraph.');
    });
  });

  describe('meta parser edge cases', () => {
    it('accepts preview as the first word with other flags after', async () => {
      const { jsx } = await transform('```md preview title="foo"\nbody\n```\n');
      expect(jsx).toHaveLength(1);
    });

    it('accepts preview later in the meta string', async () => {
      const { jsx } = await transform('```md title="foo" preview\nbody\n```\n');
      expect(jsx).toHaveLength(1);
      expect(attr(jsx[0], 'title')).toBe('foo');
    });

    it('ignores a block where preview appears as a prefix of another flag', async () => {
      // Regex uses \w+, so `previewish` shouldn't match as bare `preview`.
      const { jsx, code } = await transform('```md previewish\nbody\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code).toHaveLength(1);
    });
  });
});
