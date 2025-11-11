# Danny's Personal Website

Content-first creative playground for writing and design experimentation. Built with Astro 5.13+ and TypeScript.

## Project Essence

This site serves dual purposes:

1. **Content Platform** - Share thoughts, experiences, and work (articles and notes)
2. **Creative Playground** - Experiment with CSS, HTML, and AI-assisted development

**Design Philosophy:** Clean, typographically-driven, experimental. A personal zine-meets-manifesto with strong visual identity inspired by constructivist/modernist design. Bold, personal expression with technical excellence.

**Technical Philosophy:** Zero-JavaScript-by-default, static HTML/CSS, progressive enhancement. Fast, accessible, maintainable.

## Critical Rules

These rules define the project. Follow them always:

1. **No JavaScript by default** - Static HTML/CSS unless absolutely required
2. **Typography first** - Let type drive design decisions
3. **Use path aliases** - Always use `@components/*`, `@utils/*` etc, never relative imports
4. **Run quality checks** - `pnpm run check:all` before completing any work
5. **Update styleguide** - Add examples when creating visual components (`/styleguide`)
6. **Test both themes** - Verify light and dark mode for all visual changes
7. **Maintain character** - Bold, experimental, personal feel
8. **No unnecessary docs** - Don't create markdown files unless explicitly requested

## Commands

**Development:**

```bash
pnpm run dev          # Dev server at localhost:4321
pnpm run build        # Production build
```

**Quality gates (REQUIRED before completing work):**

```bash
pnpm run check:all    # Types → Format → Lint → Tests (unit + e2e)
```

**Individual checks:**

```bash
pnpm run lint         # ESLint only
pnpm run check:types  # TypeScript + Astro check only
pnpm run format:check # Prettier check only
pnpm run test:unit    # Unit tests only
pnpm run test:e2e     # E2E tests only
```

**Content creation:**

```bash
pnpm run newnote      # Create new note with proper frontmatter
```

**Task management:**

```bash
pnpm task:complete TASK_NAME    # Mark task as complete
```

See `@docs/tasks.md` for task system details.

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
│   ├── layout/      # Structural (BaseHead, Footer, etc.)
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

## Common Workflows

**Add Component:**

1. Create in `src/components/[category]/`
2. Add TypeScript interface for props
3. Export from category's `index.ts`
4. Add examples to `/styleguide`
5. Run `pnpm run check:all`

**Create Content:**

1. Use `pnpm run newnote` (or create article manually)
2. Set `draft: true` while working
3. Write using MDX components from `@components/mdx`
4. Run `pnpm run check:all` before publishing
5. Set `draft: false` to publish

**Design Changes:**

1. Check `design.md` for existing patterns
2. Use CSS variables for theme-aware styling
3. Test both light and dark themes
4. Verify responsive behavior
5. Update styleguide with examples

## Guide to Developer Docs

**Read `@docs/developer/README.md` first** for quick orientation, then:

- **Having build errors or import issues?** → `critical-patterns.md`
- **Creating or editing content?** → `content-authoring.md`
- **Building components or features?** → `component-patterns.md`
- **Working on visual design or CSS?** → `design.md`
- **Need to understand content architecture?** → `content-system.md`
- **Questions about standards or testing?** → `quality-requirements.md`

**For AI agents:** Read `critical-patterns.md` first to avoid breaking things, then reference other docs as needed for your specific task.

## AI Assistance Tools

**Agents:**

- `@design-system-expert` - Typography, CSS, visual design
- `@astro-specialist` - Framework, performance, technical issues

**Commands:**

- `/new-content` - Create notes and articles
- `/content-checks` - Publishing validation
- `/content-enhancements` - Images, descriptions, tags
