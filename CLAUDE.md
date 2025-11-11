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

**Tier 1: Orientation**

- `docs/developer/README.md` - Categorized index of all developer documentation

**Tier 2: Core Guides** (daily use - read these first)

- `docs/developer/architecture-guide.md` - Essential patterns and overview (START HERE)
- `docs/developer/component-patterns.md` - Component development patterns
- `docs/developer/design.md` - Visual philosophy and CSS architecture

**Tier 3: Specialized References** (consult when working on specific features)

- `docs/developer/accessibility-and-performance.md` - Accessible and performant code
- `docs/developer/content-system.md` - Content collections, RSS, build-time generation
- `docs/developer/content-authoring.md` - Creating and editing articles/notes
- `docs/developer/seo.md` - SEO utilities and patterns
- `docs/developer/code-quality.md` - Quality checks and standards
- `docs/developer/testing.md` - Testing strategy and patterns
- `docs/developer/mcp-chrome-devtools.md` - Using Chrome DevTools MCP for visual debugging

## Commands

```bash
pnpm run dev           # Dev server at localhost:4321
pnpm run build         # Production build
pnpm run check:all     # Types → Format → Lint → Tests (unit + e2e)
pnpm run check:lint    # ESLint only
pnpm run check:types   # TypeScript + Astro check only
pnpm run check:format  # Prettier check only
pnpm run check:knip    # Check for unused code with Knip
pnpm run check:dupes   # Check for duplicate code with jscpd
pnpm run test:unit     # Unit tests only
pnpm run test:e2e      # E2E tests only
pnpm run newnote       # Create new note with proper frontmatter
```

See `@docs/tasks.md` for task system details.

## Tech Stack

- **Framework:** Astro 5.15+ with TypeScript (strict mode)
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
├── lib/             # Build-time plugins and scripts (runs independently)
├── utils/           # Shared helper functions (imported throughout codebase)
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
