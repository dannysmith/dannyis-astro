# Current Tasks

## Task 1: Dark Mode

We need to add a dark mode to the site, controllable via CSS variables. The footer and main Navigation are already "dark" so don't need changing. The other pages need updating to use decent dark mode colours though.

## Requirements

- Identify the colours which will need to be changed for dark mode, both in `globa.css` and in layouts and components.
- Ensure all colours are set using CSS variables set on `:root` and are appropriatly named after their function (ie we're not _directly_ using the actual colour variables).
- Identify which colours look best in dark mode. Consider making links yellow as per https://tess.oconnor.cx/2023/10/heraldic-link-colors ?
- Add a switch to toggle dark mode to the Navigation Menu (or maybe the footer?)
- Store the user's preference in a cookie or local storage
- Detect the UAs preferred mode and set this - what's the best way to do this?
- Update UI font weights in dark mode if needed
- Update `.prose` to change font weights and line-spacing if needed
- Update the CSS for the `@articletypography` layer so Articles look beautiful in dark mode. Probably need some changes to font weights and line-spacing?
- Consider reducing the colour of images and videos by applying a filter like `filter: grayscale(30%)` in darkmode.
- Consider changing the SVG favicon (https://css-tricks.com/svg-favicons-and-all-the-fun-things-we-can-do-with-them/)
- Ensure CSS that deals with theme switching is in a `@theme` layer.
  This should include:
- Review everything to ensure we're using CSS variables appropriatly and as simply as possible for future maintainance.
- Update cursor rules to explain how theming works.

## Technical Plan: Dark Mode Implementation

### 1. CSS Variable Structure

- Define semantic color variables in `:root` in `global.css` for both light and dark themes.
- Use `[data-theme="dark"]` for dark mode overrides (not just `@media`), to allow manual toggling.
- Example:
  ```css
  :root {
    --color-bg-primary: var(--c-beige-bg);
    --color-text-primary: var(--color-grey-800);
    --color-link: var(--color-red-500);
    /* ... */
  }
  [data-theme='dark'] {
    --color-bg-primary: var(--color-bg-dark-100);
    --color-text-primary: var(--color-grey-300);
    --color-link: var(--color-yellow-500);
    /* ... */
  }
  ```

### 2. Theme Toggle Implementation

- Create a `ThemeToggle.astro` component (or add to MainNavigation).
- Toggle sets `data-theme` on `<html>` and saves preference to `localStorage`.
- On page load, check `localStorage` or fallback to `prefers-color-scheme`.
- Example logic:
  ```js
  // theme.js
  export function initTheme() {
    const theme =
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
  export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
  ```

### 3. Component & Layout Updates

- Refactor all components and layouts to use semantic CSS variables (not hardcoded colors).
- Key files: BlogPost.astro, NoteCard.astro, Callout.astro, MainNavigation.astro, Footer.astro, prose/article typography, etc.
- Ensure all backgrounds, text, borders, and accents use variables.

### 4. Typography & Prose Adjustments

- In dark mode, slightly increase font weight (e.g., 400→500) and line height (e.g., 1.7→1.85) for body text.
- Ensure headings are bold and clear.
- Adjust `.prose` and article typography for optimal readability in dark mode.
- Example:
  ```css
  [data-theme='dark'] {
    --font-weight-body: 400;
    --line-height-body: 1.85;
    /* ... */
  }
  body {
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
  }
  ```

### 5. Link & Accent Colors

- Use yellow/gold for links in dark mode for visibility and style.
- Ensure visited/hover states are distinct and accessible.
- Test accent colors for contrast.

### 6. Images & Media

- In dark mode, consider applying `filter: grayscale(30%)` to images/videos for a softer look.
- Add subtle borders or box-shadows if needed for separation.

### 7. Favicon

- Create a dark mode variant of the favicon (SVG recommended).
- Use `<link rel="icon" ... media="(prefers-color-scheme: dark)">` or swap based on theme.

### 8. Testing

- Test on all major browsers and devices.
- Verify theme persistence, system preference detection, and toggle behavior.
- Check all components, typography, and media in both themes.
- Test accessibility (contrast, focus states, screen readers).

### 9. Documentation

- Update cursor rules and docs to explain theming approach and variable usage.
- Document how to add new theme-aware components.

### 10. Implementation Order

1. Set up CSS variable structure and dark mode overrides.
2. Implement theme toggle and persistence logic.
3. Refactor components/layouts to use variables.
4. Adjust typography, links, and media for dark mode.
5. Add favicon support.
6. Test thoroughly and refine.
7. Update documentation.

## Task 2: Run some audits & tidy up

- [ ] Review all UI type & colours for consistency and colour
- [ ] Change Blog Posts to be called Article everywhere
- [ ] Reorganise components into folders:
  - Atomic UI (pill, spinner, FormattedDate etc)
  - For use in MDX and prose (Embed, Grid, Loom, Notion, Callout etc)
  - UI Modules (NoteCard, NavLink, MainNavigation, LightBox, Footer, BaseHead etc)
- [ ] Check all metadata, titles & descriptions work properly for SEO and OG embedding
- [ ] RSS Feeds
  - [ ] Add seperate RSS feeds for Articles and Notes
  - [ ] Add links to all three RSS feeds to Footer
  - [ ] Check all RSS feeds generate ok and render in RSS readers
- [ ] Check sitemap generates properly
- [ ] Add [Simply Analytics](https://www.simpleanalytics.com/)
- [ ] Add to Google Tag Manager
- [ ] Manually test all pageson multiple devices and browsers
  - [ ] Chrome/Arc macOS
  - [ ] Firefox macOS
  - [ ] Safari macOS
  - [ ] iOS Chrome
  - [ ] iOS Safari
  - [ ] Windows Chrome
  - [ ] Windows Edge
  - [ ] iPad smoke test
- [ ] Run CSS audit for unused or duplicated styles
- [ ] Run SEO Audit Tool
- [ ] Check Lighthouse Score
- [ ] Update cursor rules and docs to reflect current design patterns etc

# Possible Future Tasks

- Add view transitions
- Move very old articles over from https://github.com/dannysmith/dasmith/tree/master/articles
- Keybord search & Command Palette
- Add a `/working` page with a unique design which talks about my consulting offering.
- Show links to Toolbox Items from my Notion toolbox on a special page
- Add Webmentions to articles and notes.
