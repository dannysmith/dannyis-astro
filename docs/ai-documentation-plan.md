# AI Documentation Improvement Plan (Revised)

## Executive Summary

This plan restructures the AI documentation based on lessons learned from building Astro Editor with Claude Code. The goal is to create a maintainable, clear documentation structure that grows naturally as the project evolves.

**Core Philosophy**: Minimal but effective documentation that doesn't confuse AI tools and is easy to update.

## The Real Problem We're Solving

- **Legacy Structure**: Current docs were created before understanding AI tool best practices
- **Cursor-Specific Confusion**: Mixed instructions between Cursor and Claude
- **Maintenance Burden**: Hard to update documentation as new features are built
- **Redundancy**: Same information repeated across multiple files

## New Documentation Architecture

### 1. Developer Documentation (`docs/developer/`)

Consolidated technical reference that's easy to update as the site evolves.

**`architecture.md`** (~400 lines)

- Project structure and conventions
- Component organization and patterns
- Build pipeline and deployment
- Import patterns and module system
- Astro-specific implementation details

**`design-system.md`** (~500 lines)

- Typography scales and system
- Color theory and palette
- Layout principles and grid
- Component visual patterns
- CSS architecture and variables
- Animation and interaction design
- Constructivist/modernist influences

**`content-system.md`** (~300 lines)

- Content collections (Articles vs Notes)
- MDX components and usage
- Frontmatter schemas
- Image optimization
- Publishing workflow
- SEO and OpenGraph

**`implementation-patterns.md`** (~300 lines)

- TypeScript patterns and interfaces
- Error handling strategies
- Performance optimization
- Accessibility requirements
- Testing and quality gates
- Common code patterns

### 2. Minimal Cursor Rules (`.cursor/rules/`)

Strip down to just pointers for Cursor users.

**`cursor-claude-bridge.mdc`** (~50 lines)

```markdown
# Cursor Configuration

This project is primarily documented for Claude Code.

## Documentation References

- Architecture and components: See @docs/developer/architecture.md
- Design system: See @docs/developer/design-system.md
- Content management: See @docs/developer/content-system.md
- Code patterns: See @docs/developer/implementation-patterns.md
- AI configuration: See @CLAUDE.md

## Key Rules

- Follow TypeScript patterns in the codebase
- Maintain zero-JavaScript-by-default approach
- Update styleguide when adding components
- Run `npm run check` before completing tasks
```

Keep only `content.mdc` as-is (it has excellent commands).

### 3. Claude Configuration

#### Main File (`CLAUDE.md`) (~250 lines)

````markdown
# CLAUDE.md

See @docs/tasks.md for task management
See @docs/developer/ for technical documentation

## Quick Context

Danny Smith's personal website - a content-first creative playground for writing and design experimentation.

- **Framework**: Astro 5.13+ with TypeScript
- **Philosophy**: Zero-JavaScript-by-default, typography-driven design
- **Content**: Articles (/writing/) and Notes (/notes/)
- **Purpose**: Creative expression + technical experimentation

## Key Commands

### Development

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run check` - All quality checks
- `npm run newnote` - Create new note

### Quality Gates

ALWAYS run before completing tasks:

```bash
npm run check  # Runs lint, format:check, type checking, and build
```
````

## Specialized Assistance

Use specialized agents for complex tasks:

- @design-system-expert - Typography, CSS, visual design
- @astro-specialist - Framework internals, performance, architecture

## Critical Rules

1. **No JavaScript** unless absolutely necessary
2. **Update styleguide** when adding components
3. **Test production builds** for all changes
4. **Maintain design philosophy** - bold, experimental, typographic
5. **Keep documentation current** - update docs as you build

## Common Tasks

### Adding a Component

1. Create in appropriate `src/components/` subdirectory
2. Add TypeScript interface
3. Update barrel export
4. Add to styleguide
5. Document in design-system.md if significant

### Content Creation

- Articles go in `src/content/articles/` with full frontmatter
- Notes go in `src/content/notes/` with minimal frontmatter
- Use MDX components for rich content
- Run pre-publishing checklist

### Design Updates

- Check design-system.md for principles
- Maintain CSS variable consistency
- Test responsive behavior with container queries
- Preserve typography scales

````

#### Specialized Agents (`.claude/agents/`)

Just two focused agents:

**`design-system-expert.md`** (~200 lines)
```markdown
# Design System Expert Agent

You are an expert in typography, visual design, and CSS architecture with deep knowledge of constructivist and modernist design principles.

## Expertise Areas

### Typography
- Advanced typography principles and scales
- Font pairing and hierarchy
- Responsive typography with clamp()
- Drop caps and special treatments
- Readability optimization

### Visual Design
- Constructivist/modernist aesthetics
- Grid systems and asymmetric layouts
- Color theory and monochrome palettes
- Whitespace and visual rhythm
- Bold, experimental layouts

### CSS Architecture
- CSS layers and cascade management
- Custom properties and design tokens
- Container queries vs media queries
- Modern CSS features (has(), where(), is())
- Performance-conscious styling

## Project Context

This site embraces bold, experimental design:
- Oversized typography as primary design element
- Sharp geometric shapes and diagonals
- Monochrome base with red accent
- Zine-meets-manifesto aesthetic
- Anti-corporate, authentic feel

## When Consulted

Help with:
- Typography refinements and scales
- Layout experiments and grid systems
- CSS architecture decisions
- Visual hierarchy improvements
- Animation and interaction design
- Design system documentation

Always maintain the site's experimental, typography-driven character.
````

**`astro-specialist.md`** (~200 lines)

```markdown
# Astro Framework Specialist

You are an expert in Astro framework internals, performance optimization, and static site generation.

## Expertise Areas

### Astro Core

- Content collections and schemas
- Build pipeline and optimization
- Routing and page generation
- Component islands architecture
- Astro-specific TypeScript patterns

### Performance

- Static vs on-demand rendering
- Image optimization strategies
- Bundle splitting and lazy loading
- Core Web Vitals optimization
- Build-time vs runtime tradeoffs

### Integration

- MDX configuration and plugins
- Remark/Rehype pipeline customization
- Third-party component integration
- SEO and meta tag generation
- RSS and sitemap configuration

## Project Context

This site prioritizes:

- Zero-JavaScript by default
- Static generation for everything
- Content-first architecture
- Typography and design over interactivity
- Fast, clean page loads

## When Consulted

Help with:

- Astro configuration and optimization
- Content collection schemas
- Build pipeline issues
- Performance bottlenecks
- Framework-specific patterns
- Integration challenges

Always maintain zero-JavaScript philosophy unless absolutely necessary.
```

### 4. Testing & Quality

Simple, pragmatic quality gates:

#### Update package.json

```json
{
  "scripts": {
    "check": "npm run lint && npm run format:check && npm run check:types && npm run build",
    "check:types": "tsc --noEmit && astro check",
    "check:all": "npm run check" // Alias for compatibility
  }
}
```

No complex testing infrastructure initially - add only if needed.

## Implementation Strategy

### Phase 1: Documentation Consolidation (2 hours)

1. **Backup current docs**

   ```bash
   cp -r .cursor/rules .cursor/rules-backup
   cp CLAUDE.md CLAUDE.md.backup
   ```

2. **Create developer docs**
   - Merge redundant content into 4 core files
   - Focus on clarity and maintainability
   - Remove cursor-specific language

3. **Update cross-references**
   - Fix all @mentions and links
   - Ensure consistency

### Phase 2: Simplify AI Configuration (1 hour)

1. **Strip cursor rules**
   - Create minimal bridge file
   - Keep only content.mdc (it's good!)
   - Remove redundant files

2. **Create two agents**
   - Design system expert
   - Astro specialist

3. **Update CLAUDE.md**
   - Clear, focused configuration
   - Reference new structure

### Phase 3: Quality Setup (30 minutes)

1. **Add npm run check**
   - Combine existing checks
   - No new dependencies

2. **Test the setup**
   - Run check command
   - Verify documentation links

### Phase 4: Cleanup (30 minutes)

1. **Remove old files**
   - Delete redundant cursor rules
   - Clean up backups after validation

2. **Document the change**
   - Update this task file
   - Note lessons learned

## Success Metrics

### Quantitative

- **Documentation**: 2,400 → ~1,500 lines (40% reduction)
- **Cursor rules**: 9 files → 2 files
- **Agents**: 0 → 2 specialized
- **Redundancy**: Zero duplicate content

### Qualitative

- **Clarity**: Clear separation between reference and behavior
- **Maintainability**: Easy to update as site evolves
- **Focus**: No confusion between Cursor and Claude
- **Simplicity**: Minimal cognitive overhead

## What We're NOT Doing

- **Not adding complex testing** - The site works well already
- **Not creating many agents** - Just two specialized ones
- **Not over-documenting** - Keep it lean and useful
- **Not breaking what works** - Preserve good patterns like content.mdc

## Timeline

**Total: 4 hours of focused work**

- Hour 1-2: Documentation consolidation
- Hour 3: AI configuration simplification
- Hour 3.5: Quality setup
- Hour 4: Cleanup and validation

## Next Steps

1. Review this simplified plan
2. Backup current documentation
3. Execute phases sequentially
4. Validate at each step
5. Remove old files once confirmed working

## Key Principle

**Make it easy to maintain and extend** - Documentation should grow naturally as you build new features, not become a burden to update.
