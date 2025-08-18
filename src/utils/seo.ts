/**
 * SEO Utility Functions
 *
 * Clean, testable functions for generating SEO metadata.
 * All complex logic extracted from components for better maintainability.
 */

import {
  TITLE_TEMPLATES,
  AUTHOR,
  SITE_CONFIG,
  SCHEMA_CONFIG,
  ARTICLE_CONFIG,
  type PageType,
  type SEOData,
} from '@config/seo';

/**
 * Generate page title using configured templates
 */
export function generatePageTitle(title: string, pageType?: PageType): string {
  // Don't modify the homepage title or if no pageType is specified
  if (!pageType || title === AUTHOR.name) {
    return title;
  }

  const template = TITLE_TEMPLATES[pageType] || TITLE_TEMPLATES.default;
  return template(title);
}

/**
 * Generate meta description with consistent branding
 */
export function generateMetaDescription(description?: string): string | undefined {
  if (!description) return undefined;
  return `${description} | ${AUTHOR.name}`;
}

/**
 * Generate JSON-LD structured data for a page
 */
export function generateJSONLD(
  pageData: SEOData,
  canonicalUrl: string,
  ogImageUrl: string
): Record<string, unknown> {
  const baseGraph = [
    // Person Schema
    {
      ...SCHEMA_CONFIG.person,
      worksFor: {
        '@type': 'Organization',
        '@id': `${AUTHOR.website}/#organization`,
      },
    },
    // Organization Schema
    {
      ...SCHEMA_CONFIG.organization,
      founder: {
        '@type': 'Person',
        '@id': `${AUTHOR.website}/#person`,
      },
    },
    // Website Schema
    {
      ...SCHEMA_CONFIG.website,
      publisher: {
        '@type': 'Person',
        '@id': `${AUTHOR.website}/#person`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: SITE_CONFIG.searchAction.target,
        },
        'query-input': SITE_CONFIG.searchAction.queryInput,
      },
    },
  ];

  // Add article/blog posting schema for content pages
  if (pageData.pageType === 'article' || pageData.pageType === 'note') {
    baseGraph.push(generateArticleSchema(pageData, canonicalUrl, ogImageUrl) as never);
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
      '@id': `${AUTHOR.website}/#person`,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${AUTHOR.website}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    inLanguage: SITE_CONFIG.locale.replace('_', '-'), // Convert en_GB to en-GB
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
    { property: 'article:author', content: ARTICLE_CONFIG.author },
    { property: 'article:section', content: ARTICLE_CONFIG.section },
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
  return new URL('/og-default.png', baseUrl).toString();
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
    name: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    themeColor: SITE_CONFIG.themeColor,
    robotsDirective: SITE_CONFIG.robotsDirective,
    author: AUTHOR.name,
  };
}
