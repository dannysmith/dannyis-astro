/**
 * Content Summary Generation Utilities
 *
 * Extracts meaningful text snippets from MDX content for use in content cards.
 * Handles frontmatter-first approach with intelligent content-based fallbacks.
 */

import type { CollectionEntry } from 'astro:content'

type ContentEntry =
  CollectionEntry<'articles'> | CollectionEntry<'notes'> | CollectionEntry<'projects'>

/**
 * Generate a summary for a content entry
 *
 * Priority order:
 * 1. Use frontmatter description if present
 * 2. Extract and clean content from body
 * 3. Truncate intelligently at sentence boundaries
 */
export function generateSummary(entry: ContentEntry, maxLength: number = 200): string {
  // 1. Check frontmatter description first (projects have no description field)
  const description = 'description' in entry.data ? entry.data.description : undefined
  if (description && description.trim()) {
    return truncateAtSentence(description.trim(), maxLength)
  }

  // 2. Extract from content body
  try {
    if (entry.body) {
      const cleanText = stripMDXElements(stripLeadingEsm(entry.body))
      const firstParagraph = extractFirstMeaningfulParagraph(cleanText)

      if (firstParagraph) {
        return truncateAtSentence(firstParagraph, maxLength)
      }
    }
  } catch (error) {
    console.warn(`Failed to generate summary for ${entry.id}:`, error)
  }

  // 3. Fallback to title-based summary
  return `${entry.data.title}...`
}

/**
 * Drop leading MDX ESM statement blocks (`import` / `export`) from a raw body.
 *
 * These always sit at the top of the file, ahead of any prose. A single
 * statement can span many lines (an `export` object literal, say) and may even
 * contain blank lines, so we walk line by line — tracking bracket depth to stay
 * inside a multi-line statement — and stop at the first line of prose, even
 * when no blank line separates it from the ESM above.
 */
export function stripLeadingEsm(content: string): string {
  if (!content) return ''

  const lines = content.split('\n')
  let i = 0
  let depth = 0

  while (i < lines.length) {
    const line = lines[i]

    if (depth > 0) {
      // Continuation of a multi-line import/export statement.
      depth += bracketDelta(line)
      i++
    } else if (line.trim() === '') {
      // Leading blank line, before or between ESM statements.
      i++
    } else if (/^(?:import|export)\b/.test(line)) {
      depth += bracketDelta(line)
      i++
    } else {
      break // first line of prose
    }
  }

  return lines.slice(i).join('\n').trim()
}

/**
 * Net unclosed brackets (`{[(` minus `}])`) on a line, used to stay inside a
 * multi-line ESM statement. A heuristic, not a JS parser — brackets inside
 * strings would miscount, but import/export headers don't carry those.
 */
function bracketDelta(line: string): number {
  let delta = 0
  for (const ch of line) {
    if (ch === '{' || ch === '[' || ch === '(') delta++
    else if (ch === '}' || ch === ']' || ch === ')') delta--
  }
  return delta
}

/**
 * Strip MDX-specific elements and clean text for summary generation
 */
export function stripMDXElements(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  return (
    content
      // Remove frontmatter (everything between --- lines)
      .replace(/^---[\s\S]*?---\n?/m, '')

      // Remove import statements (including multiline)
      .replace(/^import\s+[\s\S]*?from\s+.*?;?\s*$/gm, '')
      .replace(/^import\s*\{[\s\S]*?\}\s*from\s+.*?;?\s*$/gm, '')

      // Remove MDX component usage (simple heuristic)
      .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '')
      .replace(/<[A-Z][^>]*\/>/g, '')

      // Remove code blocks (fenced)
      .replace(/```[\s\S]*?```/g, '')

      // Remove inline code
      .replace(/`[^`]+`/g, '')

      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')

      // Remove markdown images (must run BEFORE link regex, since ![alt](src)
      // would otherwise match the link pattern and leave a stray '!' behind)
      .replace(/!\[[^\]]*\]\([^)]+\)\s*/g, '')

      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')

      // Remove markdown emphasis markers but keep text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')

      // Remove markdown lists markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')

      // Remove blockquote markers
      .replace(/^>\s+/gm, '')

      // Clean up multiple whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Extract the first meaningful paragraph from cleaned text
 */
export function extractFirstMeaningfulParagraph(text: string): string {
  if (!text) return ''

  // Split into paragraphs and find the first substantial one
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  for (const paragraph of paragraphs) {
    // Skip very short paragraphs (likely headers or fragments)
    if (paragraph.length < 30) continue

    // Skip paragraphs that look like metadata or structure
    if (isStructuralContent(paragraph)) continue

    return paragraph
  }

  // If no good paragraph found, use the first non-empty one
  return paragraphs[0] || ''
}

/**
 * Check if content appears to be structural rather than prose
 */
function isStructuralContent(text: string): boolean {
  // Common structural patterns to avoid
  const structuralPatterns = [
    /^(table of contents|toc)/i,
    /^(introduction|intro)$/i,
    /^(summary|conclusion)$/i,
    /^(references|bibliography)/i,
    /^\d+\.\s*$/, // Just a number
    /^[A-Z\s]+$/, // All caps (likely a header)
  ]

  return structuralPatterns.some(pattern => pattern.test(text))
}

/**
 * Truncate text intelligently at sentence boundaries
 */
export function truncateAtSentence(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  // Try to find a good sentence boundary
  const truncated = text.substring(0, maxLength)

  // Look for sentence endings (., !, ?) followed by space or end
  // Find the last sentence ending within the truncated text
  let lastSentenceEnd = -1
  const sentencePattern = /[.!?](?=\s|$)/g
  let match

  while ((match = sentencePattern.exec(truncated)) !== null) {
    lastSentenceEnd = match.index
  }

  if (lastSentenceEnd > maxLength * 0.6) {
    // Good sentence boundary found, use it
    return text.substring(0, lastSentenceEnd + 1).trim()
  }

  // No good sentence boundary, try word boundary
  const wordBoundary = truncated.lastIndexOf(' ')

  if (wordBoundary > maxLength * 0.7) {
    return text.substring(0, wordBoundary).trim() + '...'
  }

  // Last resort: hard truncate with ellipsis
  return truncated.trim() + '...'
}

/**
 * Validate that a summary meets quality criteria
 */
export function validateSummary(summary: string): boolean {
  if (!summary || typeof summary !== 'string') return false

  // Must have some minimum length
  if (summary.length < 10) return false

  // Should not be just ellipsis or title
  if (summary === '...' || summary.match(/^.+\.\.\.$/)) return false

  return true
}

/**
 * Generate reading time estimate (optional utility)
 */
export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const cleanText = stripMDXElements(content)
  const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length

  return Math.ceil(wordCount / wordsPerMinute)
}
