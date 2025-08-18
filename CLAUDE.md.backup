See @docs/tasks.md for task management

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

This is Danny Smith's personal website built with **Astro 5.10.2** following a content-first, zero-JavaScript-by-default approach. The site serves two main content types:

1. **Articles** (`/writing/`) - Long-form articles in `src/content/articles/`
2. **Notes** (`/notes/`) - Shorter thoughts and links in `src/content/notes/`

### Content Collections

- **Articles Collection**: Articles with frontmatter including `title`, `pubDate`, `draft`, optional `cover`, `description`, `tags`
- **Notes Collection**: Shorter content with `title`, `pubDate`, optional `sourceURL`, `tags`
- Both collections support MDX with custom components

### Component Architecture

Components are organized into logical categories in `src/components/`:

- **Layout Components** (`layout/`) - BaseHead, Footer, MainNavigation, NoteCard, Lightbox
- **Navigation Components** (`navigation/`) - NavLink, ThemeToggle
- **UI Utilities** (`ui/`) - FormattedDate, Pill, Spinner
- **MDX Components** (`mdx/`) - Embed, BookmarkCard, Callout, Notion, Grid, Loom
- **Icons** (`icons/`) - SVG icon components

**Key Components:**

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
- **External link security** - All external links automatically include `target="_blank" rel="noopener noreferrer"` via `rehype-external-links`

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

**Component Development**: Follow the established patterns for props interfaces, error handling, accessibility, and CSS variable usage as defined in component-guidelines.mdc. Components are organized into categories (layout/, navigation/, ui/, mdx/, icons/) with barrel exports for clean imports.

**Styleguide Maintenance**: When adding components or features, update the relevant styleguide pages:

- `/styleguide` - Main component demos
- `src/content/notes/note-styleguide.mdx` - Note context examples
- `src/content/articles/article-styleguide.mdx` - Article context examples

**Performance & Architecture**: Maintain the zero-JavaScript-by-default approach, static generation focus, and content-first philosophy outlined in the design guidelines.

**External Link Security**: All external links must include `target="_blank" rel="noopener noreferrer"` for security and user experience. This is handled automatically for markdown content via the `rehype-external-links` plugin, but manual HTML links in components must include these attributes explicitly.

# Claude Code Memory

This file provides persistent context for Claude Code sessions in this repository.

## Project Context

**What**: Danny Smith's personal website - a content-first blog and digital playground
**Purpose**: Share thoughts/work + experiment with code/design (especially CSS/AI tools)
**Philosophy**: Simple, authentic, performant, maintainable, and fun to work on
**Audience**: Danny (creative expression), interested readers (content consumption), people checking Danny out (professional context)

## Key Design Decisions

### Technical Architecture

- **Astro 5.8** chosen for zero-JavaScript-by-default, content-first approach
- **No CSS frameworks** - custom CSS with variables, layers, and container queries
- **Static generation** for performance and simplicity
- **Content collections** for type-safe frontmatter and structured content
- **MDX support** for rich content with custom components

### Design Philosophy

- **Typographically-driven** with oversized, expressive text
- **Constructivist/modernist influences** (asymmetric layouts, bold diagonals)
- **Monochrome base + strategic red accent** color scheme
- **Experimental feel** - "personal zine-meets-manifesto" not generic portfolio
- **Sharp, intentional whitespace** with grid-based but flexible layouts

### Content Strategy

- **Articles** (`/writing/`) - Long-form articles about development, design, business
- **Notes** (`/notes/`) - Shorter thoughts, links, and commentary
- **Combined RSS feed** - All content in chronological order
- **Styleguides** - Three different contexts (main, article, note) for visual QA

## Content Creation Patterns

### File Naming Convention

- Articles: `YYYY-MM-DD-descriptive-slug.mdx` in `src/content/articles/`
- Notes: `YYYY-MM-DD-descriptive-slug.md` in `src/content/notes/`
- Use today's date unless specified otherwise
- Keep slugs concise but descriptive

### Frontmatter Essentials

- **Articles**: `title`, `pubDate`, `draft: true` (until ready), optional `description`, `cover`, `tags`
- **Notes**: `title`, `pubDate`, optional `sourceURL` (for link posts), `tags`
- Both support `styleguide: true` to exclude from indexes

### Component Usage

- `<Embed url="...">` - Universal embed (YouTube, Twitter, Vimeo, Loom) with BookmarkCard fallback
- `<BookmarkCard url="...">` - Rich URL previews
- `<Callout type="blue" icon="💡" title="Tip">` - Highlighted information
- `<Notion>` - Notion page references with auto-title fetching
- Always import components in MDX files

## Common Workflows

### Content Commands (from .cursor/rules/content.mdc)

- `"new note"` → Creates timestamped note template
- `"new note [URL]"` → Fetches title from URL, creates note with sourceURL
- `"new article [topic]"` → Creates article template with topic-based title
- `"check article"` → Validates formatting, headings, components, spelling
- `"pre-publishing checklist"` → Full publication review including SEO

### Quality Gates

**ALWAYS run before completing tasks:**

1. `npm run lint` - ESLint validation
2. `npm run check` - Astro/TypeScript checking
3. `npm run build` - Production build test
4. Manual Vercel preview verification

### Styleguide Maintenance

When adding/changing components:

1. Update `/styleguide` page with realistic examples
2. Add to `src/content/notes/note-styleguide.mdx` if relevant for notes
3. Add to `src/content/articles/article-styleguide.mdx` if relevant for articles
4. Update component documentation in `.cursor/rules/component-guidelines.mdc`

## Common Gotchas

### Content Issues

- **First paragraph** must be long enough for drop-cap to render well
- **No links** in first couple sentences of articles (interferes with drop-cap)
- **Heading hierarchy** must not skip levels (H1 → H2 → H3, never H1 → H3)
- **Acronyms** should be wrapped in `<abbr>` tags
- **External links** need `target="_blank" rel="noopener noreferrer"`

### Technical Issues

- **Image imports** in MDX require proper import statements and Astro Image component
- **Component props** must match TypeScript interfaces exactly
- **Draft content** is visible in dev but filtered in production builds
- **Container queries** need proper container setup (`.cq` class or `container-type`)

### Build Failures

- Check `astro.config.mjs` for integration issues
- Verify content schema matches frontmatter in `src/content.config.ts`
- Ensure all imported components exist and are properly exported
- Watch for TypeScript errors in components with external API calls

## Development Preferences

### Code Style

- **Zero-JavaScript by default** - only add interactivity when necessary
- **CSS variables** for theming and consistency
- **CSS layers** for proper cascade management (reset → base → prose → theme)
- **Container queries** for component responsiveness over media queries
- **Error handling** with try-catch blocks and meaningful fallbacks

### Content Style

- **Quality over quantity** - thoughtful, well-crafted posts
- **Personal voice** - authentic and experimental, not corporate
- **Visual hierarchy** - clear distinction between content types
- **Accessibility first** - semantic HTML, proper alt text, keyboard navigation

## Site URLs and Redirects

Key redirects configured in `astro.config.mjs`:

- `/meeting` → Cal.com booking
- `/cv` → PDF resume
- `/linkedin` → LinkedIn profile
- `/working` → BetterAt.Work
- `/tools` → Toolbox page

## Deployment Context

- **Hosting**: Vercel with automatic deployments
- **Branch**: `main` for production
- **Preview**: Every PR gets Vercel preview deployment
- **Build time**: OpenGraph images generated automatically
- **RSS**: Available at `/rss.xml` with combined articles and notes
