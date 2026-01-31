import { describe, it, expect } from 'vitest';
import { rehypeListDensity } from '../../src/lib/rehype-list-density.mjs';
import type { Element, Root } from 'hast';

/** Helper to create a text node */
const text = (value: string) => ({ type: 'text' as const, value });

/** Helper to create an element node */
const el = (
  tagName: string,
  children: (Element | { type: 'text'; value: string })[] = [],
  className?: string[]
): Element => ({
  type: 'element',
  tagName,
  properties: className ? { className } : {},
  children,
});

/** Helper to create a list item with text */
const li = (content: string) => el('li', [text(content)]);

/** Run the plugin on a tree and return the modified tree */
const transform = (tree: Root, options?: { threshold?: number }) => {
  const plugin = rehypeListDensity(options);
  plugin(tree);
  return tree;
};

describe('rehypeListDensity', () => {
  describe('class application', () => {
    it('does not add class to lists with short items', () => {
      const tree: Root = {
        type: 'root',
        children: [el('ul', [li('Short item'), li('Another short'), li('Third one')])],
      };

      transform(tree);

      const ul = tree.children[0] as Element;
      expect(ul.properties?.className).toBeUndefined();
    });

    it('adds class to lists with long items', () => {
      const longText =
        'This is a much longer list item that contains enough text to exceed the default threshold of 120 characters when averaged across all items in the list.';
      const tree: Root = {
        type: 'root',
        children: [el('ul', [li(longText), li(longText)])],
      };

      transform(tree);

      const ul = tree.children[0] as Element;
      expect(ul.properties?.className).toContain('long-list-items');
    });

    it('preserves existing classes when adding long-list-items', () => {
      const longText =
        'This is a much longer list item that contains enough text to exceed the default threshold of 120 characters when averaged across all items.';
      const tree: Root = {
        type: 'root',
        children: [el('ul', [li(longText), li(longText)], ['existing-class'])],
      };

      transform(tree);

      const ul = tree.children[0] as Element;
      expect(ul.properties?.className).toContain('existing-class');
      expect(ul.properties?.className).toContain('long-list-items');
    });
  });

  describe('nested list handling', () => {
    it('does not add class to nested lists', () => {
      const longText =
        'This is a very long nested list item that would normally trigger the class if it were a top-level list but should not here.';
      const tree: Root = {
        type: 'root',
        children: [
          el('ul', [el('li', [text('Parent item'), el('ul', [li(longText), li(longText)])])]),
        ],
      };

      transform(tree);

      const outerUl = tree.children[0] as Element;
      const innerLi = outerUl.children[0] as Element;
      const innerUl = innerLi.children[1] as Element;

      expect(outerUl.properties?.className).toBeUndefined();
      expect(innerUl.properties?.className).toBeUndefined();
    });

    it('excludes nested list text from parent item length calculation', () => {
      const longNestedText =
        'This nested content is very long and would push the average over the threshold if it were counted, but it should be excluded from the calculation.';
      const tree: Root = {
        type: 'root',
        children: [
          el('ul', [
            el('li', [text('Short'), el('ul', [li(longNestedText)])]),
            li('Also short'),
            li('Third short'),
          ]),
        ],
      };

      transform(tree);

      const ul = tree.children[0] as Element;
      expect(ul.properties?.className).toBeUndefined();
    });
  });

  describe('threshold configuration', () => {
    it('respects custom threshold option', () => {
      const tree: Root = {
        type: 'root',
        children: [
          el('ul', [
            li('This is about fifty characters of text here.'),
            li('And this one is also around fifty chars total.'),
          ]),
        ],
      };

      // With default threshold (120), should not get class
      transform(tree);
      expect((tree.children[0] as Element).properties?.className).toBeUndefined();

      // With lower threshold (40), should get class
      const tree2: Root = {
        type: 'root',
        children: [
          el('ul', [
            li('This is about fifty characters of text here.'),
            li('And this one is also around fifty chars total.'),
          ]),
        ],
      };
      transform(tree2, { threshold: 40 });
      expect((tree2.children[0] as Element).properties?.className).toContain('long-list-items');
    });
  });

  describe('edge cases', () => {
    it('handles empty lists gracefully', () => {
      const tree: Root = {
        type: 'root',
        children: [el('ul', [])],
      };

      expect(() => transform(tree)).not.toThrow();
      expect((tree.children[0] as Element).properties?.className).toBeUndefined();
    });

    it('counts text inside inline elements (em, strong, a, code)', () => {
      const tree: Root = {
        type: 'root',
        children: [
          el('ul', [
            el('li', [
              text('Start '),
              el('strong', [text('bold text that adds to the character count')]),
              text(' and '),
              el('a', [text('a link with more text')]),
              text(' and '),
              el('code', [text('some code')]),
              text(' end.'),
            ]),
            el('li', [
              el('em', [
                text(
                  'This entire item is emphasized and contains quite a lot of text to push the average up'
                ),
              ]),
            ]),
          ]),
        ],
      };

      transform(tree, { threshold: 80 });

      const ul = tree.children[0] as Element;
      expect(ul.properties?.className).toContain('long-list-items');
    });

    it('works with ordered lists (ol)', () => {
      const longText =
        'This is a long ordered list item that should trigger the class application just like unordered lists do when averaging character counts.';
      const tree: Root = {
        type: 'root',
        children: [el('ol', [li(longText), li(longText)])],
      };

      transform(tree);

      const ol = tree.children[0] as Element;
      expect(ol.properties?.className).toContain('long-list-items');
    });
  });
});
