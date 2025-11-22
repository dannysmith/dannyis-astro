# Component Pattern Documentation & Code Mapping

**Type:** Documentation & Audit
**Goal:** Bridge the visual review's component inventory with actual codebase implementation
**Prerequisites:** None (can run in parallel with Tasks 2-4)

## Context

The visual review catalogued 80+ visual components based purely on screenshots, without knowledge of the codebase structure. This task creates the critical bridge: mapping those visual observations to actual code, documenting patterns that exist, and identifying gaps.

**Outcome:** A comprehensive component pattern guide that allows designers and developers to understand:
1. Which visual components already exist in code
2. Where they live in the codebase
3. How to use them correctly
4. Which visual patterns need new components created

## Phase 1: Component Inventory Mapping

Create a comprehensive mapping document: `docs/developer/component-inventory.md`

### Format

For each visual component identified in the review, document:

```markdown
### [Visual Component Name]

**Status:** ✅ Implemented | ⚠️ Partial | ❌ Missing | 🔄 Needs Refactor

**Code Location:** `src/components/[category]/[ComponentName].astro`

**Visual Examples:** [Link to relevant screenshot or styleguide entry]

**Current Implementation:**
- Props interface
- Variants available
- Usage examples
- Known limitations

**Token Usage:**
- Spacing: [lists tokens used]
- Typography: [lists tokens used]
- Colors: [lists tokens used]
- Borders: [lists tokens used]

**Pattern Notes:**
[Free-form notes about the pattern, reusability, edge cases]

**Improvement Opportunities:**
[What could be better based on visual review findings]
```

### Component Categories to Map

#### 1. Brand & Hero Elements

- [ ] **Hero Masthead**
  - Location: `src/pages/index.astro`
  - Status: ✅ Implemented but needs typography clamping (Task 4)
  - Tokens: Font size, line height, letter spacing
  - Pattern: Oversized display type, ultra-bold, uppercase

- [ ] **Section Title Blocks**
  - Location: Multiple pages (`writing/index.astro`, `notes/index.astro`, etc.)
  - Status: ⚠️ Partial - pattern exists but not componentized
  - Opportunity: Could be extracted to `SectionHero.astro` component

- [ ] **Page Intro / Article Hero**
  - Location: Article/Note layouts
  - Status: ✅ Implemented in layout files
  - Pattern: Eyebrow + Title + Subtitle + Metadata

- [ ] **Styleguide Headings**
  - Location: `src/pages/styleguide.astro`
  - Status: ✅ Implemented
  - Pattern: Uppercase sans + serif italics pairing

#### 2. Navigation & Wayfinding

- [ ] **Primary Link List (Home Navigation Stack)**
  - Location: `src/pages/index.astro`
  - Status: ✅ Implemented but inconsistent coral underline thickness
  - Improvement: Apply standardized `--border-width-base` (Task 4)

- [ ] **NavLink Component**
  - Location: `src/components/navigation/NavLink.astro`
  - Status: ✅ Implemented
  - Review: Check if coral underline uses tokens

- [ ] **Inline Link Chips** ("share / copy / view")
  - Location: Likely in article/note layouts
  - Status: ⚠️ Partial - pattern exists but not componentized
  - Opportunity: Create `ActionLinks.astro` component

- [ ] **Pagination Dots**
  - Location: Footer or page layouts
  - Status: ❌ Missing or ⚠️ Unlabeled
  - Recommendation: Replace with textual navigation or remove (per visual review)

- [ ] **Footer System**
  - Location: `src/components/layout/Footer.astro`
  - Status: ✅ Implemented
  - Review: Check responsive behavior on small screens

- [ ] **ThemeToggle**
  - Location: `src/components/navigation/ThemeToggle.astro`
  - Status: ✅ Implemented
  - Review: Check if uses radius and spacing tokens

#### 3. Content Listing Modules

- [ ] **Writing Index Row**
  - Location: `src/pages/writing/index.astro`
  - Status: ✅ Implemented
  - Pattern: Date + Title + Badge + Coral divider
  - Review: Coral divider token usage

- [ ] **Notes Overview Row**
  - Location: `src/pages/notes/index.astro`
  - Status: ✅ Implemented
  - Pattern: Similar to writing but with excerpts

- [ ] **NoteCard ("Paper" Stack)**
  - Location: `src/components/layout/NoteCard.astro`
  - Status: ✅ Implemented
  - Tokens: Heavy usage of hardcoded spacing and typography
  - Priority: High for token migration (Task 3)

- [ ] **ContentCard**
  - Location: `src/components/ui/ContentCard.astro`
  - Status: ✅ Implemented
  - Opportunity: Could share base with NoteCard using Card primitive (Task 4)

- [ ] **Bookmark / Link Card**
  - Location: `src/components/mdx/BookmarkCard.astro`
  - Status: ✅ Implemented
  - Opportunity: Refactor using Card primitive (Task 4)

- [ ] **Now Page Items**
  - Location: Likely in `src/pages/now.astro`
  - Status: Need to verify
  - Pattern: Timeline entries with status/music/what's next

#### 4. Article & Note Body Components

- [ ] **Body Copy Paragraphs**
  - Location: `src/components/layout/LongFormProseTypography.astro`
  - Status: ✅ Implemented
  - Review: Typography tokens usage

- [ ] **Section Subheads**
  - Location: Within prose typography components
  - Status: ✅ Implemented in `@layer prose`
  - Pattern: Mix of serif italics and uppercase sans

- [ ] **Metadata Bars**
  - Location: Article/Note headers
  - Status: ✅ Implemented but spacing varies
  - Pattern: Gray text + coral dividers
  - Improvement: Standardize spacing with tokens

- [ ] **Share Module / Post Footer**
  - Location: Article/Note layouts
  - Status: ⚠️ Partial - exists but not componentized
  - Opportunity: Create `ShareActions.astro` component

#### 5. Communication & Status Components

- [ ] **Callout / Alerts**
  - Location: `src/components/mdx/Callout.astro`
  - Status: ✅ Implemented with color variants
  - Review: Check semantic color usage
  - Tokens: Border radius, padding

- [ ] **Pill / Badge**
  - Location: `src/components/ui/Pill.astro`
  - Status: ✅ Implemented
  - Opportunity: Add semantic variants (Task 4)
  - Tokens: Font size, letter spacing, padding, border radius

- [ ] **Blockquotes**
  - Location: `@layer prose` in typography components
  - Status: ✅ Implemented
  - Pattern: Coral border-left
  - Review: Border width token usage

- [ ] **BlockQuoteCitation**
  - Location: `src/components/mdx/BlockQuoteCitation.astro`
  - Status: ✅ Implemented
  - Review: Typography and spacing tokens

- [ ] **Pull Quotes**
  - Location: Unknown - may not exist
  - Status: ❌ Missing?
  - Visual Review: Mentioned but not found in codebase

- [ ] **Horizontal Rules / Dividers**
  - Location: Throughout (CSS, not component)
  - Status: ✅ Pattern exists
  - Priority: High for token standardization (Task 4 - coral rule system)

- [ ] **Checklists / Task Lists**
  - Location: Markdown rendering in prose
  - Status: ✅ Implemented in prose layer
  - Review: Checkbox styling, spacing

- [ ] **Accordions**
  - Location: `src/components/mdx/Accordion.astro`
  - Status: ✅ Implemented
  - Review: Coral underline, icon consistency, animation tokens

#### 6. Actions & Interactive Controls

- [ ] **ButtonLink (Primary)**
  - Location: `src/components/mdx/ButtonLink.astro`
  - Status: ✅ Implemented (primary only)
  - Opportunity: Add secondary/tertiary variants (Task 4)

- [ ] **Secondary / Ghost Buttons**
  - Status: ❌ Missing
  - Need: Create as variants of ButtonLink

- [ ] **Icon Buttons**
  - Status: ❌ Missing or ⚠️ Partial
  - Need: Standardized icon button component

- [ ] **Form Inputs**
  - Location: Styleguide only?
  - Status: ⚠️ Partial - may not have dedicated components
  - Need: Verify if form components exist

#### 7. Media & Data Display

- [ ] **Inline Code**
  - Location: `@layer prose` styling
  - Status: ✅ Implemented
  - Improvement: Add consistent background/border tokens (Task 4)

- [ ] **Code Blocks**
  - Location: Syntax highlighting in prose
  - Status: ⚠️ Partial - lacks copy button, language label
  - Opportunity: Create enhanced CodeBlock component (Task 4)

- [ ] **BasicImage**
  - Location: `src/components/mdx/BasicImage.astro`
  - Status: ✅ Implemented
  - Review: Border radius, spacing tokens

- [ ] **Grid Component**
  - Location: `src/components/mdx/Grid.astro`
  - Status: ✅ Implemented
  - Review: Gap/spacing tokens

- [ ] **Embed Component**
  - Location: `src/components/mdx/Embed.astro`
  - Status: ✅ Implemented
  - Opportunity: Refactor using Card primitive (Task 4)

- [ ] **Loom Embed**
  - Location: `src/components/mdx/Loom.astro`
  - Status: ✅ Implemented
  - Review: Aspect ratio handling

- [ ] **Tables**
  - Location: `@layer base` styling
  - Status: ✅ Implemented
  - Review: Border and spacing tokens (global.css:330-350)

- [ ] **Lists**
  - Location: `@layer prose` styling
  - Status: ✅ Implemented
  - Review: Coral bullet/numeral colors

#### 8. Layout & Utility Components

- [ ] **Container Utilities**
  - Location: Layout files (not componentized)
  - Status: ⚠️ Pattern exists but not formalized
  - Opportunity: Document max-widths and padding patterns

- [ ] **Spacing Utilities**
  - Location: Throughout (margins, padding, gaps)
  - Status: 🔄 Needs comprehensive token migration (Task 3)
  - Pattern: Ad-hoc values currently

- [ ] **Elevation System**
  - Location: Shadow tokens in global.css
  - Status: ⚠️ Tokens exist but underutilized
  - Opportunity: Formalize elevation tiers (Task 4)

- [ ] **Screen Reader Utilities**
  - Location: `.sr-only` class in global.css:705-716
  - Status: ✅ Implemented

## Phase 2: Pattern Documentation

Create detailed pattern guides in `docs/developer/patterns/`

### 2.1 Typography Patterns

**Document:**
- Display type pattern (Hero masthead, section titles)
- Prose type pattern (Article/note body copy)
- UI type pattern (Navigation, labels, metadata)
- Code type pattern (Inline code, code blocks)

**For each pattern, capture:**
- Font family token
- Size scale (when to use each level)
- Line height guidelines
- Letter spacing rules
- Font weight choices
- Color usage (semantic, not base colors)

### 2.2 Spacing Patterns

**Document:**
- Micro spacing (within components: 4-12px)
- Component spacing (padding, gaps: 16-32px)
- Section spacing (major breaks: 48-96px)
- Layout spacing (page-level margins: 64-128px)

**For each pattern, capture:**
- When to use each scale level
- Exceptions to 8px grid (typography-driven)
- Responsive adjustments
- Container query usage

### 2.3 Color Patterns

**Document:**
- Surface tiers (base, raised, inset, overlay)
- Text hierarchy (primary, secondary, accent)
- Interactive states (default, hover, active, disabled)
- Semantic colors (info, success, warning, error)
- Accent usage (coral as the signature color)

**For each pattern, capture:**
- Light mode values
- Dark mode values
- Contrast requirements
- Usage guidelines

### 2.4 Interaction Patterns

**Document:**
- Hover states (opacity, transform, color shifts)
- Focus states (outlines, rings)
- Active states (pressed buttons, selected items)
- Disabled states (reduced opacity, no pointer)
- Loading states (spinners, skeletons)

**For each pattern, capture:**
- Transition duration
- Easing function
- Visual treatment
- Accessibility requirements

### 2.5 Responsive Patterns

**Document:**
- Breakpoint strategy (when to use media queries vs container queries)
- Stacking behavior (columns to rows)
- Typography scaling (clamp usage)
- Spacing adjustments (tighter on mobile)

**For each pattern, capture:**
- Mobile behavior (375-640px)
- Tablet behavior (641-1024px)
- Desktop behavior (1025-1920px)
- Ultrawide behavior (1920px+)

## Phase 3: Gap Analysis & Recommendations

### 3.1 Missing Components

Identify visual patterns from the review that don't have corresponding components:

- [ ] Pull Quote component
- [ ] Icon Button component
- [ ] Form Input components (if actually missing)
- [ ] Timeline/Now Page item component
- [ ] Generic Card primitive (Task 4 addresses this)
- [ ] Share Actions component
- [ ] Statistic/Highlight Block component

### 3.2 Componentization Opportunities

Identify patterns that exist but could be extracted into reusable components:

- [ ] Section Hero (the "WRITING" / "NOTES" pattern)
- [ ] Metadata Bar (date, reading time, tags)
- [ ] Coral Rule/Divider (the signature underline)
- [ ] Share Module (share / copy / view actions)
- [ ] Link List Item (home navigation pattern)

### 3.3 Refactoring Recommendations

Components that exist but could benefit from restructuring:

- [ ] NoteCard + ContentCard → shared Card base
- [ ] ButtonLink → add variant system
- [ ] Callout → already good, just needs token migration
- [ ] Code blocks → add utility features

## Deliverables

1. **`docs/developer/component-inventory.md`**
   - Complete mapping of all visual components to code
   - Status of each component
   - Improvement opportunities

2. **`docs/developer/patterns/`** directory with guides:
   - `typography-patterns.md`
   - `spacing-patterns.md`
   - `color-patterns.md`
   - `interaction-patterns.md`
   - `responsive-patterns.md`

3. **`docs/developer/component-creation-guide.md`**
   - How to create new components
   - Checklist for component quality
   - Token usage requirements
   - Testing requirements
   - Documentation requirements

4. **Updated `docs/developer/README.md`**
   - Add links to new pattern guides
   - Update component documentation index

## Success Metrics

- [ ] Every visual component from review mapped to code or marked as missing
- [ ] All existing components documented with props, variants, token usage
- [ ] Pattern guides cover all major design patterns
- [ ] Gap analysis identifies missing components
- [ ] Componentization opportunities catalogued
- [ ] New developers can find any component quickly using the inventory
- [ ] Designers can reference patterns when creating new mockups

## Related Tasks

- **Task 1:** Visual Review (provides component inventory to map)
- **Task 2:** Design Token Architecture (patterns use these tokens)
- **Task 3:** Token Implementation (updates components with tokens)
- **Task 4:** Visual Refinement (creates/enhances components)

## Notes

- This is primarily **documentation**, not implementation
- Can be done in parallel with token work (Tasks 2-3)
- Provides critical foundation for Task 4 (knowing what exists)
- Creates "source of truth" for component library
- Helps identify which components need token migration priority
