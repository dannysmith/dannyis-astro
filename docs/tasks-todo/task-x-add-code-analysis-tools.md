# Add Code Analysis Tools (Knip + jscpd)

## Overview

Add two complementary code analysis tools to help identify potential code quality improvements:

1. **Knip** - Detects unused dependencies, exports, and files
2. **jscpd** - Detects duplicate code blocks

Both tools are for analysis and guidance, not strict enforcement. They help identify potential improvements that should be evaluated case-by-case.

**Important**: Neither tool should block builds or be treated as strict quality gates. They're discovery tools to help humans (and AI assistants) identify potential refactoring opportunities.

## What is Knip?

Knip finds and fixes:
- Unused npm dependencies (both dependencies and devDependencies)
- Unused exports and TypeScript types
- Unused files in the project
- Unused binaries and configuration

Benefits:
- Improved performance through reduced bloat
- Easier refactoring with clearer code relationships
- Better dependency management
- Reduced maintenance burden

## What is jscpd?

jscpd (JavaScript Copy/Paste Detector) finds duplicate code blocks across your project using the Rabin-Karp algorithm. It supports 150+ programming languages including TypeScript, JavaScript, and Astro files.

What it detects:
- Duplicate code blocks across files
- Copy-pasted functions with minor modifications
- Similar code patterns that might benefit from abstraction

**Important Philosophy**: Duplication is not always bad! Sometimes duplicate code is clearer and more maintainable than a premature abstraction. Use jscpd to discover duplication, not to eliminate all of it blindly.

Benefits:
- Identifies potential refactoring opportunities
- Helps maintain consistency across similar code
- Reveals patterns that might benefit from shared utilities
- Useful for AI-assisted development to find related code

## Implementation Plan

### Phase 1: Installation & Basic Configuration

#### Part A: Knip Setup

1. **Install Knip**
   ```bash
   pnpm add -D knip
   ```

2. **Create Knip Configuration File**
   - Create `knip.config.ts` (preferred over JSON for type safety and comments)
   - Use TypeScript format to match project patterns (like `eslint.config.js`, `vitest.config.ts`)
   - Start with minimal config - Knip has excellent defaults
   - The Astro plugin will auto-detect based on `"astro"` in package.json dependencies

3. **Initial Knip Configuration Structure**
   ```typescript
   import type { KnipConfig } from 'knip';

   export default {
     // Knip's Astro plugin auto-detects these by default:
     // - astro.config.{js,cjs,mjs,ts,mts}
     // - src/pages/**/*.{astro,mdx,js,ts}
     // - src/content.config.ts
     // - src/middleware.ts

     // Add additional entry points not covered by Astro plugin
     entry: [
       // Default Astro entries (auto-detected)
       'src/pages/**/*.{astro,mdx,js,ts}',
       'src/content.config.ts',
       'astro.config.mjs',

       // Additional project-specific entries
       'scripts/**/*.{ts,js}',           // Utility scripts
       'src/lib/**/*.{ts,mjs}',          // Custom remark/rehype plugins
       'tests/**/*.{test,spec}.ts',      // Test files

       // Config files
       'vitest.config.ts',
       'playwright.config.ts',
       'eslint.config.js',
     ],

     // Define which files to analyze for unused exports
     project: [
       'src/**/*.{ts,tsx,astro}',
       'scripts/**/*.{ts,js}',
       'tests/**/*.ts',
     ],

     // Standard ignores
     ignore: [
       'dist/**',
       'node_modules/**',
       '.astro/**',
       'public/**',
     ],

     // Ignore certain dependencies that might be flagged incorrectly
     // (Add these as we discover false positives)
     ignoreDependencies: [],
   } satisfies KnipConfig;
   ```

#### Part B: jscpd Setup

4. **Install jscpd**
   ```bash
   pnpm add -D jscpd
   ```

5. **Create jscpd Configuration File**
   Create `.jscpd.json` in the project root:

   ```json
   {
     "threshold": 0,
     "minLines": 5,
     "minTokens": 50,
     "mode": "mild",
     "reporters": ["console"],
     "ignore": [
       "**/node_modules/**",
       "**/.git/**",
       "**/dist/**",
       "**/.astro/**",
       "**/public/**",
       "**/*.md",
       "**/*.mdx",
       "docs/tasks-todo/**",
       "docs/tasks-done/**"
     ],
     "gitignore": true
   }
   ```

   **Configuration Notes**:
   - `threshold: 0` - Don't fail builds, just report
   - `minLines: 5` - Minimum 5 lines to be considered a duplicate
   - `minTokens: 50` - Minimum token count (filters out trivial matches)
   - `mode: "mild"` - Skip comments and empty lines (vs "strict" or "weak")
   - `reporters: ["console"]` - Simple console output (also available: "html", "json", "badge")
   - Excludes all content files (MD/MDX) and task directories
   - `gitignore: true` - Also respect .gitignore patterns

### Phase 2: Testing & Iteration

#### Part A: Knip Testing

6. **Run Initial Knip Analysis**
   ```bash
   pnpm knip
   ```
   - Review results carefully
   - Expect some false positives initially
   - Focus on unused files first (as recommended by Knip docs)

7. **Refine Knip Configuration**
   - Add any false positives to appropriate ignore lists
   - Common false positive categories:
     - **Generated files**: Ensure they're generated before running Knip
     - **Dynamic imports**: Template string imports aren't resolved - add manually to entry
     - **Type-only imports**: May be flagged if used only in type positions
     - **Astro components**: Components used only in MDX might need special handling
     - **Peer dependencies**: Some packages might be peer deps of other tools

8. **Test with Different Knip Reporters**
   ```bash
   # Default (symbols) - good for local dev
   pnpm knip

   # Compact - cleaner output
   pnpm knip --reporter compact

   # JSON - for potential CI integration
   pnpm knip --reporter json

   # Markdown - for documentation/tracking
   pnpm knip --reporter markdown > knip-report.md
   ```

#### Part B: jscpd Testing

9. **Run Initial jscpd Analysis**
   ```bash
   pnpm jscpd
   ```
   - Review duplicate code reports
   - Evaluate whether duplicates are legitimate or opportunities for refactoring
   - Remember: Not all duplication needs to be fixed!

10. **Test with Different jscpd Reporters**
    ```bash
    # Console output (default)
    pnpm jscpd

    # Generate HTML report for detailed visualization
    pnpm jscpd --reporters console,html

    # JSON output for programmatic analysis
    pnpm jscpd --reporters json
    ```

11. **Adjust Configuration if Needed**
    - If getting too many trivial matches, increase `minTokens` or `minLines`
    - If missing important duplicates, decrease thresholds
    - Add additional directories to ignore if needed

### Phase 3: Integration

12. **Add Commands to package.json**
    Add to the scripts section:
    ```json
    "check:knip": "knip",
    "check:dupes": "jscpd"
    ```

    **Note**: Keep these separate from `check:all` initially. These are discovery tools, not quality gates. Consider adding them only after:
    - Initial runs have been completed and results reviewed
    - Team is comfortable interpreting the reports
    - Decision made on whether they should be informational or blocking

13. **Update CLAUDE.md**
    Add to the Commands section (around line 89):
    ```bash
    pnpm run check:knip    # Check for unused code with Knip
    pnpm run check:dupes   # Check for duplicate code with jscpd
    ```

    Note: Keep separate from `check:all` - these are analysis tools, not enforcement.

14. **Update README.md**
    Add to the Commands table:
    ```markdown
    | `pnpm run check:knip`     | Check for unused dependencies, exports, and files |
    | `pnpm run check:dupes`    | Check for duplicate code blocks                    |
    ```

15. **Document in code-quality.md**
    Add new sections after the existing quality checks:

    ```markdown
    ## Code Analysis Tools

    We use two complementary analysis tools to help identify potential code quality improvements. These are **discovery tools, not quality gates** - they help identify opportunities for improvement that should be evaluated case-by-case.

    ### Knip - Unused Code Detection

    Knip automatically detects unused code in the project:
    - Unused dependencies and devDependencies
    - Unused exports and TypeScript types
    - Unused files

    Run: `pnpm run check:knip`

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

    Run: `pnpm run check:dupes`

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

    When asked to find related code or understand patterns across the codebase, run `pnpm run check:dupes` to discover similar implementations. This helps with:
    - Finding all places where a pattern is used
    - Understanding consistency across the codebase
    - Identifying refactoring opportunities
    - Ensuring fixes are applied comprehensively

    #### Configuration

    Adjust `.jscpd.json` if needed:
    - Increase `minTokens` or `minLines` if getting too many trivial matches
    - Decrease thresholds if missing important duplicates
    - Add directories to `ignore` array for areas where duplication is expected
    ```

### Phase 4: Optional Enhancements

16. **Consider CI Integration** (future task)
    - Add to GitHub Actions workflow
    - Knip: Use `--reporter github-actions` for annotations
    - jscpd: Consider HTML reports for PR comments
    - Decide on failure thresholds

17. **Create .knipignore file** (if needed)
    - Similar to .gitignore but for Knip-specific ignores
    - Useful for generated files or vendored code

## Testing Checklist

Before marking this task complete:

**Knip:**
- [ ] Knip installed (`pnpm add -D knip`)
- [ ] `knip.config.ts` created and configured
- [ ] Initial run completed (`pnpm knip`)
- [ ] Results reviewed and false positives identified
- [ ] False positives handled appropriately in config
- [ ] Command added to package.json (`check:knip`)

**jscpd:**
- [ ] jscpd installed (`pnpm add -D jscpd`)
- [ ] `.jscpd.json` created and configured
- [ ] Initial run completed (`pnpm jscpd`)
- [ ] Results reviewed with understanding of when duplication is acceptable
- [ ] Command added to package.json (`check:dupes`)

**Documentation:**
- [ ] CLAUDE.md updated with both commands
- [ ] README.md updated with both commands in table
- [ ] code-quality.md updated with comprehensive guidance for both tools
- [ ] Run `pnpm run check:format` to ensure config files are formatted correctly

**Verification:**
- [ ] Both tools run successfully without errors
- [ ] Tools don't interfere with existing quality checks
- [ ] Configuration excludes appropriate directories (content, tasks, etc.)

## Key Configuration Decisions

Based on the project structure, these decisions should be made during implementation:

### Knip-Specific

1. **Entry Points**:
   - Scripts in `scripts/` directory (get-toolbox-json.ts, create-note.ts, complete-task.js)
   - Test files in `tests/` directory
   - Remark/rehype plugins in `src/lib/`
   - Config files (eslint, vitest, playwright, astro)

2. **Dependencies to Watch**:
   - `@resvg/resvg-js` - Used in build but may be flagged
   - `puppeteer` - Used for mermaid diagram generation
   - `sharp` - Used for image optimization
   - `mermaid` - Used in markdown processing
   - Remark/Rehype plugins

3. **Potential False Positives**:
   - MDX components in `src/components/mdx/` (used in content but may not be detected)
   - Barrel exports in component directories (index.ts files)
   - Type-only utilities
   - Dynamic imports in any routing or plugin systems

### jscpd-Specific

1. **Directories to Exclude**:
   - `src/content/**/*` - Blog posts and notes (content duplication is fine)
   - `docs/tasks-todo/**` and `docs/tasks-done/**` - Task files
   - All MD/MDX files - Content shouldn't be analyzed for code duplication

2. **Threshold Tuning**:
   - Start with `minLines: 5` and `minTokens: 50`
   - Adjust based on initial results
   - Too many trivial matches? Increase thresholds
   - Missing important duplicates? Decrease thresholds

3. **Acceptable Duplication Areas**:
   - Test setup code - Often clearer when duplicated
   - Page/route files - Similar structure is expected
   - Component prop interfaces - Type definitions may naturally overlap
   - Build scripts - Configuration patterns often repeat

## Resources

### Knip
- Knip Documentation: https://knip.dev/
- Astro Plugin: https://knip.dev/reference/plugins/astro
- Configuration: https://knip.dev/overview/configuration
- Handling Issues: https://knip.dev/guides/handling-issues
- Reporters: https://knip.dev/features/reporters

### jscpd
- jscpd GitHub: https://github.com/kucherenko/jscpd
- Configuration Examples: Various integrations available via MegaLinter documentation

## Success Criteria

This task is complete when:

**For Both Tools:**
1. Both tools are installed and configured
2. Initial runs produce understandable results
3. Configuration is tuned appropriately (false positives handled, proper exclusions set)
4. Documentation is updated in all three locations (CLAUDE.md, README.md, code-quality.md)
5. Commands work as expected (`pnpm run check:knip` and `pnpm run check:dupes`)

**Understanding:**
6. Team understands how to interpret results from both tools
7. Clear guidance exists on when to act on findings vs when to accept them
8. Tools are positioned as discovery/analysis tools, not quality gates

**Important**: This task does NOT include:
- Fixing all issues Knip reports
- Removing all duplicate code
- Adding these tools to `check:all` or CI/CD

The goal is to have both tools set up, configured, and documented so they can be used effectively for analysis going forward. Addressing findings should be separate, evaluated tasks.
