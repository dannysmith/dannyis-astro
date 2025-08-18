# Task: Improve AI Documentation and Config

Having worked on a separate project and learnt a lot about using AI tools, I want to rework the AI documentation of this personal website. Developer documents should live in `docs/developer` and be primarily for the reference of AI models.

We currently have some guidance in CLAUDE.md and we have a load of documents in `.cursor/rules`. I would like to consolidate all of the documentation which explains best practices and how things work into sensible files in the developer docs. And then I'd like to extract out rules for how to work with stuff into CLAUDE or potentially some CLAUDE agents.

To do this we'll need to review the entire codebase and the various structures that we have in place here. The main goal with this task is to make it so that Claude code can conduct bigger and more complicated tasks without getting confused or breaking patterns.

- [x] Generate `docs` directory with suitable docs
- [x] Cut down Cursor Rules a lot (move good stuff into docs or Claude.md etc)
- [x] Set up proper Claude commands and agents to help with Astro, and especially with design/CSS etc. See dannysmith/tauri-template and dannysmith/astro-editor for some inspiration
- [x] Set up same task system as in other projects
- [ ] Add unit tests, end-to-end browser smoke tests, better linter, prettier and ts rules etc
- [x] Add `npm run check` command which runs all linters, tests and checks.
- [ ] Check integration with GitHub Issues for task tracking etc
- [x] Improve CLAUDE.md

## Analysis Complete

### Current State Assessment

- Analyzed 2,400+ lines across 11 documentation files
- Identified ~800-1,000 lines of redundant content
- Found significant overlap in component, architecture, and content documentation
- Current structure mixes technical reference with AI behavioral instructions

### Research Findings

- Studied tauri-template and astro-editor for patterns
- Reviewed official Astro best practices
- Identified key patterns: agent specialization, command-driven workflow, quality gates

### Implementation Plan Designed

Ready to execute the new documentation structure with:

- Consolidated developer docs in `docs/developer/`
- Streamlined AI rules in `.cursor/rules/`
- Specialized Claude agents in `.claude/agents/`
- Comprehensive testing and quality assurance setup

# AI Documentation Improvement Plan

## Executive Summary

This plan outlines the restructuring of AI documentation for the danny.is Astro project to achieve:

- 40-50% reduction in documentation redundancy
- Clear separation between developer reference and AI behavioral rules
- Specialized agent architecture for complex tasks
- Comprehensive testing and quality assurance

## Documentation Architecture

### 1. Developer Documentation (`docs/developer/`)

Technical reference documentation for AI models and human developers.

#### Core Documentation Files

**`architecture.md`** (~300 lines)

- Project structure and organization
- Directory layout and conventions
- Import patterns and module system
- Build pipeline and deployment
- Performance requirements and targets
- Static vs dynamic rendering decisions

**`components.md`** (~400 lines)

- Component catalog with examples
- Props interfaces and TypeScript patterns
- Composition patterns and best practices
- MDX component integration
- Error handling and fallback strategies
- Accessibility requirements

**`content-system.md`** (~250 lines)

- Content collections architecture
- Frontmatter schemas and validation
- Article vs Note distinctions
- MDX usage and custom components
- Image optimization patterns
- Draft workflow and publishing

**`styling-system.md`** (~300 lines)

- CSS architecture and layers
- Design tokens and CSS variables
- Container queries and responsiveness
- Typography system and scales
- Color system and theming
- Animation and interaction patterns

**`seo-and-performance.md`** (~200 lines)

- SEO utilities and configuration
- OpenGraph image generation
- RSS feed implementation
- Sitemap configuration
- Performance metrics and targets
- Core Web Vitals optimization

**`testing-and-quality.md`** (~150 lines)

- Testing strategy and tools
- Linting configuration
- Type checking setup
- Quality gates and CI/CD
- Performance monitoring
- Accessibility testing

### 2. AI Behavioral Rules (`/.cursor/rules/`)

Streamlined behavioral instructions for AI tools.

**`astro.mdc`** (~150 lines)

- Astro-specific commands and patterns
- Framework best practices
- Performance considerations
- Component development rules

**`content.mdc`** (~200 lines)

- Content creation commands
- Writing assistance roles
- SEO optimization commands
- Publishing workflows

**`development.mdc`** (~150 lines)

- Code quality standards
- Testing requirements
- Error handling patterns
- Security considerations

**`workflow.mdc`** (~100 lines)

- Definition of Ready/Done
- Commit message standards
- Quality gates
- Review processes

### 3. Claude Configuration

#### Main Configuration (`CLAUDE.md`) (~300 lines)

```markdown
# CLAUDE.md

See @docs/tasks.md for task management
See @docs/developer/ for technical documentation

## Quick Context

- **Project**: Danny Smith's personal website
- **Framework**: Astro 5.13+ with TypeScript
- **Architecture**: Content-first, zero-JavaScript-by-default
- **Content Types**: Articles (/writing/) and Notes (/notes/)

## Development Commands

### Core Commands

- `npm run dev` - Development server (localhost:4321)
- `npm run build` - Production build
- `npm run check` - Run all quality checks
- `npm run newnote` - Create new note

### Quality Assurance

ALWAYS run before marking tasks complete:

1. `npm run lint` - ESLint validation
2. `npm run check:types` - TypeScript checking
3. `npm run test` - Unit tests
4. `npm run test:e2e` - E2E browser tests
5. `npm run build` - Production build test

## Common Workflows

### Content Creation

- Use @content-specialist agent for writing tasks
- Use @seo-optimizer agent for SEO improvements
- Run "pre-publishing checklist" before publishing

### Component Development

- Use @component-expert agent for new components
- Update styleguide when adding components
- Follow TypeScript patterns in @docs/developer/components.md

### Performance Optimization

- Use @performance-analyst agent for audits
- Target Core Web Vitals thresholds
- Test with production builds

## Critical Rules

- NEVER commit without running quality checks
- NEVER add JavaScript unless absolutely necessary
- ALWAYS update styleguide for new components
- ALWAYS use semantic HTML and ARIA labels
- ALWAYS handle errors with meaningful fallbacks
```

#### Specialized Agents (`/.claude/agents/`)

**`content-specialist.md`** (~150 lines)

- Expert in content creation and optimization
- Markdown/MDX formatting
- SEO optimization
- Readability analysis
- Grammar and style checking

**`component-expert.md`** (~150 lines)

- Astro component development
- TypeScript patterns
- Accessibility implementation
- Performance optimization
- Design system adherence

**`seo-optimizer.md`** (~100 lines)

- SEO analysis and improvements
- OpenGraph optimization
- Structured data implementation
- Performance metrics
- Search visibility

**`performance-analyst.md`** (~100 lines)

- Core Web Vitals analysis
- Bundle size optimization
- Image optimization
- Caching strategies
- Loading performance

**`technical-reviewer.md`** (~100 lines)

- Code review and quality
- Architecture validation
- Security analysis
- Best practices enforcement
- Documentation review

#### Commands (`/.claude/commands/`)

**`check.md`** (~50 lines)

````markdown
---
description: Run all quality checks
allowed-tools: Bash
---

# Check Command

Runs comprehensive quality checks on the codebase.

## Execution

```bash
npm run check
```
````

This runs:

1. ESLint (`npm run lint`)
2. TypeScript checking (`npm run check:types`)
3. Unit tests (`npm run test`)
4. E2E tests (`npm run test:e2e`)
5. Build validation (`npm run build`)

Report any failures and suggest fixes.

````

**`new-component.md`** (~75 lines)
- Creates new component with TypeScript interface
- Adds to component barrel export
- Updates styleguide
- Creates basic tests

**`optimize-performance.md`** (~75 lines)
- Analyzes current performance
- Identifies bottlenecks
- Suggests optimizations
- Validates improvements

### 4. Testing Infrastructure

#### Package.json Updates
```json
{
  "scripts": {
    "check": "npm run lint && npm run check:types && npm run test && npm run build",
    "check:types": "tsc --noEmit && astro check",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:watch": "vitest --watch"
  }
}
````

#### Test Structure

```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── content/
├── e2e/
│   ├── smoke.spec.ts
│   ├── content.spec.ts
│   └── performance.spec.ts
└── fixtures/
```

## Implementation Phases

### Phase 1: Documentation Consolidation (2-3 hours)

1. Create `docs/developer/` directory structure
2. Consolidate content from `.cursor/rules/` to developer docs
3. Remove redundancies and organize by domain
4. Update cross-references and links

### Phase 2: AI Configuration (1-2 hours)

1. Streamline `.cursor/rules/` to essential behaviors
2. Create `.claude/agents/` with specialized agents
3. Set up `.claude/commands/` with common operations
4. Update CLAUDE.md with focused configuration

### Phase 3: Testing Setup (2-3 hours)

1. Install testing dependencies (Vitest, Playwright)
2. Create test structure and initial tests
3. Configure linting and type checking
4. Implement `npm run check` command

### Phase 4: Quality Assurance (1 hour)

1. Run full test suite
2. Validate documentation accuracy
3. Test AI commands and agents
4. Update task tracking

## Success Metrics

### Quantitative

- Documentation reduced from 2,400+ to ~1,500 lines
- Zero redundant content across files
- 100% test coverage for critical paths
- All quality checks passing

### Qualitative

- Clear separation of concerns
- Improved AI task completion accuracy
- Faster onboarding for new AI sessions
- Consistent code quality and patterns

## Risk Mitigation

### Potential Issues

1. **Breaking existing workflows** - Maintain backward compatibility during transition
2. **Lost documentation** - Keep backups of original files
3. **AI confusion** - Test incrementally with real tasks
4. **Test failures** - Start with smoke tests, expand gradually

### Mitigation Strategies

- Create documentation backup before changes
- Test each phase independently
- Maintain original files until validation complete
- Document migration path for existing patterns

## Timeline

- **Hour 1-3**: Phase 1 - Documentation Consolidation
- **Hour 4-5**: Phase 2 - AI Configuration
- **Hour 6-8**: Phase 3 - Testing Setup
- **Hour 9**: Phase 4 - Quality Assurance
- **Hour 10**: Buffer for issues and refinement

Total estimated time: 8-10 hours of focused work

## Next Steps

1. Review and approve this plan
2. Create backup of current documentation
3. Begin Phase 1 implementation
4. Validate each phase before proceeding
5. Document lessons learned
