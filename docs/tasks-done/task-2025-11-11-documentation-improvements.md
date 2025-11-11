# Documentation Improvements - Core Architectural Patterns

## Overview

This task focuses on documenting the **unique architectural patterns** in this codebase that differentiate it from standard Astro sites. The goal is to make the documentation useful for both human developers and AI agents without bloating it with unnecessary detail.

**Current State:** Documentation ~60% complete **Target State:** Document all critical unique patterns, fill empty sections **Priority:** Focus on patterns that are non-obvious and project-specific

**Scope:** Essentials only - comprehensive guides deferred to future tasks

---

## Part 1: Core Architecture Principles Section

**File:** `docs/developer/architecture-guide.md:7-9`

**Current State:** Empty section marked "TODO WILL FILL IN LATER"

**Action:** Write this section with the following 5 principles (ordered by importance):

### 1. Static Site with Minimal Client-Side JavaScript ⭐⭐⭐

**Key Points:**

- This is a **statically generated site** - almost everything happens at build time
- Avoid client-side JavaScript wherever possible
- **Build-time JS is fine** (OG image generation, RSS rendering, content processing)
- **Client-side JS is acceptable** when it's genuinely the best solution for a feature
- Prefer modern CSS features over JS (container queries, `:has()`, layers, etc.)
- Progressive enhancement of browser-native features preferred
- NO `client:*` directives used anywhere in this codebase
- Interactive components use inline `<script>` tags (ThemeToggle, MainNavigation, Accordion, Lightbox, MarkdownContentActions)
- All scripts handle ViewTransitions (`astro:after-swap` events)

**Build-Time Generation Examples:**

- OG images (Satori + Resvg)
- RSS feeds with full MDX rendering (Container API)
- Markdown export endpoints
- Content summaries and reading time
- All dynamic routes via `getStaticPaths()`

**Cross-references:**

- See `component-patterns.md` for interactive component patterns
- See `content-system.md` for build-time content processing

### 2. MDX Component Remapping (Automatic Enhancement) ⭐⭐⭐

**CRITICAL: This pattern is not documented anywhere else**

**What it does:**

- All `<a>` tags in MDX automatically become `SmartLink` components
- All `<img>` tags in MDX automatically become `BasicImage` components
- Transparent to content authors - no imports needed
- Provides automatic enhancements (external icons, security attributes, optimization, responsive images)

**Implementation:**

```typescript
// In article/note page templates
const components = {
  a: SmartLink,    // Auto-detects internal/external, adds icons/attributes
  img: BasicImage, // Responsive images with optimization
};

<Content components={components} />
```

**Location:**

- `src/pages/writing/[...slug]/index.astro:23-27`
- `src/pages/notes/[...slug]/index.astro` (similar pattern)

**How to extend:**

- Add more mappings to the `components` object (e.g., `code: CustomCode`)
- Available for any HTML element rendered from markdown
- Components must accept standard HTML element props

**Benefits:**

- Consistency across all content
- No need to import components in every MDX file
- Content authors don't need to know about component enhancements
- Changes to SmartLink/BasicImage automatically apply to all content

### 3. CSS Layers & Theme System ⭐⭐⭐

**CSS Layers Architecture:**

- Five-layer cascade system: `reset` → `base` → `simple-prose` → `longform-prose` → `theme`
- Eliminates need for `!important` or complex specificity battles
- Location: `src/styles/global.css:2`

**Three-Tier Color System:**

- **Tier 1:** Base tokens (e.g., `--color-red-500`) - **NEVER USE DIRECTLY**
- **Tier 2:** Semantic variables (e.g., `--color-bg-primary`) - **USE THESE**
- **Tier 3:** Component usage
- This hierarchy enables easy theme switching

**Theme Management:**

- Three modes: `auto` (follows system), `light`, `dark`
- Global `window.theme` API for programmatic access
- Inline script in `BaseHead.astro` prevents FOUC
- Custom `theme-changed` event for component updates
- localStorage persistence across sessions
- Tab synchronization via `storage` event

**Why they're related:**

- Semantic color variables switch automatically based on `data-theme` attribute
- Allows entire site to re-theme without component changes
- Modern CSS approach (layers are 2022+ feature)

**Cross-references:**

- See `design.md` for complete CSS architecture details
- See `design.md` for color system specification
- See `component-patterns.md` for theme-aware component patterns

### 4. Centralized Organization with Clear Boundaries ⭐⭐

**Directory Rules:**

**`src/config/`** - Data only (no logic)

- Constants, configuration objects, schemas
- Exported with `as const` for type inference
- Example: `src/config/seo.ts` (AUTHOR, TITLE_TEMPLATES, SCHEMA_CONFIG)

**`src/utils/`** - Pure functions only (no data)

- Testable business logic
- Consume config from `src/config/`
- Example: `src/utils/seo.ts` (generatePageTitle, generateJSONLD)

**`src/components/`** - Organized by category

- `layout/` - Structural (BaseHead, Footer, MainNavigation)
- `navigation/` - Navigation-specific (NavLink, ThemeToggle)
- `ui/` - Reusable utilities (ContentCard, FormattedDate, Pill)
- `mdx/` - Available in MDX content (Callout, Embed, BasicImage)
- Use barrel exports (`index.ts`) for clean imports

**When to extract:**

- Config: When data is reused in 2+ places or needs single source of truth
- Utils: When logic is pure, testable, and reusable
- Components: When UI pattern is reused or complex enough to isolate

**Import Dependencies:**

- Pages → can import layouts, components, utils, config
- Layouts → can import components, utils, config
- Components → can import other components, utils, config
- Utils/config → leaf dependencies (no component/page imports)

**Cross-references:**

- See `architecture-guide.md` Path Aliases section for import patterns
- See `component-patterns.md` for component organization details

### 5. Type Safety Everywhere ⭐

**Requirements:**

- Strict TypeScript configuration (`extends astro/tsconfigs/strict`)
- Zod schemas for all content collections
- Explicit Props interfaces for all components
- Global type declarations for runtime APIs (`src/types/`)

**Component Props Pattern:**

```typescript
export interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
```

**Content Validation:**

- All content validated at build time via Zod schemas
- See `src/content.config.ts` for schema definitions

**Cross-reference:** See `code-quality.md` for type safety best practices

---

## Part 2: Testing Documentation Essentials

**File:** `docs/developer/testing.md` (currently 4 lines)

**Action:** Don't write a comprehensive guide yet. Just document the **essentials**:

1. **Testing Stack** (2 paragraphs)
   - Vitest for unit tests (utils, business logic)
   - Playwright for E2E (critical paths)
   - Commands: `pnpm run test:unit`, `pnpm run test:e2e`, `pnpm run test:all`

2. **What to Test** (bullet list)
   - Pure utility functions (SEO, content summary)
   - Content filtering logic
   - Critical user paths (navigation, RSS, 404)

3. **Test File Organization** (simple tree)

   ```
   tests/
   ├── unit/         # Pure logic
   └── e2e/          # User paths
   ```

4. **Cross-reference** to existing tests as examples

**Time estimate:** 30 minutes

**See Also Links:**

- Add link to `component-patterns.md` for component testing considerations
- Add link to `code-quality.md` for quality checks that run during testing

---

## Part 3: Code Quality Essentials

**File:** `docs/developer/code-quality.md` (currently 27 lines)

**Action:** Add just the **common mistakes** section:

### Common Quality Issues

**Issue 1: Using Base Color Tokens Directly**

```css
/* ❌ BAD */
.component {
  background: var(--color-red-500);
}

/* ✅ GOOD */
.component {
  background: var(--color-bg-primary);
}
```

**Issue 2: Missing Path Aliases**

```typescript
// ❌ BAD
import { BaseHead } from '../../components/layout/BaseHead.astro';

// ✅ GOOD
import { BaseHead } from '@components/layout';
```

**Issue 3: Missing Props Interface**

```astro
// ❌ BAD: No interface
const { title, description } = Astro.props;

// ✅ GOOD: Explicit interface
export interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
```

**Time estimate:** 20 minutes

**See Also Links:**

- Add link to `architecture-guide.md` Core Principles for project-specific rules
- Add link to `component-patterns.md` for component best practices

---

## Part 4: Accessibility & Performance Brief Notes

**File:** `docs/developer/accessibility-and-performance.md`

**Action:** Add brief standards notes at the beginning or in an overview section:

**Accessibility Standards:**

- Aim to meet WCAG 2.1 AA standards as minimum
- WCAG AAA compliance for critical content where feasible
- Test with screen readers and keyboard navigation
- Ensure sufficient color contrast ratios

**Performance Standards:**

- Aim to meet Core Web Vitals thresholds:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- Monitor via Lighthouse and real user monitoring
- Performance budgets set per-page-type

**Note:** Detailed WCAG guidelines and Core Web Vitals explanations available in official documentation - focus here on site-specific implementation.

**Time estimate:** 10 minutes

---

## Part 5: Minor Additions to Existing Guides

### content-system.md

**Add to Collections Overview:**

- Mention `toolboxPages` collection (JSON loader via `file()`)
- Note sourcing script: `scripts/get-toolbox-json.ts`
- Note consumption: `ContentCard` component, toolbox test page

**Fix Reading Time Documentation:**

- Correct type: string (e.g., "3 min read"), not number
- Access via: `remarkPluginFrontmatter.minutesRead`
- Injected by: `remark-reading-time.mjs` plugin

**Document Markdown Export:**

- Note limitations: MDX component tags remain inline
- Purpose: sharing, not round-tripping to source
- Example: `<Callout>` stays as `<Callout>` in exported markdown

### architecture-guide.md

**Add Directory Boundaries section** (if not already present):

- Already covered in Part 1, Principle 4 above
- Verify section exists; if not, add it referencing Principle 4

**Time estimate:** 20 minutes total

**See Also Links for content-system.md:**

- Link to `architecture-guide.md` Core Principles for organizational rules
- Link to `component-patterns.md` for ContentCard component details

---

## Implementation Order

**Estimated Total Time: ~3 hours**

1. **Part 1: Core Architecture Principles** (~1.5 hours)
   - File: `docs/developer/architecture-guide.md:7-9`
   - Replace TODO with 5 principles
   - Add cross-references where noted

2. **Part 2: Testing Essentials** (~30 minutes)
   - File: `docs/developer/testing.md`
   - Add 4 sections as outlined
   - Add See Also links

3. **Part 3: Code Quality Common Mistakes** (~20 minutes)
   - File: `docs/developer/code-quality.md`
   - Add 3 issue examples
   - Add See Also links

4. **Part 4: Accessibility & Performance Standards** (~10 minutes)
   - File: `docs/developer/accessibility-and-performance.md`
   - Add brief standards section at top

5. **Part 5: Minor Additions** (~20 minutes)
   - content-system.md: toolboxPages, reading time fix, markdown export note
   - Verify directory boundaries covered

---

## Implementation Notes

**For the implementer:**

1. **Core Principles section format:**
   - Use H3 headings for each principle
   - Include ⭐ ratings as shown (visual priority indicator)
   - Keep explanations concise but complete
   - Include code examples where shown
   - Add cross-reference links at end of each principle

2. **MDX Component Remapping:**
   - This is Principle #2 in Core Principles
   - Emphasize it's NOT documented elsewhere
   - Include implementation code snippet
   - Document extension pattern

3. **Cross-references format:**
   - Use relative markdown links: `[text](./other-file.md)`
   - Add "See Also" sections where specified
   - Only link when genuinely relevant

4. **Reading time type fix:**
   - Find existing documentation mentioning `readingTime.minutes`
   - Change to: `minutesRead` (string like "3 min read")
   - Update any code examples

5. **Preserve existing structure:**
   - Don't reorganize existing sections
   - Add new content in specified locations
   - Maintain existing formatting style

6. **File references:**
   - Use format: `src/pages/writing/[...slug]/index.astro:23-27`
   - Include line numbers where helpful
   - Link to actual code locations

---

## Success Criteria

After this task is complete:

- ✅ Core Architecture Principles section has 5 principles documented
- ✅ MDX component remapping is thoroughly documented (currently not documented anywhere)
- ✅ All critical unique patterns are explained
- ✅ testing.md has essential information (not empty)
- ✅ code-quality.md has common mistakes section
- ✅ accessibility-and-performance.md has standards overview
- ✅ Appropriate cross-references added
- ✅ Developers and AI agents understand what makes this codebase unique
- ✅ No documentation bloat - essentials only
- ✅ Documentation completion: ~70% (up from ~60%)

**Deferred to future tasks:**

- Comprehensive testing guide (would be 4-5 hours)
- Comprehensive code quality guide (would be 2-3 hours)
- New documentation files (deployment.md, troubleshooting.md, getting-started.md)
- Detailed WCAG and Core Web Vitals explanations
- Visual diagrams

---

## Context for Implementation

**Key Patterns to Document:**

These patterns are **unique to this codebase** and not standard Astro:

1. **Static generation with minimal client JS** - philosophically different from typical SPAs
2. **MDX component remapping** - powerful but invisible to content authors
3. **CSS Layers + 3-tier color system** - modern CSS approach enabling easy theming
4. **Centralized organization** - strict boundaries between config/utils/components
5. **Build-time generation** - OG images, RSS with full MDX, markdown exports
6. **Type safety** - strict TypeScript + Zod everywhere

**What's already documented well:**

- Path aliases (architecture-guide.md)
- Component organization (component-patterns.md)
- CSS architecture details (design.md)
- Color system details (design.md)
- Content collections (content-system.md)
- Content filtering (architecture-guide.md - has GOTCHA callout)

**Reference Documents:**

- `CODEBASE_REVIEW_AND_DOCUMENTATION_GAPS.md` - comprehensive analysis with detailed outlines
- `DOCS_REVIEW.md` - independent review with similar findings
- Both agree on critical patterns and gaps

---

## Notes

- Focus on **patterns** and **principles**, not step-by-step tutorials unless an example is needed
- Emphasize what makes this codebase **different from standard Astro**
- Keep explanations concise but complete
- Use code examples sparingly but effectively
- All cross-references should be genuinely relevant, not boilerplate
