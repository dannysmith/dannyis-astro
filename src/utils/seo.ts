/**
 * SEO Utility Functions
 *
 * Pure functions for generating SEO metadata.
 * All configuration comes from getConfig().
 */

import { getConfig } from '@config/config';

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
// Public Functions
// ============================================================================

/**
 * Generate page title using configured templates
 */
export function generatePageTitle(title: string, pageType?: PageType): string {
  const config = getConfig();

  // Don't modify the homepage title or if no pageType is specified
  if (!pageType || title === config.site.name) {
    return title;
  }

  const template = config.pageTitleTemplates[pageType] || config.pageTitleTemplates.default;
  return template.replace('{title}', title);
}

/**
 * Generate meta description with consistent branding
 */
export function generateMetaDescription(description?: string): string | undefined {
  if (!description) return undefined;
  const config = getConfig();
  return `${description} | ${config.author.fullName}`;
}

/**
 * Generate JSON-LD structured data for a page
 */
export function generateJSONLD(
  pageData: SEOData,
  canonicalUrl: string,
  ogImageUrl: string
): Record<string, unknown> {
  const config = getConfig();
  const siteUrl = config.site.url;

  const personSchema = {
    '@type': 'Person' as const,
    '@id': `${siteUrl}/#person`,
    name: config.author.fullName,
    givenName: config.author.givenName,
    familyName: config.author.familyName,
    url: siteUrl,
    image: config.author.avatarUrl,
    sameAs: config.socialProfiles.map(p => p.url),
    jobTitle: config.author.jobTitle,
    description: config.descriptions.author,
    worksFor: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
    },
  };

  const organizationSchema = {
    '@type': 'Organization' as const,
    '@id': `${siteUrl}/#organization`,
    name: config.organization.name,
    url: siteUrl,
    logo: config.author.avatarUrl,
    description: config.descriptions.organization,
    founder: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
    },
  };

  const websiteSchema = {
    '@type': 'WebSite' as const,
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: config.author.fullName,
    description: config.descriptions.site,
    publisher: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: config.seo.searchAction.target,
      },
      'query-input': config.seo.searchAction.queryInput,
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
  const config = getConfig();
  const siteUrl = config.site.url;

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
    inLanguage: config.site.locale.replace('_', '-'), // Convert en_GB to en-GB
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

  const config = getConfig();

  const metaTags: Array<{ property: string; content: string }> = [
    { property: 'article:author', content: config.author.fullName },
    { property: 'article:section', content: config.seo.articleSection },
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
  const config = getConfig();

  if (image) {
    return new URL(image, baseUrl).toString();
  }
  return new URL(config.seo.defaultOgImage, baseUrl).toString();
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
