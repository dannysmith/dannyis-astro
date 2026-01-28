/**
 * Resolved Site Configuration
 *
 * This is the single entry point for all configuration.
 * - Raw values come from CONFIG in site.ts
 * - Derived values (fullName, URLs, etc.) are computed here
 * - Technical SEO constants are defined here
 *
 * Usage: import { getConfig } from '@config/config';
 *        const config = getConfig();
 */

import { CONFIG } from './site';

// ============================================================================
// Resolved Configuration
// Computed once at module load for efficiency
// ============================================================================

const resolvedConfig = {
  // Spread all of CONFIG - any new keys automatically pass through
  ...CONFIG,

  // Enhanced site section with derived URLs
  site: {
    ...CONFIG.site,
  },

  // Enhanced author section with derived values
  author: {
    ...CONFIG.author,
    fullName: `${CONFIG.author.givenName} ${CONFIG.author.familyName}`,
    avatarUrl: `${CONFIG.site.url}${CONFIG.author.avatar}`,
    avatarCircleUrl: `${CONFIG.site.url}${CONFIG.author.avatarCircle}`,
    twitterHandle: `@${CONFIG.author.twitter}`,
  },

  // Technical SEO constants (rarely change, but logically part of config)
  seo: {
    robotsDirective:
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    twitterCardType: 'summary_large_image' as const,
    defaultOgImage: '/og-default.png',
    articleSection: 'Remote Work & Leadership',
    searchAction: {
      target: `${CONFIG.site.url}/search?q={search_term_string}`,
      queryInput: 'required name=search_term_string',
    },
  },
} as const;

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the fully-resolved site configuration.
 * Includes all raw CONFIG values plus derived values and technical constants.
 */
export function getConfig() {
  return resolvedConfig;
}

/**
 * Type for the resolved configuration.
 * Useful for typing function parameters that accept config.
 */
export type SiteConfig = ReturnType<typeof getConfig>;
