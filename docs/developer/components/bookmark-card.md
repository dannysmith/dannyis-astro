# BookmarkCard Component

Component for displaying rich link previews with Open Graph metadata.

## Overview

BookmarkCard fetches metadata from URLs at build time and displays them as attractive, responsive cards. It gracefully handles failures by showing a minimal fallback UI instead of breaking the build.

## Usage

```astro
---
import BookmarkCard from '@components/mdx/BookmarkCard.astro';
---

<BookmarkCard url="https://example.com/article" />
```

## Features

- **Build-time metadata fetching**: Fetches Open Graph data during the build process
- **Graceful failure handling**: Shows clean fallback UI when metadata unavailable
- **Responsive container queries**: Automatically switches between stacked and horizontal layouts
- **Browser-like requests**: Uses proper User-Agent headers to avoid common bot blocks
- **Accessible**: Proper semantic HTML and focus states

## How it works

1. At build time, `fetchLinkMetadata()` attempts to fetch the URL with browser-like headers
2. Extracts Open Graph meta tags (og:title, og:description, og:image, etc.)
3. If fetch fails (403, timeout, network error), uses a minimal fallback
4. Renders clean card UI with the extracted or fallback metadata

## Metadata extraction

The utility tries multiple meta tag formats:
- `<meta property="og:title" content="...">` (Open Graph)
- `<meta name="twitter:title" content="...">` (Twitter Cards)
- `<title>...</title>` (HTML title tag)
- `<meta name="description" content="...">` (Standard meta)

## Graceful failures

When metadata fetch fails, BookmarkCard shows:
- Domain name from the URL
- The full URL as the title
- "Preview unavailable - click to visit" message
- No image

This ensures the site builds successfully even when external sites block requests.

## Known limitations

### Sites that block automated requests

Some sites aggressively block scrapers even with proper headers:
- Medium.com
- Twitter/X.com (requires API)
- Sites behind Cloudflare bot protection
- Sites with sophisticated fingerprinting

For these sites, the fallback UI will be shown. This is intentional and better than failing the build.

### Workarounds for blocked sites

If you need rich previews for commonly blocked sites:

1. **Manual metadata**: Create a metadata cache file and provide hardcoded metadata for specific URLs
2. **Third-party services**: Use services like `microlink.io`, `opengraph.io`, or similar
3. **Custom implementation**: Build a server-side proxy that fetches metadata with a real browser

## Container query breakpoints

- **< 400px**: Stacked layout (image on top, content below)
- **≥ 400px**: Horizontal layout (content left, image right at 160px width)

## Styling

BookmarkCard uses CSS custom properties from the theme:
- `--color-bg-secondary`: Card background
- `--color-border`: Card border
- `--color-accent`: Title color and hover border
- `--color-text-secondary`: Description and domain text
- `--color-text-tertiary`: Fallback notice text
- `--font-code`: Domain name font

## Related utilities

- `src/utils/fetchLinkMetadata.ts` - Metadata fetching logic
- `src/components/mdx/Embed.astro` - Uses BookmarkCard as fallback for non-embeddable URLs
