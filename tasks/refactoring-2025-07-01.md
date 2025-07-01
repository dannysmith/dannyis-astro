# Refactoring 2025-07-01

## Major Task List

- [x] 1 Change Blog Posts to Article everywhere
- [x] 2 Set all external links to target="\_blank"
- [x] 3 Reorganise components
- [x] 4 Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [x] 5 Upgrade Astro
- [x] 6 Sort out RSS feeds
- [ ] 7 Check sitemap, add analytics and google tag manager

## Task 6 - RSS Feed Implementation: ✅ COMPLETED

**Migration Summary:**
Successfully migrated from markdown-it + sanitize-html to Astro's Container API for full MDX component rendering in RSS feeds.

**Key Achievements:**

- ✅ All three RSS feeds now render full MDX components (`<Callout>`, `<BookmarkCard>`, `<Embed>`, `<Notion>`, etc.)
- ✅ No raw import statements in RSS output
- ✅ Proper HTML structure with semantic markup
- ✅ External links include `target="_blank" rel="noopener noreferrer"`
- ✅ Heading IDs and anchor links preserved
- ✅ Styleguide content correctly filtered out
- ✅ Draft content filtered in production
- ✅ Build performance maintained (44.57s vs 45.63s baseline)
- ✅ Old dependencies removed (markdown-it, sanitize-html, @types/markdown-it)
- ✅ Error handling implemented for failed renders

**Technical Implementation:**

- Used Astro's experimental Container API (v5.10.2)
- Container API renders MDX components to HTML at build time
- Maintains existing RSS structure and auto-discovery
- All three feeds: combined (`/rss.xml`), articles-only (`/rss/articles.xml`), notes-only (`/rss/notes.xml`)

**Performance Impact:**

- Minimal performance impact: 44.57s vs 45.63s baseline
- Container API rendering is efficient for static site generation
- No additional dependencies required

**Content Quality:**

- RSS readers now see rich, formatted content instead of raw markdown
- Custom components render as proper HTML with styling
- Consistent experience between website and RSS feeds
- Better user experience in RSS readers like Feedly, NetNewsWire, etc.

**Future Considerations:**

- Container API is experimental - monitor Astro releases for stability
- Consider performance optimizations if build times increase significantly
- RSS feed styling may need adjustments for different RSS readers
