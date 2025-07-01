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

Done.

## Task 3 - Reorganise components

### Current State Analysis

**Current Flat Structure:**
```
src/components/
├── BaseHead.astro
├── BookmarkCard.astro  
├── Callout.astro
├── Embed.astro
├── FormattedDate.astro
├── Footer.astro
├── Grid.astro
├── Lightbox.astro
├── Loom.astro
├── MainNavigation.astro
├── NavLink.astro
├── NoteCard.astro
├── Notion.astro
├── Pill.astro
├── Spinner.astro
├── ThemeToggle.astro
├── components.ts (exports MDX components)
└── icons/
    ├── InstagramIcon.astro
    ├── LinkedInIcon.astro
    ├── NotionIcon.astro
    ├── RSSIcon.astro
    └── YouTubeIcon.astro
```

**Component Usage Patterns:**
- **Layout Components**: BaseHead, MainNavigation, Footer (used in all layouts), NoteCard (Note-specific wrapper), Lightbox (Article-specific functionality)
- **Navigation Components**: NavLink, ThemeToggle (used within MainNavigation)
- **UI Utilities**: FormattedDate, Pill, Spinner (small reusable components)
- **MDX Components**: Notion, Grid, Callout, BookmarkCard, Embed, Loom (exported via components.ts)
- **Icons**: All contained in icons/ subdirectory

### Proposed Organization Structure

Based on Astro best practices and component usage analysis, reorganize into:

```
src/components/
├── layout/           # Layout and structural components
│   ├── BaseHead.astro
│   ├── Footer.astro
│   ├── MainNavigation.astro
│   ├── NoteCard.astro    # Note layout-specific wrapper
│   └── Lightbox.astro   # Article layout-specific functionality
├── navigation/       # Navigation-specific components  
│   ├── NavLink.astro
│   └── ThemeToggle.astro
├── ui/              # Small, reusable UI utilities and atoms
│   ├── FormattedDate.astro
│   ├── Pill.astro
│   └── Spinner.astro
├── mdx/             # Components available in MDX content
│   ├── BookmarkCard.astro
│   ├── Callout.astro
│   ├── Embed.astro
│   ├── Grid.astro
│   ├── Loom.astro
│   ├── Notion.astro
│   └── index.ts     # Renamed from components.ts
├── icons/           # Icon components (unchanged)
│   ├── InstagramIcon.astro
│   ├── LinkedInIcon.astro
│   ├── NotionIcon.astro
│   ├── RSSIcon.astro
│   └── YouTubeIcon.astro
└── index.ts         # Main components export (new)
```

### Reorganization Benefits

1. **Clear Categorization**: Components grouped by purpose/context
2. **Scalable Structure**: Easy to add new components to appropriate categories
3. **Import Clarity**: Developers know where to find specific component types
4. **MDX Separation**: Content components clearly separated from layout components
5. **Future-Proof**: Structure supports growth of component library
6. **Astro Aligned**: Follows Astro community patterns for component organization

### Implementation Plan

**Phase 1: Create New Directory Structure**
1. Create new subdirectories: `layout/`, `navigation/`, `ui/`, `mdx/`
2. Keep `icons/` directory unchanged (already well-organized)

**Phase 2: Move Components to New Locations**
1. **layout/**: BaseHead.astro, Footer.astro, MainNavigation.astro, NoteCard.astro, Lightbox.astro
2. **navigation/**: NavLink.astro, ThemeToggle.astro  
3. **ui/**: FormattedDate.astro, Pill.astro, Spinner.astro
4. **mdx/**: BookmarkCard.astro, Callout.astro, Embed.astro, Grid.astro, Loom.astro, Notion.astro

**Phase 3: Update Import Statements**  
1. Update tsconfig.json paths for better organization
2. Update all component imports across the codebase
3. Create barrel exports (index.ts files) for each category
4. Update MDX component exports (components.ts → mdx/index.ts)

**Phase 4: Enhance Path Aliases**
1. Add category-specific aliases to tsconfig.json:
   ```json
   {
     "paths": {
       "@components/*": ["src/components/*"],
       "@components/layout/*": ["src/components/layout/*"],
       "@components/navigation/*": ["src/components/navigation/*"],
       "@components/mdx/*": ["src/components/mdx/*"],
       "@components/ui/*": ["src/components/ui/*"],
       "@layouts/*": ["src/layouts/*"],
       "@assets/*": ["src/assets/*"]
     }
   }
   ```

**Phase 5: Create Barrel Exports**
1. **src/components/index.ts**: Main export file for all components
2. **src/components/mdx/index.ts**: Renamed from components.ts with same exports  
3. **src/components/layout/index.ts**: Layout component exports
4. **src/components/navigation/index.ts**: Navigation component exports
5. **src/components/ui/index.ts**: UI utility component exports

**Phase 6: Verification**
1. Test all pages build successfully
2. Verify MDX components work in content files
3. Run linting and type checking
4. Test development server functionality

### File Changes Required

**Files to Update (Import Statements):**
- `/src/layouts/Article.astro` (9 components)
- `/src/layouts/Note.astro` (4 components)  
- `/src/pages/index.astro` (2 components)
- `/src/pages/styleguide.astro` (12 components)
- `/src/pages/writing/index.astro` (4 components)
- `/src/pages/notes/index.astro` (4 components)
- `/src/components/MainNavigation.astro` (2 components)
- `/src/components/Footer.astro` (4 icon components)
- `/src/components/NoteCard.astro` (3 components)
- `/src/components/Embed.astro` (2 components)

**New Files to Create:**
- `/src/components/index.ts` (main barrel export)
- `/src/components/layout/index.ts`
- `/src/components/navigation/index.ts`  
- `/src/components/ui/index.ts`
- `/src/components/mdx/index.ts` (renamed from components.ts)

**Configuration Updates:**
- `tsconfig.json` - Enhanced path aliases
- Update CLAUDE.md and cursor rules if needed

### Risk Assessment

**Low Risk Changes:**
- Moving icon components (self-contained)
- Moving UI atoms (simple components)
- Creating barrel exports

**Medium Risk Changes:**  
- Moving layout components (widely used)
- Updating import paths across codebase
- Renaming components.ts to mdx/index.ts

**Mitigation Strategy:**
- Implement changes incrementally with testing at each step
- Use IDE find/replace for systematic import updates
- Maintain backward compatibility during transition
- Test build process after each phase
