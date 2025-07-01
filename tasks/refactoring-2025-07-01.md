# Refactoring 2025-07-01

## Major Task List

- [x] 1 Change Blog Posts to Article everywhere
- [x] 2 Set all external links to target="\_blank"
- [x] 3 Reorganise components
- [x] 4 Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [x] 5 Upgrade Astro
- [x] 6 Sort out RSS feeds
- [ ] 7 Check sitemap, add analytics and google tag manager

## Task 6 - RSS Feed Implementation Plan

### Overview

Create three separate RSS feeds with auto-discovery:

- `/rss.xml` - Combined feed (articles + notes)
- `/rss/articles.xml` - Articles only
- `/rss/notes.xml` - Notes only

### Implementation Steps

#### Step 1: Create RSS Feed Files

**1.1 Create `/src/pages/rss/articles.xml.js`**

```javascript
import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => {
    return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
  });

  const items = await Promise.all(
    articles.map(async article => {
      const { Content } = await render(article);
      let content = '';

      // Handle MDX content
      if (article.body) {
        content = sanitizeHtml(parser.render(article.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        });
      }

      return {
        ...article.data,
        link: `/writing/${article.id}/`,
        content,
      };
    })
  );

  return rss({
    title: `${SITE_TITLE} - Articles`,
    description: `Articles from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
```

**1.2 Create `/src/pages/rss/notes.xml.js`**

```javascript
import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const notes = await getCollection('notes', ({ data }) => !data.styleguide);

  const items = await Promise.all(
    notes.map(async note => {
      const { Content } = await render(note);
      let content = '';

      // Handle MDX content
      if (note.body) {
        content = sanitizeHtml(parser.render(note.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        });
      }

      return {
        ...note.data,
        link: `/notes/${note.id}/`,
        content,
      };
    })
  );

  return rss({
    title: `${SITE_TITLE} - Notes`,
    description: `Notes from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
```

**1.3 Create `/src/pages/rss.xml.js` (combined feed)**

```javascript
import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const articles = (
    await getCollection('articles', ({ data }) => {
      return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
    })
  ).map(post => ({ ...post, type: 'article' }));

  const notes = (await getCollection('notes', ({ data }) => !data.styleguide)).map(note => ({
    ...note,
    type: 'note',
  }));

  let all = articles.concat(notes);
  all.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  const items = await Promise.all(
    all.map(async item => {
      const { Content } = await render(item);
      let content = '';

      // Handle MDX content
      if (item.body) {
        content = sanitizeHtml(parser.render(item.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        });
      }

      return {
        ...item.data,
        link: item.type === 'note' ? `/notes/${item.id}/` : `/writing/${item.id}/`,
        content,
      };
    })
  );

  return rss({
    title: `${SITE_TITLE} - Articles & Notes`,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
```

#### Step 2: Add RSS Auto-Discovery Links

**2.1 Update `/src/components/layout/BaseHead.astro`**
Add these link tags in the `<head>` section:

```html
<!-- RSS Auto-Discovery -->
<link
  rel="alternate"
  type="application/rss+xml"
  title="Danny Smith - Articles & Notes"
  href="/rss.xml"
/>
<link
  rel="alternate"
  type="application/rss+xml"
  title="Danny Smith - Articles"
  href="/rss/articles.xml"
/>
<link
  rel="alternate"
  type="application/rss+xml"
  title="Danny Smith - Notes"
  href="/rss/notes.xml"
/>
```

#### Step 3: Add RSS Icon Component

**3.1 Create `/src/components/icons/RSSIcon.astro`**

```astro
---
export interface Props {
  className?: string;
}
const { className = '' } = Astro.props;
---

<svg
  class={className}
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 11a9 9 0 0 1 9 9" />
  <path d="M4 4a16 16 0 0 1 16 16" />
  <circle cx="5" cy="19" r="1" />
</svg>
```

**3.2 Update `/src/components/icons/index.ts`**

```typescript
export { default as RSSIcon } from './RSSIcon.astro';
```

#### Step 4: Update Footer with RSS Links

**4.1 Update `/src/components/layout/Footer.astro`**
Add RSS subscription section to the footer:

```astro
<!-- Add this section to the footer -->
<div class="rss-subscription">
  <h3>Subscribe via RSS</h3>
  <div class="rss-links">
    <a href="/rss.xml" class="rss-link">
      <RSSIcon />
      <span>All Content</span>
    </a>
    <a href="/rss/articles.xml" class="rss-link">
      <RSSIcon />
      <span>Articles Only</span>
    </a>
    <a href="/rss/notes.xml" class="rss-link">
      <RSSIcon />
      <span>Notes Only</span>
    </a>
  </div>
</div>
```

Add corresponding styles:

```css
.rss-subscription {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.rss-subscription h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.rss-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.rss-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  text-decoration: none;
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.rss-link:hover {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.rss-link svg {
  width: 1rem;
  height: 1rem;
}
```

#### Step 5: Remove Old RSS File

**5.1 Delete `/src/pages/rss.xml.js`**
Remove the old combined RSS file after confirming new feeds work.

#### Step 6: Test and Validate

**6.1 Test RSS Feeds**

- Visit `/rss.xml` - should show combined feed
- Visit `/rss/articles.xml` - should show articles only
- Visit `/rss/notes.xml` - should show notes only

**6.2 Validate RSS**

- Use online RSS validators
- Test in RSS readers (Feedly, NetNewsWire, etc.)
- Check auto-discovery in browsers

**6.3 Test Auto-Discovery**

- Check browser RSS detection
- Verify feed links work in RSS readers

### Success Criteria

- [ ] Three working RSS feeds at `/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`
- [ ] Full content rendering with proper HTML
- [ ] Auto-discovery working in browsers
- [ ] RSS links in footer with proper styling
- [ ] All feeds validate without errors
- [ ] Old RSS file removed
- [ ] All feeds work in popular RSS readers
