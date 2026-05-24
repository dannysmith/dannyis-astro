/**
 * Parses a `tree`-style fenced code block into a nested node structure.
 *
 * Accepts three input formats interchangeably (and mixtures of them):
 * GNU `tree(1)` Unicode (`├──`, `└──`, `│`), `tree --charset=ascii`
 * (`|--`, `` `-- ``, `|`), and hand-typed pipe/dash (`|-`, `+--`).
 *
 * Tree glyphs are decoration only. Depth is derived from the column at
 * which the actual filename starts (using a stack — no fixed indent unit
 * is assumed), so 2-space, 4-space, tabs, or mixed all work.
 *
 * Known limitation: filenames starting with `-` are not supported — the
 * leading `-` would be consumed as a tree glyph.
 */

export type TreeNode = FileNode | FolderNode | EllipsisNode;

export interface FileNode {
  kind: 'file';
  name: string;
  href?: string;
  comment?: string;
  /** 1-based line number in the original source block. */
  line: number;
}

export interface FolderNode {
  kind: 'folder';
  name: string;
  href?: string;
  comment?: string;
  line: number;
  children: TreeNode[];
}

export interface EllipsisNode {
  kind: 'ellipsis';
  comment?: string;
  line: number;
}

const TREE_GLYPHS = new Set(['│', '├', '└', '─', '|', '+', '\\', '`', '-']);

function isGlyphOrSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || TREE_GLYPHS.has(ch);
}

interface ParsedLine {
  contentCol: number;
  content: string;
}

/** Strip leading glyphs/whitespace; return the column + remaining text, or null if there's no content. */
function stripPrefix(line: string): ParsedLine | null {
  let i = 0;
  while (i < line.length && isGlyphOrSpace(line[i]!)) {
    i++;
  }
  if (i >= line.length) return null;
  return { contentCol: i, content: line.slice(i).trimEnd() };
}

/**
 * Split an entry's content into a body (filename or ellipsis text) and an
 * optional comment. Comment delimiter is whitespace + `#` followed by
 * either more whitespace and any text, or end of string. The leading
 * whitespace requirement means `#` characters inside filenames
 * (`temp#1.txt`) are preserved.
 */
const COMMENT_RE = /\s+#(?:\s+(.*))?$/;

function splitComment(content: string): { body: string; comment?: string } {
  const match = content.match(COMMENT_RE);
  if (!match || match.index === undefined) return { body: content };
  const body = content.slice(0, match.index).trimEnd();
  const captured = match[1]?.trim();
  return captured && captured.length > 0 ? { body, comment: captured } : { body };
}

/**
 * Detect a fully-formed markdown link as the entry body — `[text](url)`.
 * Returns the link text as the name and the URL as href. If the body
 * isn't a complete link, the whole body is the literal name (so writing
 * something like `[brackets]filename` just produces a file named exactly
 * that). URLs containing `)` are not supported — first `)` ends the URL.
 */
const LINK_RE = /^\[(.+?)\]\((.+?)\)$/;

function splitLink(body: string): { name: string; href?: string } {
  const m = body.match(LINK_RE);
  if (m) return { name: m[1]!, href: m[2]! };
  return { name: body };
}

/**
 * Upgrade a tentative file node to a folder in place. The same object
 * reference is held in the parent's `children` array, so the upgrade
 * is visible everywhere it's referenced. Ellipsis entries are rejected
 * at the call site (where line-number context is available) so this
 * helper only needs to handle file → folder.
 */
function upgradeToFolder(node: FileNode | FolderNode): asserts node is FolderNode {
  if (node.kind === 'file') {
    const folder = node as unknown as FolderNode;
    folder.kind = 'folder';
    folder.children = [];
  }
}

interface StackEntry {
  contentCol: number;
  node: TreeNode;
}

export function parseTree(input: string): TreeNode[] {
  const lines = input.split('\n');

  // Sentinel root folder. Its `children` are the returned top-level nodes.
  // Using a real folder (rather than a nullable parent) lets us treat every
  // stack entry uniformly — no null branches, no any-style casts.
  const root: FolderNode = { kind: 'folder', name: '', line: 0, children: [] };
  const stack: StackEntry[] = [{ contentCol: -1, node: root }];

  let firstContentSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i]!;
    const parsed = stripPrefix(rawLine);
    if (!parsed) continue;

    if (!firstContentSeen) {
      if (parsed.contentCol !== 0) {
        throw new Error(
          `parseTree: first content line is indented (column ${parsed.contentCol}) — there is no root entry to attach to. Line ${lineNum}: "${rawLine}"`
        );
      }
      firstContentSeen = true;
    }

    // Pop until the top of the stack is strictly shallower than this line.
    while (stack[stack.length - 1]!.contentCol >= parsed.contentCol) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]!.node;
    if (parent.kind === 'ellipsis') {
      throw new Error(
        `parseTree: line ${lineNum} is indented under an ellipsis entry (line ${parent.line}); ellipsis entries cannot have children. Line ${lineNum}: "${rawLine}"`
      );
    }
    upgradeToFolder(parent); // no-op if already a folder

    const { body, comment } = splitComment(parsed.content);

    let newNode: TreeNode;
    if (body === '...' || body === '…') {
      newNode = { kind: 'ellipsis', line: lineNum, ...(comment && { comment }) };
    } else {
      const { name: linkText, href } = splitLink(body);
      const hasTrailingSlash = linkText.endsWith('/');
      const name = hasTrailingSlash ? linkText.slice(0, -1) : linkText;
      const common = {
        name,
        line: lineNum,
        ...(href && { href }),
        ...(comment && { comment }),
      };
      newNode = hasTrailingSlash
        ? { kind: 'folder', ...common, children: [] }
        : { kind: 'file', ...common };
    }

    parent.children.push(newNode);
    stack.push({ contentCol: parsed.contentCol, node: newNode });
  }

  if (!firstContentSeen) {
    throw new Error('parseTree: input is empty or contains no parseable entries.');
  }

  return root.children;
}
