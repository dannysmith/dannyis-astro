import { describe, it, expect } from 'vitest'
import {
  CONTEXT_LENGTH,
  createAnnotation,
  normaliseArticleId,
  parseAnnotations,
  reanchor,
  serialiseAnnotations,
  storageKey,
  type BlockText,
  type StoredAnnotation,
} from '../../src/utils/annotations'

/** The anchoring is reached the way the component reaches it. */
const anchorOf = (record: StoredAnnotation, blocks: BlockText[]) => reanchor(record, blocks).anchor

const ARTICLE = '/writing/some-article'

const paragraph = (text: string): BlockText => ({ tag: 'p', text })

/** Annotates the first occurrence of `quote` in the given block. */
const annotate = (
  blocks: BlockText[],
  blockIndex: number,
  quote: string,
  note = 'a note',
): StoredAnnotation => {
  const start = blocks[blockIndex].text.indexOf(quote)
  expect(start, `"${quote}" should appear in the block`).toBeGreaterThan(-1)
  return createAnnotation({
    id: 'id-1',
    articleId: ARTICLE,
    blockIndex,
    block: blocks[blockIndex],
    startOffset: start,
    endOffset: start + quote.length,
    note,
    createdAt: '2026-09-18T00:00:00.000Z',
  })
}

describe('normaliseArticleId and storageKey', () => {
  it('treats trailing slashes as insignificant', () => {
    expect(normaliseArticleId('/writing/thing/')).toBe('/writing/thing')
    expect(normaliseArticleId('/writing/thing')).toBe('/writing/thing')
  })

  it('keeps the root path addressable', () => {
    expect(normaliseArticleId('/')).toBe('/')
  })

  it('versions the storage key', () => {
    expect(storageKey(normaliseArticleId('/writing/thing/'))).toBe('annotations:v1:/writing/thing')
  })
})

describe('createAnnotation', () => {
  const text = 'The standard around your product changes. They ask an agent to research a trip.'
  const record = annotate([paragraph(text)], 0, 'product changes')

  it('captures the quote and its surrounding context', () => {
    expect(record.quote).toBe('product changes')
    expect(record.prefix).toBe('The standard around your ')
    expect(record.suffix).toBe('. They ask an agent to research ')
  })

  it('caps the context at CONTEXT_LENGTH characters', () => {
    expect(record.suffix).toHaveLength(CONTEXT_LENGTH)
    expect(record.prefix.length).toBeLessThanOrEqual(CONTEXT_LENGTH)
  })

  it('clamps context at the block boundaries rather than overrunning', () => {
    const atStart = annotate([paragraph(text)], 0, 'The standard')
    expect(atStart.prefix).toBe('')
    const atEnd = annotate([paragraph(text)], 0, 'a trip.')
    expect(atEnd.suffix).toBe('')
  })

  it('records the block identity, lowercasing the tag', () => {
    const inQuote = createAnnotation({
      id: 'x',
      articleId: ARTICLE,
      blockIndex: 2,
      block: { tag: 'BLOCKQUOTE', text },
      startOffset: 0,
      endOffset: 3,
      note: '',
    })
    expect(inQuote.blockTag).toBe('blockquote')
    expect(inQuote.blockId).toMatch(/^blockquote:2:/)
  })
})

describe('parseAnnotations', () => {
  const blocks = [paragraph('A paragraph about margins and annotations.')]
  const record = annotate(blocks, 0, 'margins')

  it('round-trips through serialisation', () => {
    expect(parseAnnotations(serialiseAnnotations([record]), ARTICLE)).toEqual([record])
  })

  it.each([
    ['no stored value', null],
    ['an empty string', ''],
    ['invalid JSON', '{definitely not json'],
    ['a JSON object rather than an array', '{"a":1}'],
  ])('returns nothing for %s', (_label, json) => {
    expect(parseAnnotations(json, ARTICLE)).toEqual([])
  })

  it('drops malformed records but keeps good ones', () => {
    const json = JSON.stringify([record, { id: 'junk' }, { ...record, quote: '' }])
    expect(parseAnnotations(json, ARTICLE)).toEqual([record])
  })

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an empty object', {}],
  ])('rejects %s in place of a record', (_label, value) => {
    expect(parseAnnotations(JSON.stringify([value]), ARTICLE)).toEqual([])
  })

  it.each([
    ['a missing quote', { quote: '' }],
    ['a non-integer offset', { startOffset: 1.5 }],
    ['an inverted range', { startOffset: 10, endOffset: 4 }],
    ['a negative block index', { blockIndex: -1 }],
    ['a numeric note', { note: 42 }],
  ])('rejects a record with %s', (_label, broken) => {
    expect(parseAnnotations(JSON.stringify([{ ...record, ...broken }]), ARTICLE)).toEqual([])
  })

  it('drops records belonging to another article', () => {
    const json = JSON.stringify([record, { ...record, articleId: '/writing/elsewhere' }])
    expect(parseAnnotations(json, ARTICLE)).toEqual([record])
  })
})

describe('anchoring', () => {
  const original = [
    paragraph('Your product did not get worse. It still does the job well enough.'),
    paragraph('Then those customers start using agents elsewhere, and the standard changes.'),
    paragraph('Eventually they return to your product and it feels tedious.'),
  ]

  it('finds an untouched annotation exactly where it was left', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    expect(anchorOf(record, original)).toEqual({
      status: 'exact',
      blockIndex: 1,
      startOffset: original[1].text.indexOf('agents elsewhere'),
      endOffset: original[1].text.indexOf('agents elsewhere') + 'agents elsewhere'.length,
    })
  })

  it('survives an edit earlier in the same paragraph, which is what his version loses', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    const edited = [
      original[0],
      paragraph(
        'Then those same customers begin using agents elsewhere, and the standard changes.',
      ),
      original[2],
    ]
    const anchor = anchorOf(record, edited)
    expect(anchor.status).toBe('moved')
    if (anchor.status === 'orphaned') throw new Error('unreachable')
    expect(edited[1].text.slice(anchor.startOffset, anchor.endOffset)).toBe('agents elsewhere')
  })

  it('follows the quote when a paragraph is inserted above it', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    const withNewIntro = [paragraph('A new opening paragraph.'), ...original]
    const anchor = anchorOf(record, withNewIntro)
    expect(anchor).toMatchObject({ status: 'moved', blockIndex: 2 })
  })

  it('stays put when an edit elsewhere leaves the context partly intact', () => {
    const blocks = [paragraph('Alpha then the phrase and then beta.')]
    const record = annotate(blocks, 0, 'the phrase')
    const edited = [paragraph('Alpha then the phrase and then gamma entirely rewritten.')]
    expect(anchorOf(record, edited)).toMatchObject({ status: 'exact' })
  })

  it('orphans rather than mis-anchoring when the quote itself is edited away', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    const rewritten = [
      original[0],
      paragraph('Then those customers start using something altogether different.'),
      original[2],
    ]
    expect(anchorOf(record, rewritten)).toEqual({ status: 'orphaned' })
  })

  it('orphans when the whole article is replaced', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    expect(anchorOf(record, [paragraph('Nothing in common.')])).toEqual({ status: 'orphaned' })
  })

  it('orphans when the block it lived in is deleted and nothing else matches', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    expect(anchorOf(record, [original[0], original[2]])).toEqual({ status: 'orphaned' })
  })

  it('picks the occurrence whose context matches when a phrase repeats in one block', () => {
    const blocks = [paragraph('First the cat sat down. Later the cat sat again.')]
    const second = blocks[0].text.lastIndexOf('the cat sat')
    const record = createAnnotation({
      id: 'id-1',
      articleId: ARTICLE,
      blockIndex: 0,
      block: blocks[0],
      startOffset: second,
      endOffset: second + 'the cat sat'.length,
      note: '',
    })
    const edited = [paragraph('Changed opening where the cat sat down. Later the cat sat again.')]
    const anchor = anchorOf(record, edited)
    expect(anchor.status).toBe('moved')
    // The later occurrence, which is the one that was annotated — not the earlier one,
    // even though the earlier one is nearer the recorded offset.
    expect(anchor.status !== 'orphaned' && anchor.startOffset).toBe(
      edited[0].text.lastIndexOf('the cat sat'),
    )
  })

  it('keeps an annotation where it was recorded even when the quote is ambiguous', () => {
    const blocks = [paragraph('the thing'), paragraph('another line')]
    const record = annotate(blocks, 0, 'the thing')
    // A second copy appears elsewhere, but the recorded position still holds the quote.
    expect(anchorOf(record, [blocks[0], paragraph('the thing')])).toMatchObject({
      status: 'exact',
      blockIndex: 0,
    })
  })

  it('orphans an ambiguous quote once its recorded position no longer holds it', () => {
    const blocks = [paragraph('the thing'), paragraph('another line')]
    const record = annotate(blocks, 0, 'the thing')
    const edited = [paragraph('rewritten opening'), paragraph('the thing'), paragraph('the thing')]
    // Two equally plausible copies, and no context survives to separate them.
    expect(anchorOf({ ...record, prefix: 'gone', suffix: 'gone' }, edited)).toEqual({
      status: 'orphaned',
    })
  })

  it('accepts an unambiguous quote even with no surviving context', () => {
    const blocks = [paragraph('the thing')]
    const record = annotate(blocks, 0, 'the thing')
    const anchor = anchorOf({ ...record, prefix: 'gone', suffix: 'gone' }, [
      paragraph('preamble'),
      paragraph('the thing'),
    ])
    expect(anchor).toMatchObject({ status: 'moved', blockIndex: 1 })
  })

  it('prefers a block of the same kind when the quote moves into a quotation', () => {
    const record = annotate(original, 1, 'agents elsewhere')
    const anchor = anchorOf(record, [
      { tag: 'blockquote', text: 'Something about agents elsewhere.' },
      paragraph('Something about agents elsewhere.'),
    ])
    expect(anchor).toMatchObject({ status: 'moved', blockIndex: 1 })
  })
})

describe('reanchor', () => {
  const blocks = [paragraph('The standard around your product changes over time.')]

  it('returns the record untouched when nothing has changed', () => {
    const record = annotate(blocks, 0, 'product changes')
    const result = reanchor(record, blocks)
    expect(result.anchor.status).toBe('exact')
    expect(result.record).toBe(record)
  })

  it('refreshes offsets, context and block id when the text has moved', () => {
    const record = annotate(blocks, 0, 'product changes')
    const edited = [paragraph('In practice the standard around your product changes over time.')]
    const result = reanchor(record, edited)

    expect(result.anchor.status).toBe('moved')
    expect(result.record).not.toBe(record)
    expect(result.record.startOffset).toBe(edited[0].text.indexOf('product changes'))
    const movedTo = edited[0].text.indexOf('product changes')
    expect(result.record.prefix).toBe(edited[0].text.slice(movedTo - CONTEXT_LENGTH, movedTo))
    expect(result.record.blockId).not.toBe(record.blockId)
    // The reader's own writing is never touched.
    expect(result.record.note).toBe(record.note)
    expect(result.record.id).toBe(record.id)
    expect(result.record.createdAt).toBe(record.createdAt)
  })

  it('refreshes stale context even when the quote has not moved', () => {
    const record = annotate(blocks, 0, 'product changes')
    const edited = [paragraph('The standard around your product changes, eventually, over time.')]
    const result = reanchor(record, edited)
    expect(result.anchor.status).toBe('exact')
    expect(result.record.suffix).toBe(', eventually, over time.')
  })

  it('leaves an orphan exactly as it was, ready to be shown as detached', () => {
    const record = annotate(blocks, 0, 'product changes')
    const result = reanchor(record, [paragraph('Entirely different prose.')])
    expect(result.anchor).toEqual({ status: 'orphaned' })
    expect(result.record).toBe(record)
  })
})
