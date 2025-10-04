# Task 1: CSS Refactoring & Simplification

## Overview

Refactor CSS across components to reduce duplication, simplify the color system, and standardize patterns while maintaining the site's bold, experimental character.

## Areas for Simplification

### 1. Navigation & Footer Link Duplication

**Current State:**

- Footer and MainNavigation have nearly identical link styling patterns
- Both components define similar hover states, text transforms, and spacing
- Social links in Footer also duplicate similar hover/focus patterns

**Proposed Direction:**

- Extract shared navigation link patterns into reusable CSS utilities or a shared component
- Consolidate hover/focus states into consistent patterns
- Reduce code duplication while keeping navigation and footer visually distinct through their container styling

### 2. Color Variable Consolidation

**Current State:**

- ~80 color variables defined in palette (many shades rarely used)
- Some colors like brown, certain grey shades appear unused
- Multiple ways to achieve similar visual effects

**Proposed Direction:**

- Audit actual color usage across all components
- Remove unused color shades from the palette
- Consolidate similar colors that serve the same purpose
- Keep semantic color names but reduce the base palette

### 3. Component-Specific Variables Rationalization

**Current State:**

- Many components define their own CSS variables (e.g., `--color-notecard-dot-grid`, `--color-contentcard-article-accent`)
- Some of these reference the same base values
- Creates a large surface area of variables to maintain

**Proposed Direction:**

- Identify which component variables truly need to be themeable
- Replace single-use variables with direct color references where theming isn't needed
- Group related component variables more logically
- Reduce the number of intermediary variables

### 4. Container Query Standardization

**Current State:**

- NoteCard, ContentCard, and BookmarkCard each implement container queries differently
- Different breakpoint values and approaches
- No consistent pattern for responsive component behavior

**Proposed Direction:**

- Define standard container query breakpoints (e.g., compact, standard, expanded)
- Create consistent patterns for how components respond to container size
- Potentially extract container query logic into utility classes
- Ensure all responsive components follow the same scaling philosophy

## Benefits

- **Reduced maintenance**: Less duplicate code to update
- **Improved consistency**: Standardized patterns across components
- **Smaller CSS footprint**: Removing unused variables and consolidating duplicates
- **Easier theming**: Clearer understanding of which variables actually affect appearance
- **Better developer experience**: More predictable component behavior

## Constraints

- Maintain the bold, experimental visual character
- Keep the zero-JavaScript philosophy intact
- Preserve the existing light/dark theme functionality
- Don't break the typography-driven design approach
- Ensure all changes are backwards compatible with existing content

## Success Criteria

- [ ] CSS file size reduced by at least 15%
- [ ] No visual regressions in existing pages
- [ ] Improved Lighthouse scores maintained (95+)
- [ ] Theme switching continues to work smoothly
- [ ] Code is more maintainable and has clear patterns

## Next Steps

Once approved, we'll:

1. Audit current color usage across all components
2. Create a consolidation plan for navigation patterns
3. Define standard container query breakpoints
4. Implement changes incrementally with testing at each step
