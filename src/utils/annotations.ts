/**
 * Reader margin annotations: the stored record, and the anchoring that has to
 * survive the article being edited afterwards.
 *
 * Deliberately DOM-free — it's all string work over a block's text content — so
 * the part most likely to fail silently is unit testable. Turning offsets back
 * into a `Range` is the component's job.
 *
 * See docs/developer/margin-annotations.md.
 */

/** Characters of surrounding text stored either side of the quote. */
export const CONTEXT_LENGTH = 32

/** Bump when the record shape changes, so old records are ignored rather than misread. */
const STORAGE_VERSION = 1

/** One reader's annotation, as stored in their browser. */
export interface StoredAnnotation {
  id: string
  /** Article pathname, trailing slash stripped. */
  articleId: string
  /** Index into the article's annotatable blocks, in document order. */
  blockIndex: number
  blockTag: string
  /** `tag:index:hash` — a cheap "has this block changed?" signal. Never a reason to drop a note. */
  blockId: string
  /** Character offsets into the block's text content. */
  startOffset: number
  endOffset: number
  /** The annotated text itself, plus up to CONTEXT_LENGTH characters either side. */
  quote: string
  prefix: string
  suffix: string
  note: string
  createdAt: string
}

/** The text of one annotatable block. Callers pass these in document order. */
export interface BlockText {
  tag: string
  text: string
}

/** Where an annotation's text was found when restoring it. */
export type Anchor =
  | {
      /** `exact` — still where we left it. `moved` — found elsewhere, so the record needs refreshing. */
      status: 'exact' | 'moved'
      blockIndex: number
      startOffset: number
      endOffset: number
    }
  | { status: 'orphaned' }

/** FNV-1a, base 36. Short, stable, and not a security hash. */
function fnv1a(text: string): string {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  }
  return (hash >>> 0).toString(36)
}

/** Identifies a block by what it is, where it is, and what it said at the time. */
function blockId(tag: string, index: number, text: string): string {
  return `${tag.toLowerCase()}:${index}:${fnv1a(text)}`
}

/** `/writing/thing/` and `/writing/thing` are the same article. Callers normalise once, here. */
export function normaliseArticleId(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export function storageKey(articleId: string): string {
  return `annotations:v${STORAGE_VERSION}:${articleId}`
}

/** Builds a record from a selection's offsets within a block. */
export function createAnnotation(input: {
  id: string
  articleId: string
  blockIndex: number
  block: BlockText
  startOffset: number
  endOffset: number
  note: string
  createdAt?: string
}): StoredAnnotation {
  const { id, blockIndex, block, startOffset, endOffset, note } = input
  const text = block.text
  return {
    id,
    articleId: input.articleId,
    blockIndex,
    blockTag: block.tag.toLowerCase(),
    blockId: blockId(block.tag, blockIndex, text),
    startOffset,
    endOffset,
    quote: text.slice(startOffset, endOffset),
    prefix: text.slice(Math.max(0, startOffset - CONTEXT_LENGTH), startOffset),
    suffix: text.slice(endOffset, endOffset + CONTEXT_LENGTH),
    note,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

function isStoredAnnotation(value: unknown): value is StoredAnnotation {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  const strings = [
    'id',
    'articleId',
    'blockTag',
    'blockId',
    'quote',
    'prefix',
    'suffix',
    'note',
    'createdAt',
  ]
  if (!strings.every(key => typeof record[key] === 'string')) return false
  if (!['blockIndex', 'startOffset', 'endOffset'].every(key => Number.isInteger(record[key]))) {
    return false
  }
  const { blockIndex, startOffset, endOffset, quote } = record as unknown as StoredAnnotation
  return blockIndex >= 0 && startOffset >= 0 && endOffset > startOffset && quote.length > 0
}

/**
 * Reads records out of storage, dropping anything malformed or belonging to
 * another article. Never throws: unreadable storage means no annotations, not a
 * broken page.
 */
export function parseAnnotations(json: string | null, articleId: string): StoredAnnotation[] {
  if (!json) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter(
    (record): record is StoredAnnotation =>
      isStoredAnnotation(record) && record.articleId === articleId,
  )
}

export function serialiseAnnotations(records: StoredAnnotation[]): string {
  return JSON.stringify(records)
}

/**
 * Finds where an annotation belongs now: the recorded offsets first, then the
 * quote itself, scored by how much stored context still surrounds it. Only a
 * quote that has genuinely gone orphans. Reached through `reanchor`.
 *
 * Note what is deliberately *not* tested here: `blockId`. A hash mismatch only
 * means the block changed somewhere, which is no reason to throw away a note
 * whose own text is sitting there untouched.
 */
function findAnchor(record: StoredAnnotation, blocks: BlockText[]): Anchor {
  const { quote, blockIndex, startOffset } = record

  // Every place the quote still appears, scored by surviving context.
  const candidates: { index: number; start: number; score: number; tagMatch: boolean }[] = []
  for (const [index, block] of blocks.entries()) {
    let from = block.text.indexOf(quote)
    while (from !== -1) {
      candidates.push({
        index,
        start: from,
        score: contextAt(block.text, from, from + quote.length, record),
        tagMatch: block.tag.toLowerCase() === record.blockTag,
      })
      from = block.text.indexOf(quote, from + 1)
    }
  }
  if (candidates.length === 0) return { status: 'orphaned' }

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.tagMatch) - Number(a.tagMatch) ||
      Math.abs(a.index - blockIndex) - Math.abs(b.index - blockIndex) ||
      Math.abs(a.start - startOffset) - Math.abs(b.start - startOffset),
  )
  const best = candidates[0]

  // Where we left it wins unless somewhere else genuinely looks better, so an
  // edit elsewhere in the paragraph can't shunt a note onto a different copy of
  // the same phrase.
  const home = candidates.find(c => c.index === blockIndex && c.start === startOffset)
  if (home && home.score >= best.score) {
    return { status: 'exact', blockIndex, startOffset, endOffset: startOffset + quote.length }
  }

  // A quote with no surviving context that turns up in more than one place is a
  // coin toss, and attaching a reader's note to the wrong sentence is worse than
  // telling them it came loose.
  if (best.score === 0 && candidates.length > 1) return { status: 'orphaned' }

  return {
    status: 'moved',
    blockIndex: best.index,
    startOffset: best.start,
    endOffset: best.start + quote.length,
  }
}

/**
 * Re-anchors a record and returns the version to store: position and context
 * refreshed from wherever the quote now is, including when it hasn't moved but
 * the text around it has. An orphan comes back untouched.
 *
 * Unchanged records come back by identity, so callers can use `next !== previous`
 * to decide whether to write.
 */
export function reanchor(
  record: StoredAnnotation,
  blocks: BlockText[],
): { anchor: Anchor; record: StoredAnnotation } {
  const anchor = findAnchor(record, blocks)
  if (anchor.status === 'orphaned') return { anchor, record }

  const refreshed = createAnnotation({
    ...record,
    block: blocks[anchor.blockIndex],
    blockIndex: anchor.blockIndex,
    startOffset: anchor.startOffset,
    endOffset: anchor.endOffset,
  })
  const unchanged =
    refreshed.blockId === record.blockId &&
    refreshed.startOffset === record.startOffset &&
    refreshed.prefix === record.prefix &&
    refreshed.suffix === record.suffix
  return { anchor, record: unchanged ? record : refreshed }
}

/** How much of the stored context still surrounds a candidate position. */
function contextAt(
  text: string,
  start: number,
  end: number,
  record: Pick<StoredAnnotation, 'prefix' | 'suffix'>,
): number {
  const before = text.slice(Math.max(0, start - record.prefix.length), start)
  const after = text.slice(end, end + record.suffix.length)
  return sharedSuffix(before, record.prefix) + sharedPrefix(after, record.suffix)
}

function sharedPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

function sharedSuffix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
  return i
}
