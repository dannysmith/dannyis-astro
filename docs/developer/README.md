# Developer Documentation

**Start here** for technical context when working on Danny Smith's personal website.

## Project Essence

This is a content-first creative playground built with **Astro 5.13+** and TypeScript. Zero-JavaScript-by-default, typography-driven design. Two content types:

- **Articles** (`/writing/`) - Long-form content
- **Notes** (`/notes/`) - Short-form updates and links

The site serves dual purposes: a platform for sharing thoughts and work, and a space to experiment with web technologies (especially CSS, HTML, and AI-assisted development).

## Reading Guide

**Choose your path based on what you're working on:**

- **Adding features, fixing imports, or modifying config?** → Start with `critical-patterns.md`
- **Working with content, MDX, or SEO?** → Read `content.md`
- **Styling, CSS, typography, or visual design?** → See `design.md`
- **Code quality, testing, or patterns?** → Check `standards.md`

**For AI agents:** Read `critical-patterns.md` first to avoid breaking things, then reference other docs as needed.

## Top 3 Mistakes to Avoid

1. **Using wrong command** - It's `pnpm run check:all`, NOT `pnpm run check`
2. **Breaking TypeScript imports** - Always use path aliases (see critical-patterns.md)
3. **Forgetting quality gates** - Run `pnpm run check:all` before completing work

## Quick Reference

### Tech Stack

- **Framework**: Astro 5.13+ with TypeScript (strict mode)
- **Content**: MDX with content collections, RSS feeds via Container API
- **Styling**: Custom CSS with layers, CSS variables for theming
- **Icons**: astro-icon with Heroicons
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Deployment**: Vercel with automatic deployments from `main`

### File Organization

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

### Essential Commands

```bash
# Development
pnpm run dev          # Dev server at localhost:4321
pnpm run build        # Production build to ./dist/

# Quality gates - ALWAYS RUN BEFORE COMPLETING WORK
pnpm run check:all    # Types → Format → Lint → Tests (unit + e2e)

# Individual checks
pnpm run lint         # ESLint only
pnpm run check:types  # TypeScript + Astro check only
pnpm run format:check # Prettier check only
pnpm run test:unit    # Unit tests only
pnpm run test:e2e     # E2E tests only

# Content creation
pnpm run newnote      # Create new note with proper frontmatter

# Task management
pnpm task:complete TASK_NAME    # Mark task as complete
```

### Critical Rules

1. **No JavaScript by default** - Static HTML/CSS only unless required
2. **Typography first** - Let type drive design decisions
3. **Update styleguide** - Add examples when creating components (`/styleguide`)
4. **Test production builds** - Run `pnpm run check:all` before completing work
5. **Maintain character** - Bold, experimental, personal feel
6. **No unnecessary docs** - Don't create markdown files unless explicitly requested

## Performance Targets

- **Lighthouse**: 95+ on all metrics
- **Page Weight**: <200KB for content pages
- **JavaScript**: None unless absolutely necessary
- **Build Time**: <30 seconds for full site

## Common Workflows

### Adding a Component

1. Create in appropriate `src/components/` subdirectory
2. Add TypeScript interface for props
3. Export from subdirectory's `index.ts`
4. Add examples to `/styleguide` page
5. Document in `design.md` if visually significant

### Creating Content

1. Use `pnpm run newnote` for notes (articles created manually)
2. Set `draft: true` while working
3. Use MDX components from `@components/mdx`
4. Run `pnpm run check:all` before publishing
5. Set `draft: false` to publish

### Making Design Changes

1. Check `design.md` for existing patterns
2. Use CSS variables for theme-aware styling
3. Test both light and dark themes
4. Verify responsive behavior with container queries
5. Update styleguide with examples

## Getting Help

- **TypeScript import errors?** → See `critical-patterns.md` for path aliases
- **Content not showing up?** → Check `content.md` for filtering rules
- **Styling issues?** → Reference `design.md` for CSS architecture
- **Quality check failures?** → Review `standards.md` for patterns

## Philosophy

This site embraces experimentation, personal expression, and technical excellence. Be bold with design, careful with code, and always maintain the site's unique character.
