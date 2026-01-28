/**
 * SEO Utility Functions
 *
 * Clean, testable functions for generating SEO metadata.
 * All complex logic extracted from components for better maintainability.
 */

import { CONFIG } from '@config/site';

// ============================================================================
// Types
// ============================================================================

export type PageType = 'article' | 'note' | 'page';

export interface SEOData {
  title: string;
  description?: string;
  image?: string;
  type: 'website' | 'article';
  pageType?: PageType;
  pubDate?: Date;
  updatedDate?: Date;
  tags?: string[];
}

// ============================================================================
// Technical SEO Constants (rarely change, hardcoded here)
// ============================================================================

const ROBOTS_DIRECTIVE =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const ARTICLE_SECTION = 'Remote Work & Leadership';
const DEFAULT_OG_IMAGE = '/og-default.png';
const TWITTER_CARD_TYPE = 'summary_large_image';
const SEARCH_ACTION = {
  target: 'https://danny.is/search?q={search_term_string}',
  queryInput: 'required name=search_term_string',
} as const;

// ============================================================================
// Derived Helpers
// ============================================================================

const authorName = `${CONFIG.author.givenName} ${CONFIG.author.familyName}`;
const siteUrl = CONFIG.site.url;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Generate page title using configured templates
 */
export function generatePageTitle(title: string, pageType?: PageType): string {
  // Don't modify the homepage title or if no pageType is specified
  if (!pageType || title === CONFIG.site.name) {
    return title;
  }

  const template = CONFIG.pageTitleTemplates[pageType] || CONFIG.pageTitleTemplates.default;
  return template.replace('{title}', title);
}

/**
 * Generate meta description with consistent branding
 */
export function generateMetaDescription(description?: string): string | undefined {
  if (!description) return undefined;
  return `${description} | ${authorName}`;
}

/**
 * Generate JSON-LD structured data for a page
 */
export function generateJSONLD(
  pageData: SEOData,
  canonicalUrl: string,
  ogImageUrl: string
): Record<string, unknown> {
  const personSchema = {
    '@type': 'Person' as const,
    '@id': `${siteUrl}/#person`,
    name: authorName,
    givenName: CONFIG.author.givenName,
    familyName: CONFIG.author.familyName,
    url: siteUrl,
    image: `${siteUrl}${CONFIG.author.avatar}`,
    sameAs: CONFIG.socialProfiles.map(p => p.url),
    jobTitle: CONFIG.author.jobTitle,
    description: CONFIG.descriptions.author,
    worksFor: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
    },
  };

  const organizationSchema = {
    '@type': 'Organization' as const,
    '@id': `${siteUrl}/#organization`,
    name: CONFIG.organization.name,
    url: siteUrl,
    logo: `${siteUrl}${CONFIG.author.avatar}`,
    description: CONFIG.descriptions.organization,
    founder: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
    },
  };

  const websiteSchema = {
    '@type': 'WebSite' as const,
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: authorName,
    description: CONFIG.descriptions.site,
    publisher: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: SEARCH_ACTION.target,
      },
      'query-input': SEARCH_ACTION.queryInput,
    },
  };

  const baseGraph: Record<string, unknown>[] = [personSchema, organizationSchema, websiteSchema];

  // Add article/blog posting schema for content pages
  if (pageData.pageType === 'article' || pageData.pageType === 'note') {
    baseGraph.push(generateArticleSchema(pageData, canonicalUrl, ogImageUrl));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': baseGraph,
  };
}

/**
 * Generate article-specific schema markup
 */
function generateArticleSchema(
  pageData: SEOData,
  canonicalUrl: string,
  ogImageUrl: string
): Record<string, unknown> {
  const articleSchema: Record<string, unknown> = {
    '@type': 'BlogPosting',
    headline: pageData.title,
    description: pageData.description,
    url: canonicalUrl,
    image: ogImageUrl,
    author: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    inLanguage: CONFIG.site.locale.replace('_', '-'), // Convert en_GB to en-GB
  };

  // Add publication date if available
  if (pageData.pubDate) {
    articleSchema.datePublished = pageData.pubDate.toISOString();
  }

  // Add modification date (falls back to publication date)
  if (pageData.updatedDate) {
    articleSchema.dateModified = pageData.updatedDate.toISOString();
  } else if (pageData.pubDate) {
    articleSchema.dateModified = pageData.pubDate.toISOString();
  }

  // Add keywords if tags are available
  if (pageData.tags && pageData.tags.length > 0) {
    articleSchema.keywords = pageData.tags.join(', ');
  }

  return articleSchema;
}

/**
 * Generate article meta tags for OpenGraph
 */
export function generateArticleMeta(
  pageData: SEOData
): Array<{ property: string; content: string }> {
  if (pageData.type !== 'article') return [];

  const metaTags: Array<{ property: string; content: string }> = [
    { property: 'article:author', content: authorName },
    { property: 'article:section', content: ARTICLE_SECTION },
  ];

  // Add publication date
  if (pageData.pubDate) {
    metaTags.push({
      property: 'article:published_time',
      content: pageData.pubDate.toISOString(),
    });
  }

  // Add modification date
  if (pageData.updatedDate) {
    metaTags.push({
      property: 'article:modified_time',
      content: pageData.updatedDate.toISOString(),
    });
  }

  // Add tags
  if (pageData.tags) {
    pageData.tags.forEach(tag => {
      metaTags.push({ property: 'article:tag', content: tag });
    });
  }

  return metaTags;
}

/**
 * Generate OpenGraph image URL
 */
export function generateOGImageUrl(image: string | undefined, baseUrl: string): string {
  if (image) {
    return new URL(image, baseUrl).toString();
  }
  return new URL(DEFAULT_OG_IMAGE, baseUrl).toString();
}

/**
 * Validate and sanitize SEO data
 */
export function validateSEOData(data: Partial<SEOData>): SEOData {
  return {
    title: data.title || 'Untitled',
    description: data.description,
    image: data.image,
    type: data.type || 'website',
    pageType: data.pageType,
    pubDate: data.pubDate,
    updatedDate: data.updatedDate,
    tags: data.tags || [],
  };
}

/**
 * Get site configuration values
 */
export function getSiteConfig() {
  return {
    name: CONFIG.site.shortName,
    locale: CONFIG.site.locale,
    themeColor: CONFIG.site.themeColor,
    robotsDirective: ROBOTS_DIRECTIVE,
    author: authorName,
    twitterHandle: `@${CONFIG.author.twitter}`,
    twitterCardType: TWITTER_CARD_TYPE,
    defaultOgImage: DEFAULT_OG_IMAGE,
  };
}
