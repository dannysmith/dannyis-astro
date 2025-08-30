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
│   ├── icons/           # Custom SVG icons
│   │   ├── social/      # Social media icons
│   │   └── ui/          # UI icons
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

### Icons

The site uses astro-icon with Heroicons for consistent iconography. Custom SVG icons are stored in `src/icons/` and organized by category.

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

// Icon imports (using astro-icon)
import { Icon } from 'astro-icon/components';
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
pnpm run dev          # Start development server at localhost:4321
pnpm run build        # Build production site to ./dist/
pnpm run preview      # Preview build locally
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint issues automatically
pnpm run format       # Format code with Prettier
pnpm run format:check # Check Prettier formatting
pnpm run check        # Run Astro type checking
```

### Quality Assurance Pipeline

Before deployment, the following checks must pass:

- `pnpm run lint` - Check for linting errors
- `pnpm run check` - Validate TypeScript and Astro files
- `pnpm run build` - Ensure production build succeeds

### Deployment

- **Platform**: Vercel with automatic deployments
- **Branch**: `main` for production
- **Build Filtering**: Production builds filter draft content
- **Redirects**: Comprehensive redirects configured in `astro.config.mjs`

## RSS Feed System

### Feed Generation

The site generates three RSS feeds:

- **Combined Feed**: `/rss.xml` - All articles and notes
- **Articles Only**: `/rss/articles.xml` - Long-form articles only
- **Notes Only**: `/rss/notes.xml` - Short-form notes only

### Technical Approach

- Uses Astro's experimental Container API for full MDX component rendering
- Filters draft and styleguide content in production
- Implements graceful error handling for failed renders
- Build performance: ~44s (minimal impact on baseline build time)

For detailed RSS implementation and configuration, see the [content system documentation](./content-system.md#rss-feed-system).

## SEO Implementation

### Architecture Overview

- **Centralized Configuration**: All SEO settings in `src/config/seo.ts`
- **Utility Functions**: SEO helpers located in `src/utils/seo.ts`
- **BaseHead Component**: Unified HTML head management with SEO integration
- **Auto-Generated OpenGraph Images**: Build-time image generation for social sharing

For detailed SEO schemas, component usage, and implementation patterns, see the [content system documentation](./content-system.md#seo-implementation).

### Theme Management

- Global `window.theme` API provides theme management
- Supports auto/light/dark themes with system preference detection
- Automatically handles ViewTransitions and theme persistence
- Components can listen for `theme-changed` events
- Theme switching handled by `ThemeToggle` component

### External Link Security

- All external links automatically include `target="_blank" rel="noopener noreferrer"`
- Implemented via `rehype-external-links` plugin
- Manual HTML links require explicit security attributes

For detailed implementation patterns, see the [content system documentation](./content-system.md#external-link-security).

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

## Component Development Standards

### Development Approach

- Components follow consistent structure patterns with TypeScript interfaces
- Props use clear naming conventions with optional defaults
- Error handling implemented for external API calls
- Accessibility attributes included in template markup
- CSS variables used for theme-aware styling

For detailed component structure patterns, TypeScript interfaces, and implementation examples, see the [implementation patterns documentation](./implementation-patterns.md).

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
