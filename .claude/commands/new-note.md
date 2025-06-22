# New Note Command

Creates a new note with proper frontmatter and filename.

## Usage
```
/new-note [title or URL]
```

## Examples
```
/new-note
/new-note "Thoughts on AI coding"
/new-note https://example.com/interesting-article
```

## Implementation
1. If URL provided:
   - Fetch page title using WebFetch tool
   - Use title for filename and frontmatter
   - Set `sourceURL` in frontmatter
2. If title provided:
   - Use title for filename and frontmatter  
3. If no parameter:
   - Use "New Note" as default title

## Output Format
- **Filename**: `YYYY-MM-DD-kebab-case-title.md`
- **Location**: `src/content/notes/`
- **Frontmatter**: 
  ```yaml
  ---
  title: <title>
  pubDate: <today's date>
  slug: <kebab-case-slug>
  sourceURL: <if URL provided>
  tags: []
  ---
  ```

## Quality Checks
- Validate URL if provided
- Ensure unique filename
- Follow content.mdc specifications exactly