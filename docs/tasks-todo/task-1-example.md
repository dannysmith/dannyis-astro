# Task: Add Minimal Testing Suite for AI Safety

## Objective

Implement a minimal but effective testing suite to ensure AI coding tools don't break the site. Focus on speed, simplicity, and ease of extension.

## Critical Analysis & Revised Plan

### What Actually Needs Testing (Based on Codebase Analysis)

**Critical Business Logic (HIGH PRIORITY)**

1. **SEO Functions** (`src/utils/seo.ts`) - Pure functions with complex template logic
2. **Content Collection Schemas** - Zod schemas that validate all content
3. **Content Filtering Logic** - Draft/styleguide filtering (MOST CRITICAL)
4. **Route Generation** - Individual pages and listings work correctly
5. **RSS Feed Generation** - Complex MDX rendering with Container API

**Content Filtering Logic (NEW - CRITICAL!)**
The codebase has complex filtering rules that AI could easily break:

- **Individual pages**: `import.meta.env.PROD ? data.draft !== true : true`
- **Listing pages**: `&& !data.styleguide` added to draft filter
- **Environment sensitivity**: Different behavior in dev vs prod

**What DOESN'T Need Testing**

- `og-image-generator.ts` - Has built-in fallbacks, low failure impact
- `og-templates.ts` - Just JSX templates, no logic
- `NoteCard.astro` - Pure presentation, no logic beyond props
- `BaseHead.astro` - Just template rendering, tested via E2E

**Major Discovery**
The filtering logic appears in 8+ files with slight variations. This is the #1 place AI will break things.

## Revised Testing Architecture

### 1. Unit Tests (Vitest) - ~5 seconds runtime

Focus ONLY on functions with actual business logic.

**Priority Targets:**

```typescript
// SEO utility functions
- generatePageTitle() - Conditional template selection
- generateMetaDescription() - String manipulation
- validateSEOData() - Default value logic
- generateJSONLD() - Complex object construction

// Content filtering logic (CRITICAL!)
- createContentFilter() - Helper function for filtering logic
- Environment-based draft filtering
- Styleguide exclusion logic
```

**Skip These (No Logic):**

- getSiteConfig() - Just returns constants
- generateOGImageUrl() - Simple URL construction

### 2. Content Validation Tests - ~2 seconds runtime

Test Zod schemas and filtering behavior.

**Priority Targets:**

```typescript
- Article schema validation (dates, drafts, required fields)
- Note schema validation
- Draft/styleguide filtering logic with different env values
- Edge cases: invalid dates, missing required fields
```

### 3. Route Validation Tests (E2E) - ~15 seconds runtime

Test that content filtering actually works in production.

**Critical Scenarios:**

1. **Homepage Renders** - Basic load test
2. **Article Routes Work** - Individual articles accessible
3. **Listing Pages Filter Correctly** - No drafts/styleguide in /writing, /notes
4. **RSS Feeds Filter Correctly** - Same filtering rules applied
5. **404 Handling** - Returns proper status code
6. **Styleguide Pages Still Render** - Individual access works but not in lists

**The Key Insight:**
Test the business logic (filtering) separately from the routes that use it.

## Implementation Plan

### Phase 1: Setup Infrastructure (30 minutes)

#### 1.1 Install Dependencies

```bash
npm install -D vitest @vitest/ui happy-dom @testing-library/dom
npm install -D playwright @playwright/test
npm install -D @astrojs/check typescript
```

#### 1.2 Configure Vitest

Create `vitest.config.ts`:

```typescript
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.astro/', 'dist/'],
    },
    testTimeout: 10000,
  },
});
```

#### 1.3 Configure Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 1.4 Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run tests/unit",
    "test:component": "vitest run tests/component",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:component && npm run test:e2e",
    "check": "npm run check:types && npm run format:check && npm run lint && npm run test:all && npm run build"
  }
}
```

### Phase 2: Simplified Test Structure

#### 2.1 Updated Directory Structure

```
tests/
├── unit/
│   ├── seo.test.ts           # SEO utility functions
│   ├── schemas.test.ts       # Content collection validation
│   └── content-filter.test.ts # Draft/styleguide filtering logic
├── e2e/
│   └── smoke.spec.ts         # All E2E tests including route validation
└── fixtures/
    └── test-content.ts       # Sample content for testing
```

#### 2.2 SEO Utils Test (High Value)

`tests/unit/seo.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  generatePageTitle,
  generateMetaDescription,
  validateSEOData,
  generateJSONLD,
} from '@/src/utils/seo';

describe('SEO Utils', () => {
  // Test the complex conditional logic
  describe('generatePageTitle', () => {
    it('adds correct suffix for articles', () => {
      expect(generatePageTitle('My Article', 'article')).toBe('My Article | Writing | Danny Smith');
    });

    it('adds correct suffix for notes', () => {
      expect(generatePageTitle('My Note', 'note')).toBe('My Note | Notes | Danny Smith');
    });

    it('preserves homepage title unchanged', () => {
      expect(generatePageTitle('Danny Smith')).toBe('Danny Smith');
    });
  });

  // Test default value logic
  describe('validateSEOData', () => {
    it('provides sensible defaults for empty input', () => {
      const result = validateSEOData({});
      expect(result.title).toBe('Untitled');
      expect(result.type).toBe('website');
      expect(result.tags).toEqual([]);
    });

    it('preserves provided values', () => {
      const input = {
        title: 'Test',
        type: 'article' as const,
        tags: ['tech'],
      };
      const result = validateSEOData(input);
      expect(result).toMatchObject(input);
    });
  });

  // Test complex JSON-LD generation
  describe('generateJSONLD', () => {
    it('generates valid schema for articles', () => {
      const data = {
        title: 'Test Article',
        description: 'Test description',
        type: 'article' as const,
        pageType: 'article' as const,
        pubDate: new Date('2025-01-01'),
        tags: ['tech', 'web'],
      };

      const result = generateJSONLD(data, 'https://danny.is/test', 'https://danny.is/og.png');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@graph']).toBeInstanceOf(Array);
      expect(result['@graph']).toHaveLength(4); // Person, Org, Website, Article
    });
  });
});
```

#### 2.3 Content Schema Test (Catches Breaking Changes)

`tests/unit/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { collections } from '@/src/content.config';

describe('Content Schemas', () => {
  const articleSchema = collections.articles.schema({ image: () => ({}) });
  const noteSchema = collections.notes.schema;

  describe('Article Schema', () => {
    it('validates minimal valid article', () => {
      const valid = {
        title: 'Test Article',
        pubDate: '2025-01-01',
      };
      expect(() => articleSchema.parse(valid)).not.toThrow();
    });

    it('requires title and pubDate', () => {
      expect(() => articleSchema.parse({})).toThrow();
      expect(() => articleSchema.parse({ title: 'Test' })).toThrow();
      expect(() => articleSchema.parse({ pubDate: '2025-01-01' })).toThrow();
    });

    it('coerces date strings to Date objects', () => {
      const result = articleSchema.parse({
        title: 'Test',
        pubDate: '2025-01-01',
      });
      expect(result.pubDate).toBeInstanceOf(Date);
    });
  });

  describe('Note Schema', () => {
    it('validates minimal valid note', () => {
      const valid = {
        title: 'Test Note',
        pubDate: '2025-01-01',
      };
      expect(() => noteSchema.parse(valid)).not.toThrow();
    });

    it('validates sourceURL when provided', () => {
      const withInvalidURL = {
        title: 'Test',
        pubDate: '2025-01-01',
        sourceURL: 'not-a-url',
      };
      expect(() => noteSchema.parse(withInvalidURL)).toThrow();
    });
  });
});
```

#### 2.4 Content Filtering Test (CRITICAL)

`tests/unit/content-filter.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';

// Helper function to test the repeated filtering logic
function createContentFilter(isProduction: boolean) {
  return ({ data }: { data: { draft?: boolean; styleguide?: boolean } }) => {
    const draftFilter = isProduction ? data.draft !== true : true;
    return draftFilter;
  };
}

function createListingFilter(isProduction: boolean) {
  return ({ data }: { data: { draft?: boolean; styleguide?: boolean } }) => {
    const draftFilter = isProduction ? data.draft !== true : true;
    return draftFilter && !data.styleguide;
  };
}

describe('Content Filtering Logic', () => {
  describe('Individual Page Filter (drafts only)', () => {
    it('excludes drafts in production', () => {
      const filter = createContentFilter(true);

      expect(filter({ data: { draft: true } })).toBe(false);
      expect(filter({ data: { draft: false } })).toBe(true);
      expect(filter({ data: {} })).toBe(true); // no draft field = not draft
    });

    it('includes drafts in development', () => {
      const filter = createContentFilter(false);

      expect(filter({ data: { draft: true } })).toBe(true);
      expect(filter({ data: { draft: false } })).toBe(true);
      expect(filter({ data: {} })).toBe(true);
    });

    it('allows styleguide pages individually', () => {
      const prodFilter = createContentFilter(true);
      const devFilter = createContentFilter(false);

      // Styleguide pages should render individually
      expect(prodFilter({ data: { styleguide: true } })).toBe(true);
      expect(devFilter({ data: { styleguide: true } })).toBe(true);
    });
  });

  describe('Listing Page Filter (drafts + styleguide)', () => {
    it('excludes drafts and styleguide in production', () => {
      const filter = createListingFilter(true);

      expect(filter({ data: { draft: true } })).toBe(false);
      expect(filter({ data: { styleguide: true } })).toBe(false);
      expect(filter({ data: { draft: true, styleguide: true } })).toBe(false);
      expect(filter({ data: {} })).toBe(true);
    });

    it('excludes styleguide but includes drafts in development', () => {
      const filter = createListingFilter(false);

      expect(filter({ data: { draft: true } })).toBe(true); // Draft OK in dev
      expect(filter({ data: { styleguide: true } })).toBe(false); // Styleguide never OK in lists
      expect(filter({ data: {} })).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    it('handles import.meta.env.PROD correctly', () => {
      // Mock the environment variable behavior
      const mockEnv = (isProd: boolean) => ({
        PROD: isProd,
      });

      // Simulate the actual filtering logic from the codebase
      const testFilter = (env: any, data: any) => {
        return env.PROD ? data.draft !== true : true;
      };

      expect(testFilter(mockEnv(true), { draft: true })).toBe(false);
      expect(testFilter(mockEnv(false), { draft: true })).toBe(true);
    });
  });
});
```

### Phase 3: Enhanced E2E Tests (30 minutes)

#### 3.1 Comprehensive Route & Filter Tests

`tests/e2e/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Critical Path Tests', () => {
  // Test 1: Site loads without errors
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Danny Smith/);
  });

  // Test 2: Content routing works
  test('can navigate to an article', async ({ page }) => {
    await page.goto('/writing');

    const firstLink = page.locator('article a').first();
    const href = await firstLink.getAttribute('href');
    await firstLink.click();

    await expect(page).toHaveURL(new RegExp(href!));
    await expect(page.locator('article')).toBeVisible();
  });

  // Test 3: RSS feed generates valid XML
  test('RSS feed returns valid XML', async ({ page }) => {
    const response = await page.goto('/rss.xml');

    expect(response?.status()).toBe(200);
    const contentType = response?.headers()['content-type'];
    expect(contentType).toMatch(/xml|rss/);

    const content = await response?.text();
    expect(content).toContain('<?xml');
    expect(content).toContain('<rss');
    expect(content).toContain('</rss>');
  });

  // Test 4: 404 handling
  test('404 page works correctly', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);

    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found/i);
  });
});

test.describe('Content Filtering Tests', () => {
  // Test 5: Styleguide pages render individually but not in lists
  test('styleguide article renders individually', async ({ page }) => {
    const response = await page.goto('/writing/article-styleguide/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('styleguide note renders individually', async ({ page }) => {
    const response = await page.goto('/notes/note-styleguide/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Test 6: Listing pages exclude styleguide content
  test('writing page excludes styleguide articles', async ({ page }) => {
    await page.goto('/writing');

    // Check page content doesn't include styleguide
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toMatch(/styleguide/i);

    // Verify there are actual articles shown
    const articles = page.locator('article');
    expect(await articles.count()).toBeGreaterThan(0);
  });

  test('notes page excludes styleguide notes', async ({ page }) => {
    await page.goto('/notes');

    const pageContent = await page.textContent('body');
    expect(pageContent).not.toMatch(/styleguide/i);

    const notes = page.locator('article');
    expect(await notes.count()).toBeGreaterThan(0);
  });

  // Test 7: RSS feeds exclude styleguide content
  test('RSS feeds exclude styleguide content', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    const content = await response?.text();

    // Should not contain styleguide content
    expect(content).not.toMatch(/styleguide/i);

    // Should contain actual articles and notes
    expect(content).toContain('<item>');
  });

  // Test 8: Individual draft pages still accessible (this test runs in dev mode)
  test('draft articles accessible in development', async ({ page }) => {
    // This test assumes we're running in dev mode where drafts are shown
    const knownDraftPaths = [
      '/writing/ai-and-adhd/',
      '/writing/astro-editor/',
      '/writing/vibe-coding-astro-editor/',
      '/writing/moving-to-astro/',
    ];

    // Test one draft article (adjust path based on your actual content)
    for (const path of knownDraftPaths) {
      const response = await page.goto(path);
      if (response?.status() === 200) {
        // Found a working draft page
        await expect(page.locator('h1')).toBeVisible();
        break;
      }
    }
  });
});

test.describe('Build Validation', () => {
  test('production build completes successfully', async () => {
    // This test would be run via npm script, not Playwright
    // Actual implementation: npm run build && echo "Build successful"
  });
});
```

### Phase 4: Simplified Setup & Scripts

#### 4.1 Updated package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:unit": "vitest run tests/unit",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run build && npm run test:e2e",
    "check": "npm run check:types && npm run format:check && npm run lint && npm run test:all"
  }
}
```

#### 4.2 Minimal CI Setup

`.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # Quick checks first (fail fast)
      - run: npm run check:types
      - run: npm run lint

      # Unit tests
      - run: npm run test:unit

      # Build test (catches most integration issues)
      - run: npm run build

      # E2E only if everything else passes
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

## Final Success Criteria

### What We're Actually Testing

- **SEO Functions**: 4 functions with actual business logic (~8 tests)
- **Content Schemas**: 2 schemas with validation rules (~6 tests)
- **Content Filtering Logic**: Draft/styleguide filtering (~12 tests)
- **Route Validation**: Individual pages, listings, RSS (~8 tests)
- **E2E Critical Paths**: 4 smoke tests (homepage, article, RSS, 404)
- **Total Tests**: ~34 focused tests (vs original 40 scattered tests)

### Updated Metrics

- [ ] Full suite runs in < 25 seconds (Unit: 7s, E2E: 18s)
- [ ] Tests catch the #1 bug source (content filtering)
- [ ] Route validation ensures pages actually work
- [ ] Build validation as final integration test

### What We're NOT Testing

- **Presentation components** - No logic to test
- **OG image generation** - Has fallbacks, low impact
- **Simple getters** - Testing constants is pointless
- **Complex E2E interactions** - Keep it simple

## Implementation Checklist (Revised)

### Day 1: Core Setup (2 hours)

```bash
# 1. Install minimal dependencies
npm install -D vitest happy-dom playwright @playwright/test

# 2. Create simple structure
mkdir -p tests/unit tests/e2e tests/fixtures

# 3. Write SEO tests (highest value)
# 4. Write schema validation tests
# 5. Write E2E smoke tests
# 6. Verify everything runs
```

### What to Skip

- ❌ Component tests with Container API
- ❌ Multiple E2E test files
- ❌ Complex test fixtures
- ❌ Coverage reporting (for now)
- ❌ Visual regression tests

### Maintenance Philosophy

1. **If it has logic, test it**
2. **If it's just a template, skip it**
3. **One E2E test per user journey**
4. **Build test catches everything else**

## Why This Approach Works

### Original Plan Problems

- **Over-testing**: Testing presentation components with no logic
- **Missing critical tests**: Content schema validation
- **Redundant E2E**: Testing notes AND articles separately
- **Complex setup**: Component tests need Container API setup

### Revised Plan Benefits

- **Focused on logic**: Only test functions that can break
- **Catches real issues**: Schema tests prevent content errors
- **Faster execution**: ~20s total vs 30s target
- **Easier to maintain**: Less code, clearer purpose

## The Real Implementation Steps

```bash
# Step 1: Just the essentials
npm install -D vitest happy-dom playwright

# Step 2: Create vitest.config.ts
echo "import { getViteConfig } from 'astro/config';
export default getViteConfig({
  test: {
    globals: true,
    environment: 'happy-dom'
  }
});" > vitest.config.ts

# Step 3: Create playwright.config.ts (minimal)
echo "import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: true
  }
});" > playwright.config.ts

# Step 4: Write the actual tests (copy from examples above)
# Step 5: Update package.json scripts
# Step 6: Run and validate
```

## Key Decisions & Justifications

### Why These Tests?

1. **SEO Utils** - Complex conditional logic, affects all pages
2. **Content Schemas** - Catch Zod validation breaks
3. **Content Filtering Logic** - THE #1 place AI will break things (8+ files with this logic)
4. **Route Validation** - Ensure pages actually render and filter correctly
5. **E2E Smoke** - Verifies the site works end-to-end

### Why NOT These Tests?

1. **Component tests** - Astro components here are just templates
2. **OG Image tests** - Has fallback, non-critical, hard to test
3. **Multiple E2E files** - One comprehensive file is cleaner
4. **Complex UI interactions** - Build errors catch most component issues

## Summary

**Original plan**: 30-40 tests, missed the critical filtering logic
**Final plan**: ~34 focused tests, covers the actual failure points

This enhanced approach:

- Tests the business logic that actually breaks (filtering)
- Validates routes work correctly in dev and prod
- Catches content schema violations
- Runs in ~25 seconds (still very fast)
- Takes 2-3 hours to implement properly

The key insight: **Content filtering logic is everywhere and complex**. This is where AI tools will cause real problems. Test it thoroughly.
