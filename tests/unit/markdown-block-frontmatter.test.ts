import { describe, it, expect } from 'vitest'
import { MAX_PILL_LENGTH, readFrontmatter } from '../../src/lib/markdown-block/frontmatter'

/** Wrap YAML lines in a frontmatter block above a short body. */
const doc = (...yaml: string[]) => `---\n${yaml.join('\n')}\n---\n\n# Body`

/** The parsed rows of a document's frontmatter. */
function rowsOf(markdown: string) {
  const result = readFrontmatter(markdown)
  if (!result || 'invalid' in result) throw new Error('expected parsed rows')
  return result.rows
}

/** The classified value of a single-entry frontmatter block. */
const valueOf = (...yaml: string[]) => rowsOf(doc(...yaml))[0]?.value

describe('readFrontmatter', () => {
  it('returns null without frontmatter', () => {
    expect(readFrontmatter('# Just a heading\n\nText.')).toBeNull()
  })

  it('returns null for an empty block', () => {
    expect(readFrontmatter('---\n---\n\nBody')).toBeNull()
  })

  it('returns the raw block when the YAML is invalid', () => {
    expect(readFrontmatter(doc('title: "{{title}}', 'date: {{date}}'))).toEqual({
      invalid: 'title: "{{title}}\ndate: {{date}}',
    })
  })

  it('returns the raw block when the YAML is a list, not key/value pairs', () => {
    expect(readFrontmatter(doc('- a', '- b'))).toEqual({ invalid: '- a\n- b' })
  })

  it('keeps entries in source order', () => {
    expect(rowsOf(doc('b: 1', 'a: 2')).map(row => row.key)).toEqual(['b', 'a'])
  })

  it('reads TOML frontmatter', () => {
    const result = readFrontmatter('+++\ntitle = "Hugo"\n+++\n\nBody')
    expect(result).toEqual({ rows: [{ key: 'title', value: { kind: 'text', text: 'Hugo' } }] })
  })
})

describe('value classification', () => {
  it('shows strings, numbers and booleans as text', () => {
    expect(valueOf('name: Danny')).toEqual({ kind: 'text', text: 'Danny' })
    expect(valueOf('rating: 4')).toEqual({ kind: 'text', text: '4' })
    expect(valueOf('draft: false')).toEqual({ kind: 'text', text: 'false' })
  })

  it('links http(s) URLs only', () => {
    expect(valueOf('url: https://danny.is')).toEqual({ kind: 'link', href: 'https://danny.is' })
    expect(valueOf('related: "[[Boats]]"')).toEqual({ kind: 'text', text: '[[Boats]]' })
  })

  it('treats null, empty strings, arrays and objects as empty', () => {
    for (const yaml of ['status:', 'status: ""', 'status: []', 'status: {}']) {
      expect(valueOf(yaml)).toEqual({ kind: 'empty' })
    }
  })

  it('shows dates as written, with an ISO datetime', () => {
    expect(valueOf('date: 2026-10-20')).toEqual({
      kind: 'date',
      text: '2026-10-20',
      datetime: '2026-10-20',
    })
    expect(valueOf('date: 2026-05-28T09:30:00+01:00')).toEqual({
      kind: 'date',
      text: '2026-05-28T09:30:00+01:00',
      datetime: '2026-05-28T08:30:00.000Z',
    })
  })

  it('shows arrays of short items as pills', () => {
    expect(valueOf('tags: [astro, css]')).toEqual({ kind: 'pills', items: ['astro', 'css'] })
    expect(valueOf('tags:', '- one', '- two')).toEqual({ kind: 'pills', items: ['one', 'two'] })
  })

  it('shows arrays with any long item as a list', () => {
    const long = 'x'.repeat(MAX_PILL_LENGTH + 1)
    const short = 'x'.repeat(MAX_PILL_LENGTH)
    expect(valueOf(`examples: [a, ${long}]`)).toEqual({ kind: 'list', items: ['a', long] })
    expect(valueOf(`examples: [a, ${short}]`)).toEqual({ kind: 'pills', items: ['a', short] })
  })

  it('shows nested values as their dedented YAML source', () => {
    expect(valueOf('author:', '  name: Danny', '  url: https://danny.is')).toEqual({
      kind: 'source',
      text: 'name: Danny\nurl: https://danny.is',
    })
    expect(valueOf('meta: { priority: high }')).toEqual({
      kind: 'source',
      text: '{ priority: high }',
    })
    expect(valueOf('steps:', '  - name: Build', '    run: bun run build')).toEqual({
      kind: 'source',
      text: '- name: Build\n  run: bun run build',
    })
  })

  it('leaves top-level comments out of a nested value', () => {
    const rows = rowsOf(doc('author:', '  name: Danny', '# A comment', 'title: Hi'))
    expect(rows[0]?.value).toEqual({
      kind: 'source',
      text: 'name: Danny',
    })
  })

  it('falls back to JSON for keys with no source line', () => {
    // `nested` arrives via the merge key, so no line of the source starts with it.
    const rows = rowsOf(doc('base: &base', '  nested: { a: 1 }', '<<: *base'))
    expect(rows[1]).toEqual({
      key: 'nested',
      value: { kind: 'source', text: JSON.stringify({ a: 1 }, null, 2) },
    })
  })
})
