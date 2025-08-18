See @docs/tasks.md for task management

# CLAUDE.md

This is Danny Smith's personal website - a content-first creative playground for writing and design experimentation.

## Quick Context

- **Framework**: Astro 5.13+ with TypeScript
- **Philosophy**: Zero-JavaScript-by-default, typography-driven design
- **Content**: Articles (`/writing/`) and Notes (`/notes/`)
- **Purpose**: Creative expression + technical experimentation

## Documentation Structure

### Technical Reference

- `@docs/developer/architecture.md` - Project structure, components, build pipeline
- `@docs/developer/design-system.md` - Typography, CSS, visual design patterns
- `@docs/developer/content-system.md` - Content collections, MDX, SEO
- `@docs/developer/implementation-patterns.md` - TypeScript, performance, quality

### AI Assistance

- `@.claude/agents/design-system-expert.md` - Typography, CSS, visual design help
- `@.claude/agents/astro-specialist.md` - Framework, performance, technical help
- `@.claude/commands/new-content.md` - Create notes and articles
- `@.claude/commands/content-checks.md` - Publishing checklists and validation
- `@.claude/commands/content-enhancements.md` - Images, descriptions, tags

## Key Commands

### Development

```bash
npm run dev          # Development server at localhost:4321
npm run build        # Production build to ./dist/
npm run check        # All quality checks (lint, types, build)
npm run newnote      # Create new note with proper frontmatter
```

### Quality Gates

**ALWAYS run before completing tasks:**

```bash
npm run check
```

This runs: ESLint → Prettier check → TypeScript → Astro check → Build test

## Common Workflows

### Adding a Component

1. Create in appropriate `src/components/` subdirectory
2. Add TypeScript interface for props
3. Update barrel export in subdirectory's `index.ts`
4. Add examples to `/styleguide`
5. Document in `design-system.md` if significant

### Content Creation

- **Articles**: Long-form in `src/content/articles/` with full frontmatter
- **Notes**: Short-form in `src/content/notes/` with minimal frontmatter
- Use commands: `new-content`, `content-checks`, `content-enhancements`
- Always run pre-publishing checklist before going live

### Design Updates

1. Consult `@design-system-expert` agent for guidance
2. Maintain CSS variable consistency
3. Test with container queries for responsive behavior
4. Preserve experimental, typography-driven character

### Technical Implementation

1. Consult `@astro-specialist` agent for framework questions
2. Always prefer build-time over runtime solutions
3. No JavaScript unless absolutely necessary
4. Update architecture docs for significant changes

## Critical Rules

1. **No JavaScript by default** - Static HTML/CSS only unless required
2. **Typography first** - Let type drive design decisions
3. **Update styleguide** - Add examples when creating components
4. **Test production builds** - Ensure everything works statically
5. **Maintain character** - Bold, experimental, personal feel
6. **No unnecessary docs** - Don't create summary/plan markdown files unless explicitly requested

## Project Philosophy

This site embraces:

- **Oversized typography** as the primary design element
- **Constructivist aesthetics** with asymmetric layouts
- **Monochrome + red** color scheme
- **Personal voice** over corporate polish
- **Experimentation** in both content and code

## Working with Agents

- **Design System Expert**: Typography, CSS, visual design, layouts
- **Astro Specialist**: Build issues, performance, content schemas, framework

## File Organization

```
src/
├── components/       # Organized by type (layout/, ui/, mdx/, etc.)
├── content/
│   ├── articles/    # Long-form writing (YYYY-MM-DD-slug.mdx)
│   └── notes/       # Short updates (YYYY-MM-DD-slug.md)
├── layouts/         # Page templates
├── pages/           # Routes and dynamic pages
└── styles/          # Global CSS and theme

docs/
├── developer/       # Technical documentation
└── tasks/           # Task management system
```

## Performance Targets

- **Lighthouse Score**: 95+ on all metrics
- **Page Weight**: <200KB for content pages
- **No JavaScript**: Unless absolutely necessary
- **Fast Builds**: <30 seconds for full site

## Getting Help

1. Check `docs/developer/` for technical documentation
2. Use specialized agents for complex tasks
3. Reference existing patterns in the codebase
4. Run `npm run check` to catch issues early

Remember: This is a personal creative space. Be bold with design, careful with code, and always maintain the site's unique character.
