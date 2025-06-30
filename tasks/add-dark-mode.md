## Task 1: Dark Mode

We need to add a dark mode to the site, controllable via CSS variables. The footer and main Navigation are already "dark" so don't need changing. The other pages and components need updating to use decent dark mode colours. We need to keep this as simple as possible and make it very easy to include both light and dark colours when developing new pages and components.

## Technical Plan: Dark Mode Implementation

### 1. Refactor CSS Variables to be semantic and easier to understand

Before worrying about dark mode, let's sort out our colour variables.

Audit ALL color values accross the site and redefine these all as semantic variables which either use the color palette variables or assign colours directly (eg. `--heading-underline-color: var(--color-bg-dark-100)`).

- These should all be defined in the `@theme` CSS layer on `:root`. For colours used in more than one component or globaly, this should be in `global.css`. If only used inside a single component or page this can be done in an `isGlobal` style block in the component itself.
- Avoid changing the visual appearance of the site at this stage. Double-check nothing has changed in the actual colours.
- Ensure names follow a sensible semantic pattern.

### 2. Theme Toggle Implementation

Implement a simple but beautiful theme toggle, either in the bottom right of the site or in the navigation sidebar.
See https://jklakus.co.uk/blogs/astro-darktheme for an example that works with ViewTransitions and also https://astro-tips.dev/recipes/dark-mode/ for inspiration here. Think hard about how to do this best and in the simplest way. Should include "System", "Light" and "Dark" as options.

### 3. Allow for changing of semantic theme variables depending on mode

"Duplicte" the semantic variables which will need to change between modes into a system whereby we can swap them out simply by changing a colour variable. Make a first guess at the colours we wshould change at this point. Eg...

```css
:root,
:root[data-theme='light'] {
  --color-bg-primary: var(--color-bg-light-200);
  /*...*/
  color-scheme: light;
}

@media (prefers-color-scheme: dark), :root[data-theme='dark'] {
  :root {
    --color-bg-primary: var(--color-bg-light-200);
    /*...*/
    color-scheme: dark;
  }
}
```

### 5. Decide on Best Dark Mode Colours

Manually look over all of the colour variables and choose the most appropriate colours for dark mode.

- Consider using yellow/gold for links in dark mode for visibility and style (see https://tess.oconnor.cx/2023/10/heraldic-link-colors)
- Ensure visited/hover states are distinct and accessible.
- Test colors for contrast.
- Pay attention to any colours which use transparency for borders/shadows etc. These will need inverting and tweaking.

### 4. Typography, Prose and spacing Adjustments in Dark mode

When we're happy with the dark mode colours, we can make some chages to the typography in dark mode.
Let's also use this as a chance to double-check our font sizes, weights and padding/margin sizes accross the whole site to improve consistency. Things to consider...

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
  .prose {
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
  }
  ```

### 6. Images & Media

- In dark mode, consider applying `filter: grayscale(30%)` to images/videos for a softer look.
- Add subtle borders or box-shadows to images and media if needed for separation from the background.

### 7. Favicon

- Create a dark mode variant of the favicon using SVG. See https://css-tricks.com/svg-favicons-and-all-the-fun-things-we-can-do-with-them/

### 8. Testing

- Test accessibility (contrast, focus states etc).
- Manually check all colours work on multiple devices.
- Double check the code for opportunities to simplify or refactor without affecting the look of the site.

### 9. Documentation

- Update cursor rules and claude docs to explain theming approach and variable usage.
- Add documentation on how to add new theme-aware components.
