# Task 4: Markdown View for Articles and Notes

## Overview

Add the ability for users to view the raw markdown version of any article or note by appending `.md` to the URL. Include convenient copy/view links at the bottom of each post.

## Research Findings

### Astro Content Collections API

- Collection entries have a `.body` property containing raw, uncompiled markdown/MDX
- Can create endpoints using `.ts` files with GET handlers
- Dynamic routes support patterns like `[...slug].md.ts`
- Sitemap integration automatically includes statically generated routes

### Implementation Approach

Use Astro's endpoint system to create parallel `.md` routes that return plain text versions of content.

## Implementation Steps

### 1. Create Markdown Endpoints

**File: `src/pages/writing/[...slug].md.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('articles', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;

  // Build markdown with title as H1
  let markdown = `# ${post.data.title}\n\n`;

  // Remove import statements only from the top of MDX files
  const lines = post.body.split('\n');
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip import statements and empty lines at the top
    if (trimmed.startsWith('import ') || trimmed === '') {
      contentStartIndex = i + 1;
    } else {
      // Hit actual content, stop stripping
      break;
    }
  }

  const bodyContent = lines.slice(contentStartIndex).join('\n');

  // Add cleaned body content (MDX components remain as-is)
  markdown += bodyContent;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
```

**File: `src/pages/notes/[...slug].md.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return notes.map(note => ({
    params: { slug: note.id },
    props: { note },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { note } = props;

  // Build markdown with title as H1
  let markdown = `# ${note.data.title}\n\n`;

  // Add source URL if present (notes-specific)
  if (note.data.sourceURL) {
    markdown += `${note.data.sourceURL}\n\n`;
  }

  // Remove import statements only from the top of MDX files
  const lines = note.body.split('\n');
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip import statements and empty lines at the top
    if (trimmed.startsWith('import ') || trimmed === '') {
      contentStartIndex = i + 1;
    } else {
      // Hit actual content, stop stripping
      break;
    }
  }

  const bodyContent = lines.slice(contentStartIndex).join('\n');

  // Add cleaned body content (MDX components remain as-is)
  markdown += bodyContent;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
```

**Key decisions:**

- Include title from frontmatter as H1 (not in original file)
- For notes: include sourceURL on its own line under title
- Strip out MDX import statements only from the top of the file (preserves import examples in code blocks)
- Leave MDX components as-is (e.g., `<Image src={...} />` will appear literally)
- Don't include pubDate or other frontmatter (keep it minimal)
- Use `text/plain` content type for maximum browser compatibility (displays inline)

### 2. Create MarkdownActions Component

**File: `src/components/ui/MarkdownActions.astro`**

```astro
---
interface Props {
  markdownUrl: string;
}

const { markdownUrl } = Astro.props;
---

<div class="markdown-actions">
  <a href="#" id="copy-markdown" data-url={markdownUrl}>copy</a>
  <span> / </span>
  <a href={markdownUrl} target="_blank">view</a>
  <span> as markdown</span>
</div>

<script>
  const copyLink = document.getElementById('copy-markdown');

  async function copyMarkdown(url: string) {
    try {
      const response = await fetch(url);
      const markdown = await response.text();
      await navigator.clipboard.writeText(markdown);

      showFlashNotification('page copied as markdown to clipboard');
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      alert('Failed to copy markdown to clipboard');
    }
  }

  function showFlashNotification(message: string) {
    // Create flash notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-red);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.25rem;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Handle copy link click
  if (copyLink) {
    copyLink.addEventListener('click', function(e) {
      e.preventDefault();
      const url = this.getAttribute('data-url');
      if (url) copyMarkdown(url);
    });
  }
</script>

<style>
  .markdown-actions {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .markdown-actions a {
    color: var(--color-text);
    text-decoration: underline;
  }

  .markdown-actions a:hover {
    color: var(--color-red);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
</style>
```

**Implementation notes:**

- Uses data attribute to pass URL to script
- Includes inline animations for flash notification
- Minimal styling that respects design system
- Opens "view" link in new tab for convenience

### 3. Integrate Component into Layouts

**File: `src/layouts/Article.astro`**

Add import at top:

```astro
import MarkdownActions from '@components/ui/MarkdownActions.astro';
```

Add component after the `</article>` closing tag but before `<Footer />`:

```astro
<MarkdownActions markdownUrl={`${Astro.url.pathname.replace(/\/$/, '')}.md`} />
```

**Note:** The `.replace(/\/$/, '')` removes any trailing slash to ensure clean `.md` URLs.

**File: `src/layouts/Note.astro`**
Same integration as Article.astro

### 4. Update Barrel Exports

**File: `src/components/ui/index.ts`**
Add:

```typescript
export { default as MarkdownActions } from './MarkdownActions.astro';
```

### 5. Test Sitemap Integration

After building:

1. Check `dist/sitemap-0.xml` for `.md` URLs
2. If not included, investigate sitemap configuration
3. May need to add explicit `customPages` configuration if automatic detection doesn't work

**Expected behavior:**

- Sitemap should automatically include `.md` endpoints since they're statically generated via getStaticPaths
- No additional configuration should be needed

**Fallback plan if needed:**
If `.md` URLs aren't automatically included, update `astro.config.mjs`:

```javascript
sitemap({
  customPages: [
    // Generate .md URLs programmatically
  ],
});
```

## Testing Checklist

- [ ] Article markdown view shows title as H1
- [ ] Article markdown includes MDX components as plain text
- [ ] Note markdown view shows title as H1
- [ ] Note markdown includes sourceURL when present
- [ ] Note markdown works without sourceURL
- [ ] Copy button successfully copies markdown to clipboard
- [ ] Flash notification appears and disappears
- [ ] View link opens markdown in new tab
- [ ] Markdown renders correctly in browser
- [ ] Draft articles/notes don't generate .md endpoints in production
- [ ] .md URLs appear in sitemap
- [ ] Component styling matches design system
- [ ] Works on mobile browsers
- [ ] Clipboard API gracefully handles errors

## Design Considerations

### Styling

- Keep minimal and unobtrusive
- Use existing CSS variables
- Match typography of rest of site
- Flash notification uses --color-red for brand consistency

### User Experience

- Copy provides immediate feedback via notification
- View opens in new tab to preserve reading context
- Links are clearly actionable
- Error handling for clipboard API failures

### Content Fidelity

- Title from frontmatter included (not in original file)
- Source URLs for notes preserved
- MDX components shown as-is (user can see the code)
- No processing or prettification of markdown

## Edge Cases to Handle

1. **Missing clipboard API** (older browsers)
   - Fallback to alert with error message
   - Consider feature detection and hiding copy link

2. **Very large files**
   - Should work fine; browser handles streaming
   - Test with longest article

3. **Special characters in markdown**
   - UTF-8 encoding should handle all cases
   - Test with emojis, code blocks, math notation

4. **Draft content in development**
   - Endpoints should respect draft filter
   - Test both dev and production builds

5. **MDX components in output**
   - MDX components will appear as JSX in the markdown (e.g., `<Image src={...} />`)
   - This is intentional - shows the structure while keeping it readable
   - Only top-of-file import statements are stripped (preserves import examples in code)

6. **Code examples with imports**
   - Import statements appearing in code blocks or later in articles are preserved
   - Only strips imports from the very beginning of the file (before actual content)

## Future Enhancements (Not in Scope)

- Download button to save .md file locally
- Syntax highlighting for code blocks in view
- "Copy with frontmatter" option to include YAML
- RSS feed for markdown versions

## Success Criteria

- All articles and notes have working .md URLs
- Copy functionality works across modern browsers
- Flash notifications provide clear feedback
- Sitemap includes all .md URLs
- No JavaScript errors in console
- Design matches site aesthetic
- Code passes `pnpm run check`
