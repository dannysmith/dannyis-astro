# Claude Instructions for Danny's Personal Website

Content-first creative playground for writing and design experimentation. Built with AstroJS, TypeScript and modern CSS.

## Project Overview

**Goal:** Danny's Personal Website (danny.is). Clean, typographically-driven, fun. A personal site with strong visual identity inspired by constructivist/modernist design. Bold, personal expression with technical excellence. Zero-JavaScript-by-default, static HTML/CSS, progressive enhancement. Fast, accessible, maintainable long-term.

**Purpose:**

1. Danny's corner of the web - Share thoughts, experiences and work
2. Creative playground - A place to experiment with CSS, HTML, and AI-assisted development

**Key Features:**

- Traditional Blog with long-form articles
- Shorter notes for quick sharing of thoughts and comments on other content
- RSS feeds for articles, notes and both
- Redirects and hosting for core static assets on my domain (danny.is/avatar.jpg, danny.is/cv.pdf, danny.is/meeting -> redirects to my booking link etc)
- **Design Philosophy:**
- **Technical Philosophy:**

## Core Rules

### New Sessions

- Read @docs/tasks.md for task management
- Review `docs/developer/architecture-guide.md` for essential patterns
- Consult specialized guides when working on specific features (see [Documentation Structure](#documentation-structure))
- Check git status and project structure

### Development Practices

**CRITICAL:** Follow these strictly:

1. **Read Before Editing**: Always read files first to understand context
2. **Follow Established Patterns**: Use patterns from this file and `docs/developer`
3. **Senior Architect Mindset**: Consider performance, maintainability, testability
4. **No Runtime JavaScript by default** - Static HTML/CSS unless absolutely required
5. **Use path aliases** - Always use `@components/*`, `@utils/*` etc, never relative imports
6. **Update styleguides** - Add examples when creating visual components
7. **Typography first** - Let type drive design decisions
8. **Test both themes** - Verify light and dark mode for all visual changes
9. **Batch Operations**: Use multiple tool calls in single responses
10. **Match Code Style**: Follow existing formatting and patterns
11. **Test Coverage**: Write comprehensive tests for any business logic
12. **Quality Gates**: Run `pnpm run check:all` after significant changes
13. **No Dev Server**: Ask user to run and report back
14. **No Unsolicited Commits**: Only when explicitly requested
15. **Documentation**: Update `docs/developer/` guides for new patterns. Don't create other markdown files unless explicitly requested
16. **Removing files**: Always use `rm -f`

#### Directory Boundaries

[TBD - WILL FILL IN LATER]

### Documentation Structure

**Core Guides** (read for daily development):

- `docs/developer/architecture-guide.md` - Essential patterns and overview (START HERE)
- `docs/developer/accessibility-and-performance` - Guidance for writing accessible and performant HTML, CSS, TypeScript and Astro Components
- `docs/developer/component-patterns.md` - TypeScript patterns, component structure, error handling, and organization for building Astro components.
- `docs/developer/code-quality.md` - Guidance and rules for keeping code quality high.
- `docs/developer/content-system.md` - Technical implementation of content collections, RSS feeds and build-time content generation.
- `docs/developer/design.md` - Visual philosophy, CSS architecture, and design patterns for Danny's personal website.

- `docs/developer/seo.md` - Guidance and patterns for maintaining good SEO
- `docs/developer/testing.md` - Guidance on writing tests

**Reference**:

- `docs/developer/content-authoring.md` - Guide for creating and editing the CONTENT of articles and notes

See `docs/README.md` for the complete categorized list.

## Commands

```bash
pnpm run dev          # Dev server at localhost:4321
pnpm run build        # Production build
pnpm run check:all    # Types → Format → Lint → Tests (unit + e2e)
pnpm run lint         # ESLint only
pnpm run check:types  # TypeScript + Astro check only
pnpm run format:check # Prettier check only
pnpm run test:unit    # Unit tests only
pnpm run test:e2e     # E2E tests only
pnpm run newnote      # Create new note with proper frontmatter
```

See `@docs/tasks.md` for task system details.

## Tech Stack

- **Framework:** Astro 5.13+ with TypeScript (strict mode)
- **Content:** MDX with content collections, RSS feeds via Container API
- **Styling:** Custom CSS with layers, CSS variables for theming
- **Icons:** astro-icon with Heroicons
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deployment:** Vercel with automatic deployments from `main` via GitHub

## File Organization

```
src/
├── components/       # Organized by type with barrel exports
│   ├── layout/      # Structural (BaseHead, Footer, etc.)
│   ├── navigation/  # Nav-specific
│   ├── ui/          # Reusable utilities (FormattedDate, Pill, etc.)
│   └── mdx/         # Available in MDX content (Callout, Embed, etc.)
├── content/
│   ├── articles/    # Long-form writing
│   └── notes/       # Short-form writing
├── config/          # Centralized config (SEO, constants)
├── utils/           # Helper functions
├── layouts/         # Page templates (Article, Note)
├── pages/           # Routes and API endpoints
└── styles/          # Global CSS and theme

docs/
├── developer/       # Technical documentation (you are here)
└── tasks/           # Task management system
```

## AI Assistance Tools

### Claude Agents

- `@design-system-expert` - Typography, CSS, visual design
- `@astro-specialist` - Framework, performance, technical issues

### Claude Commands

- `/new-content` - Create notes and articles
- `/content-checks` - Publishing validation
- `/content-enhancements` - Images, descriptions, tags
