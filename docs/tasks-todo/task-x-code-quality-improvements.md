# Code Quality and Consistency Improvements

## Overview

Address architectural inconsistencies, improve type safety, add critical test coverage, and clarify documentation based on comprehensive codebase review.

**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Risk Level:** Low - mostly consistency fixes and test additions

## Context

Recent codebase review identified several areas where consistency could be improved and critical code paths lack test coverage. These changes focus on:
1. Fixing violations of documented patterns
2. Improving type safety
3. Adding tests for critical untested utilities
4. Clarifying documentation gaps

**Important:** This task explicitly DOES NOT refactor RSS feeds, OG image endpoints, or markdown export endpoints. While these have similar code between articles and notes, they are "similar but potentially divergent" features where duplication is actually more maintainable than abstraction.

## Changes Required

### 1. Fix Path Alias Violations (CRITICAL)

**Files to fix:**
- `src/pages/writing/[...slug]/og-image.png.ts`
- `src/pages/notes/[...slug]/og-image.png.ts`

**Current (wrong):**
```typescript
import { generateOGImage } from '../../../utils/og-image-generator.js';
import { filterContentForPage } from '../../../utils/content.js';
```

**Should be:**
```typescript
import { generateOGImage } from '@utils/og-image-generator.js';
import { filterContentForPage } from '@utils/content.js';
```

**Why:** Violates documented pattern: "ALWAYS use path aliases". Build reliability and refactoring flexibility.

---

### 2. Document lib/ vs utils/ Directory Distinction

**Update:** `CLAUDE.md` and `docs/developer/architecture-guide.md`

**Add to file organization section:**
```
src/
├── lib/             # Build-time plugins and scripts (runs independently)
│   └── *.mjs        # Remark/rehype plugins, build scripts
├── utils/           # Shared helper functions (imported throughout codebase)
│   └── *.ts         # Helper functions, business logic
```

**Explanation to add:**
- `lib/` - Build-time plugins and scripts (remark/rehype, runs independently). Configured in `astro.config.mjs`, not imported by other files.
- `utils/` - Shared helper functions (imported by components, pages, and other files). Called during Astro's component-to-HTML rendering.

**Example:**
- ✅ `lib/remark-reading-time.mjs` - Remark plugin, configured in astro.config.mjs
- ✅ `utils/seo.ts` - Functions imported by Astro components and pages
- ❌ Don't put importable utilities in `lib/`
- ❌ Don't put build plugins in `utils/`

**Also add path alias to `tsconfig.json`:**
```json
"@lib/*": ["src/lib/*"]
```

---

### 3. Fix Barrel Export Inconsistencies

**Files to update:**

**`src/components/ui/ContentCard.astro`** - Line 2-3
```typescript
// Current:
import FormattedDate from './FormattedDate.astro';

// Change to:
import { FormattedDate } from '@components/ui';
```

**`src/components/layout/NoteCard.astro`** - Line 2-3
```typescript
// Current:
import SimpleProseTypography from './SimpleProseTypography.astro';

// Change to:
import { SimpleProseTypography } from '@components/layout';
```

**`src/components/mdx/Embed.astro`** - Lines 2-4
```typescript
// Current:
import BookmarkCard from './BookmarkCard.astro';
import Loom from './Loom.astro';

// Change to:
import { BookmarkCard, Loom } from '@components/mdx';
```

**Why:** Documented pattern states components should use barrel exports. Makes future refactoring easier and maintains consistency.

---

### 4. Centralize Site Configuration

**Add to `src/config/seo.ts`:**
```typescript
/**
 * Base site URL - used for canonical URLs, OG images, RSS feeds
 * Do not include trailing slash
 */
export const SITE_URL = 'https://danny.is' as const;

/**
 * Content type URL prefixes
 */
export const CONTENT_PATHS = {
  articles: '/writing',
  notes: '/notes',
} as const;
```

**Update these files to import from config:**
- `src/pages/writing/[...slug]/og-image.png.ts:6` - Remove hardcoded SITE_URL
- `src/pages/notes/[...slug]/og-image.png.ts:6` - Remove hardcoded SITE_URL
- Search for any other hardcoded `'https://danny.is'` strings

**Why:** Single source of truth for site URL. Easier to handle staging/preview environments.

---

### 5. Centralize MDX Component Remapping

**Create new file: `src/config/mdx-components.ts`**
```typescript
/**
 * MDX component remapping configuration
 *
 * These components are automatically used when rendering MDX content.
 * They provide enhanced functionality over standard HTML elements:
 * - <a> -> SmartLink: Auto-detects internal/external links, adds icons
 * - <img> -> BasicImage: Responsive images with optimization
 */
import SmartLink from '@components/mdx/SmartLink.astro';
import BasicImage from '@components/mdx/BasicImage.astro';

export const MDX_COMPONENT_REMAPPING = {
  a: SmartLink,
  img: BasicImage,
} as const;
```

**Update these files to import and use:**
- `src/pages/writing/[...slug]/index.astro:23-26`
- `src/pages/notes/[...slug]/index.astro:21-24`
- `src/pages/notes/index.astro:22-25`

**Change from:**
```typescript
const components = {
  a: SmartLink,
  img: BasicImage,
};
```

**To:**
```typescript
import { MDX_COMPONENT_REMAPPING } from '@config/mdx-components';
// ...
<Content components={MDX_COMPONENT_REMAPPING} />
```

**Why:** Single source of truth for critical MDX pattern. Future additions (e.g., custom code blocks) only need one change.

---

### 6. Fix Type Assertion in ContentCard

**File:** `src/components/ui/ContentCard.astro:50`

**Update `src/utils/content-summary.ts` type signature:**
```typescript
import type { CollectionEntry } from 'astro:content';

// Update function signature to accept union type
export function generateSummary(
  entry: CollectionEntry<'articles'> | CollectionEntry<'notes'>,
  maxLength: number = 200
): string {
  // ... existing implementation
}
```

**Then remove `as any` from ContentCard:**
```typescript
// Current:
summary = showSummary ? generateSummary(content as any, summaryLength) : null;

// Change to:
summary = showSummary ? generateSummary(content, summaryLength) : null;
```

**Why:** Eliminates only `as any` in codebase. Improves type safety without changing functionality.

---

### 7. Add Critical Unit Tests

**Priority: High - these utilities are completely untested**

#### 7.1 Test OG Image Generation Utilities

**Create: `tests/unit/og-image-generator.test.ts`**

Test coverage for `src/utils/og-image-generator.ts`:
- Font loading (mock file reads)
- Template structure validation (ensure templates return expected shape)
- Error handling (when Satori/Resvg fail, falls back to Sharp)
- Image dimensions (1200x630)

**Mock external dependencies:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOGImage } from '@utils/og-image-generator';

vi.mock('@vercel/og', () => ({
  ImageResponse: vi.fn(),
}));

vi.mock('satori', () => ({
  default: vi.fn(),
}));

// ... test cases
```

**Key test cases:**
1. Successfully generates PNG with valid options
2. Handles missing fonts gracefully
3. Falls back to Sharp when Satori unavailable
4. Returns correct content-type headers
5. Handles errors without crashing

#### 7.2 Test Remark Reading Time Plugin

**Create: `tests/unit/remark-reading-time.test.ts`**

Test coverage for `src/lib/remark-reading-time.mjs`:
- Calculates reading time from markdown content
- Injects `minutesRead` into frontmatter
- Handles empty content
- Handles very long content
- Works with MDX (ignores frontmatter, code blocks)

**Example test:**
```typescript
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkReadingTime from '@lib/remark-reading-time.mjs';

describe('remarkReadingTime', () => {
  it('injects minutesRead into frontmatter', async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkReadingTime)
      .process('# Title\n\n' + 'Word '.repeat(250)); // ~250 words = 1 min

    expect(file.data.astro.frontmatter.minutesRead).toBe(1);
  });

  // ... more tests
});
```

#### 7.3 Test OG Templates Structure

**Create: `tests/unit/og-templates.test.ts`**

Test coverage for `src/utils/og-templates.ts`:
- Article template returns valid React element structure
- Note template returns valid React element structure
- Default template returns valid React element structure
- Templates handle long titles (truncation)
- Templates handle missing descriptions

**Why test templates?**
- 454 lines of complex layout logic
- Changes could break OG image generation silently
- Ensures templates produce valid structure for Satori

#### 7.4 Improve Content Filtering Tests

**Update: `tests/unit/content-filter.test.ts`**

Currently this file recreates the filtering logic in test mocks. Update to:
1. Import actual functions from `@utils/content`
2. Create mock content entries that match real schema
3. Test actual implementations, not reimplemented logic

**Why:** Current tests could pass while actual implementation is broken.

---

### 8. Update Documentation

#### 8.1 Remove Outdated GOTCHA

**File:** `docs/developer/architecture-guide.md`

**Find and update this section:**
```markdown
⚠️ GOTCHA: Content filtering logic is currently duplicated across RSS feeds...
```

**Change to:**
```markdown
✅ Content filtering is now centralized in `@utils/content`:
- `filterContentForPage()` - For individual content pages (includes styleguide in dev)
- `filterContentForListing()` - For listings and RSS (always excludes styleguide)

All RSS feeds and page routes now use these centralized functions.
```

**Why:** This was already fixed but documentation still has the warning.

#### 8.2 Clarify NoteCard vs ContentCard

**File:** `docs/developer/component-patterns.md`

Add clarification about the difference between NoteCard and ContentCard:

```markdown
### Layout Components vs UI Components

**NoteCard (in layout/):**
- Used specifically for notes listings
- Part of the page layout structure
- Tightly coupled to notes display patterns

**ContentCard (in ui/):**
- Generic reusable card component
- Can be used for any content type
- More flexible, accepts arbitrary content

Both serve similar visual purposes but different architectural roles.
```

---

## Testing Strategy

After each change:
1. Run `pnpm run check:types` - Verify TypeScript passes
2. Run `pnpm run test:unit` - Verify all tests pass
3. Run `pnpm run build` - Verify production build works
4. Visual spot checks:
   - View article pages - verify SmartLink/BasicImage work
   - View note pages - verify rendering correct
   - Check OG images generate: `/writing/[slug]/og-image.png`
   - Verify RSS feeds still work: `/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`

---

## Success Criteria

- [ ] All path alias violations fixed (0 relative imports in pages)
- [ ] lib/ vs utils/ distinction documented in 2 places
- [ ] All components use barrel exports consistently
- [ ] SITE_URL and content paths centralized in config
- [ ] MDX component remapping in single location
- [ ] Zero `as any` type assertions in codebase
- [ ] 4 new test files with >90% coverage of tested utilities
- [ ] All tests passing (unit + e2e)
- [ ] Documentation updated (remove outdated GOTCHA, clarify lib/utils)
- [ ] `pnpm run check:all` passes
- [ ] Production build succeeds

---

## Non-Goals (Explicitly Out of Scope)

- ❌ Refactoring RSS feed generation (duplication is acceptable)
- ❌ Refactoring OG image endpoints (keep separate for articles/notes)
- ❌ Refactoring markdown export endpoints (same as above)
- ❌ Component testing (future work)
- ❌ E2E test expansion (focusing on unit tests)
- ❌ CI/CD pipeline (handled by Vercel)
- ❌ Code coverage tooling (not needed)
- ❌ Pre-commit hooks (not desired)

---

## Notes

- The "duplication" in RSS/OG/markdown endpoints is actually a feature, not a bug. Articles and notes are similar but could diverge, so keeping them separate is more maintainable than creating abstractions.
- Unit tests preferred over E2E tests due to execution time.
- Focus on testing critical utilities that are completely untested rather than expanding coverage everywhere.
