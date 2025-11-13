/**
 * Centralized SEO Configuration
 *
 * All SEO-related constants, templates, and configuration in one place.
 * Update personal branding, job titles, and descriptions here to affect the entire site.
 *
 * STRUCTURE:
 * - Primitives section contains single sources of truth
 * - All other values are derived from primitives to ensure consistency
 */

// ============================================================================
// PRIMITIVES (Single Source of Truth)
// ============================================================================

const GIVEN_NAME = 'Danny';
const FAMILY_NAME = 'Smith';
const FULL_NAME = `${GIVEN_NAME} ${FAMILY_NAME}`;

const SITE_URL_BASE = 'https://danny.is' as const;
const EMAIL = 'hi@danny.is';
const AVATAR_PATH = '/avatar.jpg';

const PRIMARY_JOB_TITLE = 'Remote Work Consultant';
const EXTENDED_JOB_TITLE = 'Operations & Leadership Expert';

const SOCIAL_HANDLES = {
  twitter: 'dannysmith',
  linkedin: 'dannyasmith',
  github: 'dannysmith',
} as const;

const SITE_DESCRIPTION_TEXT =
  'Remote work consultant and organizational health expert. Articles and insights on leadership, remote work, and business operations.';

const AUTHOR_DESCRIPTION_TEXT =
  'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.';

const ORGANIZATION_NAME = 'Danny Smith Consulting';
const ORGANIZATION_DESCRIPTION_TEXT =
  'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.';

// ============================================================================
// DERIVED VALUES
// ============================================================================

// Site-level Constants
export const SITE_TITLE = FULL_NAME;
export const SITE_DESCRIPTION = SITE_DESCRIPTION_TEXT;

/**
 * Base site URL - used for canonical URLs, OG images, RSS feeds
 * Do not include trailing slash
 */
export const SITE_URL = SITE_URL_BASE;

/**
 * Content type URL prefixes
 */
export const CONTENT_PATHS = {
  articles: '/writing',
  notes: '/notes',
} as const;

// Personal & Business Information
export const AUTHOR = {
  name: FULL_NAME,
  givenName: GIVEN_NAME,
  familyName: FAMILY_NAME,
  jobTitle: PRIMARY_JOB_TITLE,
  email: EMAIL,
  website: SITE_URL_BASE,
  image: `${SITE_URL_BASE}${AVATAR_PATH}`,
  description: AUTHOR_DESCRIPTION_TEXT,
} as const;

// Business Information
export const ORGANIZATION = {
  name: ORGANIZATION_NAME,
  url: SITE_URL_BASE,
  logo: `${SITE_URL_BASE}${AVATAR_PATH}`,
  description: ORGANIZATION_DESCRIPTION_TEXT,
} as const;

// Social Media Profiles
export const SOCIAL_PROFILES = [
  `https://linkedin.com/in/${SOCIAL_HANDLES.linkedin}`,
  `https://github.com/${SOCIAL_HANDLES.github}`,
  `https://twitter.com/${SOCIAL_HANDLES.twitter}`,
] as const;

// Site Configuration
export const SITE_CONFIG = {
  name: 'danny.is',
  locale: 'en_GB',
  themeColor: '#1a1a1a',
  robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  searchAction: {
    target: 'https://danny.is/search?q={search_term_string}',
    queryInput: 'required name=search_term_string',
  },
} as const;

// Title Templates
export const TITLE_TEMPLATES = {
  article: (title: string) => `${title} | ${FULL_NAME} - ${EXTENDED_JOB_TITLE}`,
  note: (title: string) => `${title} | Quick Note by ${FULL_NAME}`,
  page: (title: string) => `${title} | ${FULL_NAME} - ${EXTENDED_JOB_TITLE}`,
  default: (title: string) => `${title} | ${FULL_NAME}`,
} as const;

// Article-Specific Configuration
export const ARTICLE_CONFIG = {
  author: AUTHOR.name,
  section: 'Remote Work & Leadership',
} as const;

// OpenGraph Configuration
export const OG_CONFIG = {
  siteName: SITE_CONFIG.name,
  locale: SITE_CONFIG.locale,
  defaultImage: '/og-default.png',
} as const;

// Twitter Configuration
export const TWITTER_CONFIG = {
  card: 'summary_large_image',
  site: `@${SOCIAL_HANDLES.twitter}`,
} as const;

// Page-specific default descriptions
export const PAGE_DESCRIPTIONS = {
  articles: `In-depth articles on remote work, organizational health, leadership, and business operations by consultant ${FULL_NAME}`,
  notes: 'Short-form thoughts and observations on remote work, technology, and business operations',
  now: `Current projects and focus areas for remote work & operations consultant ${FULL_NAME}`,
} as const;

// Schema.org structured data configuration
export const SCHEMA_CONFIG = {
  website: {
    '@type': 'WebSite' as const,
    '@id': `${AUTHOR.website}/#website`,
    url: AUTHOR.website,
    name: AUTHOR.name,
    description: SITE_DESCRIPTION_TEXT,
  },
  person: {
    '@type': 'Person' as const,
    '@id': `${AUTHOR.website}/#person`,
    name: AUTHOR.name,
    givenName: AUTHOR.givenName,
    familyName: AUTHOR.familyName,
    url: AUTHOR.website,
    image: AUTHOR.image,
    sameAs: SOCIAL_PROFILES,
    jobTitle: AUTHOR.jobTitle,
    description: AUTHOR.description,
  },
  organization: {
    '@type': 'Organization' as const,
    '@id': `${AUTHOR.website}/#organization`,
    name: ORGANIZATION.name,
    url: ORGANIZATION.url,
    logo: ORGANIZATION.logo,
    description: ORGANIZATION.description,
  },
} as const;

// TypeScript types for better development experience
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
