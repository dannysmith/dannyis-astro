# SEO

Guidance and patterns for maintaining good SEO.

## Using SEO Utilities

**Always use centralized SEO configuration:**

```typescript
// ✅ Correct: Using SEO utilities
import { generatePageTitle, validateSEOData } from '@utils/seo';
const seoData = validateSEOData(Astro.props);
const title = generatePageTitle(seoData.title, seoData.pageType);

// ❌ Wrong: Manual SEO generation
const title = `${props.title} | Danny Smith`;
```

## SEO Checklist

- [ ] Use `generatePageTitle()` for consistent titles
- [ ] Validate data with `validateSEOData()`
- [ ] Include OpenGraph image (auto-generated or custom)
- [ ] Add JSON-LD structured data via `generateJSONLD()`
- [ ] Use `generateMetaDescription()` for descriptions
- [ ] Include proper canonical URLs
- [ ] Add article metadata for articles/notes

## SEO System Architecture

Centralized SEO configuration prevents inconsistencies and simplifies updates.

### Configuration Files

**Personal branding and templates:** `src/config/seo.ts`

- `AUTHOR` - Name, job title, email, website, image, description
- `ORGANIZATION` - Business info
- `SOCIAL_PROFILES` - Social media URLs
- `TITLE_TEMPLATES` - Page title formatting by page type
- `PAGE_DESCRIPTIONS` - Default descriptions
- Schema.org configuration

**Site constants:** `src/consts.ts`

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_URL`

**Note:** Personal branding in `seo.ts`, generic strings in `consts.ts`.

### SEO Utility Functions

**File:** `src/utils/seo.ts`

**Title generation:**

```typescript
import { generatePageTitle } from '@utils/seo';

const title = generatePageTitle('My Article', 'article');
// Result: "My Article | Danny Smith"
```

**Meta description:**

```typescript
import { generateMetaDescription } from '@utils/seo';

const description = generateMetaDescription('Article description');
// Appends author name for consistent branding
```

**JSON-LD structured data:**

```typescript
import { generateJSONLD } from '@utils/seo';

const jsonld = generateJSONLD(pageData, canonicalUrl, ogImageUrl);
// Returns schema.org Person + Organization + Website + optional BlogPosting
```

**Article metadata:**

```typescript
import { generateArticleMeta } from '@utils/seo';

const meta = generateArticleMeta(pageData);
// Returns OpenGraph article-specific tags (author, section, dates, tags)
```

**OG image URL:**

```typescript
import { generateOGImageUrl } from '@utils/seo';

const imageUrl = generateOGImageUrl(customImage, baseUrl);
// Returns custom image or defaults to /og-default.png
```

**Data validation:**

```typescript
import { validateSEOData } from '@utils/seo';

const validated = validateSEOData(rawData);
// Normalizes and validates SEO data with defaults
```

### BaseHead Component

Unified HTML head management with SEO integration.

**File:** `src/components/layout/BaseHead.astro`

```astro
import { BaseHead } from '@components/layout';

<BaseHead
  title="Page Title"
  description="Page description under 160 characters"
  type="article"        // 'website' (default) or 'article'
  pageType="article"    // 'article', 'note', or 'page' for title templates
  image="/custom-og.png" // Optional: custom OG image
  pubDate={new Date()}   // Optional: for articles/notes
  updatedDate={new Date()} // Optional: for articles/notes
  tags={['tag1', 'tag2']} // Optional: for articles/notes
/>
```

**BaseHead handles:**

- Meta tags (title, description, canonical URL)
- OpenGraph tags (og:title, og:image, og:type, etc.)
- Twitter Card tags
- JSON-LD structured data
- Theme management (theme color, initial theme)
- Font imports (@fontsource-variable)

### Schema.org Structured Data

**Automatically included** via BaseHead component:

- Person schema (author information)
- Organization schema (business/brand)
- Website schema (site metadata)
- BlogPosting schema (for articles only)

All schemas pull from `src/config/seo.ts` for consistency.
