# Quality Requirements

Performance targets, accessibility standards, testing requirements, and quality gates.

## Performance Targets

### Core Web Vitals

- **Lighthouse Scores:** Performance 95+, Accessibility 100, Best Practices 100, SEO 100
- **LCP** (Largest Contentful Paint): < 1s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### JavaScript Optimization

**Zero JavaScript by Default:**

- Use Astro's zero-JS by default
- Only add interactivity when necessary
- Use progressive enhancement
- Implement proper code splitting

**Loading Strategies:**

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

### Build Optimization

- Static generation by default
- Only use SSR when absolutely necessary
- Implement proper caching strategies
- Minimize build-time data fetching
- Use dynamic imports for heavy components
- Optimize images at build time
- Minimize CSS and JavaScript bundles

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

See `critical-patterns.md` for complete external link security requirements.

### Accessibility Testing

- [ ] Test with screen readers (VoiceOver, NVDA, JAWS)
- [ ] Verify keyboard access (Tab, Enter, Escape)
- [ ] Check color contrast (WCAG AA minimum)
- [ ] Validate ARIA usage (no conflicting attributes)
- [ ] Test with accessibility tools (axe, Lighthouse)

## Testing and Quality Gates

### Pre-Commit Quality Checks

**ALWAYS run before completing any task:**

```bash
pnpm run check:all
```

This runs (in order):

1. **TypeScript** - Type checking
2. **Astro** - Framework-specific validation
3. **Prettier** - Format checking
4. **ESLint** - Linting
5. **Vitest** - Unit tests
6. **Playwright** - E2E tests

All checks must pass before deploying.

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

## SEO Requirements

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

See `content-system.md` for complete SEO implementation details.

## Commit Message Standards

### Format

```
[optional type]: <description>

[optional body]
```

### Description Guidelines

- **Imperative, present tense** - "change" not "changed"
- **What and why**, not how
- **One sentence**
- **50 characters max** for readability
- **Capitalize first word**, never end with period

### Types (optional)

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation-only changes
- `chore` - Build process, tools, dependency upgrades
- `refactor` - Code changes that don't alter functionality

**Required for:** `chore`, `docs`, `revert`

**Optional but recommended for:** `feat`, `fix`, `refactor`

### Examples

**Feature:**

```
feat: Add dark mode toggle

Adds button in header to switch between light and dark themes.
Uses CSS variables for theming and persists preference in localStorage.
```

**Bug fix:**

```
fix: Resolve image loading in note cards

Images were not loading due to incorrect path resolution.
Added proper path handling for both local and remote images.
```

**Documentation:**

```
docs: Update component guidelines

Updates component guidelines to reflect current best practices.
Adds examples from existing components.
```

## Quality Mindset

- **Automated checks catch errors** - Run `pnpm run check:all` frequently
- **Test in production builds** - Dev mode hides issues
- **Review before committing** - Quick scan prevents issues
- **Update docs when patterns change** - Keep documentation current
- **Ask when uncertain** - Better to clarify than break things

Remember: The goal is **clarity and completeness**, not bureaucracy. Quality gates exist to catch mistakes early and maintain a high-quality codebase.
