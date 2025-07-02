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

## 6. Quick Wins Plan (Astro-Optimized) - IN PROGRESS

### Phase 1: Critical Font & Image Fixes (High Impact, Low Effort)

**1. Fix Font Loading (5 min) - BIGGEST WIN ✅ COMPLETED**

- **Issue**: League Spartan loaded via Google Fonts CDN (external dependency)
- **Astro Solution**: Use Fontsource variable font package instead of Google Fonts CDN
- **Action**: ✅ Replaced Google Fonts with `@fontsource-variable/league-spartan`
- **Result**: ✅ Build successful, CSP locked down to self-hosted fonts only
- **Expected Impact**: ~2.1s FCP improvement (biggest single win)

**2. Fix Article Hero Images (10 min) ✅ COMPLETED**

- **Issue**: Hero images using basic `<img>` instead of Astro's optimized `<Image>`
- **Astro Solution**: Use Astro's `<Image>` component with proper sizing
- **Action**: ✅ Updated `Article.astro` to use `<Image>` with `layout="constrained"`
- **Result**: ✅ Build successful, images optimized to WebP format
- **Expected Impact**: Improved LCP and responsive image loading

**3. Optimize All Site Images (15 min) ✅ COMPLETED**

- **Issue**: Some images still using basic `<img>` tags
- **Astro Solution**: Convert to `<Image>` component with proper layouts
- **Actions**: ✅ Updated homepage avatar, Notion favicons, article styleguide images
- **Result**: ✅ All images now use Astro's optimization (WebP conversion, responsive sizing)
- **Expected Impact**: Better performance and modern image formats

**4. Verify Viewport Meta (2 min) ✅ ALREADY OPTIMAL**

- **Issue**: None - already properly implemented
- **Status**: ✅ Already present in `BaseHead.astro` and used by all layouts
- **Action**: No changes needed

### Phase 2: Performance Optimization (Medium Impact, Low Effort)

**5. Enable Responsive Images Everywhere (10 min) ✅ COMPLETED**

- **Issue**: Some `<Image>` components missing proper layouts
- **Astro Solution**: Add `layout="constrained"` or `layout="full-width"` to all `<Image>` components
- **Action**: ✅ Updated article styleguide with proper layouts
- **Result**: ✅ All images now use responsive layouts
- **Expected Impact**: Better responsive behavior and reduced layout shift

**6. Optimize CSS Loading (5 min) ✅ ALREADY OPTIMAL**

- **Issue**: None - already following Astro best practices
- **Status**: ✅ CSS already inlined in BaseHead (best practice)
- **Action**: No changes needed

### Phase 3: Accessibility & Best Practices (Low Impact, Low Effort)

**7. Fix Touch Targets (10 min) - NEXT**

- **Issue**: Some touch targets too small on mobile
- **Solution**: Increase minimum touch target size to 44px
- **Action**: Update CSS for navigation and interactive elements
- **Expected Impact**: Better mobile usability

**8. Add Missing Alt Text (5 min) - NEXT**

- **Issue**: Some images missing alt text
- **Solution**: Add descriptive alt text to all images
- **Action**: Review and update image alt attributes
- **Expected Impact**: Better accessibility

### Results Summary

**Completed Optimizations:**

- ✅ Font loading optimized (biggest win - ~2.1s FCP improvement)
- ✅ All images converted to Astro's `<Image>` component
- ✅ WebP format optimization (308kB → 9-117kB per image)
- ✅ Responsive image layouts implemented
- ✅ CSP locked down to self-hosted resources only

**Next Steps:**

- Fix touch targets for mobile
- Add missing alt text
- Run new Lighthouse tests to measure improvements

## 8. Results Comparison - Before vs After Optimizations ✅ COMPLETED

### Performance Improvements Summary

**Homepage (Desktop)**

- **Performance**: 0.94 → 0.94 (maintained excellent score)
- **Accessibility**: 1.00 → 1.00 (perfect maintained)
- **Best Practices**: 0.96 → 0.96 (excellent maintained)
- **SEO**: 1.00 → 1.00 (perfect maintained)

**Article Page (Desktop) - DRAMATIC IMPROVEMENT**

- **Performance**: 0.41 → 0.89 (**+117% improvement**)
- **Accessibility**: 0.72 → 0.86 (**+19% improvement**)
- **Best Practices**: 0.57 → 0.75 (**+32% improvement**)
- **SEO**: 1.00 → 1.00 (perfect maintained)

### Key Performance Metrics - Article Page

**Core Web Vitals Improvements:**

- **First Contentful Paint**: 0.19 → 0.62 (**+226% improvement**)
- **Largest Contentful Paint**: 0.00 → 0.87 (**FIXED - was completely failing**)
- **Speed Index**: 0.35 → 0.97 (**+177% improvement**)
- **Total Blocking Time**: 0.34 → 1.00 (**+194% improvement - now perfect**)

### Touch Target Improvements

**Homepage**: Already had perfect touch targets (1.00)
**Article Page**: Touch targets still need work (0.00) - this is likely due to other interactive elements beyond navigation

### What We Fixed

✅ **Font Loading**: Switched from Google Fonts CDN to self-hosted Fontsource variable font
✅ **Image Optimization**: All images now use Astro's `<Image>` component with WebP format
✅ **Responsive Images**: Proper layouts and sizing implemented
✅ **CSP Security**: Locked down to self-hosted resources only
✅ **Navigation Touch Targets**: Improved mobile touch targets for navigation links
✅ **Footer Touch Targets**: Improved mobile touch targets for footer links

### Impact Analysis

**Biggest Wins:**

1. **Article Page Performance**: From failing (0.41) to excellent (0.89)
2. **Largest Contentful Paint**: From completely failing (0.00) to good (0.87)
3. **Font Loading**: Eliminated external dependency and render blocking
4. **Image Optimization**: 308kB → 9-117kB per image (massive file size reduction)

**Remaining Issues:**

- Article page touch targets still need work (likely other interactive elements)
- Some accessibility improvements still possible

### Next Steps

1. **Address remaining touch targets** on article pages
2. **Run mobile tests** to verify improvements on mobile devices
3. **Monitor Core Web Vitals** in Google Search Console
4. **Consider additional accessibility improvements** if needed

## Next Steps

1. **Prioritize Phase 1 fixes** - Focus on article page performance and accessibility
2. **Implement changes incrementally** - Test each change before moving to next
3. **Re-run audits** after each major change
4. **Monitor Core Web Vitals** in Google Search Console
5. **Track performance improvements** over time
