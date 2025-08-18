# Architecture

This document provides a comprehensive technical reference for the project architecture, including project structure, component organization, build pipeline, and implementation patterns.

## Overview

Danny Smith's personal website built with **Astro 5.10.2** following a content-first, zero-JavaScript-by-default approach. The site serves two main content types:

1. **Articles** (`/writing/`) - Long-form articles in `src/content/articles/`
2. **Notes** (`/notes/`) - Shorter thoughts and links in `src/content/notes/`

### Core Principles

- **Zero JavaScript by Default** - Write components without client-side JavaScript when possible
- **Content-First Approach** - Use Astro's content collections for type-safe content
- **Performance First** - Leverage static generation, minimize client-side JavaScript
- **Component-Based Architecture** - Organized into logical categories with barrel exports

## Project Structure

```
dannyis-astro/
├── .cursor/              # Cursor configuration
│   └── rules/            # Project rules and guidelines
├── .github/              # GitHub configuration
│   └── workflows/        # GitHub Actions workflows
│       └── update-toolbox.yml # Daily toolbox data scraping automation
├── docs/                 # All documentation & notes
├── public/               # Static assets
│   ├── images/           # Image assets
│   └── fonts/            # Font files
├── scripts/              # Build and automation scripts
│   └── get-toolbox-json.ts # Puppeteer scraping script for toolbox data
├── src/
│   ├── components/       # Reusable Astro components (organized by category)
│   │   ├── layout/       # Layout and structural components
│   │   │   ├── BaseHead.astro      # HTML head with centralized SEO utilities
│   │   │   ├── Footer.astro        # Site footer
│   │   │   ├── MainNavigation.astro # Primary site navigation
│   │   │   ├── NoteCard.astro      # Note layout wrapper
│   │   │   ├── Lightbox.astro      # Article image lightbox
│   │   │   └── index.ts            # Barrel exports
│   │   ├── navigation/   # Navigation-specific components
│   │   │   ├── NavLink.astro       # Individual navigation links
│   │   │   ├── ThemeToggle.astro   # Theme switching component
│   │   │   └── index.ts            # Barrel exports
│   │   ├── ui/           # Small, reusable UI utilities
│   │   │   ├── FormattedDate.astro # Date formatting component
│   │   │   ├── Pill.astro          # Tag/label component
│   │   │   ├── Spinner.astro       # Loading spinner
│   │   │   └── index.ts            # Barrel exports
│   │   ├── mdx/          # Components available in MDX content
│   │   │   ├── BookmarkCard.astro  # URL preview cards
│   │   │   ├── Callout.astro       # Information callouts
│   │   │   ├── Embed.astro         # Universal embed component
│   │   │   ├── Grid.astro          # CSS Grid layout
│   │   │   ├── Loom.astro          # Loom video embeds
│   │   │   ├── Notion.astro        # Notion page links
│   │   │   └── index.ts            # Barrel exports (used in MDX files)
│   │   ├── icons/        # Icon components
│   │   │   ├── InstagramIcon.astro
│   │   │   ├── LinkedInIcon.astro
│   │   │   ├── NotionIcon.astro
│   │   │   ├── RSSIcon.astro
│   │   │   └── YouTubeIcon.astro
│   │   └── index.ts      # Main component barrel export
│   ├── config/           # Configuration files
│   │   └── seo.ts        # Centralized SEO configuration and constants
│   ├── content/          # Content collections
│   │   ├── articles/     # Long-form articles as MDX and md files
│   │   ├── notes/        # Short-form content as MDX and md files
│   │   └── toolboxPages.json # Scraped toolbox data from betterat.work
│   ├── layouts/          # Page layouts
│   │   ├── Article.astro # Article page layout
│   │   └── Note.astro    # Note page layout
│   ├── pages/            # Astro pages (routes)
│   ├── styles/           # Global styles and CSS
│   │   └── global.css    # Global styles
│   └── utils/            # Utility functions and helpers
│       └── seo.ts        # SEO utility functions for metadata generation
└── tasks/                # Task tracking when working with Cursor AI
```

## Component Architecture

### Component Categories

Components are organized into logical categories in `src/components/`:

#### Layout Components (`layout/`)

Structural components that define the overall page layout and architecture:

- **BaseHead.astro** - HTML head component with centralized SEO utilities and theme management
- **Footer.astro** - Site footer with social links and navigation
- **MainNavigation.astro** - Primary site navigation with mobile menu
- **NoteCard.astro** - Note layout wrapper with metadata display
- **Lightbox.astro** - Image lightbox functionality for articles

#### Navigation Components (`navigation/`)

Components specifically for navigation functionality:

- **NavLink.astro** - Individual navigation links with active state
- **ThemeToggle.astro** - Theme switching component (auto/light/dark)

#### UI Utility Components (`ui/`)

Small, reusable utility components:

- **FormattedDate.astro** - Date formatting with semantic markup
- **Pill.astro** - Tag/badge component for labels and categories
- **Spinner.astro** - Loading spinner for async operations

#### MDX Components (`mdx/`)

Components available for use in MDX content files:

- **BookmarkCard.astro** - Rich URL preview cards using Open Graph data
- **Callout.astro** - Information callouts with color variants and icons
- **Embed.astro** - Universal embed component for YouTube, Twitter, Vimeo, Loom
- **Grid.astro** - CSS Grid layout component with responsive options
- **Loom.astro** - Dedicated Loom video embed component
- **Notion.astro** - Notion page links with automatic title fetching

#### Icon Components (`icons/`)

SVG icon components for consistent iconography:

- **InstagramIcon.astro**
- **LinkedInIcon.astro**
- **NotionIcon.astro**
- **RSSIcon.astro** - Monochrome, scalable RSS icon for feed links
- **YouTubeIcon.astro**

## Import Patterns and Module System

### TypeScript Path Aliases

The project uses TypeScript path aliases for clean imports:

```typescript
// Category-specific component imports (recommended)
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';

// Direct component imports
import BaseHead from '@components/layout/BaseHead.astro';
import Callout from '@components/mdx/Callout.astro';

// MDX component imports (used in content files)
import { Callout, Embed, BookmarkCard } from '@components/mdx';

// Configuration and utility imports
import { AUTHOR, TITLE_TEMPLATES } from '@config/seo';
import { generatePageTitle, validateSEOData } from '@utils/seo';

// Icon imports
import RSSIcon from '@components/icons/RSSIcon.astro';
```

### TypeScript Path Configuration

```json
{
  "paths": {
    "@components/*": ["src/components/*"],
    "@components/layout/*": ["src/components/layout/*"],
    "@components/navigation/*": ["src/components/navigation/*"],
    "@components/mdx/*": ["src/components/mdx/*"],
    "@components/ui/*": ["src/components/ui/*"],
    "@config/*": ["src/config/*"],
    "@utils/*": ["src/utils/*"],
    "@layouts/*": ["src/layouts/*"],
    "@assets/*": ["src/assets/*"]
  }
}
```

### Barrel Exports

Each category includes an `index.ts` file for convenient importing:

- `@components/layout/index.ts` - Layout component exports
- `@components/navigation/index.ts` - Navigation component exports
- `@components/ui/index.ts` - UI utility component exports
- `@components/mdx/index.ts` - MDX component exports
- `@components/index.ts` - Main barrel export for all components

## Content Collections

### Articles Collection

Location: `src/content/articles/`

**Required Frontmatter:**

```yaml
title: string
pubDate: date
draft: boolean
```

**Optional Frontmatter:**

```yaml
updatedDate: date
cover: image
coverAlt: string
description: string
tags: string[]
platform: "medium" | "external"
redirectUrl: string
```

### Notes Collection

Location: `src/content/notes/`

**Required Frontmatter:**

```yaml
pubDate: date
```

**Optional Frontmatter:**

```yaml
title: string
url: string
tags: string[]
```

## Build Pipeline and Deployment

### Build Features

- **Static Generation** - By default for performance
- **Automatic Sitemap** - Generated during build
- **RSS Feeds** - Combined feed and separate feeds for articles/notes
- **OpenGraph Images** - Auto-generated for all content
- **Reading Time** - Calculated for articles
- **Markdown Enhancements** - With rehype/remark plugins
- **External Link Security** - Automatic `target="_blank" rel="noopener noreferrer"`

### Development Commands

```bash
npm run dev          # Start development server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check Prettier formatting
npm run check        # Run Astro type checking
```

### Quality Assurance Pipeline

Before deployment, the following checks must pass:

- `npm run lint` - Check for linting errors
- `npm run check` - Validate TypeScript and Astro files
- `npm run build` - Ensure production build succeeds

### Deployment

- **Platform**: Vercel with automatic deployments
- **Branch**: `main` for production
- **Build Filtering**: Production builds filter draft content
- **Redirects**: Comprehensive redirects configured in `astro.config.mjs`

## RSS Feed Architecture

### Overview

The site generates three RSS feeds using Astro's experimental Container API for full MDX component rendering:

- **Combined Feed**: `/rss.xml` - All articles and notes
- **Articles Only**: `/rss/articles.xml` - Long-form articles only
- **Notes Only**: `/rss/notes.xml` - Short-form notes only

### Technical Implementation

**Container API for Full MDX Rendering**

The RSS feeds use Astro's experimental Container API to render MDX components to HTML at build time:

```javascript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  // Get content with filtering
  const articles = await getCollection('articles', ({ data }) => {
    return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
  });

  // Process items with full MDX rendering
  const items = [];
  for (const article of articles) {
    try {
      const { Content } = await render(article);
      const content = await container.renderToString(Content);

      items.push({
        ...article.data,
        link: `/writing/${article.id}/`,
        content,
      });
    } catch (error) {
      console.warn(`Failed to render content for ${article.id}:`, error);
      continue; // Skip problematic items
    }
  }

  return rss({
    title: `${SITE_TITLE} - Articles`,
    description: `Articles from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
```

### Content Filtering

- **Styleguide Exclusion**: All feeds filter out content with `styleguide: true`
- **Draft Content**: Production builds filter out content with `draft: true`
- **Content Sorting**: All feeds sort by publication date (newest first)

### Error Handling

- **Graceful Degradation**: Failed component renders are logged and skipped
- **Build Continuity**: Build continues even if individual items fail to render
- **Performance**: Current implementation: ~44s build time (vs ~45s baseline)

## SEO Architecture

### Centralized Configuration

All SEO settings centralized in `src/config/seo.ts`:

- Personal branding and job titles
- Site information and metadata
- Title templates for different page types
- Schema.org structured data configuration
- OpenGraph and Twitter card configuration

### SEO Utility Functions

Located in `src/utils/seo.ts`:

- `generatePageTitle()` - Uses configured templates for consistent titles
- `generateMetaDescription()` - Adds consistent branding to descriptions
- `generateJSONLD()` - Creates comprehensive Schema.org structured data
- `generateArticleMeta()` - Generates article-specific OpenGraph meta tags
- `generateOGImageUrl()` - Handles image URL generation with fallbacks
- `validateSEOData()` - Validates and sanitizes SEO data

### BaseHead Component Integration

```astro
<BaseHead
  title="Page Title"
  description="Page description"
  type="article"        // 'website' (default) or 'article'
  pageType="article"    // 'article', 'note', or 'page' (for title templates)
  image="/custom-og.png" // Optional: custom OG image
  pubDate={new Date()}   // Optional: for articles/notes
  updatedDate={new Date()} // Optional: for articles/notes
  tags={['tag1', 'tag2']} // Optional: for articles/notes
/>
```

### Theme Management

- Global `window.theme` API provides theme management
- Supports auto/light/dark themes with system preference detection
- Automatically handles ViewTransitions and theme persistence
- Components can listen for `theme-changed` events
- Theme switching handled by `ThemeToggle` component

### External Link Security

- All external links in markdown content automatically include `target="_blank" rel="noopener noreferrer"`
- Handled by the `rehype-external-links` plugin configured in `astro.config.mjs`
- Manual HTML links in components must include these attributes explicitly

## Toolbox Data Automation

### Automated Scraping System

- **Script**: Puppeteer script (`scripts/get-toolbox-json.ts`) scrapes toolbox data
- **Source**: `https://betterat.work/tool/`
- **Schedule**: GitHub Action runs daily at 2 AM UTC
- **Storage**: Data saved to `src/content/toolboxPages.json`

### GitHub Action Workflow

Located in `.github/workflows/update-toolbox.yml`:

- **Change Detection**: Only commits updates when data actually changes
- **Failure Handling**: Tracks consecutive failures and auto-creates GitHub issues after 3 failed attempts
- **Manual Trigger**: Can be manually triggered via `workflow_dispatch`
- **Error Recovery**: Automatically resets failure counter on successful runs

## Component Development Patterns

### Astro Component Structure

```astro
---
// 1. Imports
import { Image } from 'astro:assets';
import type { Props } from './types';

// 2. Props Interface
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
}

// 3. Props destructuring with defaults
const { prop1, prop2, withDefault = true } = Astro.props;

// 4. Data fetching with error handling (if needed)
try {
  const data = await fetchData();
} catch (error) {
  console.warn('Failed to fetch data:', error);
  // Implement fallback behavior
}
---

<!-- 5. Template with accessibility attributes -->
<div class="component">
  <!-- Content -->
</div>

<!-- 6. Styles -->
<style>
  :root {
    --component-background: var(--color-bg-dark-200);
    --component-foreground: var(--c-white);
    /* Other CSS variables */
  }

  /* Component styles */
</style>
```

### Error Handling Patterns

**Network Requests:**

```typescript
try {
  const result = await externalAPI(url);
  data = result.data;
} catch (error) {
  console.warn(`Failed to fetch data from ${url}:`, error);
  data = fallbackData;
}
```

### External Link Implementation

```astro
<!-- ✅ Correct: Manual HTML external links -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External Link</a>

<!-- ✅ Correct: Preserve rel="me" with target="_blank" for identity links -->
<a href="https://social.example/@user" rel="me" target="_blank">Social Profile</a>

<!-- ✅ Automatic: Markdown links handled by rehype-external-links -->
[External Link](https://example.com)
```

## Performance Guidelines

### Core Web Vitals Targets

- **Lighthouse Scores**: Performance 95+, Accessibility 100, Best Practices 100, SEO 100
- **Core Web Vitals**: LCP < 1s, FID < 100ms, CLS < 0.1

### Build Optimization

- Use static generation by default
- Minimize client-side JavaScript
- Optimize images with Astro's built-in tools
- Implement proper code splitting

### Loading Performance

- Use `loading="lazy"` for below-fold images
- Implement proper caching strategies
- Minimize third-party dependencies
- Load non-critical scripts asynchronously
- Use proper preload directives
- Optimize resource loading order

### JavaScript Optimization

- Use Astro's zero-JS by default
- Only add interactivity when necessary
- Use progressive enhancement
- Implement proper code splitting
- Load non-critical scripts asynchronously

## URL Structure and Routing

- `/writing/[slug]/` - Articles
- `/notes/[slug]/` - Notes
- `/styleguide` - Component documentation
- `/now` - Current status page
- `/rss.xml` - Combined RSS feed
- `/rss/articles.xml` - Articles-only RSS feed
- `/rss/notes.xml` - Notes-only RSS feed

### Key Redirects

Configured in `astro.config.mjs`:

- `/meeting` → Cal.com booking
- `/cv` → PDF resume
- `/linkedin` → LinkedIn profile
- `/working` → BetterAt.Work
- `/tools` → Toolbox page

## Technology Stack

### Core Technologies

- **Astro 5.10.2** - Core framework
- **TypeScript** - Type-safe development
- **MDX** - Enhanced markdown content
- **CSS** - Custom CSS without frameworks
- **Vercel** - Hosting and deployment

### Key Directories

- **`src/config/`**: Centralized configuration files
- **`src/utils/`**: Utility functions and helpers
- **`src/components/`**: Organized component library with barrel exports
- **`src/content/`**: Type-safe content collections
- **`src/layouts/`**: Page layout templates with integrated SEO
- **`src/pages/rss/`**: RSS feed endpoints using Container API
