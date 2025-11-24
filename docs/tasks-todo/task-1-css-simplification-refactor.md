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

- [x] `Pill.astro`
- [x] `MarkdownContentActions.astro`
- [x] `Spinner.astro`
- [x] `NoteCard.astro` - uses container queries
- [x] `ContentCard.astro` - uses container queries, variants

## Phase E: Pages

- [x] `index.astro` (homepage)
- [x] `writing/index.astro`
- [x] `notes/index.astro`
- [x] `now.astro`
- [x] `Note.astro` layout
- [] `404.astro`


## Phase F: MDX Components

Enable and review each, simplify where possible:

- [ ] `highlight.astro`
- [ ] `SmallCaps.astro`
- [ ] `IntroParagraph.astro`
- [ ] `Grid.astro`
- [ ] `Center.astro`
- [ ] `Spacer.astro`
- [ ] `SmartLink.astro`
- [ ] `Callout.astro` - uses color variants
- [ ] `BlockQuoteCitation.astro`
- [ ] `BookmarkCard.astro`
- [ ] `BasicImage.astro`
- [ ] `Notion.astro`
- [ ] `ButtonLink.astro`
- [ ] `Accordion.astro`
- [ ] `Loom.astro`

## Phase G: Final Reviews

- [ ] Fully Review all CSS as a CSS expert.
  - [ ] Look for any outdated or redundant CSS we've left behind in astro components/pages.
  - [ ] Look for any identical CSS being used in more than one place. Consider whether we should extract these patterns into something reusable. This may be core global CSS custom properties (colour etc), utility classes or even new Atro wrapper components.
  - [ ] Look for places where we're repeatedly overriding styles applied in global.css in the same way in multipkle places. This *may* be an signal to change the global styles.
  - [ ] Look for anywhere we can consolidate selectors by using nesting, where, is etc.
  - [ ] Look for any opportunities to make the CSS more defensive WITHOUT ADDING MUCH CODE. Think small, easy changes. We only need to care about this in components which may be used in multiple places/contexts etc.
  - [ ] Review global.css and other areas we use custom properties for opportunities to add `@property` type definitions. We should only do this where it might help reduce errors in the future.
  - [ ] Double check for any leftover "this has moved" or "we now handle..." AI comments and remove. Where appropriate, add helpful explanatory comments for non-obvious CSS rules to help AI and humans quickly understand what CSS does and why (no AI slop & must not be brittle "eg. "❌ Inherits Red background from X" because red may change etc). The reset in `global.css` is a good example of doing this in a very verbose way (because most rules in any reset have a non-obvious "why") Add structure to global.css and any other long CSS things with section titles, seperators etc as comments.
  - [ ] Conduct final comprehensive review of all CSS in the project as an expert and make any reccomendations.

## Phase H: Test on Preview Deploy

- [ ] Push to GH branch and review any CodeRabbit comments
- [ ] Manually test preview branch on:
  - [ ] Desktop
    - [ ] Chrome
    - [ ] Safari
    - [ ] Firefox
  - [ ] iPhone
    - [ ] Chrome
    - [ ] Safari
  - [ ] iPad
    - [ ] Chrome
    - [ ] Safari

## Phase I: Update docs

- [ ] Pass One: update all docs in `docs/developer` so they're **accurate** as per the current system. Update outdated CSS custom properties, layer names, component interfaces etc. Do not add new guidance but mark any areas we should change or update with a TODO for thenext pass.
- [ ] Update relevant docs in `docs/developer` so they properly explain the current system, the design patterns to use etc. Should include clear instructions on what CSS layers to use, how to use the core CSS custom properties systems, when and how to use the utility classes, what patterns to follow etc. Should also include info on how and when to extract CSS into `@base`, `@typography` or `.ui-styles`.
- [ ] Update `CLAUDE.md` and `.claude/agents/design-system-expert.md` appropriately. Include reference to CSS expert skill (available globally - not in project)
- [ ] Final pass over documentation to ensure it's correct and as useful as possible for AI agents working on CSS.

## Phase J: Pre-Merge Checks

- [ ] Remove `global-backup.css`
- [ ] Remove `toggle-component-css.sh`
- [ ] Run `pnpm run check:all` and fix any issues
- [ ] Resolve any last Coderabbit issues
- [ ] Danny will manually review all the CSS and docs one last time before merging on GH

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


## Reference Files

- `src/styles/global.css` - working file
- `src/styles/global-backup.css` - full original (copy from here)
- `scripts/toggle-component-css.sh` - enable/disable component CSS
