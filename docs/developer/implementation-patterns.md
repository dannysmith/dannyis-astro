# Implementation Patterns

This document consolidates technical implementation patterns, coding standards, and quality requirements for the personal website codebase.

## TypeScript Patterns and Interfaces

### Component Props Interface

All components should define clear TypeScript interfaces for props:

```typescript
// Component props interface pattern
export interface Props {
  required: string;
  optional?: number;
  withDefault?: boolean;
  title?: string; // Optional override for performance
}

// Props destructuring with defaults
const { required, optional, withDefault = true, title } = Astro.props;
```

### Import Patterns

Use TypeScript path aliases for clean component imports:

```typescript
// Category-specific barrel imports (recommended)
import { BaseHead, Footer } from '@components/layout';
import { FormattedDate, Pill } from '@components/ui';
import { NavLink, ThemeToggle } from '@components/navigation';

// Direct component imports
import BaseHead from '@components/layout/BaseHead.astro';
import Callout from '@components/mdx/Callout.astro';

// MDX content imports (used in content files)
import { Callout, Embed, BookmarkCard } from '@components/mdx';

// Configuration and utility imports
import { AUTHOR, TITLE_TEMPLATES } from '@config/seo';
import { generatePageTitle, validateSEOData } from '@utils/seo';
```

### Component Structure Pattern

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
const { prop1, prop2, withDefault = true } = Astro.props;

// 4. Data fetching with error handling (if needed)
try {
  const data = await fetchData();
} catch (error) {
  console.warn('Failed to fetch data:', error);
  // Implement fallback behavior
}
---

<!-- 5. Template with accessibility attributes -->
<div class="component">
  <!-- Content -->
</div>

<!-- 6. Styles -->
<style>
  :root {
    --component-background: var(--color-bg-dark-200);
    --component-foreground: var(--c-white);
    /* Other CSS variables */
  }

  /* Component styles */
</style>
```

## Error Handling Strategies

### Network Requests

Always wrap external API calls in try-catch blocks with meaningful fallback content:

```typescript
// Network request error handling pattern
try {
  const result = await externalAPI(url);
  data = result.data;
} catch (error) {
  console.warn(`Failed to fetch data from ${url}:`, error);
  data = fallbackData;
}
```

### Graceful Degradation

- Provide optional props for manual overrides
- Use sensible defaults
- Ensure components work even when external services fail

```typescript
// Example: Component with manual override for expensive operations
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

## Performance Optimization Techniques

### Core Web Vitals Targets

- **Lighthouse Scores**: Performance 95+, Accessibility 100, Best Practices 100, SEO 100
- **Core Web Vitals**: LCP < 1s, FID < 100ms, CLS < 0.1

### JavaScript Optimization

1. **Zero JavaScript by Default**
   - Use Astro's zero-JS by default
   - Only add interactivity when necessary
   - Use progressive enhancement
   - Implement proper code splitting

2. **Third-Party Scripts**
   - Load non-critical scripts asynchronously
   - Use proper loading strategies
   - Minimize third-party dependencies
   - Implement proper error handling

### Image Optimization

```astro
<!-- Astro Image Component best practices -->
<Image
  src={import('../assets/image.jpg')}
  alt="Descriptive alt text"
  width={800}
  height={600}
  loading="lazy"
/>
```

Best practices:

- Always provide width and height
- Use descriptive alt text
- Leverage Astro's image optimization
- Use appropriate image formats (WebP, AVIF)
- Implement responsive images with srcset

### Loading Performance

- Use `loading="lazy"` for below-fold images
- Implement proper caching strategies
- Minimize third-party dependencies
- Load non-critical scripts asynchronously
- Use proper preload directives
- Optimize resource loading order

## Accessibility Requirements

### Semantic HTML

- Use appropriate elements (`<article>`, `<section>`, etc.)
- Include ARIA attributes when needed
- Support keyboard navigation
- Maintain focus management

### External Link Security & UX

Always use `target="_blank" rel="noopener noreferrer"` for external links in manual HTML:

```astro
<!-- ✅ Correct: Manual HTML external links -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External Link</a>

<!-- ✅ Correct: Preserve rel="me" with target="_blank" for identity links -->
<a href="https://social.example/@user" rel="me" target="_blank">Social Profile</a>

<!-- ✅ Automatic: Markdown links are handled by rehype-external-links -->
[External Link](https://example.com)

<!-- ❌ Incorrect: Missing security attributes -->
<a href="https://example.com" target="_blank">External Link</a>
```

### Accessibility Testing

- Test with screen readers
- Verify keyboard access
- Check color contrast
- Validate ARIA usage

## Styling Patterns

### CSS Variables and Theming

```css
/* Global theme variables in global.css */
:root[data-theme='light'] {
  --color-nav-bg: var(--color-bg-dark-200);
  --color-nav-text: var(--color-brand-white);
}

:root[data-theme='dark'] {
  --color-nav-bg: var(--color-bg-light-200);
  --color-nav-text: var(--color-brand-black);
}

/* Component uses semantic variables */
.component {
  background: var(--color-nav-bg);
  color: var(--color-nav-text);
}
```

### Modern CSS Patterns

```css
.component {
  display: inline-flex;
  align-items: baseline;
  transition: opacity 0.2s ease;
}

.component:hover {
  opacity: var(--component-hover-opacity);
}

/* Responsive design with container queries */
@container (width > 400px) {
  /* Desktop styles */
}

.title {
  font-size: clamp(1rem, calc(0.6rem + 1vw), 1.5rem);
}
```

## Testing and Quality Gates

### Pre-commit Quality Checks

Before completing any task, always run:

```bash
pnpm run lint      # Check for linting errors
pnpm run check     # Validate TypeScript and Astro files
pnpm run build     # Ensure production build succeeds
```

### Definition of Done Requirements

A task is "Done" when:

- [ ] If a PRD is being used, it meets the requirements described
- [ ] Any relevant documentation is updated
- [ ] If components or important styles are changed/added, they are updated in the styleguide
- [ ] All relevant Cursor rules are updated to reflect new patterns
- [ ] The change follows all relevant rules and best practices
- [ ] No linting, formatting, or type errors exist
- [ ] Code is committed, pushed to branch, and PR is open
- [ ] All GitHub PR checks are passing, including successful Vercel preview build
- [ ] Vercel preview deploy has been manually reviewed
- [ ] PR has been merged to `main` and production site confirmed working

### Error Prevention

- There should be no type errors, Prettier formatting errors, or similar issues
- These should be caught by automated checks
- Goal is clarity and completeness, not process for its own sake

## Common Code Patterns

### SEO Implementation

```astro
<!-- BaseHead component usage -->
<BaseHead
  title="Page Title"
  description="Page description"
  type="article"        // 'website' (default) or 'article'
  pageType="article"    // 'article', 'note', or 'page' (for title templates)
  image="/custom-og.png" // Optional: custom OG image
  pubDate={new Date()}   // Optional: for articles/notes
  updatedDate={new Date()} // Optional: for articles/notes
  tags={['tag1', 'tag2']} // Optional: for articles/notes
/>
```

### SEO Utility Usage

```typescript
// Use centralized SEO configuration
import { generatePageTitle, validateSEOData } from '@utils/seo';
const seoData = validateSEOData(Astro.props);
const title = generatePageTitle(seoData.title, seoData.pageType);

// ❌ Bad: Manual SEO generation
const title = `${props.title} | Danny Smith`;
```

### Component Organization

```
components/
├── layout/           # Layout and structural components
├── navigation/       # Navigation-specific components
├── ui/              # Small, reusable UI utilities
├── mdx/             # Components for MDX content
├── icons/           # Icon components
└── index.ts         # Main component barrel
```

Each category includes barrel exports (`index.ts`) for clean imports.

## Commit Message Standards

### Format

```
[optional type[optional scope]:] <description>

[optional body]

[optional footer(s)]
```

### Description Guidelines

- Always use imperative, present tense ("change" not "changed")
- Describe the what and why, not how
- Keep to one sentence
- Limit to 50 characters for readability
- Capitalize first word, never end with period

### Types (optional for some)

- `feat`: Fully complete new features
- `fix`: Bug fixes
- `docs`: Documentation-only changes
- `chore`: Build process, tools, dependency upgrades
- `revert`: Revert other commits
- `refactor`: Code changes that don't alter functionality

Required for: `chore`, `docs`, `revert`. Optional but recommended for others.

### Examples

```
feat: Add dark mode toggle

Adds a new button in the header to switch between light and dark themes.
Uses CSS variables for theming and persists user preference in localStorage.

Closes #123
```

```
fix: Resolve image loading in note cards

Images were not loading properly due to incorrect path resolution.
Added proper path handling for both local and remote images.

Fixes #456
```

```
docs: Update component guidelines

Updates component guidelines to reflect current best practices and
implementation patterns. Adds examples from existing components.
```

### Best Practices

1. **Be Specific**: Clearly describe what changed and why
2. **Keep it Simple**: Use simple, clear language focused on "what" and "why"
3. **Be Consistent**: Follow format, use same tense, maintain style
4. **Review Before Committing**: Check format, verify clarity, ensure completeness
