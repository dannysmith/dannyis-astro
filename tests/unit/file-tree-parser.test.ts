import { describe, it, expect } from 'vitest';
import { parseTree, type FolderNode, type TreeNode } from '../../src/lib/file-tree/parse-tree';

/** Narrow a TreeNode to FolderNode; throws with a clear message if not. */
function assertFolder(node: TreeNode): asserts node is FolderNode {
  if (node.kind !== 'folder') {
    throw new Error(`expected folder, got ${node.kind}`);
  }
}

/**
 * Project a folder's children to their names, with `null` for any child
 * that isn't a file. The `null` filler is intentional — it surfaces
 * unexpected folder/ellipsis children in failure output instead of
 * silently filtering them out.
 */
function fileNames(folder: FolderNode): (string | null)[] {
  return folder.children.map(c => (c.kind === 'file' ? c.name : null));
}

/** Run a function expected to throw, returning the thrown message. */
function getThrownMessage(fn: () => unknown): string {
  try {
    fn();
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
  throw new Error('expected function to throw, but it returned normally');
}

describe('parseTree', () => {
  describe('error cases', () => {
    it('throws on empty input', () => {
      expect(() => parseTree('')).toThrow(/empty|no parseable entries/i);
    });

    it('throws on whitespace-only input', () => {
      expect(() => parseTree('   \n\n\t\n')).toThrow(/empty|no parseable entries/i);
    });

    it('throws on glyph-only input (lines made entirely of tree characters)', () => {
      expect(() => parseTree('│\n│\n│\n')).toThrow(/empty|no parseable entries/i);
    });

    it('throws when the first content line is indented (no root entry)', () => {
      expect(() => parseTree('  └── orphan.txt')).toThrow();
    });

    it('first-line-indented error mentions the line number and the offending content', () => {
      const msg = getThrownMessage(() => parseTree('  └── orphan.txt'));
      expect(msg).toMatch(/line 1/i);
      expect(msg).toContain('orphan.txt');
    });

    it('throws when a line is indented under an ellipsis, with the line numbers in the message', () => {
      const input = ['a/', '├── ...', '│   └── nope.txt'].join('\n');
      const msg = getThrownMessage(() => parseTree(input));
      expect(msg).toMatch(/ellipsis/i);
      // Both the offending child line (3) and the parent ellipsis line (2) are useful context.
      expect(msg).toMatch(/line 3/i);
      expect(msg).toMatch(/line 2/i);
    });
  });

  describe('single entries', () => {
    it('parses a single file with no glyphs as one root-level file', () => {
      const result = parseTree('README.md');
      expect(result).toEqual([{ kind: 'file', name: 'README.md', line: 1 }]);
    });

    it('parses a single folder (trailing slash, no children) as a folder', () => {
      const result = parseTree('src/');
      expect(result).toEqual([{ kind: 'folder', name: 'src', line: 1, children: [] }]);
    });
  });

  describe('flat lists', () => {
    it('parses a flat list of files (all depth 0)', () => {
      const result = parseTree(['makefile', 'README.md', '.gitignore'].join('\n'));
      expect(result).toEqual([
        { kind: 'file', name: 'makefile', line: 1 },
        { kind: 'file', name: 'README.md', line: 2 },
        { kind: 'file', name: '.gitignore', line: 3 },
      ]);
    });

    it('ignores blank lines between entries', () => {
      const result = parseTree(['a.txt', '', 'b.txt', '   ', 'c.txt'].join('\n'));
      expect(result.map(n => (n.kind === 'file' ? n.name : null))).toEqual([
        'a.txt',
        'b.txt',
        'c.txt',
      ]);
    });

    it('ignores pure-glyph separator lines (e.g. a lone `│`)', () => {
      const input = ['a/', '├── one.txt', '│', '└── two.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(fileNames(result[0])).toEqual(['one.txt', 'two.txt']);
    });
  });

  describe('nesting (Unicode tree(1) format)', () => {
    it('parses one folder with one child', () => {
      const input = ['src/', '└── index.ts'].join('\n');
      const result = parseTree(input);
      expect(result).toEqual([
        {
          kind: 'folder',
          name: 'src',
          line: 1,
          children: [{ kind: 'file', name: 'index.ts', line: 2 }],
        },
      ]);
    });

    it('parses a folder with multiple children', () => {
      const input = ['src/', '├── a.ts', '├── b.ts', '└── c.ts'].join('\n');
      const result = parseTree(input);
      expect(result).toHaveLength(1);
      assertFolder(result[0]!);
      expect(fileNames(result[0])).toEqual(['a.ts', 'b.ts', 'c.ts']);
    });

    it('parses deep nesting (3 levels)', () => {
      const input = ['a/', '└── b/', '    └── c/', '        └── d.txt'].join('\n');
      const result = parseTree(input);

      expect(result).toHaveLength(1);
      const a = result[0]!;
      assertFolder(a);
      expect(a.name).toBe('a');

      expect(a.children).toHaveLength(1);
      const b = a.children[0]!;
      assertFolder(b);
      expect(b.name).toBe('b');

      expect(b.children).toHaveLength(1);
      const c = b.children[0]!;
      assertFolder(c);
      expect(c.name).toBe('c');

      expect(c.children).toEqual([{ kind: 'file', name: 'd.txt', line: 4 }]);
    });

    it('returns siblings to the correct parent after ascending out of a folder', () => {
      const input = ['root/', '├── child-folder/', '│   └── deep.txt', '└── sibling.txt'].join(
        '\n'
      );
      const result = parseTree(input);
      expect(result).toHaveLength(1);
      const root = result[0]!;
      assertFolder(root);
      expect(root.children).toHaveLength(2);
      expect(root.children[0]!.kind).toBe('folder');
      expect(root.children[1]).toEqual({ kind: 'file', name: 'sibling.txt', line: 4 });
    });

    it('handles a deeper line with no intermediate-depth parent (attaches to nearest shallower)', () => {
      // grandchild appears at col 8 with no col-4 line between it and `a/` at col 0.
      const input = ['a/', '        deep.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].children).toEqual([{ kind: 'file', name: 'deep.txt', line: 2 }]);
    });

    it('handles multiple top-level entries (siblings at root)', () => {
      const input = ['src/', '└── a.ts', 'dist/', '└── b.js'].join('\n');
      const result = parseTree(input);
      expect(result).toHaveLength(2);
      assertFolder(result[0]!);
      assertFolder(result[1]!);
      expect(result[0].name).toBe('src');
      expect(fileNames(result[0])).toEqual(['a.ts']);
      expect(result[1].name).toBe('dist');
      expect(fileNames(result[1])).toEqual(['b.js']);
    });
  });

  describe('alternative whitespace / line endings', () => {
    it('handles tab-indented input', () => {
      // depth derived from column position, so tabs work as long as they're consistent.
      const input = ['a/', '\tb.txt', '\tc/', '\t\td.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0]).toEqual({ kind: 'file', name: 'b.txt', line: 2 });
      const c = result[0].children[1]!;
      assertFolder(c);
      expect(c.name).toBe('c');
      expect(c.children).toEqual([{ kind: 'file', name: 'd.txt', line: 4 }]);
    });

    it('handles CRLF line endings', () => {
      const input = 'a/\r\n├── b.txt\r\n└── c.txt\r\n';
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].name).toBe('a');
      expect(fileNames(result[0])).toEqual(['b.txt', 'c.txt']);
    });
  });

  describe('folder identification', () => {
    it('treats a trailing-slash entry with no children as a folder', () => {
      const result = parseTree(['empty/'].join('\n'));
      expect(result[0]).toEqual({ kind: 'folder', name: 'empty', line: 1, children: [] });
    });

    it('treats an entry with children as a folder even without trailing slash', () => {
      const input = ['parent', '└── child.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].name).toBe('parent');
      expect(result[0].children).toHaveLength(1);
    });

    it('treats an entry with both trailing slash AND children as one folder', () => {
      const input = ['parent/', '└── child.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].name).toBe('parent');
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('format equivalence', () => {
    // Same logical tree, expressed three ways. All three must produce
    // identical parse output (modulo nothing — line numbers included,
    // since each fixture has the same number of lines in the same order).
    //
    // The tree:
    //   project/
    //   ├── src/
    //   │   ├── index.ts
    //   │   └── lib/
    //   │       └── helper.ts
    //   ├── README.md
    //   └── tests/
    //       └── unit.test.ts

    const UNICODE = [
      'project/',
      '├── src/',
      '│   ├── index.ts',
      '│   └── lib/',
      '│       └── helper.ts',
      '├── README.md',
      '└── tests/',
      '    └── unit.test.ts',
    ].join('\n');

    const ASCII = [
      'project/',
      '|-- src/',
      '|   |-- index.ts',
      '|   `-- lib/',
      '|       `-- helper.ts',
      '|-- README.md',
      '`-- tests/',
      '    `-- unit.test.ts',
    ].join('\n');

    // Hand-typed pipe/dash with 3-column indent (`|- ` = 3 chars wide).
    const PIPE_DASH = [
      'project/',
      '|- src/',
      '|  |- index.ts',
      '|  `- lib/',
      '|     `- helper.ts',
      '|- README.md',
      '`- tests/',
      '   `- unit.test.ts',
    ].join('\n');

    function expectStandardShape(result: TreeNode[]) {
      expect(result).toHaveLength(1);
      const project = result[0]!;
      assertFolder(project);
      expect(project.name).toBe('project');
      expect(project.line).toBe(1);
      expect(project.children).toHaveLength(3);

      const [src, readme, tests] = project.children;
      assertFolder(src!);
      expect(src.name).toBe('src');
      expect(src.line).toBe(2);
      expect(src.children).toHaveLength(2);
      expect(src.children[0]).toEqual({ kind: 'file', name: 'index.ts', line: 3 });

      const lib = src.children[1]!;
      assertFolder(lib);
      expect(lib.name).toBe('lib');
      expect(lib.line).toBe(4);
      expect(lib.children).toEqual([{ kind: 'file', name: 'helper.ts', line: 5 }]);

      expect(readme).toEqual({ kind: 'file', name: 'README.md', line: 6 });

      assertFolder(tests!);
      expect(tests.name).toBe('tests');
      expect(tests.line).toBe(7);
      expect(tests.children).toEqual([{ kind: 'file', name: 'unit.test.ts', line: 8 }]);
    }

    it('parses the Unicode (tree default) format', () => {
      expectStandardShape(parseTree(UNICODE));
    });

    it('parses the ASCII (tree --charset=ascii) format', () => {
      expectStandardShape(parseTree(ASCII));
    });

    it('parses the hand-typed pipe/dash format with 3-col indent', () => {
      expectStandardShape(parseTree(PIPE_DASH));
    });

    it('produces identical output across all three formats', () => {
      const a = parseTree(UNICODE);
      const b = parseTree(ASCII);
      const c = parseTree(PIPE_DASH);
      expect(a).toEqual(b);
      expect(b).toEqual(c);
    });

    it('tolerates mixed glyphs within a single tree', () => {
      // Unicode root, ASCII branches, mixed — should still parse.
      const input = ['root/', '├── a.txt', '|-- b.txt', '`-- c.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(fileNames(result[0])).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });

    it('handles the `+--` branch glyph variant', () => {
      const input = ['root/', '+-- a.txt', '+-- b.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(fileNames(result[0])).toEqual(['a.txt', 'b.txt']);
    });
  });

  describe('special entries', () => {
    describe('ellipsis', () => {
      it('parses `...` as an ellipsis node, not a file', () => {
        const result = parseTree(['a/', '├── one.txt', '├── ...', '└── two.txt'].join('\n'));
        assertFolder(result[0]!);
        const ellipsis = result[0].children[1]!;
        expect(ellipsis).toEqual({ kind: 'ellipsis', line: 3 });
      });

      it('parses `…` (Unicode ellipsis) as an ellipsis node', () => {
        const result = parseTree(['a/', '├── one.txt', '├── …', '└── two.txt'].join('\n'));
        assertFolder(result[0]!);
        expect(result[0].children[1]).toEqual({ kind: 'ellipsis', line: 3 });
      });

      it('parses an ellipsis at the root level', () => {
        const result = parseTree(['a.txt', '...', 'z.txt'].join('\n'));
        expect(result).toEqual([
          { kind: 'file', name: 'a.txt', line: 1 },
          { kind: 'ellipsis', line: 2 },
          { kind: 'file', name: 'z.txt', line: 3 },
        ]);
      });

      it('throws if a line is indented under an ellipsis (ellipses cannot have children)', () => {
        const input = ['a/', '├── ...', '│   └── nope.txt'].join('\n');
        expect(() => parseTree(input)).toThrow();
      });
    });

    describe('unusual filenames', () => {
      it('preserves spaces in filenames', () => {
        const result = parseTree(['My New Video.mp4'].join('\n'));
        expect(result).toEqual([{ kind: 'file', name: 'My New Video.mp4', line: 1 }]);
      });

      it('preserves spaces in filenames inside a folder', () => {
        const input = ['videos/', '└── My New Video.mp4'].join('\n');
        const result = parseTree(input);
        assertFolder(result[0]!);
        expect(result[0].children).toEqual([{ kind: 'file', name: 'My New Video.mp4', line: 2 }]);
      });

      it('handles dotfiles (.gitignore, .videorc)', () => {
        const input = ['config/', '├── .gitignore', '└── .videorc'].join('\n');
        const result = parseTree(input);
        assertFolder(result[0]!);
        expect(fileNames(result[0])).toEqual(['.gitignore', '.videorc']);
      });

      it('handles extensionless files (makefile, Dockerfile)', () => {
        const input = ['project/', '├── makefile', '└── Dockerfile'].join('\n');
        const result = parseTree(input);
        assertFolder(result[0]!);
        expect(fileNames(result[0])).toEqual(['makefile', 'Dockerfile']);
      });

      it('handles a mix of special-name files in one tree', () => {
        const input = [
          'project/',
          '├── My New Video.mp4',
          '├── .videorc',
          '├── makefile',
          '└── ...',
        ].join('\n');
        const result = parseTree(input);
        assertFolder(result[0]!);
        expect(result[0].children).toEqual([
          { kind: 'file', name: 'My New Video.mp4', line: 2 },
          { kind: 'file', name: '.videorc', line: 3 },
          { kind: 'file', name: 'makefile', line: 4 },
          { kind: 'ellipsis', line: 5 },
        ]);
      });
    });
  });

  describe('comments', () => {
    it('extracts a trailing comment from a file', () => {
      const result = parseTree('foo.txt # the foo file');
      expect(result).toEqual([{ kind: 'file', name: 'foo.txt', comment: 'the foo file', line: 1 }]);
    });

    it('extracts a comment from a folder', () => {
      const result = parseTree('src/ # source code');
      expect(result).toEqual([
        { kind: 'folder', name: 'src', comment: 'source code', line: 1, children: [] },
      ]);
    });

    it('extracts a comment from an ellipsis', () => {
      const input = ['a/', '└── ... # more files'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].children[0]).toEqual({
        kind: 'ellipsis',
        comment: 'more files',
        line: 2,
      });
    });

    it('does not attach a comment field when no comment is present', () => {
      const result = parseTree('foo.txt');
      expect(result[0]).toEqual({ kind: 'file', name: 'foo.txt', line: 1 });
      expect((result[0] as { comment?: string }).comment).toBeUndefined();
    });

    it('preserves `#` in a filename when there is no leading-space delimiter', () => {
      const result = parseTree('temp#1.txt');
      expect(result[0]).toEqual({ kind: 'file', name: 'temp#1.txt', line: 1 });
    });

    it('extracts the comment correctly when the filename also contains `#`', () => {
      const result = parseTree('temp#1.txt # has a hash in the name');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'temp#1.txt',
        comment: 'has a hash in the name',
        line: 1,
      });
    });

    it('preserves spaces inside a filename when a comment is also present', () => {
      const result = parseTree('My New Video.mp4 # the new video');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'My New Video.mp4',
        comment: 'the new video',
        line: 1,
      });
    });

    it('treats a bare trailing `#` (empty comment) as no comment', () => {
      const result = parseTree('foo.txt #');
      expect(result[0]).toEqual({ kind: 'file', name: 'foo.txt', line: 1 });
    });

    it('trims surrounding whitespace from the comment', () => {
      const result = parseTree('foo.txt    #    spacious    ');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'foo.txt',
        comment: 'spacious',
        line: 1,
      });
    });

    it('keeps inner `#` characters in the comment body', () => {
      const result = parseTree('foo.txt # has # hash');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'foo.txt',
        comment: 'has # hash',
        line: 1,
      });
    });

    it('handles comments on multiple entries in a real-world tree', () => {
      const input = [
        'data/',
        '├── init.mp4         # HLS init segment',
        '├── seg_000.m4s      # ~4s media segment',
        '├── ...              # more segments',
        '└── stream.m3u8      # HLS playlist',
      ].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].name).toBe('data');
      expect(result[0].children).toEqual([
        { kind: 'file', name: 'init.mp4', comment: 'HLS init segment', line: 2 },
        { kind: 'file', name: 'seg_000.m4s', comment: '~4s media segment', line: 3 },
        { kind: 'ellipsis', comment: 'more segments', line: 4 },
        { kind: 'file', name: 'stream.m3u8', comment: 'HLS playlist', line: 5 },
      ]);
    });
  });

  describe('markdown-link filenames', () => {
    it('extracts href and name from a file link', () => {
      const result = parseTree('[index.html](https://example.com/index.html)');
      expect(result).toEqual([
        {
          kind: 'file',
          name: 'index.html',
          href: 'https://example.com/index.html',
          line: 1,
        },
      ]);
    });

    it('extracts href and name from a folder link (trailing slash inside brackets)', () => {
      const result = parseTree('[src/](https://example.com/src)');
      expect(result).toEqual([
        {
          kind: 'folder',
          name: 'src',
          href: 'https://example.com/src',
          line: 1,
          children: [],
        },
      ]);
    });

    it('combines a link with a comment on the same line', () => {
      const result = parseTree('[index.html](https://example.com) # the entry page');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'index.html',
        href: 'https://example.com',
        comment: 'the entry page',
        line: 1,
      });
    });

    it('parses a link inside a tree structure', () => {
      const input = [
        'project/',
        '├── [index.html](https://github.com/x/y/blob/main/index.html) # entry',
        '└── README.md',
      ].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].children[0]).toEqual({
        kind: 'file',
        name: 'index.html',
        href: 'https://github.com/x/y/blob/main/index.html',
        comment: 'entry',
        line: 2,
      });
      expect(result[0].children[1]).toEqual({
        kind: 'file',
        name: 'README.md',
        line: 3,
      });
    });

    it('preserves href when a tentative file link is upgraded to a folder by virtue of children', () => {
      // No trailing slash inside the brackets, but children appear underneath —
      // the entry should become a folder while keeping its href.
      const input = ['[src](https://example.com/src)', '└── index.ts'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0]).toMatchObject({
        kind: 'folder',
        name: 'src',
        href: 'https://example.com/src',
      });
      expect(result[0].children).toHaveLength(1);
    });

    it('treats malformed `[unclosed](url` as a literal filename', () => {
      const result = parseTree('[unclosed](url');
      expect(result[0]).toEqual({ kind: 'file', name: '[unclosed](url', line: 1 });
    });

    it('treats `[brackets]filename` (no parens) as a literal filename', () => {
      const result = parseTree('[brackets]filename');
      expect(result[0]).toEqual({ kind: 'file', name: '[brackets]filename', line: 1 });
    });

    it('leaves links inside the comment body verbatim (renderer handles markdown)', () => {
      const result = parseTree('foo.txt # see [the spec](https://example.com) for details');
      expect(result[0]).toEqual({
        kind: 'file',
        name: 'foo.txt',
        comment: 'see [the spec](https://example.com) for details',
        line: 1,
      });
    });
  });

  describe('line tracking', () => {
    it('records 1-based source line numbers on every entry', () => {
      const input = [
        'a/', // line 1
        '├── b.txt', // line 2
        '└── c/', // line 3
        '    └── d.txt', // line 4
      ].join('\n');
      const result = parseTree(input);
      const a = result[0]!;
      assertFolder(a);
      expect(a.line).toBe(1);
      expect(a.children[0]!.line).toBe(2);
      const c = a.children[1]!;
      assertFolder(c);
      expect(c.line).toBe(3);
      expect(c.children[0]!.line).toBe(4);
    });

    it('counts blank lines too when assigning line numbers', () => {
      const input = ['a.txt', '', 'b.txt'].join('\n');
      const result = parseTree(input);
      expect(result[0]!.line).toBe(1);
      expect(result[1]!.line).toBe(3);
    });

    it('counts pure-glyph separator lines toward line numbers', () => {
      // The lone `│` on line 3 is skipped as content but still takes a line.
      const input = ['a/', '├── one.txt', '│', '└── two.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].children[0]).toMatchObject({ name: 'one.txt', line: 2 });
      expect(result[0].children[1]).toMatchObject({ name: 'two.txt', line: 4 });
    });

    it('records line numbers across all node kinds (file, folder, ellipsis)', () => {
      const input = ['root/', '├── file.txt', '├── sub/', '├── ...', '└── last.txt'].join('\n');
      const result = parseTree(input);
      assertFolder(result[0]!);
      expect(result[0].line).toBe(1);
      const lines = result[0].children.map(n => n.line);
      expect(lines).toEqual([2, 3, 4, 5]);
      expect(result[0].children[1]!.kind).toBe('folder');
      expect(result[0].children[2]!.kind).toBe('ellipsis');
    });
  });
});
