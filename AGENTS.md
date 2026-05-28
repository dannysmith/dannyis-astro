# Claude /AI Agent Instructions for Danny's Personal Website

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

## Core Rules

@docs/tasks.md

### Developer Docs

@docs/README.md

Review `docs/developer/architecture-guide.md` for essential patterns

### Development Practices

1. **Follow Established Patterns**: Reference `docs/developer` guides
2. **No Runtime JavaScript** - Static HTML/CSS unless absolutely required
3. **Use path aliases** - `@components/*`, `@utils/*` etc, never relative imports. Prefer barrel imports (e.g., `from '@components/layout/index'`). Note: `.astro` files require the explicit `/index` suffix for barrel imports to work with `astro check`.
4. **Typography first** - Let type drive design decisions
5. **Test both themes** - Verify light and dark mode for visual changes
6. **CSS patterns** - Follow `docs/developer/design.md`
7. **Update styleguides** - Add examples when creating visual components
8. **Quality Gates**: Run `bun run check:all` after significant changes
9. **Documentation**: Update `docs/developer/` for new patterns
10. **Package manager**: Always use `bun` — never `npm` or `pnpm`. The lockfile is `bun.lock`.



## Commands

```bash
bun run dev           # Dev server at localhost:4321
bun run build         # Production build
bun run check:all     # Types → Format → Lint → Tests (unit + e2e)
bun run check:lint    # ESLint only
bun run check:types   # TypeScript + Astro check only
bun run check:format  # Prettier check only
bun run check:knip    # Check for unused code with Knip
bun run check:dupes   # Check for duplicate code with jscpd
bun run test:unit     # Unit tests only
bun run test:e2e      # E2E tests only
bun run newnote       # Create new note with proper frontmatter
```

## Tech Stack

- **Framework:** Astro 6.4+ with TypeScript (strict mode)
- **Content:** MDX with content collections, RSS feeds via Container API
- **Styling:** Custom CSS with layers, CSS variables for theming
- **Icons:** astro-icon with Heroicons
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deployment:** Vercel with automatic deployments from `main` via GitHub

## File Organization

```
├── public/            # Static files served at root (favicon, avatar, fonts)
├── scripts/           # Build and task scripts
├── tests/             # Test files
│   ├── e2e/           # Playwright end-to-end tests
│   ├── unit/          # Vitest unit tests
│   └── fixtures/      # Test fixtures
├── docs/
│   ├── README.md      # Documentation index
│   ├── tasks.md       # Task management system
│   ├── developer/     # Technical documentation
│   ├── tasks-todo/    # Pending tasks
│   └── tasks-done/    # Completed tasks
└── src/
    ├── assets/        # Images, videos for content & components
    ├── components/    # Organized by type with barrel exports
    │   ├── layout/    # Structural (BaseHead, Footer, etc.)
    │   ├── navigation/# Nav-specific
    │   ├── ui/        # Reusable utilities (FormattedDate, Pill, etc.)
    │   ├── mdx/       # Available in MDX content (Callout, Embed, etc.)
    │   ├── styleguide/# Styleguide page helpers (not for general use)
    │   └── demos/     # Interactive demos for articles/notes (React OK here)
    ├── config/        # Centralized config (SEO, constants)
    ├── content/
    │   ├── articles/  # Long-form writing
    │   └── notes/     # Short-form writing
    ├── icons/         # Custom SVG icons (social, ui)
    ├── layouts/       # Page templates (Article, Note)
    ├── lib/           # Build-time plugins (runs independently)
    ├── pages/         # Routes and API endpoints
    │   └── styleguide/# Visual styleguide (partials prefixed with _)
    ├── styles/        # CSS architecture (one file per layer)
    │   ├── global.css       # Entry point: layer order & imports
    │   ├── _foundation.css  # Design tokens, fonts, @property
    │   ├── _reset.css       # Reset layer
    │   ├── _base.css        # Base layer (forms, tables, etc.)
    │   ├── _typography.css  # Typography layer
    │   ├── _verticalflow.css# Vertical rhythm (part of typography layer)
    │   ├── _layout.css      # Layout utilities (.list-reset)
    │   └── _utilities.css   # Utility classes
    ├── types/         # TypeScript type declarations
    └── utils/         # Shared helper functions
```

## AI Assistance Tools

### Skills

- **CSS Expert** - Available globally via `css-expert` skill for advanced CSS patterns, modern features, and defensive CSS guidance
