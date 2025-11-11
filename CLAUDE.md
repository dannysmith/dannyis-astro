# Danny's Personal Website

Content-first creative playground for writing and design experimentation. Built with Astro 5.13+ and TypeScript.

## For AI Agents: Start Here

**Read `@docs/developer/README.md` first**, then:
- Import/config issues? → `@docs/developer/critical-patterns.md`
- Content/MDX/SEO? → `@docs/developer/content.md`
- Design/CSS? → `@docs/developer/design.md`
- Code quality? → `@docs/developer/standards.md`

## Quick Reference

### Commands

```bash
pnpm run dev          # Dev server (localhost:4321)
pnpm run build        # Production build
pnpm run check:all    # Quality gates (REQUIRED before completing work)
pnpm run newnote      # Create new note
```

### Task Management

See `@docs/tasks.md` for task system details.

```bash
pnpm task:complete TASK_NAME    # Mark task complete
```

### Common Workflows

**Add Component:** Create in `src/components/[category]/` → Add TypeScript interface → Export from `index.ts` → Add to `/styleguide`

**Create Content:** Use `pnpm run newnote` → Set `draft: true` → Write with MDX → Run `pnpm run check:all` → Set `draft: false`

**Design Changes:** Check `design.md` patterns → Use CSS variables → Test both themes → Update styleguide

## Critical Rules

1. **No JavaScript by default** - Static HTML/CSS unless required
2. **Typography first** - Let type drive design
3. **Update styleguide** - Add examples for new components
4. **Test builds** - Run `pnpm run check:all` before completing work
5. **Maintain character** - Bold, experimental, personal feel
6. **No unnecessary docs** - Don't create markdown files unless requested

## AI Assistance Tools

**Agents:**
- `@design-system-expert` - Typography, CSS, visual design
- `@astro-specialist` - Framework, performance, technical issues

**Commands:**
- `/new-content` - Create notes and articles
- `/content-checks` - Publishing validation
- `/content-enhancements` - Images, descriptions, tags

## Philosophy

Embrace experimentation, personal expression, and technical excellence. Be bold with design, careful with code, and always maintain the site's unique character.
