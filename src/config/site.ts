// =============================================================================
// SITE CONFIGURATION
// Edit this object - everything else derives from it
// =============================================================================

export const CONFIG = {
  // -------------------------------------------------------------------------
  // Site Identity
  // -------------------------------------------------------------------------
  site: {
    name: 'Danny Smith', // Full display name (also author name)
    shortName: 'danny.is', // Used in manifest, OG
    url: 'https://danny.is',
    locale: 'en_GB',
    themeColor: '#1a1a1a',
  },

  // -------------------------------------------------------------------------
  // Author Identity
  // -------------------------------------------------------------------------
  author: {
    givenName: 'Danny',
    familyName: 'Smith',
    email: 'hi@danny.is', // Identity email (schema, metadata)
    contactEmail: 'hi+website@danny.is', // For mailto links (tracking)
    location: 'London, UK',
    jobTitle: 'Remote Work Consultant',
    extendedTitle: 'Operations & Leadership Expert',
    fediverse: '@dannysmith@indieweb.social',
    twitter: 'dannysmith',
    avatar: '/avatar.jpg',
    avatarCircle: '/avatar-circle.png', // Pre-cropped for OG images
  },

  // -------------------------------------------------------------------------
  // Descriptions (used in different contexts)
  // -------------------------------------------------------------------------
  descriptions: {
    // Short one-liner (meta tags, manifest, Twitter bio style)
    short: 'Remote work consultant and organizational health expert.',

    // Medium - site description (RSS feeds, schema.org Website)
    site: 'Remote work consultant and organizational health expert. Articles and insights on leadership, remote work, and business operations.',

    // Author bio (schema.org Person, llms.txt about section)
    author:
      'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.',

    // Organization (schema.org Organization - consulting business)
    organization:
      'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.',
  },

  // -------------------------------------------------------------------------
  // Page Title Templates
  // Use {title} as placeholder - replaced at runtime
  // -------------------------------------------------------------------------
  pageTitleTemplates: {
    article: '{title} | Danny Smith - Operations & Leadership Expert',
    note: '{title} | Quick Note by Danny Smith',
    page: '{title} | Danny Smith - Operations & Leadership Expert',
    default: '{title} | Danny Smith',
  },

  // -------------------------------------------------------------------------
  // Page-specific descriptions (for index pages)
  // -------------------------------------------------------------------------
  pageDescriptions: {
    articles:
      'In-depth articles on remote work, organizational health, leadership, and business operations.',
    notes:
      'Short-form thoughts and observations on remote work, technology, and business operations.',
    now: 'Current projects and focus areas.',
  },

  // -------------------------------------------------------------------------
  // Social Profiles
  // All external profiles - used by SocialLinks, llms.txt, schema.org sameAs
  // -------------------------------------------------------------------------
  socialProfiles: [
    {
      id: 'bluesky',
      name: 'BlueSky',
      url: 'https://bsky.app/profile/danny.is',
      icon: 'social/bluesky',
      showInFooter: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/dannyasmith',
      icon: 'social/linkedin',
      showInFooter: true,
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com/dannysmith',
      icon: 'social/github',
      showInFooter: true,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA',
      icon: 'social/youtube',
      showInFooter: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://instagram.com/dannysmith',
      icon: 'social/instagram',
      showInFooter: true,
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      url: 'https://indieweb.social/@dannysmith',
      icon: 'social/mastodon',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      url: 'https://twitter.com/dannysmith',
      icon: 'social/twitter',
    },
  ],

  // -------------------------------------------------------------------------
  // External Links (non-social, for llms.txt and elsewhere)
  // -------------------------------------------------------------------------
  externalLinks: [
    {
      id: 'consulting',
      name: 'Better at Work',
      url: 'https://betterat.work',
      description: 'Consulting practice',
    },
    {
      id: 'toolbox',
      name: 'Toolbox',
      url: 'https://betterat.work/toolbox',
      description: 'Collection of tools and frameworks',
    },
  ],

  // -------------------------------------------------------------------------
  // Organization (for schema.org - the consulting business, separate from personal)
  // -------------------------------------------------------------------------
  organization: {
    name: 'Danny Smith Consulting',
    // URL and logo derived from site.url and author.avatar
    // Description in descriptions.organization
  },
} as const;

// Raw config only - consuming code should use getConfig() from @config/config
// which provides derived values (fullName, avatarUrl, etc.) plus technical constants.
