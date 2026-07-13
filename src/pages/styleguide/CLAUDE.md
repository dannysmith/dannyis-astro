# Working in `src/pages/styleguide`

The public visual styleguide for danny.is (served at `/styleguide`). Reference for how everything renders.

## Rules

- Keep it current and correct, especially with regard to new/changed design tokens and new/changed components.
- Do not make edits in here without the user's explicit permission.
- Do not rewrite any of the explanatory prose in here without the user explicitly asking you to.

## Table of contents (per-page `toc`)

Each routed page defines a `const toc = [{ id, label }, …]` and passes it to `StyleguideLayout`, which renders a sticky sidebar. Highlighting-as-you-scroll is a **CSS-only scroll-spy** (`scroll-target-group` / `:target-current`) — experimental, Chrome 140+ only, and a pure progressive enhancement (it simply doesn't highlight in other browsers).

When you add, remove, or reorder a **major section heading** on a page, update that page's `toc` to match:

- Every `toc` entry's `id` must equal the `id` on the section it points to (usually `<section id="…">`), or it can never be highlighted.
- Keep `toc` entries in **document order** so the highlight moves top-to-bottom as you scroll.
- Conversely, a major section with **no** `toc` entry won't be tracked — add one.

## Directory structure

Each routed page is a top-level `.astro` file; underscore-prefixed directories are helpers and are not routed:

- `index.astro` - Brief overview for readers.
- `foundations.astro` - The fundamentals of my "design system" including colours, design tokens, type and spacing scales, plus some global utility classes.
- `typography.astro` - Shows the various type treatments and other typographic features.
- `components.astro` - Shows the various components I use in my content. 
- `ui.astro` -  reference for other reusable components used in the design and layout of the site.
- `html.astro` - Reference for native HTML elements which aren't covered elsewhere but are styled in the site.
- `_layout/StyleguideLayout.astro` — shared layout used by styleguide pages. Kept here to avoid polluting the main layours dir with styleguide-specific stuff.
- `_components/` — styleguide-only helper components (e.g. `SGSwitcher`, `SGTypeSpecimen`). Not for use outside the styleguide.
- `_snippets/` — `.mdx` fragments imported into pages to demo MDX/markdown features (checklists, footnotes, list density).
