# Blog to Article Refactoring Plan

## Overview

This refactoring will replace all references to "blog" with "article" throughout the codebase while maintaining:

- All existing functionality
- All existing URLs and routes
- All existing content and metadata

## Scope Analysis

Based on codebase exploration, the following areas contain "blog" references:

### 1. Content Configuration (`src/content.config.ts`)

- Collection name: `blog` → `articles`
- Collection export: `{ blog, notes }` → `{ articles, notes }`

### 2. Layout Files

- **File**: `src/layouts/BlogPost.astro` → `src/layouts/Article.astro`
- **Props type**: `CollectionEntry<'blog'>` → `CollectionEntry<'articles'>`
- **CSS class**: `.blog-article` → `.article`

### 3. Page Files

- **Writing index** (`src/pages/writing/index.astro`):
  - `getCollection('blog')` → `getCollection('articles')`
- **Individual article** (`src/pages/writing/[...slug]/index.astro`):
  - `getCollection('blog')` → `getCollection('articles')`
  - `CollectionEntry<'blog'>` → `CollectionEntry<'articles'>`
  - Import: `BlogPost` → `Article`

### 4. RSS Feed (`src/pages/rss.xml.js`)

- `getCollection('blog')` → `getCollection('articles')`

### 5. OG Image Generation (`src/pages/writing/[...slug]/og-image.png.ts`)

- `getCollection('blog')` → `getCollection('articles')`

### 6. CSS Styles (`src/styles/global.css`)

- All instances of `.blog-article` → `.article` (59 occurrences)
- CSS comments referencing "blog" → "article"

### 7. Assets Directory

- `src/assets/blog/` → `src/assets/articles/`

### 8. Generated Files (will be auto-regenerated)

- `.astro/content.d.ts`
- `.astro/collections/blog.schema.json`
- `.astro/data-store.json`

### 9. Documentation Updates

- **CLAUDE.md**: Update references to "blog posts" and "blog collection"
- **.cursor/rules/content.mdc**: Update all `src/content/blog/` references and template examples
- **.cursor/rules/project-structure.mdc**: Update directory structure and layout references
- **.cursor/rules/design-and-brand-guidelines.mdc**: Change "blog posts" to "articles"
- **.cursor/rules/cursor-rules.mdc**: Update styleguide path reference
- **.cursor/rules/astro-guidelines.mdc**: Update content path reference

### 10. Content Directory

- **Rename**: `src/content/blog/` → `src/content/articles/`

## Implementation Steps

### Phase 1: Core Configuration

1. Rename content directory: `src/content/blog/` → `src/content/articles/`
2. Update content collection definition in `src/content.config.ts`
3. Rename layout file and update its internal references
4. Move assets directory from `blog` to `articles`

### Phase 2: Page Updates

5. Update all page files that use the collection
6. Update import statements for the renamed layout

### Phase 3: Styling

7. Update all CSS references in `src/styles/global.css`

### Phase 4: Documentation

8. Update CLAUDE.md references
9. Update all .cursor/rules/ documentation files
10. Update any content files with self-referential mentions

### Phase 5: Verification

11. Run build to ensure no TypeScript errors
12. Run lint and format checks
13. Test development server
14. Verify all pages load correctly
15. Check RSS feed and OG image generation

## Risk Assessment

- **Low Risk**: Collection name changes are handled by Astro's type system
- **Medium Risk**: CSS class changes need careful find/replace
- **Low Risk**: Asset directory rename is straightforward

## Rollback Plan

- All changes are tracked in git
- Can revert individual commits if issues arise
- No database or external dependencies affected

## Quality Assurance Checklist

- [ ] All TypeScript types compile correctly
- [ ] All pages render without errors
- [ ] CSS styling remains intact
- [ ] RSS feed generates correctly
- [ ] OG images generate correctly
- [ ] Development server runs without issues
- [ ] Production build succeeds
- [ ] All existing URLs still work
- [ ] No broken links or references

## Files to Modify

### Core Code Files
1. `src/content/blog/` → `src/content/articles/` (directory rename)
2. `src/content.config.ts`
3. `src/layouts/BlogPost.astro` → `src/layouts/Article.astro`
4. `src/pages/writing/index.astro`
5. `src/pages/writing/[...slug]/index.astro`
6. `src/pages/writing/[...slug]/og-image.png.ts`
7. `src/pages/rss.xml.js`
8. `src/styles/global.css`
9. `src/assets/blog/` → `src/assets/articles/`

### Documentation Files
10. `CLAUDE.md`
11. `.cursor/rules/content.mdc`
12. `.cursor/rules/project-structure.mdc`
13. `.cursor/rules/design-and-brand-guidelines.mdc`
14. `.cursor/rules/cursor-rules.mdc`
15. `.cursor/rules/astro-guidelines.mdc`

## Expected Outcome

- Zero functional changes to the website
- All URLs remain the same
- Clean, consistent terminology throughout codebase
- Improved semantic clarity (articles vs blog posts)
