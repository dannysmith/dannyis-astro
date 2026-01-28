/**
 * Resolved Site Configuration
 *
 * Single entry point for all configuration. Spreads CONFIG and adds:
 * - Derived values (fullName, avatarUrl, etc.)
 * - Technical SEO constants
 *
 * Usage: import { getConfig } from '@config/config';
 */

import { CONFIG } from './site';

const resolvedConfig = {
  ...CONFIG,

  // Author with derived values
  author: {
    ...CONFIG.author,
    fullName: `${CONFIG.author.givenName} ${CONFIG.author.familyName}`,
    avatarUrl: `${CONFIG.site.url}${CONFIG.author.avatar}`,
    avatarCircleUrl: `${CONFIG.site.url}${CONFIG.author.avatarCircle}`,
    twitterHandle: `@${CONFIG.author.twitter}`,
  },

  // Technical SEO constants
  seo: {
    robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    twitterCardType: 'summary_large_image' as const,
    defaultOgImage: '/og-default.png',
    articleSection: 'Remote Work & Leadership',
    searchAction: {
      target: `${CONFIG.site.url}/search?q={search_term_string}`,
      queryInput: 'required name=search_term_string',
    },
  },
} as const;

export function getConfig() {
  return resolvedConfig;
}

export type SiteConfig = ReturnType<typeof getConfig>;
