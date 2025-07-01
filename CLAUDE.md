# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
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

### Quality Assurance
Before completing tasks, always run:
- `npm run lint` - Check for linting errors
- `npm run check` - Validate TypeScript and Astro files
- `npm run build` - Ensure production build succeeds

## Architecture Overview

### Content-First Static Site
This is Danny Smith's personal website built with **Astro 5.8** following a content-first, zero-JavaScript-by-default approach. The site serves two main content types:

1. **Articles** (`/writing/`) - Long-form articles in `src/content/articles/`
2. **Notes** (`/notes/`) - Shorter thoughts and links in `src/content/notes/`

### Content Collections
- **Articles Collection**: Articles with frontmatter including `title`, `pubDate`, `draft`, optional `cover`, `description`, `tags`
- **Notes Collection**: Shorter content with `title`, `pubDate`, optional `sourceURL`, `tags`
- Both collections support MDX with custom components

### Key Components
- **Universal Embed** (`<Embed>`) - Handles YouTube, Twitter, Vimeo, Loom embeds; falls back to BookmarkCard
- **BookmarkCard** - Rich URL previews using Open Graph data
- **Callout** - Highlighted information boxes with color variants
- **Notion** - Notion page references with automatic title fetching
- **Image optimization** - Uses Astro's built-in Image component with responsive layouts

### URL Structure
- `/writing/[slug]/` - Articles
- `/notes/[slug]/` - Notes
- `/styleguide` - Component documentation
- `/now` - Current status page
- `/rss.xml` - Combined RSS feed

### Build Features
- **Static generation** by default
- **Automatic sitemap** generation
- **RSS feed** combining articles and notes
- **OpenGraph images** auto-generated for all content
- **Reading time** calculation for articles
- **Markdown enhancements** with rehype/remark plugins

### Content Workflow
The `.cursor/rules/content.mdc` file defines specific commands for:
- Creating new articles/notes with proper frontmatter
- Adding images and components
- Pre-publishing checklists
- SEO optimization
- Content migration between formats

### Deployment
- Built for static hosting (Vercel)
- Production builds filter draft content
- Comprehensive redirects configured in `astro.config.mjs`

## Cursor Rules Integration

This project has comprehensive guidelines in `.cursor/rules/` that Claude Code should follow:

### Core Guidelines
- **[Project Structure](file://.cursor/rules/project-structure.mdc)** - Directory organization and architecture
- **[Component Guidelines](file://.cursor/rules/component-guidelines.mdc)** - Astro component development patterns
- **[Astro Guidelines](file://.cursor/rules/astro-guidelines.mdc)** - Framework-specific best practices
- **[Styling Guide](file://.cursor/rules/styling-guide.mdc)** - CSS architecture and visual consistency
- **[Design Guidelines](file://.cursor/rules/design-and-brand-guidelines.mdc)** - Brand identity and visual philosophy

### Content & Workflow
- **[Content Rules](file://.cursor/rules/content.mdc)** - Article/note creation commands and workflows
- **[DoR/DoD](file://.cursor/rules/dor-dod.mdc)** - Definition of Ready and Definition of Done
- **[Planning Process](file://.cursor/rules/planning-process/planning-process-overview.mdc)** - Feature planning methodology
- **[Commit Messages](file://.cursor/rules/commit-messages.mdc)** - Version control standards

### Key Implementation Notes

**Content Creation Commands**: The content.mdc file defines specific commands like "new note", "new article", "check article", "pre-publishing checklist" that should be recognized and executed precisely.

**Quality Standards**: All changes must meet the DoD criteria including successful linting, type checking, Vercel preview builds, and styleguide updates.

**Component Development**: Follow the established patterns for props interfaces, error handling, accessibility, and CSS variable usage as defined in component-guidelines.mdc.

**Styleguide Maintenance**: When adding components or features, update the relevant styleguide pages:
- `/styleguide` - Main component demos
- `src/content/notes/note-styleguide.mdx` - Note context examples  
- `src/content/articles/article-styleguide.mdx` - Article context examples

**Performance & Architecture**: Maintain the zero-JavaScript-by-default approach, static generation focus, and content-first philosophy outlined in the design guidelines.