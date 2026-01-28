/**
 * Site Configuration (Raw Data)
 *
 * Edit this file to update site metadata.
 * Consuming code should use getConfig() from @config/config.
 */

export const CONFIG = {
  // Site Identity
  site: {
    name: 'Danny Smith',
    shortName: 'danny.is',
    url: 'https://danny.is',
    locale: 'en_GB',
    themeColor: '#1a1a1a',
  },

  // Author Identity
  author: {
    givenName: 'Danny',
    familyName: 'Smith',
    email: 'hi@danny.is',
    contactEmail: 'hi+website@danny.is', // For mailto links (tracking suffix)
    location: 'London, UK',
    jobTitle: 'Remote Work Consultant',
    extendedTitle: 'Operations & Leadership Expert',
    fediverse: '@dannysmith@indieweb.social',
    twitter: 'dannysmith',
    avatar: '/avatar.jpg',
    avatarCircle: '/avatar-circle.png',
  },

  // Descriptions for different contexts
  descriptions: {
    short: 'Remote work consultant and organizational health expert.',
    site: 'Remote work consultant and organizational health expert. Articles and insights on leadership, remote work, and business operations.',
    author:
      'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.',
    organization:
      'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.',
  },

  // Page title templates ({title} replaced at runtime)
  pageTitleTemplates: {
    article: '{title} | Danny Smith - Operations & Leadership Expert',
    note: '{title} | Quick Note by Danny Smith',
    page: '{title} | Danny Smith - Operations & Leadership Expert',
    default: '{title} | Danny Smith',
  },

  // Default descriptions for index pages
  pageDescriptions: {
    articles:
      'In-depth articles on remote work, organizational health, leadership, and business operations.',
    notes:
      'Short-form thoughts and observations on remote work, technology, and business operations.',
    now: 'Current projects and focus areas.',
  },

  // Social profiles (used by SocialLinks, llms.txt, schema.org sameAs)
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

  // External links (for llms.txt, etc.)
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

  // Organization (for schema.org - the consulting business)
  organization: {
    name: 'Danny Smith Consulting',
  },
} as const;
