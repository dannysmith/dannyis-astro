# Publish Check Command

Runs comprehensive pre-publishing validation for articles or notes.

## Usage

```
/publish-check <article|note> [filename]
```

## Examples

```
/publish-check article
/publish-check note 2024-06-22-my-latest-note.md
/publish-check article src/content/articles/2024-06-22-ai-coding.mdx
```

## Implementation

### For Articles

1. Run "check article" validation:
   - First paragraph length (drop-cap compatibility)
   - Heading hierarchy (no skipped levels)
   - Markdown formatting
   - Component formatting per component-guidelines.mdc
   - Spelling and grammar
   - Acronyms in `<abbr>` tags
   - Final paragraph is proper sentence
   - Code blocks have language defined

2. SEO review:
   - Title optimization
   - Description under 160 characters
   - Keyword inclusion
   - Internal linking opportunities

3. Technical checks:
   - Title/slug/filename alignment
   - Date consistency (filename vs pubDate)
   - Image paths and imports
   - Remove unused component imports
   - Set `draft: false`
   - External links have proper attributes

### For Notes

1. Basic validation:
   - Markdown formatting
   - Component formatting
   - Spelling and grammar
   - Image paths and imports
   - Remove unused imports
   - Title/slug/filename alignment
   - Date consistency
   - SourceURL formatting (if present)
   - External link attributes

## Output

- ✅/❌ Checklist with specific issues found
- Suggested improvements
- Ready/not ready for publication status
