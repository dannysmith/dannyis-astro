# Accessibility & Performance

Site-specific accessibility and performance patterns. For the underlying standards, see the [WCAG 2.1 quick reference](https://www.w3.org/WAI/WCAG21/quickref/) — this doc only covers how they apply _here_.

## Accessibility

The baseline is **WCAG 2.1 AA** and full keyboard operability for every interactive element.

- **Reach for semantic HTML first** (`article`, `header`, `section`, `nav`, `time`, `button`) and only add ARIA when an element's role/state isn't already conveyed. Hidden-but-announced text uses the `.sr-only` utility.
- **Focus rings are global.** The reset layer in `global.css` sets `:focus-visible` with `outline-offset: 3px`, so you rarely need per-component focus styles. See [component-patterns.md § Accessible Interactive Component](./component-patterns.md#accessible-interactive-component) for a full example.
- **Colour contrast** must meet AA in both themes — test light and dark.

## Performance

**Zero JavaScript by default.** Astro ships no client JS unless a component opts in. Add interactivity only when genuinely needed, as progressive enhancement:

- Site-wide behaviour (e.g. the theme toggle) uses small inline `<script>` tags.
- One-off interactive React demos are confined to `src/components/demos/` with `client:*` directives — see [component-patterns.md § Demo Components](./component-patterns.md#demo-components).

**Images** use the `BasicImage` component with a top-level asset import, which routes through Astro's image pipeline (optimisation, dimensions, responsive `srcset`). Always give descriptive alt text and lazy-load below-fold images. See [content-authoring.md § Images](./content-authoring.md#images) for the full pattern.
