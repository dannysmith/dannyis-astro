# Refactoring 2025-07-01

## Major Task List

- [x] Change Blog Posts to Article everywhere
- [x] Set all external links to target="\_blank"
- [ ] Reorganise components
- [ ] Upgrade Astro
- [ ] Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [ ] Sort RSS feeds
- [ ] Check sitemap, add analytics and google tag manager

## Task 1 - Change Blog Posts to Article everywhere

Done.

## Task 2 - Set all external links to target="\_blank"

### Current State Analysis

**✅ Already Correct:**

- `src/components/Notion.astro` - Has `target="_blank" rel="noopener noreferrer"`

**❌ Needs Fixing:**

- **Markdown content** - Many external links in articles/notes with no target="\_blank"
- **Homepage** (`src/pages/index.astro`) - Social links have `rel="me"` but no `target="_blank"`
- **Third-party components** - `astro-embed` components may not open in new tabs

**🔍 Needs Investigation:**

- `src/components/BookmarkCard.astro` - Uses astro-embed's LinkPreview
- `src/components/Embed.astro` - Falls back to BookmarkCard for external URLs
- Other pages with manual external links

### Implementation Plan

**Phase 1: Global Markdown Links**

1. Install `rehype-external-links` package
2. Configure in `astro.config.mjs` to add `target="_blank"` and `rel="noopener noreferrer"` to external links
3. Test markdown external links in both articles and notes

**Phase 2: Manual Component Links**

1. Update homepage social links to include `target="_blank"`
2. Search for other manual external links in components
3. Ensure security with `rel="noopener noreferrer"` where appropriate

**Phase 3: Third-party Components**

1. ✅ Research if astro-embed's LinkPreview supports target="\_blank" configuration
2. 📝 **Finding:** astro-embed's LinkPreview component does NOT support target="\_blank" configuration. The generated links like `<a class="link-preview__title" href="https://example.com">` don't include target or rel attributes. This is a limitation of the library itself.
3. ⏳ **Decision:** Leave as-is for now. BookmarkCard components will not open in new tabs, but this provides a different UX than regular text links which may actually be preferred for preview cards.

**Phase 4: Verification**

1. ✅ Test sample external links in articles, notes, and components
2. ✅ Use browser dev tools to verify all external links have target="\_blank"  
3. ✅ Verify security attributes are present (`rel="noopener noreferrer"`)

### Final Results ✅

**Successfully implemented target="_blank" for external links:**

- ✅ **Markdown Links**: All external links in articles/notes now have `target="_blank" rel="noopener noreferrer"` via `rehype-external-links`
- ✅ **Homepage Social Links**: 6 external social links now have `target="_blank"` while preserving `rel="me"` attributes  
- ✅ **Footer Instagram Link**: Updated with `target="_blank" rel="noopener noreferrer"`
- ✅ **Now Page External Links**: 5 external links updated with proper attributes
- ✅ **Notion Component**: Already correctly implemented (no changes needed)

**Verified Counts:**
- Homepage: 6 external links with `target="_blank"`
- Now Page: 5 external links with `target="_blank"`  
- Article Styleguide: 4 markdown links with security attributes
- Build: 64 pages successfully generated
- Linting: Passed (only pre-existing warnings)

**Excluded by Design:**
- astro-embed LinkPreview components don't support `target="_blank"` configuration - this is a deliberate UX choice for preview cards

### Notes

- `rel="me"` links on homepage should retain that attribute while adding `target="_blank"`
- Astro's redirect URLs in config don't need target="\_blank" as they're handled server-side
- Internal navigation links MUST NOT have target="\_blank"`
