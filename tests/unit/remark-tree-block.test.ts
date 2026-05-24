import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import type { Root } from 'mdast';
import { remarkTreeBlock } from '../../src/lib/remark-tree-block.mjs';

/** Parse MDX source and run the plugin. Returns the transformed tree. */
async function transform(source: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkTreeBlock);
  const tree = processor.parse(source);
  return (await processor.run(tree)) as Root;
}

type JsxNode = { type: string; name?: string; attributes?: { name: string; value: unknown }[] };

/** Safely read an mdxJsxAttribute value by name. */
function attr(node: JsxNode, name: string): string | undefined {
  const a = node.attributes?.find(x => x.name === name);
  return typeof a?.value === 'string' ? a.value : undefined;
}

/** Does the node carry an attribute with the given name? */
function hasAttr(node: JsxNode, name: string): boolean {
  return Boolean(node.attributes?.some(x => x.name === name));
}

describe('remarkTreeBlock', () => {
  describe('transformation', () => {
    it('transforms a ```tree fence into a <file-tree> mdxJsxFlowElement', async () => {
      const tree = await transform('```tree\nsrc/\n└── index.ts\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(node.type).toBe('mdxJsxFlowElement');
      expect(node.name).toBe('file-tree');
    });

    it('preserves the raw tree code verbatim as the `code` attribute', async () => {
      const raw = 'src/\n├── index.ts\n└── lib/\n    └── helper.ts';
      const tree = await transform('```tree\n' + raw + '\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'code')).toBe(raw);
    });

    it('does not transform other languages', async () => {
      const tree = await transform('```js\nconst a = 1;\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(node.type).toBe('code');
    });

    it('does not transform a fence whose lang merely starts with "tree"', async () => {
      const tree = await transform('```treeish\nstuff\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(node.type).toBe('code');
    });
  });

  describe('title', () => {
    it('extracts title="..." into a title attribute', async () => {
      const tree = await transform('```tree title="My Project"\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'title')).toBe('My Project');
    });

    it('adds no title attribute when none is given', async () => {
      const tree = await transform('```tree\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'title')).toBe(false);
    });
  });

  describe('frame', () => {
    it('passes frame="none" through', async () => {
      const tree = await transform('```tree frame="none"\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'frame')).toBe('none');
    });

    it('ignores any frame value other than "none" (falls back to default)', async () => {
      const tree = await transform('```tree frame="terminal"\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'frame')).toBe(false);
    });

    it('adds no frame attribute when none is given', async () => {
      const tree = await transform('```tree\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'frame')).toBe(false);
    });
  });

  describe('highlight ranges', () => {
    it('expands a single line {3} into "3"', async () => {
      const tree = await transform('```tree {3}\na\nb\nc\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'highlight')).toBe('3');
    });

    it('expands a mixed spec {2,5-7} into "2,5,6,7"', async () => {
      const tree = await transform('```tree {2,5-7}\na\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'highlight')).toBe('2,5,6,7');
    });

    it('normalises a reversed range {5-3} into "3,4,5"', async () => {
      const tree = await transform('```tree {5-3}\na\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'highlight')).toBe('3,4,5');
    });

    it('deduplicates and sorts overlapping entries {4,2,3-4,2}', async () => {
      const tree = await transform('```tree {4,2,3-4,2}\na\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'highlight')).toBe('2,3,4');
    });

    it('adds no highlight attribute when no braces are given', async () => {
      const tree = await transform('```tree\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'highlight')).toBe(false);
    });

    it('adds no highlight attribute for an empty brace spec {}', async () => {
      const tree = await transform('```tree {}\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'highlight')).toBe(false);
    });

    it('ignores line 0 (1-based domain, so {0} yields no highlight)', async () => {
      const tree = await transform('```tree {0}\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(hasAttr(node, 'highlight')).toBe(false);
    });

    it('drops a non-positive bound from a range ({0-2} → "1,2")', async () => {
      const tree = await transform('```tree {0-2}\na\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'highlight')).toBe('1,2');
    });
  });

  describe('combinations', () => {
    it('parses title, frame and highlight together regardless of order', async () => {
      const tree = await transform('```tree {2,4} title="Project" frame="none"\nsrc/\n```\n');
      const node = tree.children[0] as unknown as JsxNode;
      expect(attr(node, 'title')).toBe('Project');
      expect(attr(node, 'frame')).toBe('none');
      expect(attr(node, 'highlight')).toBe('2,4');
      expect(attr(node, 'code')).toBe('src/');
    });
  });
});
