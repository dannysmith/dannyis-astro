---
description: Create new notes and articles
allowed-tools: Bash, Write
---

# New Content Command

Creates new notes and articles with proper structure and frontmatter.

## Create New Note

When asked to create a new note:

- If given a title, run `pnpm run newnote "<title>"`
- If given a URL, run `pnpm run newnote "<url>"`
- If given a longer sentence, extract a suitable title and run the command
- Otherwise, run `pnpm run newnote "new-note"`

### Example

**Request:** "make new note about changing my desk setup" **Action:** `pnpm run newnote "New Desk Setup"`

## Create New Article

When asked to create a new article:

1. Choose appropriate title (or use "New Article" if not specified)
2. Create file: `src/content/articles/YYYY-MM-DD-slug.mdx`
3. Use today's date unless specified
4. Generate slug from title (kebab-case)

### Article Template

```yaml
---
title: <Title in Title Case>
pubDate: <YYYY-MM-DD>
slug: <title-as-kebab-case>
draft: true
description:
cover:
coverAlt:
---
import { BasicImage } from '@components/mdx'; import { Notion, Grid, BookmarkCard, Callout, Embed, Loom } from '@components/mdx';
```

### Example

**Request:** "new article about using LLMs to draw ducks" **File:** `src/content/articles/2025-01-15-drawing-ducks-with-llms.mdx` **Title:** "Drawing Ducks with LLMs" **Slug:** "drawing-ducks-with-llms"
