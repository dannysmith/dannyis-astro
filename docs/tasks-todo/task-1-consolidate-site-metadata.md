# Consolidate Site Metadata & Config

## Goal

Create a single source of truth for all site metadata that's easy to edit and automatically propagates everywhere it's needed. One CONFIG object to rule them all.

---

## Metadata Usage Map

Before designing the solution, here's where metadata is actually used:

### 1. Page Titles (BaseHead via utils/seo.ts)

**What's needed:** Author name, job title variations

**Current templates:**
- Articles: `"{title} | Danny Smith - Operations & Leadership Expert"`
- Notes: `"{title} | Quick Note by Danny Smith"`
- Pages: `"{title} | Danny Smith - Operations & Leadership Expert"`
- Homepage: Just `"Danny Smith"` (no suffix)

**Source:** `TITLE_TEMPLATES` in seo.ts

### 2. JSON-LD Schemas (utils/seo.ts → BaseHead)

**What's needed:** Full identity data

- **Person schema:** name, givenName, familyName, jobTitle, description, image, sameAs (social URLs)
- **Organization schema:** name, url, logo, description
- **Website schema:** name, url, description, searchAction config
- **BlogPosting schema:** (per-article, uses author/org refs)

**Source:** `SCHEMA_CONFIG`, `AUTHOR`, `ORGANIZATION` in seo.ts

### 3. Meta Tags (BaseHead)

| Tag | Value needed |
|-----|--------------|
| `<title>` | Generated page title |
| `name="description"` | Page description + author name appended |
| `name="author"` | Author full name |
| `name="robots"` | Robots directive |
| `name="theme-color"` | Theme color |
| `og:site_name` | Site short name (danny.is) |
| `og:locale` | Locale (en_GB) |
| `twitter:site` | Twitter handle |
| `fediverse:creator` | Fediverse handle (**currently hardcoded**) |

**Source:** Mix of `SITE_CONFIG`, `OG_CONFIG`, `TWITTER_CONFIG`, plus hardcoded fediverse

### 4. RSS Feed Titles (BaseHead autodiscovery + feed files)

**Currently hardcoded in BaseHead:**
- "Danny Smith - Articles & Notes"
- "Danny Smith - Articles"
- "Danny Smith - Notes"

**Feed files use:** `SITE_TITLE`, `SITE_DESCRIPTION`

### 5. OG Images (og-branding.ts, og-templates.ts)

**What's needed:**
- Author name (for byline)
- Profile image URL (avatar-circle.png)
- Site domain text ("danny.is")

**Source:** `og-branding.ts` has own constants (**duplicated**)

### 6. llms.txt

**What's needed:**
- Site name, URL
- Author info, social profiles
- Bio/about description
- Now page content (from markdown)
- List of pages

**Source:** Currently mix of config + hardcoded prose

### 7. Microformats/Schema.org in HTML (index.astro)

**What's needed:**
- givenName, familyName (separately)
- Email (with +website tracking suffix)
- Profile image

**Source:** Currently hardcoded in index.astro

### 8. site.webmanifest

**What's needed:**
- name: "Danny Smith"
- short_name: "danny.is"
- description: Short site description
- theme_color, background_color

**Source:** Static file (**duplicated from config**)

### 9. humans.txt

**What's needed:**
- Author name
- Location
- Site URL

**Source:** Static file (**duplicated**)

---

## Current Problems

1. **Social profiles incomplete:** Only 3 in `SOCIAL_PROFILES` (LinkedIn, GitHub, Twitter), missing Bluesky, Mastodon, Instagram, YouTube

2. **Hardcoded values scattered:**
   - Fediverse handle in BaseHead
   - RSS titles in BaseHead
   - Author name in og-branding.ts
   - All values in site.webmanifest, humans.txt

3. **Description confusion:** Multiple description-like values with unclear purposes:
   - `SITE_DESCRIPTION`
   - `AUTHOR.description`
   - `ORGANIZATION.description`
   - `PAGE_DESCRIPTIONS.articles/notes/now`

4. **Now page content duplicated:** Inline HTML in now.astro, prose copy in llms.txt.ts

---

## End Result (User Experience)

After this work:

1. **One CONFIG object to edit:** All site metadata at the top of `src/config/site.ts`. Change job title, add a social profile, update bio - one place.

2. **Now page as markdown:** Edit `src/pages/now/_now.md` directly. Both `now.astro` and `llms.txt` use the same content.

3. **Auto-generated files:** `site.webmanifest` and `humans.txt` generated at build time.

4. **Smarter llms.txt:** Uses config for all metadata, imports Now markdown directly.

5. **SocialLinks uses config:** Add a profile to CONFIG, it appears in footer automatically.

---

## Phase 1: Unified Site Config

### Create `src/config/site.ts`

Single CONFIG object at top, derived exports below. The object should be comprehensive but not over-abstracted:

```typescript
// =============================================================================
// SITE CONFIGURATION
// Edit this object - everything else derives from it
// =============================================================================

const CONFIG = {
  // -------------------------------------------------------------------------
  // Site Identity
  // -------------------------------------------------------------------------
  site: {
    name: 'Danny Smith',              // Full display name (also author name)
    shortName: 'danny.is',            // Used in manifest, OG
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
    email: 'hi@danny.is',              // Identity email (schema, metadata)
    contactEmail: 'hi+website@danny.is', // For mailto links (tracking)
    location: 'London, UK',
    jobTitle: 'Remote Work Consultant',
    extendedTitle: 'Operations & Leadership Expert',
    fediverse: '@dannysmith@indieweb.social',
    avatar: '/avatar.jpg',
    avatarCircle: '/avatar-circle.png',  // Pre-cropped for OG images
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
    author: 'Remote work consultant and organizational health expert helping companies build healthy remote teams and optimize operations.',

    // Organization (schema.org Organization - consulting business)
    organization: 'Consulting services specializing in remote work, organizational health, leadership coaching, and business operations optimization.',
  },

  // -------------------------------------------------------------------------
  // Page-specific descriptions (for index pages)
  // -------------------------------------------------------------------------
  pageDescriptions: {
    articles: 'In-depth articles on remote work, organizational health, leadership, and business operations.',
    notes: 'Short-form thoughts and observations on remote work, technology, and business operations.',
    now: 'Current projects and focus areas.',
  },

  // -------------------------------------------------------------------------
  // Social Profiles
  // All external profiles - used by SocialLinks, llms.txt, schema.org sameAs
  // -------------------------------------------------------------------------
  socialProfiles: [
    { id: 'bluesky', name: 'BlueSky', url: 'https://bsky.app/profile/danny.is', icon: 'social/bluesky', showInFooter: true },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/in/dannyasmith', icon: 'social/linkedin', showInFooter: true },
    { id: 'github', name: 'GitHub', url: 'https://github.com/dannysmith', icon: 'social/github', showInFooter: true },
    { id: 'youtube', name: 'YouTube', url: 'https://youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA', icon: 'social/youtube', showInFooter: true },
    { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/dannysmith', icon: 'social/instagram', showInFooter: true },
    { id: 'mastodon', name: 'Mastodon', url: 'https://indieweb.social/@dannysmith', icon: 'social/mastodon' },
    { id: 'twitter', name: 'Twitter', url: 'https://twitter.com/dannysmith', icon: 'social/twitter' },
  ],

  // -------------------------------------------------------------------------
  // External Links (non-social, for llms.txt and elsewhere)
  // -------------------------------------------------------------------------
  externalLinks: [
    { id: 'consulting', name: 'Better at Work', url: 'https://betterat.work', description: 'Consulting practice' },
    { id: 'toolbox', name: 'Toolbox', url: 'https://betterat.work/toolbox', description: 'Collection of tools and frameworks' },
  ],

  // -------------------------------------------------------------------------
  // SEO & Technical
  // -------------------------------------------------------------------------
  seo: {
    articleSection: 'Remote Work & Leadership',
    robotsDirective: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    twitterHandle: 'dannysmith',
  },
} as const;

// =============================================================================
// DERIVED EXPORTS
// Import CONFIG and use directly where possible.
// These exports exist for compatibility with existing code.
// =============================================================================

// Full author name (derived)
export const AUTHOR_NAME = `${CONFIG.author.givenName} ${CONFIG.author.familyName}`;

// Re-export the whole config for direct access
export { CONFIG };

// Convenience exports for frequently accessed values
export const SITE_URL = CONFIG.site.url;
export const SITE_TITLE = CONFIG.site.name;
export const SITE_DESCRIPTION = CONFIG.descriptions.site;

// Social profile URLs array (for schema.org sameAs)
export const SOCIAL_PROFILE_URLS = CONFIG.socialProfiles.map(p => p.url);

// Title template functions
export const TITLE_TEMPLATES = {
  article: (title: string) => `${title} | ${AUTHOR_NAME} - ${CONFIG.author.extendedTitle}`,
  note: (title: string) => `${title} | Quick Note by ${AUTHOR_NAME}`,
  page: (title: string) => `${title} | ${AUTHOR_NAME} - ${CONFIG.author.extendedTitle}`,
  default: (title: string) => `${title} | ${AUTHOR_NAME}`,
} as const;
```

### Refactor `src/utils/seo.ts`

- Import from `site.ts` instead of `config/seo.ts`
- Keep the utility functions (generatePageTitle, generateJSONLD, etc.)
- Update to use new CONFIG structure

### Delete `src/config/seo.ts`

No longer needed - everything moves to `site.ts` (config) and `utils/seo.ts` (utilities).

### Update `src/utils/og-branding.ts`

Import author name and avatar from `site.ts`:

```typescript
import { CONFIG, AUTHOR_NAME } from '@config/site';

export const OG_AUTHOR_NAME = AUTHOR_NAME;
export const OG_PROFILE_IMAGE = `${CONFIG.site.url}${CONFIG.author.avatarCircle}`;
```

---

## Phase 2: Now Page as Markdown Partial

### Pattern: Colocated MDX partial

Based on [Astro's markdown import pattern](https://docs.astro.build/en/guides/markdown-content/), we can import markdown directly and render its `Content` component:

```
src/pages/now/
├── index.astro    # Page wrapper with Callout
└── _now.md        # Editable content (underscore = not a route)
```

### Create `src/pages/now/_now.md`

Simple markdown with the Now page content:

```markdown
- [Consulting](https://betterat.work) on leadership, remote working and operations with a few companies.
- Working on [Taskdn](https://tdn.danny.is), a system for managing tasks and projects as plain markdown files.
- Working on [Astro Editor](https://astroeditor.danny.is), a markdown editor for Astro content collections.
- Learning a shit ton about how to work with AI to build stuff fast **and well**.
- Occasionally adding to my [collection of tools and frameworks](https://betterat.work/toolbox).
- Playing at Open Mic nights in my local pub.
- Living in a lovely little mews in Islington, North London.

Updated: 2025-10-04
```

### Move `src/pages/now.astro` → `src/pages/now/index.astro`

Update to import and render the markdown:

```astro
---
import { BaseHead, Footer, MainNavigation } from '@components/layout/index';
import { Callout } from '@components/mdx/index';
import { Content as NowContent } from './_now.md';
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead
      title="Danny's Now Page"
      description="Current projects and focus areas"
      pageType="page"
    />
  </head>
  <body>
    <MainNavigation />
    <main class="content">
      <h1 class="ui-style">What I'm doing now</h1>

      <Callout emoji="💡">
        This is a <a href="https://nownownow.com/about">Now Page</a>.
        Thanks to Derek Sivers for the <a href="https://sive.rs/nowff">idea</a>.
      </Callout>

      <NowContent />
    </main>
    <Footer />
  </body>
</html>
```

### Update `llms.txt.ts`

Import the raw markdown content for the Now section:

```typescript
// Import raw markdown content
import nowMarkdown from './now/_now.md?raw';

// In the generation logic:
lines.push('## Now');
lines.push('');
lines.push(nowMarkdown.trim());
```

---

## Future Phases (to be detailed after Phase 1 & 2)

### Phase 3: Improve llms.txt
- Use CONFIG for all metadata
- Auto-generate "Other Pages" from actual pages
- Import Now content from markdown

### Phase 4: Generate site.webmanifest
- Create `src/pages/site.webmanifest.ts`
- Delete `public/site.webmanifest`

### Phase 5: Generate humans.txt (optional)
- Create `src/pages/humans.txt.ts`
- Delete `public/humans.txt`

### Phase 6: Update Components
- `SocialLinks.astro` - use CONFIG.socialProfiles
- `BaseHead.astro` - use CONFIG for fediverse, RSS titles

### Phase 7: Extract Redirects (optional, separate concern)
- Create `redirects.js` in project root
- Import into `astro.config.mjs`

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/config/site.ts` | **NEW** - Single source of truth |
| `src/config/seo.ts` | **DELETE** - Merged into site.ts |
| `src/utils/seo.ts` | Refactor - Import from site.ts |
| `src/utils/og-branding.ts` | Refactor - Import from site.ts |
| `src/pages/now.astro` | **MOVE** → `src/pages/now/index.astro` |
| `src/pages/now/_now.md` | **NEW** - Now page content |
| `src/pages/llms.txt.ts` | Refactor - Use config + import now.md |

---

## Out of Scope

- **Homepage (`index.astro`)** - Keeps hardcoded presentation (purely visual)
- **PersonalLogo, Footer name** - Keeps hardcoded (purely presentational)
- **Email difference** - Intentional: `email` for identity, `contactEmail` for mailto links
- **Avatar vs avatarCircle** - Both needed, different use cases
- **Redirects in astro.config.mjs** - Separate concern, optional extraction later
