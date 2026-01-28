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

**Base configuration:** `src/config/site.ts`

- `author` - Name, job title, email, social handles, avatar paths
- `organization` - Business info
- `socialProfiles` - Social media URLs with icons
- `pageTitleTemplates` - Page title formatting by page type
- `pageDescriptions` - Default descriptions
- `descriptions` - Site, author, and organization descriptions

**Resolved configuration:** `src/config/config.ts`

- Spreads `CONFIG` from `site.ts`
- Adds derived values (`fullName`, `avatarUrl`, `avatarCircleUrl`, `twitterHandle`)
- Adds technical SEO constants (`robotsDirective`, `twitterCardType`, `defaultOgImage`, etc.)

**Usage:**

```typescript
import { getConfig } from '@config/config';

const config = getConfig();
console.log(config.author.fullName); // "Danny Smith"
console.log(config.seo.defaultOgImage); // "/og-default.png"
```

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
import { BaseHead } from '@components/layout/index';

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
- BlogPosting schema (for articles and notes)

All schemas pull from `getConfig()` for consistency.
