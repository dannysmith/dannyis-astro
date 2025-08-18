---
description: Enhance content with images, descriptions, and tags
allowed-tools: Read, Edit, Write
---

# Content Enhancements Command

Adds images, descriptions, tags, and other enhancements to content.

## Insert Image

When inserting an image:

- Don't resize images unless requested
- Rename appropriately and place in `src/assets/`
- Use Astro's `<Image>` component with proper imports
- Provide descriptive alt text
- If no image provided, offer to find on Unsplash or generate
- Don't use copyrighted images without permission

### Example

```astro
import myImage from '../assets/articles/article-name/image.jpg';

<Image src={myImage} alt="Descriptive alt text" />
```

## Add Header Image

For article header images:

- Don't resize without asking
- Place in appropriate `src/assets/` location
- Update `cover` frontmatter with import
- Set `coverAlt` with descriptive text
- Offer Unsplash or generation if no image provided

### Example Frontmatter

```yaml
cover: ./path/to/header-image.jpg
coverAlt: 'Descriptive alt text for header image'
```

## Generate Description

When generating descriptions:

- Read content and create 1-2 sentence summary
- Focus on main value proposition
- Make SEO-friendly with keywords
- Keep under 160 characters
- Update `description` frontmatter field

## Suggest Tags

When suggesting tags:

- Analyze for key topics and themes
- Suggest 3-5 relevant tags maximum
- Use lowercase with hyphens for multi-word
- Consider existing tags for consistency
- Focus on broad, searchable categories

### Common Tags

- `development`, `design`, `astro`, `css`, `javascript`
- `web-performance`, `typography`, `productivity`
- `personal`, `tools`, `ai`, `writing`
