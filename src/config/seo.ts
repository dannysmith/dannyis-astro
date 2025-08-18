/**
 * Centralized SEO Configuration
 *
 * All SEO-related constants, templates, and configuration in one place.
 * Update personal branding, job titles, and descriptions here to affect the entire site.
 */

// Personal & Business Information
export const AUTHOR = {
  name: 'Danny Smith',
  givenName: 'Danny',
  familyName: 'Smith',
  jobTitle: 'Remote Work Consultant',
  email: 'hi@danny.is',
  website: 'https://danny.is',
  image: 'https://danny.is/danny-smith.jpg',
  description:
    'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.',
} as const;

// Business Information
export const ORGANIZATION = {
  name: 'Danny Smith Consulting',
  url: 'https://danny.is',
  logo: 'https://danny.is/icon.jpg',
  description:
    'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.',
} as const;

// Social Media Profiles
export const SOCIAL_PROFILES = [
  'https://linkedin.com/in/danny-smith-uk',
  'https://github.com/dannysmith',
  'https://twitter.com/dannyfsmith',
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
  article: (title: string) => `${title} | Danny Smith - Operations & Leadership Expert`,
  note: (title: string) => `${title} | Quick Take by Danny Smith`,
  page: (title: string) => `${title} | Danny Smith - Operations & Leadership Expert`,
  default: (title: string) => `${title} | Danny Smith`,
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
  site: '@dannyfsmith',
} as const;

// Page-specific default descriptions
export const PAGE_DESCRIPTIONS = {
  articles:
    'In-depth articles on remote work, organizational health, leadership, and business operations by consultant Danny Smith',
  notes: 'Short-form thoughts and observations on remote work, technology, and business operations',
  now: 'Current projects and focus areas for remote work & operations consultant Danny Smith',
} as const;

// Schema.org structured data configuration
export const SCHEMA_CONFIG = {
  website: {
    '@type': 'WebSite' as const,
    '@id': `${AUTHOR.website}/#website`,
    url: AUTHOR.website,
    name: AUTHOR.name,
    description:
      'Remote work consultant and organizational health expert. Articles and insights on leadership, remote work, and business operations.',
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
