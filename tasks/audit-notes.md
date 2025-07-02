# SEO Audit Plan - danny.is

## Overview

This document contains the step-by-step plan for conducting a comprehensive SEO audit of danny.is using various tools and collecting results for analysis.

## 1. Lighthouse CLI Audit ✅ COMPLETE

```bash
# Create output directory
mkdir -p seo-audit-results

# Run on key pages (desktop and mobile)
npx lighthouse https://danny.is --output=json --output-path=./seo-audit-results/homepage-desktop.json --chrome-flags="--headless"
npx lighthouse https://danny.is --output=json --output-path=./seo-audit-results/homepage-mobile.json --chrome-flags="--headless" --preset=mobile

# Test article pages (replace with actual URLs)
npx lighthouse https://danny.is/writing/2020-03-17-website-redesign-ii --output=json --output-path=./seo-audit-results/article-desktop.json --chrome-flags="--headless"
npx lighthouse https://danny.is/writing/2020-03-17-website-redesign-ii --output=json --output-path=./seo-audit-results/article-mobile.json --chrome-flags="--headless" --preset=mobile

# Test note pages
npx lighthouse https://danny.is/notes/1700733150901-apples-thunderbolt-3-cables --output=json --output-path=./seo-audit-results/note-desktop.json --chrome-flags="--headless"
npx lighthouse https://danny.is/notes/1700733150901-apples-thunderbolt-3-cables --output=json --output-path=./seo-audit-results/note-mobile.json --chrome-flags="--headless" --preset=mobile

# Test other important pages
npx lighthouse https://danny.is/now --output=json --output-path=./seo-audit-results/now-desktop.json --chrome-flags="--headless"
npx lighthouse https://danny.is/writing --output=json --output-path=./seo-audit-results/writing-index-desktop.json --chrome-flags="--headless"
npx lighthouse https://danny.is/notes --output=json --output-path=./seo-audit-results/notes-index-desktop.json --chrome-flags="--headless"
```

### Results

See `./seo-audit-results`

## 2. Google PageSpeed Insights ✅ COMPLETE

Test results for homepage, sample article and sample note...

### Results

- Homepage (https://danny.is):
  - Desktop: https://pagespeed.web.dev/analysis/https-danny-is/nltwe2fizw?form_factor=desktop
  - Mobile: https://pagespeed.web.dev/analysis/https-danny-is/nltwe2fizw?form_factor=mobile
- Sample Article (https://danny.is/writing/organisational-health/):
  - Desktop: https://pagespeed.web.dev/analysis/https-danny-is-writing-organisational-health/rtz718p5v2?form_factor=desktop
  - Mobile: https://pagespeed.web.dev/analysis/https-danny-is-writing-organisational-health/rtz718p5v2?form_factor=mobile
- Sample Note (https://danny.is/notes/apples-thunderbolt-3-cables/):
  - Desktop: https://pagespeed.web.dev/analysis/https-danny-is-notes-apples-thunderbolt-3-cables/n0esn7gvd9?form_factor=desktop
  - Mobile: https://pagespeed.web.dev/analysis/https-danny-is-notes-apples-thunderbolt-3-cables/n0esn7gvd9?form_factor=mobile

## 3. Google Search Console Setup ✅ COMPLETE

- [x] Verify Ownership
- [x] Submit Sitemap

## 4. Rich Results Test ✅ COMPLETE

### How to Run

Go to https://search.google.com/test/rich-results

### Result

All pass ok

## 5. Analysis & Findings ✅ COMPLETE

### Overall Performance Scores

| Page               | Performance | Accessibility | Best Practices | SEO  |
| ------------------ | ----------- | ------------- | -------------- | ---- |
| Homepage (Desktop) | 0.94        | 1.00          | 0.96           | 1.00 |
| Homepage (Mobile)  | 0.92        | N/A           | N/A            | N/A  |
| Article (Desktop)  | 0.41        | 0.72          | 0.57           | 1.00 |
| Note (Desktop)     | 0.71        | 0.96          | 0.93           | 1.00 |
| /now (Desktop)     | 0.76        | 0.96          | 0.96           | 1.00 |
| /writing (Desktop) | 0.92        | 0.94          | 0.93           | 1.00 |
| /notes (Desktop)   | 0.94        | 0.94          | 0.96           | 1.00 |

### Critical Issues Identified

#### 1. Article Page Performance (Score: 0.41) - HIGH PRIORITY

- **Largest Contentful Paint**: 0 (failing)
- **Speed Index**: 0.35 (poor)
- **Total Blocking Time**: 0.34 (poor)
- **Interactive**: 0.05 (failing)
- **First Contentful Paint**: 0.19 (poor)

#### 2. Accessibility Issues on Article Pages

- **Color Contrast**: 0 (failing)
- **Link Names**: 0 (failing)
- **ARIA Issues**: Multiple failing scores
- **Meta Viewport**: 0 (failing)

#### 3. Common Performance Issues Across Pages

- **First Contentful Paint**: Consistently poor (0.19-0.85)
- **Largest Contentful Paint**: Poor on content pages
- **Cumulative Layout Shift**: Issues on mobile (0.79) and notes (0.8)
- **Cache TTL**: 0.5 (suboptimal caching)

#### 4. Best Practices Issues

- **Target Size**: 0 (failing) - touch targets too small
- **Uses Responsive Images**: 0 (failing) on articles
- **Total Byte Weight**: 0.5 (suboptimal)
- **Unused JavaScript**: 0 (failing)

### Positive Findings

- **SEO**: Perfect scores across all pages (1.00)
- **Index Pages**: Good performance (0.92-0.94)
- **Note Pages**: Reasonable performance (0.71)
- **Accessibility**: Good on most pages (0.94-1.00)

## 6. Quick Wins Plan (Astro-Optimized)

### Phase 1: Critical Font & Image Fixes (High Impact, Low Effort)

**1. Fix Font Loading (5 min) - BIGGEST WIN**

**Current Issue**:

- League Spartan loaded via Google Fonts CDN (external dependency)
- No `font-display: swap` causing render blocking
- 2.1s FCP delay due to font loading

**Technical Solution**:

```bash
# Install Fontsource variable font package
npm install @fontsource-variable/league-spartan
```

**Code Changes**:

```typescript
// src/components/layout/BaseHead.astro
// Replace lines 95-99 (Google Fonts link) with:
import '@fontsource-variable/league-spartan';
```

**CSS Updates**:

```css
/* src/styles/global.css - Update font family reference */
:root {
  /* Update font family to use variable font */
  --font-ui: 'League Spartan Variable', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

**Files to Update**:

- `src/components/layout/BaseHead.astro` (remove Google Fonts, add Fontsource import)
- `src/styles/global.css` (update font family to use variable font)
- `src/utils/og-templates.ts` (update font references if needed)
- `src/utils/og-image-generator.ts` (update font loading)

**Expected Impact**: ~2.1s FCP improvement (biggest single win)

**Note**: League Spartan variable font only supports normal style (no italic) with weights 100-900. If italic is needed, we'll need to use the static font package instead.

---

**2. Fix Article Hero Images (10 min)**

**Current Issue**:

- Hero images using basic `<img>` instead of Astro's optimized `<Image>`
- No responsive sizing or format optimization
- Poor LCP scores

**Technical Solution**:

```astro
<!-- src/layouts/Article.astro -->
<!-- Replace lines 42-46 with: -->
{cover && coverAlt && (
  <div class="hero-image">
    <Image
      src={cover}
      alt={coverAlt}
      layout="constrained"
      width={1200}
      height={240}
      format="webp"
      quality={85}
    />
  </div>
)}
```

**CSS Updates**:

```css
/* src/layouts/Article.astro - Update hero-image styles */
.hero-image {
  grid-column: 1 / 4;
  aspect-ratio: 5 / 1;
  overflow: hidden;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Files to Update**:

- `src/layouts/Article.astro` (Image component + CSS)

**Expected Impact**: Better LCP, responsive images, format optimization

---

**3. Add Missing Viewport Meta (2 min)**

**Current Issue**:

- Article pages missing viewport meta tag (already present in BaseHead)

**Technical Solution**: Already implemented in `BaseHead.astro` line 45:

```html
<meta name="viewport" content="width=device-width,initial-scale=1" />
```

**Action**: Verify it's working on all pages (should be fine)

---

### Phase 2: Astro-Specific Optimizations (Medium Impact, Low Effort)

**4. Enable Responsive Images (5 min)**

**Current Issue**:

- Images not using Astro's responsive features
- Already configured in `astro.config.mjs` but not used consistently

**Technical Solution**: Update all `<Image>` components to use proper layouts:

```astro
<!-- For hero images -->
<Image layout="constrained" width={1200} height={240} />

<!-- For content images -->
<Image layout="constrained" width={800} height={600} />

<!-- For full-width images -->
<Image layout="full-width" width={1200} height={600} />
```

**Files to Check**:

- `src/layouts/Article.astro` (hero images)
- `src/components/mdx/BookmarkCard.astro` (if using images)
- Any other components using `<Image>`

**Expected Impact**: Better CLS, responsive srcsets, format optimization

---

**5. Optimize CSS Loading (5 min)**

**Current Issue**:

- CSS blocking render (2.1s delay)
- Already properly inlined in BaseHead (best practice)

**Technical Solution**: CSS is already optimized. Verify no external CSS blocking:

```bash
# Check for any external CSS in BaseHead.astro
grep -n "stylesheet" src/components/layout/BaseHead.astro
```

**Action**: No changes needed - CSS already follows Astro best practices

---

**6. Fix Touch Targets (10 min)**

**Current Issue**:

- Touch targets too small on mobile (< 44px)

**Technical Solution**: Update navigation and button styles:

```css
/* src/components/navigation/NavLink.astro */
/* Add minimum touch target size */
.nav-link {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* src/components/navigation/ThemeToggle.astro */
/* Ensure theme toggle buttons are large enough */
.theme-toggle button {
  min-height: 44px;
  min-width: 44px;
}
```

**Files to Update**:

- `src/components/navigation/NavLink.astro`
- `src/components/navigation/ThemeToggle.astro`

**Expected Impact**: Better mobile accessibility

---

### Phase 3: Content & Accessibility (Low Impact, Low Effort)

**7. Fix Link Names (5 min)**

**Current Issue**:

- Some links missing descriptive names

**Technical Solution**: Add proper `aria-label` attributes:

```astro
<!-- Example: src/components/layout/MainNavigation.astro -->
<a href="/writing" aria-label="View all articles">Writing</a>
<a href="/notes" aria-label="View all notes">Notes</a>
```

**Files to Audit**:

- `src/components/layout/MainNavigation.astro`
- `src/components/layout/Footer.astro`
- Any other navigation components

**Expected Impact**: Better screen reader support

---

**8. Optimize Image Alt Text (5 min)**

**Current Issue**:

- Some images missing or have poor alt text

**Technical Solution**: Review and improve alt text for all images:

```astro
<!-- Example: Better alt text -->
<Image
  src={cover}
  alt="A detailed diagram showing the website redesign process with wireframes and mockups"
/>
```

**Files to Review**:

- All article cover images
- Any inline images in content
- Component images

**Expected Impact**: Better accessibility and SEO

---

### Implementation Order & Testing

**Week 1 (Immediate Wins)**:

1. Font loading fix (biggest impact) - Test FCP improvement
2. Article hero images - Test LCP improvement
3. Verify viewport meta - Should already be working

**Week 2 (Performance)**: 4. Responsive images optimization - Test CLS improvement 5. CSS loading review - Should already be optimized 6. Touch targets - Test mobile accessibility

**Week 3 (Accessibility)**: 7. Link names - Test screen reader compatibility 8. Image alt text - Test accessibility tools

### Testing Strategy

**After Each Change**:

```bash
# Quick performance test
npx lighthouse https://danny.is/writing/2020-03-17-website-redesign-ii --output=json --output-path=./test-results.json --chrome-flags="--headless"

# Check specific metrics
jq -r '.audits["first-contentful-paint"].numericValue' test-results.json
jq -r '.audits["largest-contentful-paint"].numericValue' test-results.json
```

**Expected Results**:

- FCP: 2.1s → ~0.5s (font fix)
- LCP: 4.1s → ~2.5s (font fix + image optimization)
- CLS: 0.1 → ~0.05 (responsive images)
- Performance Score: 0.41 → ~0.85 (article pages)

### Astro Best Practices Confirmed

✅ **Font Loading**: Use Fontsource packages instead of Google Fonts CDN
✅ **Image Optimization**: Use Astro's `<Image>` component with proper layouts
✅ **CSS Loading**: CSS already properly inlined in BaseHead
✅ **Responsive Images**: Already configured in astro.config.mjs
✅ **Viewport Meta**: Already present in BaseHead.astro
✅ **Asset Optimization**: Astro handles format optimization automatically

### Risk Assessment

**Low Risk Changes**:

- Font loading (Fontsource is well-tested)
- Image optimization (Astro's built-in features)
- Touch targets (simple CSS changes)

**Medium Risk Changes**:

- None identified - all changes use Astro's recommended patterns

**Rollback Plan**:

- Each change is isolated and can be reverted independently
- Git commits for each change
- Test on staging before production

### Notes

- **No Complex Changes**: All fixes use Astro's built-in patterns
- **Preserve Aesthetics**: No color changes or typography modifications
- **Quick Implementation**: Each item takes 2-10 minutes
- **Astro-Native**: Uses Astro's recommended approaches throughout
- **Incremental Testing**: Test each change before moving to next

## Next Steps

1. **Prioritize Phase 1 fixes** - Focus on article page performance and accessibility
2. **Implement changes incrementally** - Test each change before moving to next
3. **Re-run audits** after each major change
4. **Monitor Core Web Vitals** in Google Search Console
5. **Track performance improvements** over time
