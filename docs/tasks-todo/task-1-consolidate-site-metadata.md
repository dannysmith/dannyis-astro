# Consolidate Site Metadata & Config

## Goal

Create a single source of truth for all site metadata (author info, social links, site description, etc.) that's easy to edit and automatically propagates to all the places it's needed: SEO meta tags, llms.txt, OG images, the footer, and generated files like site.webmanifest.

## The Problem

Site metadata is currently scattered across 8+ files:

- `src/config/seo.ts` - Main config, but incomplete social links
- `src/utils/og-branding.ts` - Duplicates author name
- `src/pages/llms.txt.ts` - Hardcoded AI descriptions and Now content
- `src/components/ui/SocialLinks.astro` - Hardcoded social links
- `src/pages/now.astro` - Inline HTML content, duplicated in llms.txt
- `public/site.webmanifest` - Static file duplicating config values
- `astro.config.mjs` - Contains redirect URLs for some social profiles
- Various components with hardcoded values

This makes updates error-prone and tedious.

## End Result (User Experience)

After this work:

1. **One file to edit for metadata**: All site metadata lives in a single `CONFIG` object at the top of `src/config/site.ts`. Change your job title, add a social profile, update your bio - all in one place.

2. **Now page as markdown**: Edit `src/content/pages/now.md` directly. The Now page renders it, and llms.txt includes it automatically.

3. **Auto-generated files**: `site.webmanifest` generates at build time from config - no more keeping static files in sync.

4. **Smarter llms.txt**: Automatically lists all site pages, uses config for social links, pulls Now content from the markdown file.

5. **SocialLinks component uses config**: Footer social icons come from the config array - add a profile once, it appears everywhere.

---

## Phase 1: Create Unified Site Config

### Create `src/config/site.ts`

Structure with editable CONFIG object at top, derived exports below:

```typescript
// =============================================================================
// SITE CONFIGURATION - Edit this section
// =============================================================================

const CONFIG = {
  // Site identity
  site: {
    name: 'Danny Smith',
    shortName: 'danny.is',
    url: 'https://danny.is',
    locale: 'en_GB',
    themeColor: '#1a1a1a',
    description: 'Remote work consultant and organizational health expert...',
  },

  // Author/owner info
  author: {
    givenName: 'Danny',
    familyName: 'Smith',
    email: 'hi@danny.is',           // Identity/metadata email
    contactEmail: 'hi+website@danny.is', // For mailto links (tracking)
    jobTitle: 'Remote Work Consultant',
    extendedTitle: 'Operations & Leadership Expert',
    avatar: '/avatar.jpg',
    avatarCircle: '/avatar-circle.png',
    fediverse: '@dannysmith@indieweb.social',
  },

  // Social profiles - single source of truth
  // Used by: SocialLinks component, llms.txt, SEO meta, schema.org
  socialProfiles: [
    { id: 'bluesky', name: 'BlueSky', url: 'https://bsky.app/profile/danny.is', icon: 'social/bluesky', showInFooter: true },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/in/dannyasmith', icon: 'social/linkedin', showInFooter: true },
    { id: 'github', name: 'GitHub', url: 'https://github.com/dannysmith', icon: 'social/github', showInFooter: true },
    { id: 'youtube', name: 'YouTube', url: 'https://youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA', icon: 'social/youtube', showInFooter: true },
    { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/dannysmith', icon: 'social/instagram', showInFooter: true },
    { id: 'mastodon', name: 'Mastodon', url: 'https://indieweb.social/@dannysmith' },
    { id: 'twitter', name: 'Twitter', url: 'https://twitter.com/dannysmith' },
  ],

  // Content for llms.txt and future About page
  about: {
    summary: 'Danny helps companies build healthy remote teams...',
    aiDescription: 'Danny Smith is a remote work consultant based in London...',
  },
} as const;

// =============================================================================
// DERIVED EXPORTS - Generated from CONFIG above
// =============================================================================

export const SITE = CONFIG.site;
export const AUTHOR = { ...CONFIG.author, name: `${CONFIG.author.givenName} ${CONFIG.author.familyName}` };
export const SOCIAL_PROFILES = CONFIG.socialProfiles;
export const ABOUT = CONFIG.about;
// ... etc
```

### Refactor `src/config/seo.ts`

- Import primitives from `site.ts`
- Keep SEO-specific logic: title templates, schema.org config, page descriptions
- Remove duplicated primitives (GIVEN_NAME, FULL_NAME, etc.)

### Update `src/utils/og-branding.ts`

- Import author name and avatar from `site.ts` instead of hardcoding

---

## Phase 2: Now Page as Content

### Create `src/content/pages/now.md`

Simple markdown file with the Now page content (no frontmatter needed, or minimal):

```markdown
- [Consulting](https://betterat.work) on leadership, remote working and operations
- Building [Taskdn](https://tdn.danny.is), a system for managing tasks as plain markdown files
- Building [Astro Editor](https://astroeditor.danny.is), a markdown editor for Astro
- Learning how to work effectively with AI
- Playing at Open Mic nights in Islington

Updated: 2025-10-04
```

### Update content collection config

Add a simple `pages` collection (or use a file loader) for standalone page content.

### Refactor `src/pages/now.astro`

- Import and render the markdown content
- Keep the Callout component explaining what a Now page is
- Render markdown content below the callout

---

## Phase 3: Improve llms.txt

### Update `src/pages/llms.txt.ts`

1. **Remove hardcoded content**: Import AI description and about content from `site.ts`

2. **Use config for social links**: Iterate over `SOCIAL_PROFILES` array instead of hardcoded string matching

3. **Auto-generate "Other Pages"**: Scan `src/pages/*.astro` at build time to list actual pages (now, writing, notes, etc.)

4. **Pull Now content from markdown**: Read the raw content from `src/content/pages/now.md`

---

## Phase 4: Generate site.webmanifest

### Create `src/pages/site.webmanifest.ts`

Generate the webmanifest from config:

```typescript
export const GET: APIRoute = async () => {
  const manifest = {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: '/',
    display: 'browser',
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    icons: [/* ... */],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
```

### Delete `public/site.webmanifest`

No longer needed - generated at build time.

---

## Phase 5: Update Components

### `src/components/ui/SocialLinks.astro`

- Import `SOCIAL_PROFILES` from config
- Filter to `showInFooter: true` entries
- Render dynamically instead of hardcoded links

### `src/components/layout/BaseHead.astro`

- Import fediverse handle from config (currently hardcoded)
- Ensure all meta tags use config values

---

## Phase 6 (Optional): Extract Redirects

### Create `redirects.js` in project root

```javascript
export default {
  '/meeting': 'https://cal.com/dannysmith',
  '/linkedin': 'https://linkedin.com/in/dannyasmith',
  '/youtube': 'https://youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA',
  // ...
};
```

### Update `astro.config.mjs`

Import redirects from the external file. This makes it easier to add/remove redirects manually or via automation.

---

## Files Changed

| File | Action |
|------|--------|
| `src/config/site.ts` | NEW - Single source of truth |
| `src/config/seo.ts` | Refactor - Import from site.ts |
| `src/content/pages/now.md` | NEW - Now page content |
| `src/content.config.ts` | Update - Add pages collection |
| `src/pages/now.astro` | Refactor - Render markdown |
| `src/pages/llms.txt.ts` | Refactor - Use config, auto-generate |
| `src/pages/site.webmanifest.ts` | NEW - Generate from config |
| `public/site.webmanifest` | DELETE |
| `src/components/ui/SocialLinks.astro` | Refactor - Use config |
| `src/components/layout/BaseHead.astro` | Minor - Use config for fediverse |
| `src/utils/og-branding.ts` | Refactor - Import from config |
| `redirects.js` | NEW (optional) |
| `astro.config.mjs` | Update (optional) - Import redirects |

## Out of Scope

- Homepage (`index.astro`) - Keeps hardcoded presentation (intentional)
- PersonalLogo, Footer name - Keeps hardcoded (purely presentational)
- Email difference (`hi@danny.is` vs `hi+website@danny.is`) - Intentional, both available in config
- Redirect logic in astro.config.mjs - Can stay there, optional extraction
