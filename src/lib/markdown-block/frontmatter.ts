/**
 * Turn a markdown document's frontmatter into display rows for
 * MarkdownBlock's frontmatter panel (MarkdownFrontmatter.astro).
 *
 * Parsing uses Astro's own `parseFrontmatter` (js-yaml, plus TOML for `+++`
 * blocks), so previews read frontmatter exactly as content collections do.
 * Each value is classified by shape:
 *
 *   - strings, numbers, booleans  → text (http(s) URLs become links)
 *   - dates                       → shown as written, with an ISO datetime
 *   - null, '', [] and {}         → empty
 *   - arrays of short scalars     → pills
 *   - arrays of longer scalars    → a list
 *   - anything nested             → that entry's YAML source, verbatim
 */
import { extractFrontmatter, parseFrontmatter } from 'astro/markdown'

/** Longest array item (in characters) that still renders as a pill. */
export const MAX_PILL_LENGTH = 24

export type FrontmatterValue =
  | { kind: 'empty' }
  | { kind: 'text'; text: string }
  | { kind: 'date'; text: string; datetime: string }
  | { kind: 'link'; href: string }
  | { kind: 'pills' | 'list'; items: string[] }
  | { kind: 'source'; text: string }

export interface FrontmatterRow {
  key: string
  value: FrontmatterValue
}

/** Parsed rows, or the raw block when it isn't valid YAML/TOML. */
export type Frontmatter = { rows: FrontmatterRow[] } | { invalid: string }

const isScalar = (value: unknown) =>
  value === null || typeof value !== 'object' || value instanceof Date

/** Dates in YAML are UTC; date-only values have a midnight time. */
function isoDate(date: Date): string {
  const iso = date.toISOString()
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso
}

const formatScalar = (value: unknown) => (value instanceof Date ? isoDate(value) : String(value))

/**
 * The source text of each top-level entry's value, keyed by name, so values
 * can be shown exactly as written. A new entry starts on any unindented
 * `key:` line; everything until the next one belongs to it.
 */
function entrySources(raw: string): Map<string, string> {
  const sources = new Map<string, string>()
  let key: string | undefined
  let lines: string[] = []
  const flush = () => {
    if (key === undefined) return
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.search(/\S/)))
    const dedented = lines.map(line => line.slice(indent))
    sources.set(key, dedented.join('\n').trim())
  }
  for (const line of raw.split('\n')) {
    if (line.startsWith('#')) continue
    const match = /^(["']?)([^\s#'"-][^:]*?)\1:(?:\s+(.*))?$/.exec(line)
    if (match) {
      flush()
      key = match[2]
      lines = match[3] ? [match[3]] : []
    } else {
      lines.push(line)
    }
  }
  flush()
  return sources
}

function classify(value: unknown, source: string | undefined): FrontmatterValue {
  if (value === null || value === '') return { kind: 'empty' }
  if (!isScalar(value) && Object.keys(value as object).length === 0) return { kind: 'empty' }
  if (value instanceof Date) {
    return { kind: 'date', text: source ?? isoDate(value), datetime: isoDate(value) }
  }
  if (Array.isArray(value) && value.every(isScalar)) {
    const items = value.map(formatScalar)
    const short = items.every(item => item.length <= MAX_PILL_LENGTH)
    return { kind: short ? 'pills' : 'list', items }
  }
  if (!isScalar(value)) {
    // Keys produced by YAML merges (`<<: *base`) have no source line of their own.
    return { kind: 'source', text: source ?? JSON.stringify(value, null, 2) }
  }
  if (typeof value === 'string' && /^https?:\/\/\S+$/.test(value)) {
    return { kind: 'link', href: value }
  }
  return { kind: 'text', text: formatScalar(value) }
}

/**
 * Read the frontmatter at the top of a markdown document. Returns null when
 * there is none, or it has no entries.
 */
export function readFrontmatter(markdown: string): Frontmatter | null {
  const raw = extractFrontmatter(markdown)
  if (raw === undefined) return null

  let data: Record<string, unknown>
  try {
    data = parseFrontmatter(markdown).frontmatter
  } catch {
    return { invalid: raw.trim() }
  }

  const entries = Object.entries(data)
  if (entries.length === 0) return null

  const sources = entrySources(raw)
  return {
    rows: entries.map(([key, value]) => ({ key, value: classify(value, sources.get(key)) })),
  }
}
