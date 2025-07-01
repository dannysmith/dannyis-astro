# Refactoring 2025-07-01

## Major Task List

- [x] 1 Change Blog Posts to Article everywhere
- [x] 2 Set all external links to target="\_blank"
- [x] 3 Reorganise components
- [x] 4 Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [x] 5 Upgrade Astro
- [x] 6 Sort out RSS feeds
- [ ] 7 Check sitemap, add analytics and google tag manager

## Task 6 - RSS Feed Implementation Plan: Switching to Astro's Container API

### Current State Analysis

**Current Implementation:**

- Uses `markdown-it` + `sanitize-html` for content rendering
- Only renders markdown content, not MDX components
- Missing custom components like `<Callout>`, `<BookmarkCard>`, `<Embed>`, etc.
- Content appears as raw markdown in RSS readers

**Issues with Current Approach:**

- MDX components (`<Callout>`, `<BookmarkCard>`, `<Embed>`, `<Notion>`, etc.) are not rendered
- Import statements remain in RSS output
- Poor user experience in RSS readers
- Inconsistent with site's rich content experience

### Migration to Astro Container API

**Benefits:**

- Full MDX component rendering (Callout, BookmarkCard, Embed, etc.)
- Proper HTML output for RSS readers
- Consistent content experience across site and RSS
- Future-proof approach using Astro's recommended patterns

**Technical Approach:**

- Use Astro's experimental Container API (introduced in v4.9)
- Render MDX content to HTML using `container.renderToString(Content)`
- Maintain existing RSS structure and auto-discovery
- Keep all three feeds: combined, articles-only, notes-only

### Implementation Plan

#### Step 1: Update Dependencies

**1.1 Verify Astro Version**

- Current: Astro 5.10.2 ✅ (supports Container API)
- No version upgrade needed

**1.2 Add Container API Dependencies**

```bash
# No additional dependencies needed - Container API is built into Astro 5.x
# @astrojs/mdx is already installed (v4.3.0)
```

#### Step 2: Update RSS Feed Files

**2.1 Update `/src/pages/rss.xml.js` (Combined Feed)**

```javascript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  // Get articles and notes with filtering
  const articles = (
    await getCollection('articles', ({ data }) => {
      return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
    })
  ).map(post => ({ ...post, type: 'article' }));

  const notes = (await getCollection('notes', ({ data }) => !data.styleguide)).map(note => ({
    ...note,
    type: 'note',
  }));

  // Combine and sort by publication date
  let all = articles.concat(notes);
  all.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  // Process items with full MDX rendering
  const items = [];
  for (const item of all) {
    const { Content } = await render(item);
    const content = await container.renderToString(Content);

    items.push({
      ...item.data,
      link: item.type === 'note' ? `/notes/${item.id}/` : `/writing/${item.id}/`,
      content,
    });
  }

  return rss({
    title: `${SITE_TITLE} - Articles & Notes`,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
```

**2.2 Update `/src/pages/rss/articles.xml.js` (Articles Only)**

```javascript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const articles = await getCollection('articles', ({ data }) => {
    return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
  });

  // Process articles with full MDX rendering
  const items = [];
  for (const article of articles) {
    const { Content } = await render(article);
    const content = await container.renderToString(Content);

    items.push({
      ...article.data,
      link: `/writing/${article.id}/`,
      content,
    });
  }

  return rss({
    title: `${SITE_TITLE} - Articles`,
    description: `Articles from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
```

**2.3 Update `/src/pages/rss/notes.xml.js` (Notes Only)**

```javascript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const notes = await getCollection('notes', ({ data }) => !data.styleguide);

  // Process notes with full MDX rendering
  const items = [];
  for (const note of notes) {
    const { Content } = await render(note);
    const content = await container.renderToString(Content);

    items.push({
      ...note.data,
      link: `/notes/${note.id}/`,
      content,
    });
  }

  return rss({
    title: `${SITE_TITLE} - Notes`,
    description: `Notes from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
```

#### Step 3: Remove Old Dependencies

**3.1 Remove Unused Packages**

```bash
npm uninstall markdown-it sanitize-html
npm uninstall @types/markdown-it
```

**3.2 Update package.json**

- Remove `markdown-it`, `sanitize-html`, and `@types/markdown-it` from dependencies
- Keep `@astrojs/rss` and `@astrojs/mdx` (already installed)

#### Step 4: Testing and Validation

**4.1 Local Testing**

```bash
npm run build
npm run preview
```

**4.2 RSS Feed Validation**

- Visit `/rss.xml` - should show combined feed with full HTML content
- Visit `/rss/articles.xml` - should show articles with rendered components
- Visit `/rss/notes.xml` - should show notes with rendered components
- Test in RSS readers (Feedly, NetNewsWire, etc.)

**4.3 Component Rendering Verification**

- Check that `<Callout>` components render as styled HTML
- Verify `<BookmarkCard>` components render as link previews
- Confirm `<Embed>` components render as appropriate embeds
- Test `<Notion>` components render as links with titles

**4.4 Content Quality Checks**

- No raw import statements in RSS output
- Proper HTML structure and formatting
- Images and links work correctly
- Code blocks and syntax highlighting preserved

#### Step 4: Comprehensive Testing Strategy

**4.1 Pre-Implementation Baseline**

```bash
# Measure current build performance
time npm run build

# Test current RSS feeds
curl -s http://localhost:4321/rss.xml | head -20
curl -s http://localhost:4321/rss/articles.xml | head -20
curl -s http://localhost:4321/rss/notes.xml | head -20

# Validate current feeds
npm install -g rss-validator
rss-validator http://localhost:4321/rss.xml
```

**4.2 Post-Implementation Testing**

```bash
# Build and preview
npm run build
npm run preview

# Test RSS feed generation
curl -s http://localhost:4321/rss.xml > /tmp/combined-feed.xml
curl -s http://localhost:4321/rss/articles.xml > /tmp/articles-feed.xml
curl -s http://localhost:4321/rss/notes.xml > /tmp/notes-feed.xml

# Validate feeds
rss-validator /tmp/combined-feed.xml
rss-validator /tmp/articles-feed.xml
rss-validator /tmp/notes-feed.xml
```

**4.3 Component-Specific Testing**

- **Callout Components**: Check that styled boxes render with proper colors and icons
- **BookmarkCard Components**: Verify link previews show title, description, and image
- **Embed Components**: Test YouTube, Twitter, Vimeo, Loom embeds render correctly
- **Notion Components**: Confirm Notion links render with fetched titles
- **Grid Components**: Check that CSS Grid layouts render properly
- **Image Components**: Verify Astro Image components render with proper src/alt

**4.4 RSS Reader Testing**

- **Feedly**: Import feeds and check content rendering
- **NetNewsWire**: Test on macOS/iOS
- **Inoreader**: Web-based RSS reader testing
- **RSS.app**: Online RSS viewer
- **Browser RSS**: Check browser's built-in RSS handling

**4.5 Content Edge Cases**

- Articles with no custom components (pure markdown)
- Notes with only external links
- Content with complex nested components
- Articles with images and media
- Content with code blocks and syntax highlighting
- Articles with footnotes and references

**4.6 Performance Testing**

```bash
# Measure build time impact
time npm run build

# Check RSS file sizes
ls -la dist/rss*.xml

# Monitor memory usage during build
# (if build times are significantly slower)
```

**4.7 Error Scenario Testing**

- Test with intentionally broken MDX content
- Verify error handling works correctly
- Check that problematic items are skipped gracefully
- Ensure build doesn't fail completely on component errors

#### Step 5: Error Handling and Fallbacks

**5.1 Complete Error Handling Implementation**

```javascript
// Add to each RSS file with proper fallback
const items = [];
for (const item of all) {
  try {
    const { Content } = await render(item);
    const content = await container.renderToString(Content);

    items.push({
      ...item.data,
      link: item.type === 'note' ? `/notes/${item.id}/` : `/writing/${item.id}/`,
      content,
    });
  } catch (error) {
    console.warn(`Failed to render content for ${item.id}:`, error);
    // Fallback: skip the item or use basic markdown
    // Option 1: Skip problematic items
    continue;

    // Option 2: Use basic markdown fallback (if we keep markdown-it)
    // const basicContent = sanitizeHtml(parser.render(item.body || ''), {
    //   allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    // });
    // items.push({ ...item.data, link: ..., content: basicContent });
  }
}
```

**5.2 Fix Sorting Consistency**

```javascript
// Add to articles-only and notes-only feeds
const articles = await getCollection('articles', ({ data }) => {
  return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
});

// Sort by publication date (newest first)
articles.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
```

**5.3 Fix Notes Content Filtering**

```javascript
// Update notes collection to filter drafts in production
const notes = await getCollection('notes', ({ data }) => {
  return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
});
```

**5.4 CSS and Styling Considerations**

- Container API renders components with scoped styles
- RSS readers may strip CSS or not support it
- Consider adding global CSS variables to RSS output
- Test how styled components appear in various RSS readers
- May need to inline critical styles or use RSS-specific styling

**5.5 Component Import Handling**

- Container API should handle component imports automatically
- Test that all MDX components render correctly
- Verify that component props are passed correctly
- Check that dynamic content (like BookmarkCard URLs) works

**5.6 Performance Considerations**

- Container API rendering is slower than markdown-it
- Consider caching rendered content if build times become an issue
- Monitor build performance on Vercel

#### Step 6: Documentation Updates

**6.1 Update Component Guidelines**

- Document that MDX components now render in RSS feeds
- Update RSS feed documentation
- Note experimental nature of Container API

**6.2 Update Task Documentation**

- Mark RSS implementation as complete
- Document the migration approach for future reference

### Success Criteria

- [ ] All three RSS feeds generate with full MDX component rendering
- [ ] `<Callout>`, `<BookmarkCard>`, `<Embed>`, `<Notion>` components render as HTML
- [ ] No import statements or raw MDX syntax in RSS output
- [ ] RSS feeds validate without errors
- [ ] Build times remain acceptable (< 2x current build time)
- [ ] Old dependencies removed from package.json
- [ ] Error handling implemented for failed renders
- [ ] Documentation updated

### Rollback Plan

If Container API causes issues:

1. Revert to markdown-it approach
2. Reinstall removed dependencies
3. Document limitations for future consideration

### Future Considerations

- Monitor Astro Container API stability and updates
- Consider performance optimizations if needed
- Evaluate RSS feed styling options
- Plan for potential Container API breaking changes

### Implementation Notes

**Experimental Feature Warning:**

- Container API is experimental and may change
- Monitor Astro releases for breaking changes
- Consider pinning Astro version if stability becomes critical

**Performance Impact:**

- Container API rendering is more resource-intensive
- Monitor build times and Vercel deployment performance
- Consider implementing caching if needed

**Content Compatibility:**

- All existing MDX content should work without changes
- Custom components will now render in RSS feeds
- Test thoroughly with all content types
