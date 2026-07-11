import { describe, it, expect } from 'vitest';
import { rehypeUnwrapImages } from '../../src/lib/rehype-unwrap-images.mjs';
import type { Element, Root, Text } from 'hast';

/** Helpers to build a small hast tree. */
const text = (value: string): Text => ({ type: 'text', value });
const img = (src = 'photo.jpg'): Element => ({
  type: 'element',
  tagName: 'img',
  properties: { src },
  children: [],
});
const el = (tagName: string, children: (Element | Text)[] = []): Element => ({
  type: 'element',
  tagName,
  properties: {},
  children,
});

/** Run the plugin against a tree and return it. */
const transform = (tree: Root): Root => {
  rehypeUnwrapImages()(tree);
  return tree;
};

const tagsOf = (tree: Root) => tree.children.map(c => (c as Element).tagName ?? c.type);

describe('rehypeUnwrapImages', () => {
  it('unwraps a paragraph whose only child is an image', () => {
    const tree: Root = { type: 'root', children: [el('p', [img()])] };
    transform(tree);
    expect(tree.children).toHaveLength(1);
    expect((tree.children[0] as Element).tagName).toBe('img');
  });

  it('ignores surrounding whitespace when deciding to unwrap', () => {
    const tree: Root = { type: 'root', children: [el('p', [text('\n  '), img(), text('\n')])] };
    transform(tree);
    expect(tagsOf(tree)).toContain('img');
    expect(tagsOf(tree)).not.toContain('p');
  });

  it('unwraps a paragraph containing only multiple images (a gallery)', () => {
    const tree: Root = {
      type: 'root',
      children: [el('p', [img('a.jpg'), text('\n'), img('b.jpg')])],
    };
    transform(tree);
    const imgs = tree.children.filter(c => (c as Element).tagName === 'img');
    expect(imgs).toHaveLength(2);
    expect(tagsOf(tree)).not.toContain('p');
  });

  it('unwraps a paragraph whose only child is a link wrapping an image', () => {
    const tree: Root = { type: 'root', children: [el('p', [el('a', [img()])])] };
    transform(tree);
    expect((tree.children[0] as Element).tagName).toBe('a');
    expect(tagsOf(tree)).not.toContain('p');
  });

  it('does NOT unwrap a paragraph mixing text and an image', () => {
    const tree: Root = { type: 'root', children: [el('p', [text('See '), img(), text(' here')])] };
    transform(tree);
    expect((tree.children[0] as Element).tagName).toBe('p');
  });

  it('does NOT unwrap a text-only paragraph', () => {
    const tree: Root = { type: 'root', children: [el('p', [text('just words')])] };
    transform(tree);
    expect((tree.children[0] as Element).tagName).toBe('p');
  });

  it('does NOT unwrap an empty paragraph', () => {
    const tree: Root = { type: 'root', children: [el('p', [])] };
    transform(tree);
    expect((tree.children[0] as Element).tagName).toBe('p');
  });

  it('leaves non-paragraph containers alone', () => {
    const tree: Root = { type: 'root', children: [el('div', [img()])] };
    transform(tree);
    const div = tree.children[0] as Element;
    expect(div.tagName).toBe('div');
    expect((div.children[0] as Element).tagName).toBe('img');
  });
});
