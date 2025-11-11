# Developer Documentation

**Start here** for technical context when working on Danny Smith's personal website.

## Project Overview

Content-first creative playground built with **Astro 5.13+** and TypeScript. Zero-JavaScript-by-default, typography-driven design. Two content types:

- **Articles** (`/writing/`) - Long-form content
- **Notes** (`/notes/`) - Short-form updates and links

The site serves dual purposes: a platform for sharing thoughts and work, and a space to experiment with web technologies (especially CSS, HTML, and AI-assisted development).

## Navigation Guide

**Choose your path based on what you're working on:**

- **Build errors, import issues, or breaking things?** → `critical-patterns.md`
- **Creating or editing content?** → `content-authoring.md`
- **Building components or features?** → `component-patterns.md`
- **Visual design or CSS work?** → `design.md`
- **Understanding content architecture?** → `content-system.md`
- **Standards, testing, or quality requirements?** → `quality-requirements.md`

**For AI agents:** Read `critical-patterns.md` first to avoid breaking things, then reference other docs as needed.

## Tech Stack

- **Framework:** Astro 5.13+ with TypeScript (strict mode)
- **Content:** MDX with content collections, RSS feeds via Container API
- **Styling:** Custom CSS with layers, CSS variables for theming
- **Icons:** astro-icon with Heroicons
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deployment:** Vercel with automatic deployments from `main`

## File Organization

```
src/
├── components/       # Organized by type with barrel exports
│   ├── layout/      # Structural components (BaseHead, Footer, etc.)
│   ├── navigation/  # Nav-specific (NavLink, ThemeToggle)
│   ├── ui/          # Reusable utilities (FormattedDate, Pill, etc.)
│   └── mdx/         # Available in MDX content (Callout, Embed, etc.)
├── content/
│   ├── articles/    # Long-form (YYYY-MM-DD-slug.mdx)
│   └── notes/       # Short-form (YYYY-MM-DD-slug.md)
├── config/          # Centralized config (SEO, constants)
├── utils/           # Helper functions (SEO, content processing)
├── layouts/         # Page templates (Article, Note)
├── pages/           # Routes and API endpoints
└── styles/          # Global CSS and theme

docs/
├── developer/       # Technical documentation (you are here)
└── tasks/           # Task management system
```

## Performance Targets

- **Lighthouse:** 95+ on all metrics
- **Page Weight:** <200KB for content pages
- **JavaScript:** None unless absolutely necessary
- **Build Time:** <30 seconds for full site

## Philosophy

This site embraces experimentation, personal expression, and technical excellence. Be bold with design, careful with code, and always maintain the site's unique character.
