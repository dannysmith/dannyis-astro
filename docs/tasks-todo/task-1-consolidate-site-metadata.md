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

## Phase 1a: Create Unified Site Config

### Create `src/config/site.ts`

Single CONFIG object - this is the only thing exported. All consuming code imports CONFIG and accesses the keys it needs.

```typescript
// =============================================================================
// SITE CONFIGURATION
// Edit this object - everything else derives from it
// =============================================================================

export const CONFIG = {
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
    twitter: 'dannysmith',
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
  // Organization (for schema.org - the consulting business, separate from personal)
  // -------------------------------------------------------------------------
  organization: {
    name: 'Danny Smith Consulting',
    // URL and logo derived from site.url and author.avatar
    // Description in descriptions.organization
  },
} as const;

// That's it. No derived exports.
// Consuming code does: import { CONFIG } from '@config/site'
// Then accesses: CONFIG.site.name, CONFIG.author.email, etc.
```

**Note:** `robotsDirective` and `articleSection` are hardcoded in `utils/seo.ts` - they're technical values that rarely change.

---

### Implementation Notes & Gotchas

**Things to hardcode in utils/seo.ts (not in CONFIG):**
- `robotsDirective` - technical SEO directive
- `articleSection` - OpenGraph article categorization ('Remote Work & Leadership')
- `searchAction` - JSON-LD site search config (URL pattern + query input)
- `defaultOgImage` - '/og-default.png'
- `twitterCardType` - 'summary_large_image'

**Types to define in utils/seo.ts:**
- `PageType = 'article' | 'note' | 'page'`
- `SEOData` interface (title, description, image, type, pageType, pubDate, updatedDate, tags)

**SCHEMA_CONFIG reconstruction:**
The current `SCHEMA_CONFIG` is a pre-built object with `@type`, `@id`, etc. This needs to be reconstructed in `utils/seo.ts` from CONFIG values. The `generateJSONLD()` function already does most of this work - it just needs updating to use CONFIG directly instead of importing pre-built objects.

**CONTENT_PATHS:**
Currently exported but never used anywhere. Can be safely ignored/removed.

**Organization vs Author:**
- `CONFIG.organization.name` = 'Danny Smith Consulting' (the business)
- `CONFIG.site.name` = 'Danny Smith' (the person/site)
These are intentionally different. The organization schema.org data uses the business name.

**Tests exist:**
`tests/unit/seo.test.ts` tests the utility functions. These import from `utils/seo.ts` (not config), so they should continue working. Run `bun run test:unit` after Phase 1a to verify nothing breaks.

**RSS feed titles:**
The RSS autodiscovery links in BaseHead have hardcoded titles like "Danny Smith - Articles & Notes". The actual RSS feed files use `${SITE_TITLE} - Articles & Notes`. These currently match, which is good.

Options:
- Keep BaseHead hardcoded (simpler, titles rarely change)
- Interpolate just the name: `` `${CONFIG.site.name} - Articles & Notes` `` (consistent with feeds)

Either is fine - the suffix part ("- Articles & Notes") should stay near where it's used regardless. This is low priority and could be left as-is.

---

### Refactor `src/utils/seo.ts`

- Import `CONFIG` from `site.ts`
- Update all functions to use `CONFIG.x.y` syntax
- Add helper for full author name: `const authorName = \`${CONFIG.author.givenName} ${CONFIG.author.familyName}\``
- Update `generatePageTitle()` to use template string replacement:

```typescript
export function generatePageTitle(title: string, pageType?: PageType): string {
  if (!pageType || title === CONFIG.site.name) return title;
  const template = CONFIG.pageTitleTemplates[pageType] || CONFIG.pageTitleTemplates.default;
  return template.replace('{title}', title);
}
```

- Hardcode `robotsDirective` and `articleSection` values directly in the functions that use them

### Delete `src/config/seo.ts`

No longer needed - config is in `site.ts`, utilities stay in `utils/seo.ts`.

### Update `src/utils/og-branding.ts`

```typescript
import { CONFIG } from '@config/site';

const authorName = `${CONFIG.author.givenName} ${CONFIG.author.familyName}`;
export const OG_AUTHOR_NAME = authorName;
export const OG_PROFILE_IMAGE = `${CONFIG.site.url}${CONFIG.author.avatarCircle}`;
```

---

## Phase 1b: Update All Consuming Code

After Phase 1a works, refactor all files that currently import from `@config/seo` to import `CONFIG` from `@config/site` instead.

**Files to update:**

| File | Current Import | Change To |
|------|----------------|-----------|
| `src/components/layout/BaseHead.astro` | `OG_CONFIG`, `TWITTER_CONFIG` | `CONFIG` (access `CONFIG.site.shortName`, `CONFIG.site.locale`, `CONFIG.author.twitter`) |
| `src/pages/index.astro` | `SITE_TITLE`, `SITE_DESCRIPTION` | `CONFIG` (access `CONFIG.site.name`, `CONFIG.descriptions.site`) |
| `src/pages/rss.xml.js` | `SITE_TITLE`, `SITE_DESCRIPTION` | `CONFIG` |
| `src/pages/rss/articles.xml.js` | `SITE_TITLE`, `SITE_DESCRIPTION` | `CONFIG` |
| `src/pages/rss/notes.xml.js` | `SITE_TITLE`, `SITE_DESCRIPTION` | `CONFIG` |
| `src/pages/llms.txt.ts` | `SITE_TITLE`, `SITE_URL`, `AUTHOR`, `SOCIAL_PROFILES` | `CONFIG` |
| `src/pages/writing/[...slug]/og-image.png.ts` | `SITE_URL` | `CONFIG` |
| `src/pages/notes/[...slug]/og-image.png.ts` | `SITE_URL` | `CONFIG` |

This is a straightforward find-and-replace refactor. Each file imports `CONFIG` and accesses the specific keys it needs.

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
- Auto-generate "Other Pages" by scanning actual pages
- Use CONFIG.socialProfiles and CONFIG.externalLinks
- Import Now content from `_now.md`

### Phase 4: Update SocialLinks Component
- `SocialLinks.astro` - iterate over `CONFIG.socialProfiles.filter(p => p.showInFooter)`

### Phase 5: Generate site.webmanifest
- Create `src/pages/site.webmanifest.ts`
- Delete `public/site.webmanifest`

### Phase 6: Generate humans.txt (optional)
- Create `src/pages/humans.txt.ts`
- Delete `public/humans.txt`

### Phase 7: Extract Redirects (optional, separate concern)
- Create `redirects.js` in project root
- Import into `astro.config.mjs`

---

## Files Changed Summary

### Phase 1a
| File | Action |
|------|--------|
| `src/config/site.ts` | **NEW** - Single source of truth (exports only CONFIG) |
| `src/config/seo.ts` | **DELETE** - Merged into site.ts + utils/seo.ts |
| `src/utils/seo.ts` | Refactor - Import CONFIG, update all functions |
| `src/utils/og-branding.ts` | Refactor - Import CONFIG |

### Phase 1b
| File | Action |
|------|--------|
| `src/components/layout/BaseHead.astro` | Refactor - Use CONFIG directly |
| `src/pages/index.astro` | Refactor - Use CONFIG directly |
| `src/pages/rss.xml.js` | Refactor - Use CONFIG directly |
| `src/pages/rss/articles.xml.js` | Refactor - Use CONFIG directly |
| `src/pages/rss/notes.xml.js` | Refactor - Use CONFIG directly |
| `src/pages/llms.txt.ts` | Refactor - Use CONFIG directly |
| `src/pages/writing/[...slug]/og-image.png.ts` | Refactor - Use CONFIG directly |
| `src/pages/notes/[...slug]/og-image.png.ts` | Refactor - Use CONFIG directly |

### Phase 2
| File | Action |
|------|--------|
| `src/pages/now.astro` | **MOVE** → `src/pages/now/index.astro` |
| `src/pages/now/_now.md` | **NEW** - Now page content |
| `src/pages/llms.txt.ts` | Update - Import now.md raw content |

---

## Out of Scope

- **Homepage (`index.astro`)** - Keeps hardcoded presentation (purely visual)
- **PersonalLogo, Footer name** - Keeps hardcoded (purely presentational)
- **Email difference** - Intentional: `email` for identity, `contactEmail` for mailto links
- **Avatar vs avatarCircle** - Both needed, different use cases
- **Redirects in astro.config.mjs** - Separate concern, optional extraction later
