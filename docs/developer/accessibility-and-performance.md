# Accessibility & Performance

Guidance for writing accessible and performant HTML, CSS, TypeScript and Astro Components

## Standards Overview

This project follows industry-standard accessibility and performance benchmarks to ensure an excellent user experience for all visitors.

### Accessibility Standards

- **WCAG 2.1 AA** - Minimum standard for all features and content
- **Keyboard navigation** - All interactive elements must be keyboard accessible
- **Color contrast ratios** - Meet or exceed WCAG requirements (4.5:1 for normal text, 3:1 for large text)

Detailed WCAG guidelines are available in the [official WCAG 2.1 documentation](https://www.w3.org/WAI/WCAG21/quickref/). Focus here is on site-specific implementation patterns.

## Accessibility

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
/* Focus-visible for keyboard navigation (not mouse clicks) */
.interactive:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

The reset layer in `global.css` sets `outline-offset: 3px` globally for `:focus-visible`.

See [component-patterns.md § Accessible Interactive Component](./component-patterns.md#accessible-interactive-component) for a full component example with ARIA attributes and transitions.

## Performance

### Using runtime Javascript

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

- Always provide width and height
- Use descriptive alt text
- Leverage Astro's automatic optimization
- Implement lazy loading for below-fold images
