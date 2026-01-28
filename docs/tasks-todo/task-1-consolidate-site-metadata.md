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

## Phase 1: Unified Site Config ✅ COMPLETE

### Architecture

Three-file structure with clear responsibilities:

```
src/config/site.ts     # Raw CONFIG object - edit this file
src/config/config.ts   # Re-exports CONFIG + adds derived values & SEO constants
src/utils/seo.ts       # Pure functions for generating SEO metadata
```

**`site.ts`** - The single source of truth you edit:
- Site identity (name, shortName, url, locale, themeColor)
- Author identity (names, email, location, jobTitle, social handles, avatars)
- Descriptions (short, site, author, organization)
- Page title templates (with `{title}` placeholder)
- Page descriptions for index pages
- Social profiles array (with `showInFooter` flag)
- External links
- Organization name

**`config.ts`** - Adds computed values via `getConfig()`:
- Derived: `fullName`, `avatarUrl`, `avatarCircleUrl`, `twitterHandle`
- Technical SEO: `robotsDirective`, `twitterCardType`, `defaultOgImage`, `articleSection`, `searchAction`

**`seo.ts`** - Pure functions that call `getConfig()`:
- `generatePageTitle()` - applies page title templates
- `generateMetaDescription()` - adds author branding
- `generateJSONLD()` - builds schema.org graph
- `generateArticleMeta()` - OpenGraph article tags
- `generateOGImageUrl()` - resolves OG image paths
- `validateSEOData()` - sanitizes SEO input

### Consuming Code Pattern

All files import via `getConfig()`:

```typescript
import { getConfig } from '@config/config';
const config = getConfig();
// Access: config.site.name, config.author.fullName, config.descriptions.site, etc.
```

### Files Updated

| File | Status |
|------|--------|
| `src/config/site.ts` | Created - raw CONFIG |
| `src/config/config.ts` | Created - getConfig() with derived values |
| `src/config/seo.ts` | Deleted - merged into above |
| `src/utils/seo.ts` | Refactored - uses getConfig() |
| `src/utils/og-branding.ts` | Refactored - uses getConfig() |
| `src/components/layout/BaseHead.astro` | Refactored |
| `src/pages/index.astro` | Refactored |
| `src/pages/rss.xml.js` | Refactored |
| `src/pages/rss/articles.xml.js` | Refactored |
| `src/pages/rss/notes.xml.js` | Refactored |
| `src/pages/llms.txt.ts` | Refactored |
| `src/pages/writing/[...slug]/og-image.png.ts` | Refactored |
| `src/pages/notes/[...slug]/og-image.png.ts` | Refactored |

---

## Phase 2: Now Page as Markdown Partial ✅ COMPLETE

### Structure

```
src/pages/now/
├── index.astro    # Page wrapper with Callout, imports Content from _now.md
└── _now.md        # Editable content (underscore = not a route)
```

### How It Works

- **`_now.md`** - Simple markdown file with Now page content. Edit this to update what you're doing.
- **`index.astro`** - Imports `{ Content as NowContent }` from `./_now.md` and renders it.
- **`llms.txt.ts`** - Imports `nowMarkdown from './now/_now.md?raw'` and includes it directly.

### Files Changed

| File | Action |
|------|--------|
| `src/pages/now/_now.md` | **NEW** - Now page content |
| `src/pages/now/index.astro` | **NEW** - Page wrapper |
| `src/pages/now.astro` | **DELETED** - Replaced by above |
| `src/pages/llms.txt.ts` | Updated - imports `_now.md?raw` |

---

## Remaining Phases

### Phase 3: Improve llms.txt ✅ COMPLETE

**What was done:**
- Auto-discovers static pages using `import.meta.glob('./**/*.astro')`
- Filters out dynamic routes (`[...]`), partials (`_*.astro`), homepage, and excluded pages
- `EXCLUDED_PAGES` array at top of file for easy maintenance (`/scratchpad/`, `/toolboxtest/`, `/404/`)
- Derives page titles from URL paths (e.g., `/foo-bar/` → `Foo Bar`)
- Added "External" section using `config.externalLinks`

**Files:** `src/pages/llms.txt.ts`

---

### Phase 4: Update SocialLinks Component

Currently `src/components/ui/SocialLinks.astro` has 5 hardcoded social links. Should use config.

**Changes:**
- Import `getConfig()`
- Filter profiles: `config.socialProfiles.filter(p => p.showInFooter)`
- Iterate to generate `<li>` elements with `<Icon name={profile.icon} />`

**Files:** `src/components/ui/SocialLinks.astro`

---

### Phase 5: Generate site.webmanifest

Currently `public/site.webmanifest` is a static JSON file with hardcoded values that duplicate config.

**Changes:**
- Create `src/pages/site.webmanifest.ts` as an API route
- Use `getConfig()` for `name`, `short_name`, `description`, `theme_color`, `background_color`
- Keep `icons` array hardcoded (rarely changes)
- Delete `public/site.webmanifest`

**Files:**
- `src/pages/site.webmanifest.ts` (new)
- `public/site.webmanifest` (delete)

---

### Phase 6: Generate humans.txt (optional)

Currently `public/humans.txt` is static with hardcoded author info.

**Changes:**
- Create `src/pages/humans.txt.ts` as an API route
- Use `getConfig()` for author name, location, site URL
- Delete `public/humans.txt`

**Files:**
- `src/pages/humans.txt.ts` (new)
- `public/humans.txt` (delete)

---

### Phase 7: Extract Redirects (independent)

Unrelated to config consolidation. The redirects in `astro.config.mjs` are getting long.

**Changes:**
- Create `redirects.js` or `redirects.ts` in project root
- Export redirects object
- Import into `astro.config.mjs`

**Files:**
- `redirects.js` (new)
- `astro.config.mjs` (simplify)

---

## Files Changed Summary

### Phase 1 ✅
See table in Phase 1 section above.

### Phase 2 ✅
See table in Phase 2 section above.

---

## Out of Scope

- **Homepage (`index.astro`)** - Keeps hardcoded presentation (purely visual)
- **PersonalLogo, Footer name** - Keeps hardcoded (purely presentational)
- **Email difference** - Intentional: `email` for identity, `contactEmail` for mailto links
- **Avatar vs avatarCircle** - Both needed, different use cases
- **Redirects in astro.config.mjs** - Separate concern, optional extraction later
