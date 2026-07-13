import { describe, it, expect } from 'vitest';
import { mdxToJs, markdownToHtml, defineMdastPlugin } from 'satteri';
import { satteriTreeBlock } from '../../src/lib/satteri-tree-block.mjs';

type JsxNode = { type: string; name?: string; attributes?: { name: string; value: unknown }[] };
type CodeNode = { type: string; lang?: string | null };

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

/**
 * Compile MDX with the plugin followed by a capture plugin (later plugins
 * visit earlier plugins' replacement nodes), returning what came through.
 */
async function transform(source: string) {
  const jsx: JsxNode[] = [];
  const code: CodeNode[] = [];
  const capturer = defineMdastPlugin({
    name: 'capturer',
    mdxJsxFlowElement(node: unknown) {
      jsx.push(structuredClone(node) as JsxNode);
    },
    code(node: unknown) {
      code.push(structuredClone(node) as CodeNode);
    },
  });
  await mdxToJs(source, {
    mdastPlugins: [satteriTreeBlock(), capturer],
    data: astroData(),
  });
  return { jsx, code };
}

/** Safely read an mdxJsxAttribute value by name. */
function attr(node: JsxNode, name: string): string | undefined {
  const a = node.attributes?.find(x => x.name === name);
  return typeof a?.value === 'string' ? a.value : undefined;
}

/** Does the node carry an attribute with the given name? */
function hasAttr(node: JsxNode, name: string): boolean {
  return Boolean(node.attributes?.some(x => x.name === name));
}

describe('satteriTreeBlock', () => {
  describe('transformation', () => {
    it('transforms a ```tree fence into a <file-tree> mdxJsxFlowElement', async () => {
      const { jsx, code } = await transform('```tree\nsrc/\n└── index.ts\n```\n');
      expect(jsx).toHaveLength(1);
      expect(jsx[0].name).toBe('file-tree');
      expect(code).toHaveLength(0);
    });

    it('preserves the raw tree code verbatim as the `code` attribute', async () => {
      const raw = 'src/\n├── index.ts\n└── lib/\n    └── helper.ts';
      const { jsx } = await transform('```tree\n' + raw + '\n```\n');
      expect(attr(jsx[0], 'code')).toBe(raw);
    });

    it('does not transform other languages', async () => {
      const { jsx, code } = await transform('```js\nconst a = 1;\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code).toHaveLength(1);
    });

    it('does not transform a fence whose lang merely starts with "tree"', async () => {
      const { jsx, code } = await transform('```treeish\nstuff\n```\n');
      expect(jsx).toHaveLength(0);
      expect(code).toHaveLength(1);
    });

    it('does not transform in plain markdown (remapping is MDX-only)', async () => {
      const result = await markdownToHtml('```tree\nsrc/\n```\n', {
        mdastPlugins: [satteriTreeBlock()],
        data: astroData(),
      });
      expect(result.html).not.toContain('file-tree');
      expect(result.html).toContain('<pre');
    });
  });

  describe('title', () => {
    it('extracts title="..." into a title attribute', async () => {
      const { jsx } = await transform('```tree title="My Project"\nsrc/\n```\n');
      expect(attr(jsx[0], 'title')).toBe('My Project');
    });

    it('adds no title attribute when none is given', async () => {
      const { jsx } = await transform('```tree\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'title')).toBe(false);
    });
  });

  describe('frame', () => {
    it('passes frame="none" through', async () => {
      const { jsx } = await transform('```tree frame="none"\nsrc/\n```\n');
      expect(attr(jsx[0], 'frame')).toBe('none');
    });

    it('ignores any frame value other than "none" (falls back to default)', async () => {
      const { jsx } = await transform('```tree frame="terminal"\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'frame')).toBe(false);
    });

    it('adds no frame attribute when none is given', async () => {
      const { jsx } = await transform('```tree\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'frame')).toBe(false);
    });
  });

  describe('highlight ranges', () => {
    it('expands a single line {3} into "3"', async () => {
      const { jsx } = await transform('```tree {3}\na\nb\nc\n```\n');
      expect(attr(jsx[0], 'highlight')).toBe('3');
    });

    it('expands a mixed spec {2,5-7} into "2,5,6,7"', async () => {
      const { jsx } = await transform('```tree {2,5-7}\na\n```\n');
      expect(attr(jsx[0], 'highlight')).toBe('2,5,6,7');
    });

    it('normalises a reversed range {5-3} into "3,4,5"', async () => {
      const { jsx } = await transform('```tree {5-3}\na\n```\n');
      expect(attr(jsx[0], 'highlight')).toBe('3,4,5');
    });

    it('deduplicates and sorts overlapping entries {4,2,3-4,2}', async () => {
      const { jsx } = await transform('```tree {4,2,3-4,2}\na\n```\n');
      expect(attr(jsx[0], 'highlight')).toBe('2,3,4');
    });

    it('adds no highlight attribute when no braces are given', async () => {
      const { jsx } = await transform('```tree\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'highlight')).toBe(false);
    });

    it('adds no highlight attribute for an empty brace spec {}', async () => {
      const { jsx } = await transform('```tree {}\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'highlight')).toBe(false);
    });

    it('ignores line 0 (1-based domain, so {0} yields no highlight)', async () => {
      const { jsx } = await transform('```tree {0}\nsrc/\n```\n');
      expect(hasAttr(jsx[0], 'highlight')).toBe(false);
    });

    it('drops a non-positive bound from a range ({0-2} → "1,2")', async () => {
      const { jsx } = await transform('```tree {0-2}\na\n```\n');
      expect(attr(jsx[0], 'highlight')).toBe('1,2');
    });
  });

  describe('combinations', () => {
    it('parses title, frame and highlight together regardless of order', async () => {
      const { jsx } = await transform('```tree {2,4} title="Project" frame="none"\nsrc/\n```\n');
      expect(attr(jsx[0], 'title')).toBe('Project');
      expect(attr(jsx[0], 'frame')).toBe('none');
      expect(attr(jsx[0], 'highlight')).toBe('2,4');
      expect(attr(jsx[0], 'code')).toBe('src/');
    });
  });
});
