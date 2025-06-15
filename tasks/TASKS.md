# Current Tasks

## Task 1: Dark Mode

We need to add a dark mode to the site, controllable via CSS variables. The footer and main Navigation are already "dark" so don't need changing. The other pages and components need updating to use decent dark mode colours though. We need to keep this as simple as possible and make it very easy to include both light and dark colours when developing new pages and components.

## Requirements

- Identify the colours which will need to be changed for dark mode, both in `global.css` and in layouts and components.
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

### 1. Theme Toggle Implementation

- Create a `ThemeToggle.astro` component and add to navigation etc.
- Toggle sets `data-theme` on `<html>` and saves preference to `localStorage`.
- See https://jklakus.co.uk/blogs/astro-darktheme for an example that works with ViewTransitions and also https://astro-tips.dev/recipes/dark-mode/.
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

### 3. Refactor CSS Variables Everywhere and in Components

Let's do this step manually together so we really think carefully about how the CSS Variables work.
Let's also spend time auditing the colours we use across the site here.

1. List all colours which are used to set an actuall color on elements (ie background, color, border etc). Decide on a core set of these actual colours (eg foreground-color, accent-color, background-color, secondary-background-color, link-color, link-visited-color, heading-underline-color etc etc).
2. Refactor global.css to use these in light mode eg: `--heading-underline-color: var(--color-bg-dark-100)`. This should not change the visual look of anything at all.
3. Refactor global.css to apply some vaguely sensible colours in dark mode eg: `--heading-underline-color: var(--color-bg-light-100)`
4. Refactor ALL components to use these semantic variables. Move the light AND dark definitions of any semdnatic variables which are ONLY used within components from global.css into the components themselves in a global style tage set on :root.
5. Refactor pages in a similar way.
6. Refactor to ensure that all colour stuff related to theming is in the `@theme` CSS layer.
7. Double-check nothing has changed in the actual colours.

### 5. Decide on Dark Mode Colours

Switch to dark mode and work over EVERY SINGLE colour to find one which looks nice in Dark mode.

- Consider using yellow/gold for links in dark mode for visibility and style.
- Ensure visited/hover states are distinct and accessible.
- Test accent colors for contrast.
- Pay attention to any colours which use transparency for borders/shadows etc. These will need inverting and tweaking.
- Confirm that all variables are sensibly named, as simple as possible and are as close to the HTML they are used in as possible.

### 4. Typography, Prose and spacing Adjustments in Dark mode

When we're happy with the dark mode colours, we can make some chages to the typography in dark mode.
Let's also use this as a chance to double-check our font sizes, weights and padding/margin sizes accross the whole site to improve consistency.

- In dark mode, slightly increase font weight (e.g., 400→500) and line height (e.g., 1.7→1.85) for body text.
- Ensure headings are bold and clear.
- Adjust `.prose` and article typography for optimal readability in dark mode.
- Increase padding or margin as needed in dark mode. Be careful about causing unnececarry reflows.
- Example:
  ```css
  [data-theme='dark'] {
    --font-weight-body: 400;
    --line-height-body: 1.85;
    /* ... */
  }
  .prose {
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
  }
  ```

### 6. Images & Media

- In dark mode, consider applying `filter: grayscale(30%)` to images/videos for a softer look.
- Add subtle borders or box-shadows if needed for separation.

### 7. Favicon

- Create a dark mode variant of the favicon using SVG.
- Use `<link rel="icon" ... media="(prefers-color-scheme: dark)">` or swap based on theme.

### 8. Testing

- Test on all major browsers and devices.
- Verify theme persistence, system preference detection, and toggle behavior.
- Check all components, typography, and media in both themes.
- Test accessibility (contrast, focus states etc).

### 9. Documentation

- Update cursor rules and docs to explain theming approach and variable usage.
- Document how to add new theme-aware components.

## Task 2: Run some audits & tidy up

- [ ] Change Blog Posts to be called Article everywhere
- [ ] Reorganise components into folders:
  - UI Atoms (pill, Spinner, FormattedDate etc)
  - For use in MDX and prose (Embed, Grid, Loom, Notion, Callout etc)
  - UI Modules (NoteCard, NavLink, MainNavigation, LightBox, Footer, BaseHead etc)
- [ ] Check all metadata, titles & descriptions work properly for SEO and OG embedding
- [ ] RSS Feeds
  - [ ] Add seperate RSS feeds for Articles and Notes
  - [ ] Add links to all three RSS feeds to Footer
  - [ ] Check all RSS feeds generate ok and render in RSS readers
- [ ] Check sitemap generates properly in prod
- [ ] Add [Simply Analytics](https://www.simpleanalytics.com/)
- [ ] Add to Google Tag Manager
- [ ] Manually test all pages on multiple devices and browsers
  - [ ] Chrome/Arc macOS
  - [ ] Firefox macOS
  - [ ] Safari macOS
  - [ ] iOS Chrome
  - [ ] iOS Safari
  - [ ] Windows Chrome
  - [ ] Windows Edge
  - [ ] iPad Smoke Test
- [ ] Run CSS audit for unused or duplicated styles
- [ ] Run SEO Audit Tool
- [ ] Check Lighthouse Score
- [ ] Update cursor rules and docs to reflect all current design patterns etc

# Possible Future Tasks

- Add view transitions
- Move very old articles over from https://github.com/dannysmith/dasmith/tree/master/articles
- Keybord search & Command Palette (see https://www.thomasledoux.be/blog/search-static-astro-website)
- Add a `/working` page with a unique design which talks about my consulting offering.
- Show links to Toolbox Items from my Notion toolbox on a special page
- Add Webmentions to articles and notes?
