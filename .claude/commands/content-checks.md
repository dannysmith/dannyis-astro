---
description: Check and prepare content for publishing
allowed-tools: Read, Edit
---

# Content Checks Command

Validates and prepares articles and notes for publishing.

## Check Article

When asked to check an article, verify:

- First paragraph is long enough for drop-cap rendering
- No links in first couple sentences
- Proper heading hierarchy (no skipped levels)
- Correctly formatted markdown and Astro components
- No spelling/grammar errors
- Acronyms wrapped in `<abbr>` tags
- Final paragraph is proper sentence
- Footnotes properly formatted
- Code blocks have language defined

## Pre-Publishing Checklist - Article

Before publishing an article:

1. Run all "Check Article" validations
2. Review for SEO improvements (keywords, title, description)
3. Verify title, slug, and filename match appropriately
4. Ensure filename date matches pubDate
5. Add appropriate tags (3-5 max, or none)
6. Check image paths and imports
7. Remove unused component imports
8. Set `draft: false` or remove draft field
9. Verify external HTML links have `target="_blank" rel="noopener noreferrer"`
10. Ensure description is compelling and under 160 characters

## Pre-Publishing Checklist - Note

Before publishing a note:

1. Check markdown and component formatting
2. Fix spelling/grammar errors
3. Improve title if needed
4. Verify title, slug, filename relationship
5. Ensure filename date matches pubDate
6. Check image paths and imports
7. Remove unused imports
8. Verify sourceURL format if present
9. Check external link attributes
10. Set `draft: false` or remove draft field

## SEO Review

When reviewing for SEO:

- Analyze title for keywords and engagement
- Review description optimization
- Check heading structure hierarchy
- Identify internal linking opportunities
- Suggest featured snippet improvements
- Recommend meta description if missing
- Check keyword density without over-optimization
