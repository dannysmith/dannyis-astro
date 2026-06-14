# Working in `src/pages/styleguide`

The public visual styleguide for danny.is (served at `/styleguide`). Reference for how everything renders.

## Rules

- Keep it current and correct, especially with regard to new/changed design tokens and new/changed components.
- Do not make edits in here without the user's explicit permission.
- Do not rewrite any of the explanatory prose in here without the user explicitly asking you to.

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
