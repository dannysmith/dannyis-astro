# Codebase Issues Found During Documentation Cleanup

Issues discovered during codebase exploration on 2025-11-11. These are not critical bugs but inconsistencies and technical debt that should be addressed.

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

**Current pattern (duplicated):**

```javascript
const publishable = entries.filter(entry => {
  if (import.meta.env.PROD) {
    return entry.data.draft !== true && !entry.data.styleguide;
  }
  return true;
});
```

**Risk:** Changing filtering rules requires updating 5+ files. Easy to miss one and create inconsistencies.

**Recommended fix:** Create a utility function in `src/utils/content.ts`:

```typescript
export function filterPublishableContent<T extends { data: { draft?: boolean; styleguide?: boolean } }>(entries: T[]): T[] {
  if (import.meta.env.PROD) {
    return entries.filter(entry => entry.data.draft !== true && !entry.data.styleguide);
  }
  return entries;
}
```

Then use consistently:

```javascript
import { filterPublishableContent } from '@utils/content';
const publishable = filterPublishableContent(entries);
```

---

### 4. SEO Configuration Split Across Two Files

**Problem:** Personal branding info is split between two files.

**Files:**

- `src/config/seo.ts` - Author info, organization, social profiles
- `src/consts.ts` - Site title, description, URL

**Impact:**

- Updating branding requires changing both files
- Easy to forget one and create inconsistencies
- Not a single source of truth

**Recommended fix:**

- **Option A:** Move everything to `src/config/seo.ts` (preferred)
- **Option B:** Document clearly in both files that they're related
- **Option C:** Re-export constants from `seo.ts` to centralize

---

### 5. Reading Time Implementation is Confusing

**Problem:** Reading time comes from a remark plugin but looks like it should be in SEO utils.

**Current state:**

- `remark-reading-time.mjs` (root directory, not in src/) injects `minutesRead` into frontmatter
- `src/utils/seo.ts` has 8 SEO functions but none for reading time
- Reading time is accessed directly from frontmatter: `entry.data.minutesRead`

**Confusion:** Developers might look for reading time in:

- `@utils/seo` (it's not there)
- `@utils/content-summary` (it's not there either)

**Impact:**

- Not immediately obvious where reading time comes from
- Remark plugin is in root directory (unusual location)
- No central documentation of how it works

**Recommended fix:**

- Document in `remark-reading-time.mjs` that it injects into frontmatter
- Add JSDoc comment explaining this in content.config.ts
- Consider moving remark plugin to `src/utils/` or `scripts/` for consistency

---

## Low Priority Issues

### 6. Container API Marked as Experimental

**Problem:** RSS feeds use `experimental_AstroContainer` which could change.

**Affected files:**

- `src/pages/rss.xml.js`
- `src/pages/rss/articles.xml.js`
- `src/pages/notes.xml.js`

**Current usage:**

```javascript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
```

**Risk:** Astro could change this API in future releases.

**Recommended action:**

- Monitor Astro release notes for Container API changes
- Watch for when API becomes stable (not experimental)
- Update to stable API when available
- Add comment in code noting it's experimental

---

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

## Documentation Updates Needed

### 8. TypeScript Path Aliases Not Fully Documented

**Problem:** Some aliases exist but weren't documented in old architecture.md.

**Missing from docs:**

- `@components/icons` (though directory doesn't exist - see issue #1)
- How barrel exports work
- When to use category imports vs direct imports

**Fixed in new documentation:** `critical-patterns.md` now covers this thoroughly.

---

## Summary Statistics

**Total issues found:** 8

- Critical: 2 (icon directory, MDX exports)
- Medium: 3 (filtering duplication, SEO split, reading time confusion)
- Low: 3 (experimental API, file locations, docs gaps)

**Impact:**

- **Breaking potential:** Low (nothing currently broken)
- **Maintenance burden:** Medium-High (duplication, confusion)
- **Developer experience:** Medium (confusing patterns, missing exports)

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 hours)

1. Fix MDX typography component exports (issue #2)
2. Create content filtering utility (issue #3)
3. Document reading time source (issue #5)

### Phase 2: Structural Improvements (2-4 hours)

4. Resolve icon directory issue (issue #1)
5. Consolidate SEO configuration (issue #4)
6. Standardize file locations (issue #7)

### Phase 3: Future Monitoring

7. Watch for Container API stabilization (issue #6)
8. Keep documentation updated (issue #8)

---

## Notes

- All issues found during documentation cleanup on 2025-11-11
- Codebase exploration was "medium" thoroughness - there may be additional issues
- None of these issues are currently breaking the build
- Prioritized by potential for causing future bugs
