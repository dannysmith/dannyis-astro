# Danny's Personal Website

Content-first creative playground for writing and design experimentation. Built with AstroJS and TypeScript.

## Project Essence

This site serves dual purposes:

1. **Content Platform** - Share thoughts, experiences, and work (articles and notes)
2. **Creative Playground** - Experiment with CSS, HTML, and AI-assisted development

**Design Philosophy:** Clean, typographically-driven, fun. A personal site with strong visual identity inspired by constructivist/modernist design. Bold, personal expression with technical excellence.

**Technical Philosophy:** Zero-JavaScript-by-default, static HTML/CSS, progressive enhancement. Fast, accessible, maintainable long-term.

## Critical Rules

Follow these always:

1. **No Runtime JavaScript by default** - Static HTML/CSS unless absolutely required
2. **Typography first** - Let type drive design decisions
3. **Use path aliases** - Always use `@components/*`, `@utils/*` etc, never relative imports
4. **Run quality checks** - `pnpm run check:all` before completing any work
5. **Update styleguides** - Add examples when creating visual components
6. **Test both themes** - Verify light and dark mode for all visual changes
7. **Maintain character** - Bold, experimental, personal feel
8. **No unnecessary docs** - Don't create markdown files unless explicitly requested

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

## Developer Docs

Read `@docs/developer/README.md` for quick orientation, then:

- Having build errors or import issues? → `critical-patterns.md`
- Creating or editing content? → `content-authoring.md`
- Building components or features? → `component-patterns.md`
- Working on visual design or CSS? → `design.md`
- Need to understand content architecture? → `content-system.md`
- Questions about standards or testing? → `quality-requirements.md`

## AI Assistance Tools

### Claude Agents

- `@design-system-expert` - Typography, CSS, visual design
- `@astro-specialist` - Framework, performance, technical issues

### Claude Commands

- `/new-content` - Create notes and articles
- `/content-checks` - Publishing validation
- `/content-enhancements` - Images, descriptions, tags
