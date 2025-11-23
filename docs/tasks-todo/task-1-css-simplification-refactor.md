# CSS Simplification Refactor

Drastically simplify the CSS system while retaining modern future-proofing features (layers, OKLCH, light-dark(), container queries, etc.).

## Setup Complete

- [x] Created `global-backup.css` with full original CSS
- [x] Created minimal `global.css` skeleton (reset + essential tokens)
- [x] Disabled all component CSS via `./scripts/toggle-component-css.sh disable`

---

## Phase A: global.css Foundation ✅

Work through `global.css`, copying rules from `global-backup.css` as needed.

### A1: Review Reset Layer
- [x] Review reset layer (already complete in skeleton)
- [x] Verify it looks correct with just reset applied
- [x] Run dev server, check homepage, article page, notes page

### A2: Base Layer
- [x] Copy `html` and `body` base styles from backup
- [x] Copy `abbr`, `sup`, `sub`, `del`, `mark` styles
- [x] Copy table styles
- [x] Copy form element styles
- [x] Review and simplify where possible

### A3: Typography Layer
- [x] Copy `html` typography foundation
- [x] Copy `body` font defaults
- [x] Copy heading styles (h1-h6)
- [x] Copy link styles
- [x] Copy list styles
- [x] Copy blockquote styles
- [x] Copy prose spacing rhythm
- [x] Copy inline code styles
- [x] Review - can anything be simplified?

### A4: Layout Layer
- [x] Copy `.flow` utility
- [x] Copy `.list-reset` utility
- [x] Copy `.all-caps` utility
- [x] Consider: do you need all of these?

### A5: Utilities Layer
- [x] Copy `.ui-style` - this is important for nav/footer
- [x] Copy `.dark-surface`
- [x] Copy `.cq` (container query utility)
- [x] Copy `.sr-only` / `.hidden-microformat`

### A6: Theme Layer - Simplification Target
- [x] Copy reduced motion styles
- [x] Copy dark mode typography overrides
- [x] Copy manual theme override selectors
- [x] **Review semantic color variables** - many can be removed
  - Do components really need their own color vars?
  - Can you use primitives + `color-mix()` directly?
  - Target: reduce from ~60 component vars to ~10-15 essential ones

---

## Phase B: Core Content System ✅

### B1: LongFormProseTypography.astro
```bash
./scripts/toggle-component-css.sh enable LongFormProseTypography
```
- [x] Enable and review
- [x] Check article page rendering
- [x] Simplify where possible
- [x] Consider: which styles duplicate typography layer?

### B2: Article.astro Layout
```bash
./scripts/toggle-component-css.sh enable Article
```
- [x] Enable and review
- [x] Check grid layout
- [x] Check hero image
- [x] Check metadata styling

---

## Phase C: Core Layout Components ✅

- [x] Footer
  - [x] Footer.astro
  - [x] PersonalLogo.astro
  - [x] SocialLinks.astro
- [x] Lightbox.astro
- [x] MainNavigation
  - [x] MainNavigation.astro
  - [x] ThemeToggle.astro

---

## Phase D: UI Components

- [ ] `Pill.astro`
- [ ] `MarkdownContentActions.astro`
- [ ] `Spinner.astro`
- [ ] `ContentCard.astro` - uses container queries, variants
- [ ] `NoteCard.astro` - uses container queries

## Phase E: Pages

- [ ] `index.astro` (homepage)
- [ ] `writing/index.astro`
- [ ] `notes/index.astro`
- [ ] `now.astro`
- [ ] `404.astro`
- [ ] `Note.astro` layout


## Phase F: MDX Components

Enable and review each, simplify where possible:

- [ ] `Callout.astro` - uses color variants
- [ ] `Accordion.astro`
- [ ] `BookmarkCard.astro`
- [ ] `IntroParagraph.astro`
- [ ] `ButtonLink.astro`
- [ ] `BlockQuoteCitation.astro`
- [ ] `Notion.astro`
- [ ] `BasicImage.astro`
- [ ] `Spacer.astro`
- [ ] `SmartLink.astro`
- [ ] `Center.astro`
- [ ] `Loom.astro`
- [ ] `Grid.astro`
- [ ] `highlight.astro`
- [ ] `SmallCaps.astro`

## Phase G: Update docs

- [ ] Update all docs in `docs/developer` so they're **accurate** as per the current system.
- [ ] Update relevant docs in `docs/developer` so they properly explain how things work, the design patterns to use etc. Should include clear instructions on what CSS layers to use, how to use the core CSS custom properties systems, when and how to use the utility classes etc. Should also include info on how and when to extract CSS into `@base`, `@typography` or `.ui-styles`.
- [ ] Update `CLAUDE.md` and `.claude/agents/design-system-expert.md` appropriately.

## Final Review

- [ ] Double check for any leftover "this has moved" or "we now handle..." comments. Add helpful explanatory comments wherever helpful.
- [ ] Fully Review all CSS and Related Documentation as a CSS expert.
- [ ] Manually test all styleguides on multiple browsers, and on mobile.

## Modernization Guidelines

### Replace These Patterns

| Old Pattern | Modern Replacement |
|-------------|-------------------|
| Multiple similar color vars | `color-mix(in oklch, var(--base) 70%, white)` |
| `opacity: 0.7` for grey text | Hand-picked OKLCH with adjusted lightness |
| Repeated list resets | Single `.list-reset` utility |
| `@media` for component responsiveness | `@container` queries |
| Manual dark mode vars | `light-dark()` with primitives |

### Defensive CSS to Keep/Add

- `flex-wrap: wrap` on all flex containers
- `min-width: 0` on flex/grid children
- `overflow-wrap: break-word` on text containers
- `min-height` never `height` for variable content
- Always provide fallbacks: `var(--x, fallback)`

### Remove/Simplify

- Component-specific semantic color vars used only once
- Redundant `font-family` declarations (inherit from body)
- Overly specific selectors when layer order handles priority
- Dead code and outdated comments

---

## Final Checks

- [ ] Test light mode
- [ ] Test dark mode
- [ ] Test mobile viewport
- [ ] Test article pages
- [ ] Test notes pages
- [ ] Test homepage
- [ ] Run `pnpm run check:all`
- [ ] Remove `global-backup.css` when confident
- [ ] Remove or update `toggle-component-css.sh` script

---

## Reference Files

- `src/styles/global.css` - working file
- `src/styles/global-backup.css` - full original (copy from here)
- `scripts/toggle-component-css.sh` - enable/disable component CSS
