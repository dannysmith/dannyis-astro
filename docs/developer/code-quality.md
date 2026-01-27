# Code Quality

Guidance and rules for keeping code quality high.

## Quality Mindset

- **Automated checks catch errors** - Run `bun run check:all` frequently
- **Test in production builds** - Dev mode hides issues
- **Review before committing** - Quick scan prevents issues
- **Update docs when patterns change** - Keep documentation current
- **Ask when uncertain** - Better to clarify than break things

Remember: The goal is **clarity and completeness**, not bureaucracy. Quality gates exist to catch mistakes early and maintain a high-quality codebase.

## Quality Checks

We have various tools available to help with maintaining code quality:

1. **TypeScript** - Type checking
2. **Astro** - Framework-specific validation
3. **Prettier** - Format checking
4. **ESLint** - Linting
5. **Vitest** - Unit tests
6. **Playwright** - E2E tests

These can be run together with `bun run check:all`.

## Common Patterns Reference

For coding patterns and common issues, see:

- **CSS patterns** (colors, tokens, styling) → [design.md](./design.md)
- **Import patterns** (path aliases) → [architecture-guide.md § TypeScript Path Aliases](./architecture-guide.md#typescript-path-aliases)
- **Component patterns** (props, structure) → [component-patterns.md](./component-patterns.md)

## Code Analysis Tools

We use two complementary analysis tools to help identify potential code quality improvements. These are **discovery tools, not quality gates** - they help identify opportunities for improvement that should be evaluated case-by-case.

### Knip - Unused Code Detection

Knip automatically detects unused code in the project:
- Unused dependencies and devDependencies
- Unused exports and TypeScript types
- Unused files

Run: `bun run check:knip`

#### Understanding Knip Results

Knip groups issues by type:
- **unused files**: Files in the project that aren't imported anywhere
- **unused dependencies**: npm packages that aren't used
- **unused exports**: Exported functions/types that aren't imported anywhere
- **unlisted dependencies**: Used packages not in package.json
- **unresolved imports**: Imports that can't be resolved

#### Handling Knip Reports

Not all issues need immediate fixing:

1. **Start with unused files** - These are usually safe to remove or add to entry points
2. **Review dependencies carefully** - Some are needed at runtime even if not imported
3. **Check exports in utility files** - Some exports might be for future use or external tools
4. **Dynamic imports** - Template string imports (`import(\`./\${x}.ts\`)`) aren't detected

#### Common False Positives

**Type-only imports**: Sometimes flagged if used only in type positions
```typescript
// May be flagged as unused but is needed for types
import type { SomeType } from 'some-package';
```

**Astro components used in MDX**: Components imported in MDX files might not be detected
- Solution: Add to entry points or use MDX components barrel export

**Build-time dependencies**: Tools used in build process but not in source
- Examples: `@resvg/resvg-js`, `sharp`, `puppeteer`
- These are actual dependencies, not devDependencies

**Peer dependencies**: Installed for other tools but not directly imported

#### Configuring Ignores

If you have persistent false positives, add them to `knip.config.ts`:

```typescript
ignoreDependencies: [
  'some-package', // Used at runtime but not imported
],
ignoreExportsUsedInFile: true, // For utility files with multiple exports
```

**Important**: Don't over-use ignores. Most "false positives" reveal:
- Code that can be removed
- Missing documentation about why something is needed
- Opportunities to refactor

### jscpd - Duplicate Code Detection

jscpd finds duplicate code blocks across the project using the Rabin-Karp algorithm.

Run: `bun run check:dupes`

#### Understanding jscpd Results

jscpd reports:
- Duplicate code blocks and their locations
- Percentage of duplication in the codebase
- Specific files and line numbers where duplicates occur

#### The Philosophy of Duplication

**Critical**: Not all duplication is bad! Sometimes duplicate code is clearer and more maintainable than premature abstraction.

Good reasons for duplication:
- **Independence**: Components that happen to be similar but serve different purposes
- **Clarity**: Explicit code that's easier to understand than a complex abstraction
- **Flexibility**: Code that might diverge in the future
- **Testing**: Test setup code that's clearer when duplicated

Bad reasons for duplication:
- Copy-pasted bug fixes (bug exists in multiple places)
- Business logic that must stay in sync
- Complex algorithms duplicated across files
- Utility functions that should be shared

#### Using jscpd Effectively

1. **Use it for discovery**: Let it find duplicates, then evaluate each case
2. **Focus on business logic**: Prioritize duplicated business rules or complex logic
3. **Ignore boilerplate**: Config files, test setup, and simple patterns are often fine duplicated
4. **Consider the future**: Is this code likely to diverge or stay in sync?

#### For AI Assistants

When asked to find related code or understand patterns across the codebase, run `bun run check:dupes` to discover similar implementations. This helps with:
- Finding all places where a pattern is used
- Understanding consistency across the codebase
- Identifying refactoring opportunities
- Ensuring fixes are applied comprehensively

#### Configuration

Adjust `.jscpd.json` if needed:
- Increase `minTokens` or `minLines` if getting too many trivial matches
- Decrease thresholds if missing important duplicates
- Add directories to `ignore` array for areas where duplication is expected
