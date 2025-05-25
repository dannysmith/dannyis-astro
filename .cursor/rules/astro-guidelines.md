---
description: Guidelines for working with Astro in this project
globs: ['**/*.astro', '**/*.mdx']
alwaysApply: true
---

# Astro Guidelines

## Core Principles

1. **Zero JavaScript by Default**

   - Write components without client-side JavaScript when possible
   - Use Astro's built-in features for static content
   - Only add interactivity when necessary

2. **Content-First Approach**

   - Use Astro's content collections for type-safe content
   - Leverage MDX for enhanced markdown
   - Keep content separate from presentation

3. **Performance First**
   - Use Astro's image optimization
   - Minimize client-side JavaScript
   - Leverage static generation where possible

## Component Guidelines

### Astro Components

1. **Structure**

   ```astro
   ---
   // 1. Imports
   import { Image } from 'astro:assets';

   // 2. Props
   const { title, image } = Astro.props;

   // 3. Data fetching (if needed)
   const data = await fetchData();
   ---

   <!-- 4. Template -->
   <div class="component">
     <!-- Content -->
   </div>

   <!-- 5. Styles -->
   <style>
     /* Scoped styles */
   </style>
   ```

2. **Best Practices**
   - Keep components focused and single-purpose
   - Use scoped styles by default
   - Leverage Astro's built-in components
   - Use TypeScript for props

### MDX Components

1. **Usage**

   - Use for content that needs enhanced markdown
   - Keep custom components minimal
   - Document available components

2. **Available Components**
   - `<Callout>` - For highlighting important information
   - `<LovelyEmbed>` - For rich link previews
   - `<NotionMention>` - For Notion page references

## Content Collections

1. **Articles**

   - Use `src/content/articles/`
   - Required frontmatter:
     ```yaml
     title: string
     pubDate: date
     draft: boolean
     ```
   - Optional frontmatter:
     ```yaml
     updatedDate: date
     cover: image
     coverAlt: string
     description: string
     tags: string[]
     platform: "medium" | "external"
     redirectUrl: string
     ```

2. **Notes**
   - Use `src/content/notes/`
   - Required frontmatter:
     ```yaml
     pubDate: date
     ```
   - Optional frontmatter:
     ```yaml
     title: string
     url: string
     tags: string[]
     ```

## Image Handling

1. **Astro Image Component**

   ```astro
   <Image
     src={import('../assets/image.jpg')}
     alt="Description"
     width={800}
     height={600}
   />
   ```

2. **Best Practices**
   - Always provide width and height
   - Use descriptive alt text
   - Leverage Astro's image optimization
   - Use appropriate image formats

## Performance Guidelines

1. **Build Optimization**

   - Use static generation by default
   - Minimize client-side JavaScript
   - Optimize images with Astro's built-in tools

2. **Loading Performance**
   - Use `loading="lazy"` for below-fold images
   - Implement proper caching strategies
   - Minimize third-party dependencies

## SEO Guidelines

1. **Meta Tags**

   - Use Astro's built-in SEO components
   - Implement proper meta descriptions
   - Use semantic HTML

2. **Sitemap**
   - Leverage `@astrojs/sitemap` integration
   - Keep URLs clean and descriptive
   - Implement proper redirects

## Error Handling

1. **404 Pages**

   - Implement proper error boundaries
   - Handle missing content gracefully

2. **Error States**
   - Design for error states
   - Provide helpful error messages
   - Implement proper fallbacks
