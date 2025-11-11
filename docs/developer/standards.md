# Code Standards and Quality

TypeScript patterns, component structure, error handling, performance optimization, testing, and quality requirements.

## TypeScript Patterns

### Component Props Interface

All components define clear TypeScript interfaces:

```typescript
// Component props interface pattern
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
  title?: string; // Optional override for expensive operations
}

// Props destructuring with defaults
const { required, optional, withDefault = true, title } = Astro.props;
```

### Import Patterns

See `critical-patterns.md` for TypeScript path aliases. **Always use aliases:**

```typescript
// ✅ Correct: Category-specific barrel imports
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';

// ✅ Correct: Direct imports when not in barrel
import Callout from '@components/mdx/Callout.astro';

// ✅ Correct: Config and utilities
import { AUTHOR, TITLE_TEMPLATES } from '@config/seo';
import { generatePageTitle } from '@utils/seo';

// ❌ Wrong: Relative imports
import BaseHead from '../../components/layout/BaseHead.astro';
```

## Component Structure Pattern

**Standard structure for all Astro components:**

```astro
---
// 1. Imports
import { Image } from 'astro:assets';
import type { Props } from './types';

// 2. Props Interface
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
}

// 3. Props destructuring with defaults
const { required, optional, withDefault = true } = Astro.props;

// 4. Data fetching with error handling (if needed)
try {
  const data = await fetchData();
} catch (error) {
  console.warn('Failed to fetch data:', error);
  // Implement fallback behavior
}
---

<!-- 5. Template with accessibility attributes -->
<div class="component" role="region" aria-label="Component description">
  <!-- Content -->
</div>

<!-- 6. Styles -->
<style>
  /* Component-specific CSS variables */
  :root {
    --component-background: var(--color-bg-dark-200);
    --component-foreground: var(--color-brand-white);
  }

  /* Component styles */
  .component {
    background: var(--component-background);
    color: var(--component-foreground);
  }
</style>
```

## Error Handling Strategies

### Network Requests

**Always wrap external API calls** in try-catch with fallback:

```typescript
// Network request error handling pattern
try {
  const result = await externalAPI(url);
  data = result.data;
} catch (error) {
  console.warn(`Failed to fetch data from ${url}:`, error);
  data = fallbackData; // Always provide fallback
}
```

### Graceful Degradation

Principles:

- Provide optional props for manual overrides
- Use sensible defaults
- Ensure components work when external services fail

```typescript
// Component with manual override for expensive operations
export interface Props {
  url: string;
  title?: string; // Manual override to skip expensive title fetching
  className?: string;
}

const { url, title, className } = Astro.props;

// Use manual title if provided, otherwise fetch
let displayTitle = title;
if (!title) {
  try {
    displayTitle = await fetchTitle(url);
  } catch (error) {
    console.warn('Failed to fetch title, using URL as fallback:', error);
    displayTitle = url;
  }
}
```

### RSS Feed Error Handling

For RSS generation with Container API:

```javascript
// RSS content rendering with error handling
const items = [];
for (const article of articles) {
  try {
    const { Content } = await render(article);
    const content = await container.renderToString(Content);

    items.push({
      ...article.data,
      link: `/writing/${article.id}/`,
      content,
    });
  } catch (error) {
    console.warn(`Failed to render content for ${article.id}:`, error);
    // Skip problematic items - build continues
    continue;
  }
}
```

## Performance Optimization

### Core Web Vitals Targets

- **Lighthouse Scores**: Performance 95+, Accessibility 100, Best Practices 100, SEO 100
- **LCP** (Largest Contentful Paint): < 1s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### JavaScript Optimization

**1. Zero JavaScript by Default**

- Use Astro's zero-JS by default
- Only add interactivity when necessary
- Use progressive enhancement
- Implement proper code splitting

**2. Third-Party Scripts**

- Load non-critical scripts asynchronously
- Minimize third-party dependencies
- Implement proper error handling

**3. Loading Strategies**

```astro
<!-- Critical scripts: inline or high priority -->
<script is:inline>
  // Critical functionality
</script>

<!-- Non-critical: async loading -->
<script async src="/analytics.js"></script>

<!-- Defer when order matters -->
<script defer src="/non-critical.js"></script>
```

### Image Optimization

```astro
<!-- Astro Image Component best practices -->
<Image
  src={import('@assets/image.jpg')}
  alt="Descriptive alt text"
  width={800}
  height={600}
  loading="lazy"  <!-- Below-fold images -->
/>
```

**Requirements:**

- Always provide width and height (prevent CLS)
- Use descriptive alt text (accessibility)
- Leverage Astro's automatic optimization
- Use appropriate formats (WebP, AVIF)
- Implement lazy loading for below-fold images

### Loading Performance Checklist

- [ ] `loading="lazy"` for below-fold images
- [ ] Proper caching strategies
- [ ] Minimal third-party dependencies
- [ ] Async loading for non-critical scripts
- [ ] Proper preload directives for critical assets
- [ ] Optimized resource loading order

## Accessibility Requirements

### Semantic HTML

**Always use appropriate elements:**

```astro
<!-- ✅ Correct: Semantic HTML -->
<article>
  <header>
    <h1>Article Title</h1>
    <time datetime="2025-01-15">January 15, 2025</time>
  </header>
  <section>
    <p>Content...</p>
  </section>
  <footer>
    <nav aria-label="Article navigation">
      <!-- Links -->
    </nav>
  </footer>
</article>

<!-- ❌ Wrong: Div soup -->
<div class="article">
  <div class="header">
    <div class="title">Article Title</div>
    <div class="date">January 15, 2025</div>
  </div>
</div>
```

### ARIA Attributes

Include when semantic HTML isn't enough:

```astro
<!-- Navigation with ARIA label -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<!-- Button with ARIA attributes -->
<button
  aria-label="Toggle dark mode"
  aria-pressed={theme === 'dark'}
>
  <Icon name="moon" />
</button>

<!-- Hidden content with aria-hidden -->
<span aria-hidden="true">🎨</span>
<span class="sr-only">Decorative emoji</span>
```

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**

```css
/* Visible focus indicators */
.interactive:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Focus-visible for mouse vs keyboard */
.interactive:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### External Link Security & UX

See `critical-patterns.md` for security requirements.

### Accessibility Testing

- [ ] Test with screen readers (VoiceOver, NVDA, JAWS)
- [ ] Verify keyboard access (Tab, Enter, Escape)
- [ ] Check color contrast (WCAG AA minimum)
- [ ] Validate ARIA usage (no conflicting attributes)
- [ ] Test with accessibility tools (axe, Lighthouse)

## Styling Patterns

### CSS Variables and Theming

See `design.md` for complete theming architecture. Key principle:

**Never use base colors directly - always use semantic variables:**

```css
/* ❌ Wrong: Using base color directly */
.component {
  background: var(--color-red-500);
}

/* ✅ Correct: Using semantic variable */
.component {
  background: var(--color-component-bg);
}
```

### Modern CSS Patterns

```css
.component {
  /* Inline flex for alignment control */
  display: inline-flex;
  align-items: baseline;

  /* Smooth transitions */
  transition: opacity 0.2s ease;

  /* currentColor for inherited color */
  border-color: currentColor;
}

.component:hover {
  opacity: var(--component-hover-opacity);
}

/* Responsive with container queries */
@container (width > 400px) {
  .component {
    /* Desktop styles */
  }
}

/* Fluid typography */
.title {
  font-size: clamp(1rem, calc(0.6rem + 1vw), 1.5rem);
}
```

## Testing and Quality Gates

### Pre-Commit Quality Checks

**ALWAYS run before completing any task:**

```bash
pnpm run check:all
```

This runs:

1. **TypeScript** - Type checking
2. **Astro** - Framework-specific validation
3. **Prettier** - Format checking
4. **ESLint** - Linting
5. **Vitest** - Unit tests
6. **Playwright** - E2E tests

### Individual Checks

```bash
pnpm run lint         # ESLint only
pnpm run check:types  # TypeScript + Astro only
pnpm run format:check # Prettier only
pnpm run test:unit    # Unit tests only
pnpm run test:e2e     # E2E tests only
```

### Definition of Done

A task is "Done" when:

- [ ] Meets requirements (if using PRD)
- [ ] Relevant documentation updated
- [ ] Components/styles added to styleguide (if applicable)
- [ ] Cursor rules updated for new patterns (if applicable)
- [ ] Follows all relevant rules and best practices
- [ ] **No linting, formatting, or type errors**
- [ ] **`pnpm run check:all` passes**
- [ ] Code committed and pushed to branch
- [ ] PR created and all GitHub checks passing
- [ ] Vercel preview build successful
- [ ] Vercel preview manually reviewed
- [ ] PR merged to `main`
- [ ] Production site confirmed working

### Error Prevention

Goal: **Clarity and completeness, not process for its own sake.**

Automated checks should catch:

- Type errors
- Formatting errors
- Linting violations
- Broken tests
- Build failures

## Commit Message Standards

### Format

```
[optional type[optional scope]:] <description>

[optional body]

[optional footer(s)]
```

### Description Guidelines

- **Imperative, present tense** - "change" not "changed"
- **What and why**, not how
- **One sentence**
- **50 characters max** for readability
- **Capitalize first word**, never end with period

### Types (optional for some)

- `feat` - Fully complete new features
- `fix` - Bug fixes
- `docs` - Documentation-only changes
- `chore` - Build process, tools, dependency upgrades
- `revert` - Revert other commits
- `refactor` - Code changes that don't alter functionality

**Required for:** `chore`, `docs`, `revert` **Optional but recommended for:** `feat`, `fix`, `refactor`

### Examples

**Feature addition:**

```
feat: Add dark mode toggle

Adds a new button in the header to switch between light and dark themes.
Uses CSS variables for theming and persists user preference in localStorage.

Closes #123
```

**Bug fix:**

```
fix: Resolve image loading in note cards

Images were not loading properly due to incorrect path resolution.
Added proper path handling for both local and remote images.

Fixes #456
```

**Documentation:**

```
docs: Update component guidelines

Updates component guidelines to reflect current best practices and
implementation patterns. Adds examples from existing components.
```

**Chore (type required):**

```
chore: Update dependencies

Updates Astro to 5.13.2 and refreshes all minor/patch dependencies.
No breaking changes.
```

### Best Practices

1. **Be Specific** - Clearly describe what changed and why
2. **Keep it Simple** - Use simple, clear language
3. **Be Consistent** - Follow format, same tense, maintain style
4. **Review Before Committing** - Check format, verify clarity

## Component Organization

### Directory Structure

```
components/
├── layout/           # Layout and structural components
│   └── index.ts     # Barrel exports
├── navigation/       # Navigation-specific components
│   └── index.ts     # Barrel exports
├── ui/              # Small, reusable UI utilities
│   └── index.ts     # Barrel exports
├── mdx/             # Components for MDX content
│   └── index.ts     # Barrel exports
└── index.ts         # Main component barrel
```

Each category includes barrel exports for clean imports.

### Barrel Export Pattern

```typescript
// src/components/layout/index.ts
export { default as BaseHead } from './BaseHead.astro';
export { default as Footer } from './Footer.astro';
export { default as MainNavigation } from './MainNavigation.astro';
export { default as NoteCard } from './NoteCard.astro';
```

### Adding New Components

1. Create component in appropriate subdirectory
2. Add TypeScript interface for props
3. Export from subdirectory's `index.ts`
4. Add to main `index.ts` if needed
5. Add examples to `/styleguide`
6. Document in `design.md` if visually significant
7. Run `pnpm run check:all` to verify

## SEO Best Practices

### Using SEO Utilities

**Always use centralized SEO configuration:**

```typescript
// ✅ Correct: Using SEO utilities
import { generatePageTitle, validateSEOData } from '@utils/seo';
const seoData = validateSEOData(Astro.props);
const title = generatePageTitle(seoData.title, seoData.pageType);

// ❌ Wrong: Manual SEO generation
const title = `${props.title} | Danny Smith`;
```

### SEO Checklist

- [ ] Use `generatePageTitle()` for consistent titles
- [ ] Validate data with `validateSEOData()`
- [ ] Include OpenGraph image (auto-generated or custom)
- [ ] Add JSON-LD structured data via `generateJSONLD()`
- [ ] Use `generateMetaDescription()` for descriptions
- [ ] Include proper canonical URLs
- [ ] Add article metadata for articles/notes

See `content.md` for complete SEO implementation details.

## Build Optimization

### Static Generation

- Use static generation by default
- Only use SSR when absolutely necessary
- Implement proper caching strategies
- Minimize build-time data fetching

### Code Splitting

- Astro automatically splits by page
- Use dynamic imports for heavy components
- Load non-critical components lazily

### Asset Optimization

- Optimize images at build time
- Use appropriate formats (WebP, AVIF)
- Implement proper preloading
- Minimize CSS and JavaScript bundles

## Common Patterns

### Component with External Data

```astro
---
export interface Props {
  url: string;
  title?: string; // Optional override
}

const { url, title } = Astro.props;

let displayTitle = title;
if (!title) {
  try {
    displayTitle = await fetchTitle(url);
  } catch (error) {
    console.warn('Failed to fetch title:', error);
    displayTitle = new URL(url).hostname;
  }
}
---

<a href={url}>{displayTitle}</a>
```

### Theme-Aware Component

```astro
<div class="component">
  <!-- Content -->
</div>

<style>
  .component {
    /* Use semantic variables that change with theme */
    background: var(--color-component-bg);
    color: var(--color-component-text);
  }
</style>
```

### Responsive Component with Container Queries

```astro
<div class="cq">
  <div class="component">
    <!-- Content -->
  </div>
</div>

<style>
  .cq {
    container-type: inline-size;
  }

  @container (width > 400px) {
    .component {
      /* Wider styles */
    }
  }
</style>
```

## Quality Mindset

- **Automated checks catch errors** - Run `pnpm run check:all` frequently
- **Test in production builds** - Dev mode hides issues
- **Review before committing** - Quick scan prevents issues
- **Update docs when patterns change** - Keep documentation current
- **Ask when uncertain** - Better to clarify than break things

Remember: The goal is **clarity and completeness**, not bureaucracy. Quality gates exist to catch mistakes early and maintain a high-quality codebase.
