# Task: Styleguide rework

Rework the **main** styleguide at `src/pages/styleguide/` (not the article/note styleguides, which are just markdown-rendering examples). The styleguide is a hidden-but-findable reference whose primary job is to help Danny build new components and visual features, and secondarily to let curious visitors see how the site is put together.

This doc is the living plan. It starts with the settled architecture, then the phased implementation. The original brain-dump that kicked it off is preserved at the bottom for context.

## Decisions made

These are settled (agreed in the planning conversation):

1. **Organising principle: authorial input modality** — "what do I write to get this thing?" Everything sits on one spectrum: _nothing (it's the system)_ → _plain markdown_ → _deliberate MDX component / special syntax_ → _code-only Astro markup_ → _raw native HTML_. This single axis resolves the overlaps (links, blockquotes, cards, footnotes) that the old native-vs-component / write-vs-code split kept double-binning.
2. **Split into multiple pages** via Astro file-based routing — one page per top-level section. Fixes navigability, keeps each source file small enough to hand-edit, and lightens each page (far fewer component instances per page). **Not** a content collection.
3. **HTML baseline: hybrid** — distribute native elements that have a natural component home (video/audio → embeds, `<details>` → accordion), and keep a "Native HTML baseline" appendix page for the genuine orphans (forms, `<dl>`, `<figure>`).
4. **Footnotes live in Prose** — authored as markdown (`[^1]`), shown as one complete demo covering the marker, the inline progressive-enhancement popup, and the end-of-doc section.
5. **Utility classes live in Foundations** — treated as system primitives alongside design tokens, kept together as one reference rather than scattered.
6. **Map over data, hand-write examples** — keep `.map()` only where the data _is_ the content (spacing scale, colour swatches). Hand-write every actual example (callouts, demos, component specimens) so they're easy to tweak. This is the biggest lever on editability.

## Target architecture

### Public-facing pages

| Route | Section | Contents | Mode |
| --- | --- | --- | --- |
| `/styleguide` | **Overview hub** | Intro, what this is, theme-toggle note, cross-links to all sections | Orientation |
| `/styleguide/foundations` | **Foundations** | Colour system, design tokens (space, type tokens, borders, radii, shadows, font families/sizes), utility classes | Documentation / reference |
| `/styleguide/typography` | **Prose & Typography** | Inline elements, headings, lists, tables, blockquotes; auto-enrichments (SmartLink/NotionLink, footnotes); composite "real article excerpt" examples | Specimens |
| `/styleguide/components` | **Content Components** | Deliberate MDX components: Callout, Embed family, BookmarkCard, Accordion, FileTree, ButtonLink, Image/Picture, IntroParagraph, MarkdownBlock, code blocks, ContentCard/NoteCard, layout helpers (Center/Grid) | Component-library docs |
| `/styleguide/ui` | **UI Components** | Code-only building blocks: Pill, Spinner, PersonalLogo, SocialLinks, ThemeToggle, MarkdownContentActions, Footer, nav | Component-library docs |
| `/styleguide/html` | **HTML Baseline** | Orphan native elements (forms, `<dl>`, `<figure>`) under default CSS, as a baseline audit | Reference |

`/styleguide` is a **slim orientation hub** (not merged into Foundations).

### Per-section content patterns

**Foundations** — primarily documentation, not specimens. Token tables stay `.map()`-driven over data (the data _is_ the content). Add explanatory intros to each group. Utility classes as a reference table, kept together.

**Prose & Typography** — two halves:

- _Inline reference_ as tables, per the format Danny suggested:

  | Element | You write | Renders | Notes |
  | --- | --- | --- | --- |
  | Strike | `` `<del>…</del>` `` | <del>…</del> | … |

- _Composite examples_ — a few realistic prose excerpts showing many elements together.
- _Auto-enrichment badge_ — mark elements where plain markdown is transparently enriched (links → SmartLink/NotionLink, `[^1]` → footnotes). These live here, **not** in Content Components, because the author never chose a component.
- _Footnotes_ — one complete demo unit (marker + inline popup + end section).

**Content Components & UI Components** — each component gets the full component-library treatment:

- What it is and (briefly) how it works.
- **Props table** for anything with non-trivial props.
- **"You write this" (MDX/code block) + rendered output**, the repeated unit.
- One or more examples, in different typographic contexts and/or `ResizableContainer` where width-response matters.
- **Badges** for components that auto-replace standard markdown or support special markdown syntax (fenced code → code block, filetree, markdownpreview, etc.).
- ContentCard/NoteCard live in **Content Components** (embeddable in MDX) with a note that they're also used internally on listing pages — one canonical entry, no duplication.

**HTML Baseline** — orphan native elements only, framed explicitly as "raw native element defaults under our CSS" so the audit purpose is clear.

### Helper components (styleguide-only, co-located)

Keep all styleguide-specific CSS/components co-located under the styleguide and minimal. Anticipated helpers:

- **Shared layout** — responsive, single-column on mobile (fixes the always-two-column bug). Persistent cross-page nav + light in-page sub-nav.
- **`SGNav`** — cross-page + in-page navigation, replacing the current `SGTOC`.
- **`SGSwitcher`** — the typography-context switcher (the existing `SGTypographySwitcher`), used to show a specimen across the **four contexts** (UI Flow dropped everywhere): Default, Default Flow, Long Form Prose, UI.
- **`SGSpecimen`** (working name) — renders the "you write this" code block + live output as one consistent unit. The core repeated element across Components/UI pages.
- **Props tables** — hand-written markdown tables per component (no data-driven `SGPropsTable`), for editability.

### Authoring approach

Pages stay `.astro` (keeps easy access to helpers/components/data), but long explanatory prose and "type this in MDX" examples are authored as co-located `.mdx`/`.md` snippets (extending the existing `_snippets/` pattern). Avoid a full MDX-page rewrite — too much complexity for little gain.

### Proposed file organisation

```
src/pages/styleguide/
  index.astro            # Overview hub
  foundations.astro
  typography.astro
  components.astro
  ui.astro
  html.astro
  _layout/               # co-located shared layout + nav
  _components/           # SGSwitcher, SGSpecimen, SGNav
  _snippets/             # MDX snippets (existing pattern, extended)
```

## Resolved implementation choices

- **Hub vs. merged** — `/styleguide` is a slim orientation hub; the index does not become Foundations.
- **Props tables** — hand-written markdown tables per component, for editability. No data-driven `SGPropsTable`.
- **Switcher contexts** — drop "UI Flow" everywhere. `SGSwitcher` offers four: Default, Default Flow, Long Form Prose, UI. Decide per-specimen which of those are worth showing.

## Phased plan

Each phase: Claude drafts the scaffolding/structure and a first pass of content; Danny reviews and tweaks copy and examples. Work the phases in order; the page split means later phases don't disturb earlier ones.

### Phase 0 — Scaffolding

- New responsive shared layout (single-column on mobile) + `SGNav` cross-page nav.
- Relocate the existing helpers into co-located `_components/`: `SGTOC` → `SGNav`, `SGTypographySwitcher` → `SGSwitcher`. Update the `src/components/styleguide/index.ts` barrel and any imports.
- `SGSwitcher` (four contexts) — adapt the existing `SGTypographySwitcher`, dropping UI Flow.
- `SGSpecimen` helper for code + rendered output.
- Create the **sibling** stub pages (`foundations`, `typography`, `components`, `ui`, `html`) on the new layout. **Leave `index.astro` as the current monolith** — it keeps rendering all sections until Phase 6, so the styleguide stays working throughout the migration.

### Phase 1 — Foundations page

Migrate colour system + design tokens; add intro/explanatory copy; fold in utility classes as a reference.

### Phase 2 — Prose & Typography page

Regroup current `_Typography` into the inline-reference tables + composite examples; add auto-enrichment badges; build the footnotes demo unit.

### Phase 3 — Content Components page

Build the per-component doc pattern (explanation, props, "you write this" + render, context/resizable demos, special-syntax badges). Includes ContentCard/NoteCard.

### Phase 4 — UI Components page

Same doc pattern for the code-only components.

### Phase 5 — HTML Baseline (hybrid)

Distribute media/`<details>` into their component homes; build the baseline appendix for the orphan elements; add any missing native elements worth a baseline.

### Phase 6 — Cleanup

Convert `index.astro` from the monolith into the slim hub (last, once every section has its own page); remove the old single-page partials; verify mobile performance/heat; `bun run check:all`; update `docs/developer/` if any patterns changed.

Note on Phases 1–5: as each section moves to its own page, remove its partial from the `index.astro` monolith so content is never duplicated or lost mid-migration.

---

## Original brief (preserved for context)

The original brain-dump that started this task is kept below for reference.

### Background

I'd like to do some work on the styleguide now. This excludes the article and note style guides, it's just the main style guide at `src/pages/styleguide/`. The article and note style guides are really just examples of how various things render in those contexts principally normal markdown copy. However, the main style guide is a separate section of the site, which while it's hidden from the main navigation, it is findable by users who want to get a bit of a feeling for how the site is put together. And of course its main purpose is to act as a reference for me when it comes to working on new components or visual features of the site.

Therefore I guess we could think of this style guide as having a few distinct "sections":

#### 1. Design System Overview

This should include a bit of an introduction, the colour system and the foundational design tokens. While I might refer to this as an easier way of reminding myself of some of these design tokens, nothing in here is likely to actually be used by me while I'm developing as a kind of reference to check how changes I'm making are changing things. We can almost think of this as like the documentation of the system rather than examples. It may make sense for us to split this down into subsections for typography, colour, space, I don't know, whatever else.

#### 2. Typography Examples

This section should be all about showing off examples of the various typographic features that we have. This is pretty much everything that we currently have in _Typography.astro already, Though I would like to rejig how we're grouping and displaying these things So that we can include a little bit more explanation about these and how they work for some of them. in a lot of cases for like the inline typography stuff it might actually make sense for us to be making better use of tables like:

| Element | Example | Renders | Notes |
| ------- | ------- | ------- | ----- |
| Strike  | `<del>this is deleted</del>` | <del>this is deleted</del> | Any interesting or notable features of this |

But we will also need to include some kind of composite examples, if you will, where we can see a bunch of these different elements in a more like real life examples.

I'm conscious that this section is likely to also be a mixture of "simple" elements which are just showing off the CSS applied to regular HTML elements and also sore "complex" elements which are actually more like components (eg SmartLink or NotionLink). And depending on how this falls out, we'll need to decide how we want to go about organizing or splitting this the more I think about it it doesn't really feel like we should arbitrarily split this based on "native HTML element" or not, because if we did that we'd end up with things like links and blokquotes being in both? Because in parsed markdown content links are replaced by SmartLinks and the like. I think how we want to split all of this stuff up in this entire document is probably worth a little bit of thought here.

#### 3. Content Components

These are basically the components which are intended for use in content on this site. For these I would like each one to have its own little thing which should include an explanation of what it is and perhaps a little about how it works one or more examples of it potentially in different contexts. Each example should probably include a code block showing what I'd type into an MDX/MD doc and then the rendered example. for components with a more complex set of props or expectations about what goes inside of them, We should also include a table of the props. Basically we should treat a lot of these like we would expect to for a proper component library documentation. We will also want to mention or mark any which automatically replace standard markdown or support special markdown syntax (eg fenced code blocks, smartlinks, filetree, markdownpreview etc).

I think we're probably gonna have to think a little bit about how best we want to split down these content components into subsections. Or maybe even group them together in their own like sub pages or something?

Maybe one way to think about the difference between (3) and (2) is that content components require some kind of intentional action from the user either by writing MDX like a JSX component or by using special markdown syntax or whatever whereas the typography stuff is just like standard markdown that's enriched but then even then I don't think that's necessarily great.

#### 4. UI Components

Much like we currently have UI components are effectively components that we are only ever likeley to use when *coding* rather than writing. These should probably follow a very similar pattern to to above. and the current section on this is pretty good, I think, given we make similar changes to above, except that the CotentCard components could easily end up getting used in actual content? (and maybe even full NoteCards embedded in articles?) So perhaps they really ought to be in (3)?

#### The Other Stuff???

And we currently have some other sections to the style guide Which I think we need to give a bit of thought to about where we want to put these or what we wanna do with them:

- OtherStuff just contains footnotes at present. And this is a weird one because we need to show off like a whole little demo of the footnotes here. Including the inline footnote marker (Which could belong in typography), the toggleable inline footnote display (Which while it isn't a content component by my definition above, you could imagine potentially including there) and the actual block of footnotes at the end of a doc (Which you could even argue is more like a UI component). Except we need to show all of this together. Or it's not a useful reference. So I'm wondering actually if footnote should just be their own thing entirely.
- UtilityClasses should probably just be part of the like introduction to the design system maybe or maybe in typography or something or part of the design tokens I I don't really know because these utility classes do different things But it does make sense to keep them together.
- The HTMLElements section is actually quite an important part of the style guide because it shows how HTML elements are rendered under the default styles here. Now it's a little bit weird at the moment because we've obviously already covered a lot of these in, you know, typography and various other sections above, right? So at the moment this section essentially contains *only the HTML elements which haven't already been mentioned but which might end up being used on this site, either as embedded HTML in MD/MDX content or as plain HTML in Astro pages markup*. I can't help but feel like it may make more sense for us to include these kinds of things actually in the relevant sections above. ie include the native video/audio elements alongside the other embedded media stuff, or details alongside the acordian component or whatever? Note that while most of these aren't actually used currently on the site, it is important that we include this stuff in the style guide because these things are styled with CSS. In some cases they're styled with CSS to provide good defaults when they are used within some of our Astro components. In other cases we're styling them simply so that we have a good baseline if they are used in the future. And it's important for me to be able to look at this and and see that right. There may of course be a bunch of HTML elements which we ought to be including in here, which aren't currently in the style guide.

### Other Points to Note

- You'll see that many examples are wrapped in a `<ResizableContainer>`. This is important because it makes it easy to see how the thing responds to being inside different-sized containers.
- Most examples are also wrapped inside a `<SGTypographySwitcher>` which allows me to toggle between the four typographic contexts in which components might be shown:
  - Default - Nothing special
  - Default Flow - Nothing special but the container has the `flow` class which adds vertical rhythm and spacing.
  - Long Form Prose - Is inside a LongFormProseTypography container, as used in articles and the like.
  - UI - Has `ui-style` applied, ie most styles and spacing are stripped etc.
  - UI Flow - As above but the container has `flow` applied. We may actually be able to get rid of this one.
- The style guide code was thrown together pretty quickly by AI and most of the content written by AI. So it doesn't necessarily follow sense of idiomatic Astro practices. I would imagine that it might actually make a a bit of sense for us to lean on Astro's page based routing as we split this down. We could even consider using a content collection. But I think I'd rather not do that Because it feels like massive overcomplication.
- The style guide entry is currently written in HTML/Astro, except where we need a markdown snipped to actually process and produce markdup. I'm open to retaining this, but I'm also open to potentially writing more of this stuff in Markdown or MDX. But I am conscious that probably does add complexity where it likely isn't worth it.
- some of the pages currently make fairly extensive use of JavaScript objects to store data and then map over those. in some cases, I guess that maybe makes sense, but I think in a lot of cases the savings in terms of like repetition of similar code are outweighed by the added complexity of of the Astro code which actually does this. Might be better to just handwrite that as HTML. But I don't know, like that one once thinking about again this is a result of this being built by AI ages ago.
- I am certainly gonna want to write a lot of the content here by hand and probably tweak a lot of the example code and stuff as well. And I'm certainly gonna want to have read over and tweaked all of this by hand. But I'd like us to work out what we need to do to put ourselves in a position where this is gonna be easier for me.
- It's obviously inevitable that we're gonna have some specific CSS and HTML and all the rest pertaining to these style guide pages, but wherever possible I would like to keep that stuff to a minimum and lean on the kind of default styling that we have available to us. so long as the style guide still serves its purpose, of course, but the main thing here really is that or possible I'd like to try and keep stuff related to the style guide co-located with the style guide pages. Now there's obviously some exceptions to that. but effectively I don't want to be scattering stuff that's only used in this style guide stuff all over the rest of the Astro site if we can help it.
- the current layout of the style guide page doesn't work very well on mobile because it's a two column layout no matter how narrow the viewport is down to the table of contents and it would obviously be good if this rendered fine on mobile. Also, whenever I look at this page on my phone, my phone gets quite hot. I assume that's because it's one enormous page that has loads and loads and loads of ResizableContainer and SGTypographySwitchers on it So it probably ends up registering millions of event listeners in the JavaScript. Might be a slightly more efficient way for us to handle that stuff. that's a minor nitpick though, but might be worth can be worth considering when we think about how we want to architect this all.
