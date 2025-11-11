# Outstanding Codebase Issues

Issues requiring attention. These are not critical bugs but inconsistencies and technical debt that should be addressed. Last reviewed: 2025-11-11.

## Critical Issues

### 1. Icon Directory Ghost Dependency

**Problem:** TypeScript config and component barrel exports reference a non-existent directory.

**Files affected:**

- `tsconfig.json` - Line ~17-18: Alias points to `src/components/icons/index.ts`
- `src/components/index.ts` - Lines ~5-10: Exports from `./icons/` directory

**Current state:**

```typescript
// tsconfig.json
"@components/icons": ["src/components/icons/index.ts"],
"@components/icons/*": ["src/components/icons/*"],

// src/components/index.ts
export { default as InstagramIcon } from './icons/InstagramIcon.astro';
export { default as LinkedInIcon } from './icons/LinkedInIcon.astro';
export { default as NotionIcon } from './icons/NotionIcon.astro';
export { default as RSSIcon } from './icons/RSSIcon.astro';
export { default as YouTubeIcon } from './icons/YouTubeIcon.astro';
```

**Issue:** The `/src/components/icons/` directory **does not exist**. Nothing currently imports these icons, so it doesn't break the build, but it's a landmine for future development.

**Recommended fix:**

- **Option A:** Create the missing directory and icon components
- **Option B:** Remove the exports and TypeScript aliases
- **Option C:** Document that icons are intentionally not implemented yet

---

### 2. MDX Typography Components Missing from Barrel Exports

**Problem:** Typography components exist but aren't exported from `src/components/mdx/index.ts`.

**Missing exports:**

- `Center.astro`
- `typography/Title1.astro`
- `typography/Title2.astro`
- `typography/Title3.astro`
- `typography/Title4.astro`
- `typography/SmallCaps.astro`
- `typography/highlight.astro`

**Current state:** These components exist in `src/components/mdx/` and `src/components/mdx/typography/` but are not in the barrel export file.

**Impact:**

- Can't import via `import { Title1 } from '@components/mdx'`
- Must use direct imports: `import Title1 from '@components/mdx/typography/Title1.astro'`
- Inconsistent with other MDX components

**Recommended fix:** Add these components to `src/components/mdx/index.ts`:

```typescript
export { default as Center } from './Center.astro';
export { default as Title1 } from './typography/Title1.astro';
export { default as Title2 } from './typography/Title2.astro';
export { default as Title3 } from './typography/Title3.astro';
export { default as Title4 } from './typography/Title4.astro';
export { default as SmallCaps } from './typography/SmallCaps.astro';
export { default as highlight } from './typography/highlight.astro';
```

---

## Medium Priority Issues

### 3. Content Filtering Logic Duplicated Across 5+ Files

**Problem:** The same draft/styleguide filtering logic is copy-pasted in multiple files.

**Affected files:**

- `src/pages/rss.xml.js`
- `src/pages/rss/articles.xml.js`
- `src/pages/rss/notes.xml.js`
- `src/pages/writing/[...slug].md.ts`
- `src/pages/notes/[...slug].md.ts`
- Various index pages

**Current state:**

- Tests exist in `tests/unit/content-filter.test.ts` documenting the expected behavior
- No utility function has been created yet - logic is still duplicated across files

**Recommended fix:** Create `src/utils/content.ts` with reusable filter functions:

```typescript
export function filterContentForPage<T extends { data: { draft?: boolean; styleguide?: boolean } }>(entries: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  return isProduction ? entries.filter(entry => entry.data.draft !== true) : entries;
}

export function filterContentForListing<T extends { data: { draft?: boolean; styleguide?: boolean } }>(entries: T[], isProduction: boolean = import.meta.env.PROD): T[] {
  const draftFilter = isProduction ? entry => entry.data.draft !== true : () => true;
  return entries.filter(entry => draftFilter(entry) && !entry.data.styleguide);
}
```

---

### 4. SEO Configuration Split Across Two Files

**Problem:** Site configuration is split between two files.

**Current state:**

- `src/config/seo.ts` - Comprehensive SEO config (author, organization, social, titles, schema)
- `src/consts.ts` - Still has `SITE_TITLE` and `SITE_DESCRIPTION`

**Impact:**

- Most branding is centralized in seo.ts (good)
- But core site title/description still in consts.ts (inconsistent)
- Risk of divergence between the two sources

**Recommended fix:**

- Move `SITE_TITLE` and `SITE_DESCRIPTION` from `src/consts.ts` to `src/config/seo.ts`
- Either delete `consts.ts` entirely or clearly document its purpose if other constants are added
- Update all imports to use `@config/seo`

---

### 5. Reading Time Implementation Lacks Documentation

**Problem:** Reading time implementation is undocumented and in an unusual location.

**Current state:**

- `remark-reading-time.mjs` in root directory injects `minutesRead` into frontmatter
- No JSDoc comments explaining how it works
- No documentation in architecture guides
- Unusual location (most utils in `src/utils/`)

**Confusion for developers:**

- Not obvious where `minutesRead` comes from in frontmatter
- Might look for reading time logic in `@utils/seo` or `@utils/content-summary`
- No clear indication it's a build-time injection

**Recommended fix:**

- Add JSDoc comments to `remark-reading-time.mjs` explaining injection
- Document in `docs/developer/content-system.md` under "Reading Time"
- Consider moving to `src/lib/` for better organization

---

## Low Priority Issues

### 7. Inconsistent File Locations

**Problem:** Some configuration files are in unusual locations.

**Examples:**

- `remark-reading-time.mjs` - Root directory (most utils in `src/utils/`)
- `scripts/get-toolbox-json.ts` - Uses TypeScript (should scripts be in `src/scripts/`?)

**Impact:**

- Harder to discover utilities
- Inconsistent organization

**Recommended fix:** Consider standardizing on:

- `src/utils/` - Runtime utilities (used in components/pages)
- `src/lib/` - Build-time utilities (remark plugins, etc.)
- `scripts/` - One-off scripts (toolbox scraper, etc.)

---

## Summary Statistics

**Total issues remaining:** 7

- Critical: 2 (icon directory, MDX exports)
- Medium: 3 (filtering duplication, SEO split, reading time docs)
- Low: 2 (experimental API, file locations)

**Issues resolved:**

- Issue #8: TypeScript path aliases now documented in architecture-guide.md

**Impact:**

- **Breaking potential:** Low (nothing currently broken)
- **Maintenance burden:** Medium-High (duplication, split config)
- **Developer experience:** Medium (confusing patterns, missing exports)

## Recommended Action Plan

### Phase 1: Quick Wins

1. Fix MDX typography component exports (issue #2)
2. Create content filtering utilities (issue #3)
3. Document reading time implementation (issue #5)

### Phase 2: Structural Improvements

4. Resolve icon directory issue (issue #1)
5. Consolidate SEO configuration (issue #4)
6. Standardize file locations (issue #7)

---

## Notes

- Issues originally discovered during documentation cleanup on 2025-11-11
- Last reviewed and updated: 2025-11-11
- None of these issues are currently breaking the build
- Prioritized by potential for causing future bugs and maintenance burden
