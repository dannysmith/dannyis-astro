import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import type { Root } from 'mdast';
import { remarkMarkdownPreview } from '../../src/lib/remark-markdown-preview.mjs';

/** Parse MDX source and run the plugin. Returns the transformed tree. */
async function transform(source: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkMarkdownPreview);
  const tree = processor.parse(source);
  return (await processor.run(tree)) as Root;
}

/** Safely read an mdxJsxAttribute value by name. */
function attr(
  node: { attributes?: { name: string; value: unknown }[] },
  name: string
): string | undefined {
  const a = node.attributes?.find(x => x.name === name);
  return typeof a?.value === 'string' ? a.value : undefined;
}

describe('remarkMarkdownPreview', () => {
  describe('transformation', () => {
    it('transforms `md preview` fenced block into mdxJsxFlowElement', async () => {
      const tree = await transform('```md preview\n# hello\n```\n');
      const node = tree.children[0] as unknown as { type: string; name?: string };
      expect(node.type).toBe('mdxJsxFlowElement');
      expect(node.name).toBe('markdown-preview');
    });

    it('transforms `markdown preview` (long form language) as well', async () => {
      const tree = await transform('```markdown preview\n# hello\n```\n');
      const node = tree.children[0] as unknown as { type: string; name?: string };
      expect(node.type).toBe('mdxJsxFlowElement');
      expect(node.name).toBe('markdown-preview');
    });

    it('preserves the raw code verbatim as the `code` attribute', async () => {
      const raw = '# Heading\n\nA paragraph with **bold**.\n\n- one\n- two';
      const tree = await transform('```md preview\n' + raw + '\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'code')).toBe(raw);
    });

    it('preserves nested triple-backticks when the outer fence is quadruple', async () => {
      const raw = '# readme\n\n```bash\nnpm install\n```';
      const tree = await transform('````md preview\n' + raw + '\n````\n');
      const node = tree.children[0] as unknown as {
        type: string;
        attributes: { name: string; value: string }[];
      };
      expect(node.type).toBe('mdxJsxFlowElement');
      expect(attr(node, 'code')).toBe(raw);
    });
  });

  describe('meta attributes', () => {
    it('extracts title="..." into a title attribute', async () => {
      const tree = await transform('```md preview title="README.md"\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'title')).toBe('README.md');
    });

    it('extracts defaultView="source" into a defaultView attribute', async () => {
      const tree = await transform('```md preview defaultView="source"\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'defaultView')).toBe('source');
    });

    it('extracts defaultView="rendered" when explicitly set', async () => {
      const tree = await transform('```md preview defaultView="rendered"\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'defaultView')).toBe('rendered');
    });

    it('ignores invalid defaultView values', async () => {
      const tree = await transform('```md preview defaultView="wrong"\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'defaultView')).toBeUndefined();
    });

    it('supports multiple meta attributes in any order', async () => {
      const tree = await transform(
        '```md preview defaultView="source" title="foo.md"\nbody\n```\n'
      );
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'title')).toBe('foo.md');
      expect(attr(node, 'defaultView')).toBe('source');
    });

    it('omits title attribute when not present', async () => {
      const tree = await transform('```md preview\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        attributes: { name: string; value: string }[];
      };
      expect(attr(node, 'title')).toBeUndefined();
    });
  });

  describe('non-matching blocks', () => {
    it('leaves md fences without the preview flag alone', async () => {
      const tree = await transform('```md\n# hello\n```\n');
      const node = tree.children[0] as unknown as { type: string; lang?: string };
      expect(node.type).toBe('code');
      expect(node.lang).toBe('md');
    });

    it('leaves non-md fences with a preview flag alone', async () => {
      const tree = await transform('```js preview\nconsole.log(1);\n```\n');
      const node = tree.children[0] as unknown as { type: string; lang?: string };
      expect(node.type).toBe('code');
      expect(node.lang).toBe('js');
    });

    it('leaves fences with no language alone', async () => {
      const tree = await transform('```\nsome text\n```\n');
      const node = tree.children[0] as unknown as { type: string };
      expect(node.type).toBe('code');
    });

    it('leaves surrounding content untouched', async () => {
      const tree = await transform(
        '# Before\n\n```md preview\n# inside\n```\n\nAfter paragraph.\n'
      );
      expect(tree.children).toHaveLength(3);
      const [before, block, after] = tree.children as unknown as { type: string }[];
      expect(before.type).toBe('heading');
      expect(block.type).toBe('mdxJsxFlowElement');
      expect(after.type).toBe('paragraph');
    });
  });

  describe('meta parser edge cases', () => {
    it('accepts preview as the first word with other flags after', async () => {
      const tree = await transform('```md preview title="foo"\nbody\n```\n');
      const node = tree.children[0] as unknown as { type: string };
      expect(node.type).toBe('mdxJsxFlowElement');
    });

    it('accepts preview later in the meta string', async () => {
      const tree = await transform('```md title="foo" preview\nbody\n```\n');
      const node = tree.children[0] as unknown as {
        type: string;
        attributes: { name: string; value: string }[];
      };
      expect(node.type).toBe('mdxJsxFlowElement');
      expect(attr(node, 'title')).toBe('foo');
    });

    it('ignores a block where preview appears as a prefix of another flag', async () => {
      // Regex uses \w+, so `previewish` shouldn't match as bare `preview`.
      const tree = await transform('```md previewish\nbody\n```\n');
      const node = tree.children[0] as unknown as { type: string };
      expect(node.type).toBe('code');
    });
  });
});
