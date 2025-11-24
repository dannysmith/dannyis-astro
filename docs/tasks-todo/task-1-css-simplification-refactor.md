# CSS Simplification Refactor

## Goal
Drastically simplify & modernise the CSS system so it's easier to work with, uses modern clean CSS in the most elegant way possible.

## General Method

Disable all CSS and then:

1. Set a good foundation in global.css by starting from scratch and reintroducing code bit by bit while reviewing each line.
2. Rework the CSS for every component and page in the site one-by-one until nothing is still disabled.
3. Run a series of focussed reviews on the finished product.
4. Update our documentation so AI agents know how to write CSS like this.

## Objectives & Process

### 1 - global.css Foundation

Create a concise, robust, clean and easy-to-read `global.css` which uses modern CSS and includes:

- Reset and Base CSS layers which establish sensible defaults.
- A unified colour system which includes global CSS properties for
  - Primative hues (coral, green, yellow etc)
  - Core primitive colour vars which adapt to theme by default using `light-dark`, derived from the primative hues. So `colour: var(--color-yellow)` will Just Work regardless of theme etc.
  - Core Semantic color vars which work in the same way. Eg color-accent, color-text, color-text-secondary, color-background, color-background-secondary, color-border and the like.
  - Absolute color vars for non-derived colours like `black, white, beige, ink, charcoal` etc
- A Utopia-generated system of fluid spacing (eg `--space-m: clamp(a,b,c)`)
- A Utopia-generated system of fluid type sizes (eg `--step-0: clamp(a,b,c)`) with semantic aliases (eg `--font-size-base`).
- Scales with named CSS Vars for:
  - leading (line-height)
  - tracking (letter-spacing)
  - font-weight
  - border-width
  - border-radius
  - animation duration
  - shadows
- A typography layer which sets sensible site-wide defaults (and replaces the styles added by the old SimpleProseTypography.astro). This should apply sensible styling for prose, links etc.
- A `.ui-style` utility class which "undoes" much of the styling from the typograpjy layer and sets sensible defaults for "UI-ish" pages and elements. Eg. itmight use `--font-ui`, remove margin and padding, remove underlines and color from non-hovered links, tighten line-height etc etc etc.
- Utility classes for very common CSS we use lots (eg `all-caps` and `list-reset`).

### 2 - Component and Page CSS

One-by-one we will re-introduce the CSS for each component and page, updating it to use the new global CSS variables. As we reintroduce it we will:

1. Simplify & condense the CSS (and improve consistency) by:
   - Relying on the more comprehensive defaults now inherited from global.css
   - Relying on the fluid space and type systems provided by the new space & type variables.
   - Relying on the adaptive switching provided by the new color variables.
   - Using `.ui-style` to set god defaults for "UI-ish" elements and pages, and smaller utilities like `.list-reset` or `.all-caps` alongside it.
   - Where appropriate, deriving local values from the global vars using CSS features like color-mix, oklch, calc etc.
2. Further modernise, simplify & condense the CSS by making use of features like:
   - Modern grid & flexbox layouts
   - Modern properties (eg `aspect-ratio`, `text-underline-offset` and many more)
   - Logical properties (where they're simpler/clearer)
   - Nested selectors, where(), is(), has() etc.
   - etc.
3. [For generalised, reusable components ONLY] Ensure they respond appropriatly to any potential container & content, and are somewhat robust (ie container queries, overflow behavior, line breaking and all the rest - simple defensive CSS). Do not over-engineer here, though.
3. Visually test in the browser and make small visual improvements, redesigns or trade-off decisions nececarry as we go.
4. Finish up by sanity-checking for anything redundant, adding comments where code is non-obvious &noting anything we should later consider extracting into global.css (as global CSS Var, part of @typography or @base or `.ui-style`, or as a utility class) or into a wrapper Astro component.

### 3 & 4 - Wrapping Up

Detail on this below.

## Implementation Checklist

### Setup ✅

- [x] Create `global-backup.css` with full original CSS
- [x] Create minimal `global.css` skeleton (reset + essential tokens)
- [x] Disable all component CSS via `./scripts/toggle-component-css.sh disable`

---

### Phase 0: global.css Foundation ✅

Work through `global.css`, manually copying rules from `global-backup.css` as needed.

#### 0.0: Set up simplified global CSS Custom Properties System
- [x] Remove all old properties
- [x] Base hues for all colours
- [x] Absolute Color Primatives
- [x] Adaptive color vars using light-dark
- [x] Additional neutral primatives (beige, ink, charcoal etc)
- [x] Core Semantic colour vars
- [x] Font vars (stay as-is)
- [x] Fluid Spacing Vars (utopia-generated)
- [x] Fluid Typography Vars (utopia-generated)
- [x] Semantic aliases for fluid typography vars
- [x] Leading vars
- [x] Tracking vars
- [x] Font Weight vars
- [x] Border width and radias vars
- [x] Motion vars (timing etc)
- [x] Shadow vars

#### 0.1: Reset Layer
- [x] Review reset layer
- [x] Verify the site looks somewhat correct with just reset applied

#### 0.2: Base Layer
- [x] Manually copy styles over, veryfying each is modern, worthwhile and belongs in the base layer.
- [x] Review and simplify where possible
- [x] Verify the site looks kinda-ok with just reset & base applied.

#### 0.3: Typography Layer
- [x] Manually copy styles over, veryfying each is modern, worthwhile and belongs in the typography layer.
- [x] Review and simplify where possible
- [x] Verify the site looks kinda-ok with just reset, base & typography applied.

#### 0.4: Layout Layer
- [x] `.flow` utility
- [x] `.list-reset` utility
- [x] `.all-caps` utility
- [x] Ensure these are being used eveywhere appropriate

#### 0.5: Utilities Layer
- [x] Create `.ui-style` to reset many of the rules in @typography and apply styles appropriate for UI-ish elements.
- [x] Create `.dark-surface` for applying dark-mode to elements regardless of color mode (eg MainNav, Footer etc)
- [x] Review and copy over existing utilities: `.cq`, `.sr-only` / `.hidden-microformat`
- [x] Ensure `.ui-style` is used wherever appropriate.

- [x] Review whole of `global.css` for redundancy, simplification and modernness.
---

### Phase 1: Long-Form Content System ✅

Simplify to make use of new defaults inherited from base @typography. Ensure no layout code exists in `Article.astro` layout, and vice versa.

- [x] LongFormProseTypography.astro
- [x] Article.astro Layout
- [x] Detailed visual check of Articles

### Phase 2: Core Layout Components ✅

- [x] Footer
  - [x] Footer.astro
  - [x] PersonalLogo.astro
  - [x] SocialLinks.astro
- [x] Lightbox.astro
- [x] MainNavigation
  - [x] MainNavigation.astro
  - [x] ThemeToggle.astro

---

### Phase 3: UI Components ✅

- [x] `Pill.astro`
- [x] `MarkdownContentActions.astro`
- [x] `Spinner.astro`
- [x] `NoteCard.astro` - uses container queries
- [x] `ContentCard.astro` - uses container queries, variants

### Phase 4: Pages ✅

- [x] `index.astro` (homepage)
- [x] `writing/index.astro`
- [x] `notes/index.astro`
- [x] `now.astro`
- [x] `Note.astro` layout
- [x] `404.astro`


### Phase 5: MDX Components

These components are intended mainly for use in MDX (articles, notes, pages, future content).

Simple(ish) components css-wise:

- [x] `highlight.astro`
- [x] `SmallCaps.astro`
- [x] `IntroParagraph.astro`
- [x] `Grid.astro`
- [x] `Center.astro`
- [x] `Spacer.astro`
- [x] `SmartLink.astro`
- [x] `Loom.astro`

More complex components CSS-wise. Maybe an opportunity to resesign some of these visually to improve how they look:

- [x] `Callout.astro` - uses color variants
- [x] `BlockQuoteCitation.astro`
- [x] `BookmarkCard.astro`
- [x] `BasicImage.astro`
- [x] `Notion.astro`
- [x] `ButtonLink.astro` - this is mega ugly we should totally redesign it to look lovely
- [x] `Accordion.astro` - this is mega ugly we should totally redesign it to look lovely

Bugfixes and other Cleanup

- [x] Update styleguide page CSS
- [x] Reenable and update toolboxtest page CSS
- [x] Fix vertical flow issues

### Phase 6: Final Reviews


- [ ] Fully Review all CSS as a CSS expert.
  - [x] Look for any outdated or redundant CSS we've left behind in astro components/pages.
  - [x] Look for any identical CSS being used in more than one place. Consider whether we should extract these patterns into something reusable. This may be core global CSS custom properties (colour etc), utility classes or even new Atro wrapper components.
  - [x] Look for places where we're repeatedly overriding styles applied in global.css in the same way in multipkle places. This *may* be an signal to change the global styles.
  - [x] Look for anywhere we can consolidate selectors by using nesting, where, is etc.
  - [x] Look for any opportunities to make the CSS more defensive WITHOUT ADDING MUCH CODE. Think tiny, easy changes. We only need to care about this in components which may be used in multiple places/contexts etc.
  - [x] Review global.css and other areas we use custom properties for opportunities to add `@property` type definitions. We should only do this where it might help reduce errors in the future.
  - [x] Double check for any leftover "this has moved" or "we now handle..." AI comments and remove. Where appropriate, add helpful explanatory comments for non-obvious CSS rules to help AI and humans quickly understand what CSS does and why (no AI slop & must not be brittle "eg. "❌ Inherits Red background from X" because red may change etc). The reset in `global.css` is a good example of doing this in a very verbose way (because most rules in any reset have a very non-obvious "why"). Don;t go mad with this, be surgical. MAke sure we have structure in global.css and any other long blocks of CSS by adding section titles, seperators etc as comments.
  - [x] Conduct final comprehensive review of all CSS in the project as an expert and make any reccomendations.
  - [ ] Run `pnpm run check:all` and fix any issues


### Phase 6A: Other Random Things I wanna fix

- [ ] Inline footnotes are broken in articles
- [ ] Code styles
- [ ] Mermaid diagrams broken
- [ ] Add view transitions
  - [ ] Footer
  - [ ] NoteCard
  - [ ] General cross-fade?

### Phase 7: Test on Preview Deploy

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

### Phase 8: Update docs

- [ ] Pass One: update all docs in `docs/developer` so they're **accurate** as per the current system. Update outdated CSS custom properties, layer names, component interfaces etc. Do not add new guidance but mark any areas we should change or update with a TODO for thenext pass.
- [ ] Update relevant docs in `docs/developer` so they properly explain the current system, the design patterns to use etc. Should include clear instructions on what CSS layers to use, how to use the core CSS custom properties systems, when and how to use the utility classes, what patterns to follow etc. Should also include info on how and when to extract CSS into `@base`, `@typography` or `.ui-styles`.
- [ ] Update `CLAUDE.md` and `.claude/agents/design-system-expert.md` appropriately. Include reference to CSS expert skill (available globally - not in project)
- [ ] Final pass over documentation to ensure it's correct and as useful as possible for AI agents working on CSS.

### Phase 9: Pre-Merge Checks

- [ ] Remove `global-backup.css`
- [ ] Remove `toggle-component-css.sh`
- [ ] Run `pnpm run check:all` and fix any issues
- [ ] Resolve any last Coderabbit issues
- [ ] Danny will manually review all the CSS and docs one last time before merging on GH

## Modernization Guidelines for AI Agents

- When working through components & pages (phases 1-5), tackle one at a time so Danny can manually review the code and check in the browser.
- Use your CSS Expert skill (if available), but don't *slavishly* follow the patterns documented in it if they don't feel right here.
- If the user gives you a screenshot of the site REALLY STUDY AND ANALYSE IT. Don't assume you already know what it shows.
- Remember the developer documentation in `/docs` was written before this refactor, so is likeley out-of-date in some areas and patterns (we'll address this in Phase 8).
- Before adding CSS, check what's already inherited from `@typography` and `@base` layers. Many components had redundant declarations that global.css now handles.
- Don't run a browser (eg chrome-dev-tools or playwright MCP) unless the user specifically asks. The user can take screenshots for you if needed.

### Replace These Patterns

| Old Pattern | Modern Replacement |
|-------------|-------------------|
| Multiple similar color vars | `color-mix(in oklch, var(--base) 70%, white)` |
| `opacity: 0.7` for grey text | Hand-picked OKLCH with adjusted lightness |
| Repeated list resets | Single `.list-reset` utility |
| `@media` for component responsiveness | `@container` queries |
| Manual dark mode vars | `light-dark()` with primitives |
| Hardcoded colors | Semantic vars (`--color-accent`, `--color-text`, etc.) |
| Hardcoded spacing/sizes | Fluid vars (`--space-m`, `--font-size-base`, etc.) |
| Flat CSS selectors | CSS nesting (`& a { }` instead of `.foo a { }`) |
| Re-declaring link/heading styles | Inherit from `@typography`, use `.ui-style` to opt out |


---

## Reference Files

- `src/styles/global.css` - working file
- `src/styles/global-backup.css` - full original (copy from here)
- `scripts/toggle-component-css.sh` - enable/disable component CSS
