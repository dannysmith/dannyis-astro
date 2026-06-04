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
    extendedTitle: '',
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
    // Used as the AI summary at the top of llms.txt
    aiSummary:
      'Danny Smith is a remote work consultant based in London. This is his personal website where he shares articles and notes on remote work, leadership, and technology.',
  },

  // Page title templates ({title} replaced at runtime)
  pageTitleTemplates: {
    article: '{title} | Danny Smith',
    note: '{title} | Quick Note by Danny Smith',
    page: '{title} | Danny Smith',
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

  // Self-hosted video host (LoomClone). Used by <LCVid> MDX component.
  videos: {
    baseUrl: 'https://v.danny.is',
  },

  // standard.site (AT Protocol) publishing. Posts are mirrored to the Bluesky
  // PDS as site.standard.document records. See
  // docs/tasks-todo/task-x-standard-site-atproto.md for setup. The empty fields
  // are typed `as string` so reads stay `string` (CONFIG is `as const`, which
  // would otherwise narrow '' to the literal type "" and break null checks).
  standardSite: {
    // AT Protocol DID for danny.is. Filled in during setup (resolve from the
    // Bluesky handle, e.g. via com.atproto.identity.resolveHandle).
    did: 'did:plc:aes3lokiqtv63fk62nwnjeuf' as string,
    // Bluesky handle that owns the records / used to log in.
    handle: 'danny.is',
    // AT-URI of the site.standard.publication record. Empty until created via
    // scripts/standard-site/create-publication.ts. When empty: the /.well-known
    // endpoint 404s and the homepage publication link tag is omitted.
    publicationUri:
      'at://did:plc:aes3lokiqtv63fk62nwnjeuf/site.standard.publication/3mnin5cnq2q2a' as string,
    // Only posts on/after this cutoff get a record + link tag. Set before the
    // first post (2012-06-05) so the whole backfilled corpus qualifies.
    since: '2000-01-01',
  },
} as const;
