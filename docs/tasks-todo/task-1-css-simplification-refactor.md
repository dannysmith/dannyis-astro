# CSS Simplification Refactor

Drastically simplify the CSS system while retaining modern future-proofing features (layers, OKLCH, light-dark(), container queries, etc.).

## Setup Complete

- [x] Created `global-backup.css` with full original CSS
- [x] Created minimal `global.css` skeleton (reset + essential tokens)
- [x] Disabled all component CSS via `./scripts/toggle-component-css.sh disable`

## Workflow

```bash
# Check status
./scripts/toggle-component-css.sh status

# Enable specific component CSS
./scripts/toggle-component-css.sh enable Footer
./scripts/toggle-component-css.sh enable MainNav

# Enable all component CSS (when done)
./scripts/toggle-component-css.sh enable
```

---

## Phase A: global.css Foundation

Work through `global.css`, copying rules from `global-backup.css` as needed.

### A1: Review Reset Layer
- [ ] Review reset layer (already complete in skeleton)
- [ ] Verify it looks correct with just reset applied
- [ ] Run dev server, check homepage, article page, notes page

### A2: Base Layer
- [ ] Copy `html` and `body` base styles from backup
- [ ] Copy `abbr`, `sup`, `sub`, `del`, `mark` styles
- [ ] Copy table styles
- [ ] Copy form element styles
- [ ] Review and simplify where possible

### A3: Typography Layer
- [ ] Copy `html` typography foundation
- [ ] Copy `body` font defaults
- [ ] Copy heading styles (h1-h6)
- [ ] Copy link styles
- [ ] Copy list styles
- [ ] Copy blockquote styles
- [ ] Copy prose spacing rhythm
- [ ] Copy inline code styles
- [ ] Review - can anything be simplified?

### A4: Layout Layer
- [ ] Copy `.flow` utility
- [ ] Copy `.list-reset` utility
- [ ] Copy `.all-caps` utility
- [ ] Consider: do you need all of these?

### A5: Utilities Layer
- [ ] Copy `.ui-style` - this is important for nav/footer
- [ ] Copy `.dark-surface`
- [ ] Copy `.cq` (container query utility)
- [ ] Copy `.sr-only` / `.hidden-microformat`

### A6: Theme Layer - Simplification Target
- [ ] Copy reduced motion styles
- [ ] Copy dark mode typography overrides
- [ ] Copy manual theme override selectors
- [ ] **Review semantic color variables** - many can be removed
  - Do components really need their own color vars?
  - Can you use primitives + `color-mix()` directly?
  - Target: reduce from ~60 component vars to ~10-15 essential ones

---

## Phase B: Core Content System

### B1: LongFormProseTypography.astro
```bash
./scripts/toggle-component-css.sh enable LongFormProseTypography
```
- [ ] Enable and review
- [ ] Check article page rendering
- [ ] Simplify where possible
- [ ] Consider: which styles duplicate typography layer?

### B2: Article.astro Layout
```bash
./scripts/toggle-component-css.sh enable Article
```
- [ ] Enable and review
- [ ] Check grid layout
- [ ] Check hero image
- [ ] Check metadata styling

---

## Phase C: Core Layout Components

### C1: MainNavigation.astro
```bash
./scripts/toggle-component-css.sh enable MainNav
```
- [ ] Enable and review
- [ ] Uses `.ui-style` and `.dark-surface` - ensure those work
- [ ] Simplify color references (use primitives?)

### C2: Footer.astro
```bash
./scripts/toggle-component-css.sh enable Footer
```
- [ ] Enable and review
- [ ] Similar patterns to nav - consolidate?

### C3: Lightbox.astro
```bash
./scripts/toggle-component-css.sh enable Lightbox
```
- [ ] Enable and review

---

## Phase D: MDX Components

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

---

## Phase E: UI Components

- [ ] `ContentCard.astro` - uses container queries, variants
- [ ] `NoteCard.astro` - uses container queries
- [ ] `Pill.astro`
- [ ] `SocialLinks.astro`
- [ ] `ThemeToggle.astro`
- [ ] `MarkdownContentActions.astro`
- [ ] `PersonalLogo.astro`
- [ ] `Spinner.astro`

---

## Phase F: Pages

- [ ] `index.astro` (homepage)
- [ ] `writing/index.astro`
- [ ] `notes/index.astro`
- [ ] `now.astro`
- [ ] `404.astro`
- [ ] `Note.astro` layout

---

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
