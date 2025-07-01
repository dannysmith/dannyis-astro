# Refactoring 2025-07-01

## Major Task List

- [x] Change Blog Posts to Article everywhere
- [x] Set all external links to target="\_blank"
- [x] Reorganise components
- [x] Check metadata, titles, OG tags, descriptions etc for SEO optimisation
- [ ] Sort RSS feeds
- [ ] Upgrade Astro
- [ ] Check sitemap, add analytics and google tag manager

## Task 1 - Change Blog Posts to Article everywhere

Done.

## Task 2 - Set all external links to target="\_blank"

Done.

## Task 3 - Reorganise components

Done.

## Task 4 - Check metadata, titles, OG tags, descriptions etc for SEO optimisation

### Current SEO Implementation Analysis

**✅ What's Working Well:**

- BaseHead.astro component properly implements essential meta tags
- Dynamic OpenGraph image generation for articles and notes
- Proper canonical URLs and sitemap configuration
- Mobile-responsive viewport meta tag
- SSL implementation and secure site configuration
- External links properly configured with security attributes
- Schema.org markup for articles with proper structured data

**⚠️ Areas Needing Attention:**

1. **Content-Level Issues:**

   - Many articles lack compelling meta descriptions
   - Some notes have missing titles or descriptions
   - Generic site-wide title/description usage on index pages
   - Inconsistent keyword optimization across content

2. **Technical SEO Gaps:**

   - Missing JSON-LD structured data for enhanced rich snippets
   - No breadcrumb schema markup
   - Limited meta tag optimization for different content types
   - No meta robots tags for content management

3. **SEO Strategy Issues:**
   - No clear keyword strategy for Danny's personal brand
   - Missing focus keywords for different content categories
   - Opportunity to better leverage Danny's expertise areas

### SEO Refactoring Plan: Clean Architecture for Maintainability

**Status: ✅ Initial implementation complete - now refactoring for maintainability**

#### Current Implementation Analysis

**✅ Completed Features:**
- Note.astro description bug fixed
- Comprehensive JSON-LD structured data added
- Page-specific title templates implemented
- Meta robots tags and OpenGraph enhancements
- Content collection schema improvements
- Main page SEO optimizations

**⚠️ Maintainability Issues Identified:**
- 47 hardcoded strings scattered across BaseHead.astro
- Complex conditional logic mixed with presentation
- 93-line JSON-LD structure embedded in component
- No centralized SEO configuration
- Difficult to change author info, job titles, or descriptions

#### Phase 1: SEO Architecture Refactoring (Priority: High)

**1.1 Create Centralized SEO Configuration**
- [ ] Create `/src/config/seo.ts` with all SEO constants:
  - Personal info (name, job titles, descriptions)
  - Social media URLs and profiles
  - Site metadata (locale, theme color, robots directives)
  - Title templates for different page types
  - OpenGraph and Twitter card defaults
- [ ] Create TypeScript interfaces for type safety
- [ ] Follow existing `/src/consts.ts` pattern but with structured organization

**1.2 Extract SEO Utilities**
- [ ] Create `/src/utils/seo.ts` with focused functions:
  - `generatePageTitle(title, pageType)` - Clean title template logic
  - `generateJSONLD(pageData, pageType)` - Modular structured data
  - `generateMetaDescription(description)` - Description processing
  - `generateArticleMeta(articleData)` - Article-specific metadata
- [ ] Follow existing utility patterns from `/src/utils/og-*` files
- [ ] Implement proper error handling and fallbacks

**1.3 Simplify BaseHead.astro**
- [ ] Remove hardcoded strings - import from config
- [ ] Replace complex logic with utility function calls
- [ ] Maintain existing props interface for backward compatibility
- [ ] Focus on templating and rendering, not business logic
- [ ] Target: Reduce BaseHead.astro from ~250 lines to ~100 lines

#### Phase 2: Enhanced Maintainability Features (Priority: Medium)

**2.1 Configuration-Driven SEO**
- [ ] Add SEO config validation at build time
- [ ] Create development-time SEO debugging utilities
- [ ] Add configuration for different deployment environments
- [ ] Create templates for common SEO patterns

**2.2 Advanced SEO Components**
- [ ] Create dedicated `<JSONLDScript>` component for structured data
- [ ] Create `<ArticleMeta>` component for article-specific tags
- [ ] Create `<SocialMeta>` component for OpenGraph/Twitter
- [ ] Enable easy customization per page type

#### Phase 3: Developer Experience Improvements (Priority: Low)

**3.1 SEO Development Tools**
- [ ] Add SEO preview component for development
- [ ] Create SEO validation utilities
- [ ] Add TypeScript interfaces for all SEO data types
- [ ] Generate SEO documentation from config

**3.2 Performance Optimizations**
- [ ] Lazy-load non-critical SEO metadata
- [ ] Optimize JSON-LD generation performance
- [ ] Add caching for computed SEO values

### New Architecture Overview

```
/src/config/
  └── seo.ts              # All SEO constants and templates

/src/utils/
  └── seo.ts              # SEO logic functions

/src/components/
  └── layout/
      ├── BaseHead.astro  # Simplified, config-driven template
      └── seo/            # Optional: Dedicated SEO components
          ├── JSONLDScript.astro
          ├── ArticleMeta.astro
          └── SocialMeta.astro
```

### Success Metrics

**Maintainability Goals:**
- ✅ Single file to change all author info, job titles, descriptions
- ✅ Easy to add new page types with different SEO patterns  
- ✅ Reduce BaseHead.astro complexity by 60%
- ✅ Type-safe SEO configuration with full IDE support
- ✅ Zero hardcoded strings in components

**Developer Experience Goals:**
- ✅ Clear separation between configuration, logic, and templates
- ✅ Follows existing codebase patterns and conventions
- ✅ Maintains backward compatibility with current BaseHead usage
- ✅ Easy to test and validate SEO metadata
- ✅ Self-documenting configuration structure

### Implementation Notes

This refactoring maintains all current SEO functionality while dramatically improving maintainability. The new architecture follows the established patterns in the codebase (similar to how OG image generation is organized) and makes it trivial to update personal branding, add new page types, or modify SEO strategies.

### Phase 1 Implementation Details

#### 1.1 SEO Configuration Structure (`/src/config/seo.ts`)

```typescript
// Personal & Business Information
export const AUTHOR = {
  name: 'Danny Smith',
  givenName: 'Danny', 
  familyName: 'Smith',
  jobTitle: 'Remote Work Consultant',
  email: 'hi@danny.is',
  website: 'https://danny.is',
  image: 'https://danny.is/danny-smith.jpg',
  description: 'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.'
} as const;

// Business Information  
export const ORGANIZATION = {
  name: 'Danny Smith Consulting',
  url: 'https://danny.is',
  logo: 'https://danny.is/icon.jpg',
  description: 'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.'
} as const;

// Social Media Profiles
export const SOCIAL_PROFILES = [
  'https://linkedin.com/in/danny-smith-uk',
  'https://github.com/dannysmith', 
  'https://twitter.com/dannyfsmith'
] as const;

// Site Configuration
export const SITE_CONFIG = {
  name: 'danny.is',
  locale: 'en_GB',
  themeColor: '#1a1a1a',
  robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
} as const;

// Title Templates
export const TITLE_TEMPLATES = {
  article: (title: string) => `${title} | Danny Smith - Operations & Leadership Expert`,
  note: (title: string) => `${title} | Quick Take by Danny Smith`,
  page: (title: string) => `${title} | Danny Smith - Operations & Leadership Expert`,
  default: (title: string) => `${title} | Danny Smith`
} as const;

// Article-Specific Configuration
export const ARTICLE_CONFIG = {
  author: AUTHOR.name,
  section: 'Remote Work & Leadership'
} as const;
```

#### 1.2 SEO Utilities Structure (`/src/utils/seo.ts`)

```typescript
import { TITLE_TEMPLATES, AUTHOR, ORGANIZATION, SOCIAL_PROFILES, SITE_CONFIG } from '@config/seo';

export type PageType = 'article' | 'note' | 'page';

export interface PageSEOData {
  title: string;
  description?: string;
  pubDate?: Date;
  updatedDate?: Date; 
  tags?: string[];
  pageType?: PageType;
}

export function generatePageTitle(title: string, pageType?: PageType): string {
  if (!pageType || title === AUTHOR.name) return title;
  
  const template = TITLE_TEMPLATES[pageType] || TITLE_TEMPLATES.default;
  return template(title);
}

export function generateMetaDescription(description?: string): string | undefined {
  return description ? `${description} | ${AUTHOR.name}` : undefined;
}

export function generateJSONLD(pageData: PageSEOData, canonicalUrl: string, ogImageUrl: string) {
  const baseGraph = [
    // Person Schema
    {
      '@type': 'Person',
      '@id': `${AUTHOR.website}/#person`,
      name: AUTHOR.name,
      // ... rest of person schema
    },
    // Organization Schema
    {
      '@type': 'Organization', 
      '@id': `${AUTHOR.website}/#organization`,
      // ... rest of organization schema
    },
    // Website Schema
    {
      '@type': 'WebSite',
      '@id': `${AUTHOR.website}/#website`,
      // ... rest of website schema
    }
  ];

  // Add article schema if it's an article
  if (pageData.pageType === 'article' || pageData.pageType === 'note') {
    baseGraph.push({
      '@type': 'BlogPosting',
      headline: pageData.title,
      // ... rest of article schema
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': baseGraph
  };
}
```

#### 1.3 Simplified BaseHead.astro

```astro
---
import { generatePageTitle, generateMetaDescription, generateJSONLD } from '@utils/seo';
import { SITE_CONFIG, ARTICLE_CONFIG } from '@config/seo';

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  pageType?: 'article' | 'note' | 'page';
  pubDate?: Date;
  updatedDate?: Date;
  tags?: string[];
}

const { title, description, image, type = 'website', pageType, pubDate, updatedDate, tags } = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const pageTitle = generatePageTitle(title, pageType);
const metaDescription = generateMetaDescription(description);
const jsonLD = generateJSONLD({ title, description, pubDate, updatedDate, tags, pageType }, canonicalURL.toString(), ogImageUrl);

// ... OG image logic stays the same
---

<!-- All the meta tags using the generated values -->
<title>{pageTitle}</title>
<meta name="description" content={metaDescription} />
<!-- ... etc -->

<!-- JSON-LD from utility -->
<script type="application/ld+json" set:html={JSON.stringify(jsonLD)} />
```

### Benefits of This Approach

**For Danny (Content Creator):**
- Change job title in one place (`AUTHOR.jobTitle`) - updates everywhere
- Update social links in one array - affects all structured data
- Modify title templates easily without touching components
- All personal branding centralized in config file

**For Developers:**
- Clean separation of concerns
- Easy to test SEO utilities independently  
- Type-safe configuration with autocomplete
- Follows existing codebase patterns
- Backward compatible with current BaseHead usage

**For Maintenance:**
- Reduces BaseHead.astro from ~250 lines to ~100 lines
- Zero hardcoded strings in components
- Easy to add new page types or SEO patterns
- Self-documenting configuration structure
