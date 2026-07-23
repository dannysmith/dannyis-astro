# View Transitions

The site uses two flavours of the View Transitions API:

1. **Cross-document (navigation) transitions** — morphs between pages as you navigate. Zero-JS.
2. **Same-page (state) transitions** — morphs when a page rearranges itself in place. A little JS.

This is a statically generated MPA site: there is **no `ClientRouter`** and every navigation is a full page load. The cross-document transitions are pure CSS; nothing re-initialises across a "swap" because there is no swap.

CSS lives in [`src/styles/_view-transitions.css`](../../src/styles/_view-transitions.css).

---

## Cross-document (navigation) transitions

The whole site opts in with one rule:

```css
@view-transition {
  navigation: auto;
}
```

On every same-origin navigation the browser cross-fades the two pages, and **morphs any element on the outgoing page whose `view-transition-name` matches an element on the incoming page**. Browsers without support (Firefox today) just navigate instantly.

### The pattern

A morphable element declares the name via a variable in its scoped CSS:

```css
.card-title {
  view-transition-name: var(--vt-name, none);
}
```

…and whoever renders it sets the variable inline, from the entry id:

```astro
<h3 class="card-title" style={`--vt-name: article-title-${item.id}`}>
```

Omitting the variable leaves the element inert (`none`). An element that morphs **two** parts uses a second variable, `--vt-cover`, the same way (see `ArticleCard` → the article hero image).

### Naming convention

- `<type>-<id>` for a whole-element morph — e.g. `note-<id>`.
- `<type>-<facet>-<id>` when one element morphs several parts — e.g. `article-title-<id>`, `article-cover-<id>`.

The two ends of a morph must use the **same** name: the card and the detail page both emit `note-<id>` / `article-title-<id>`.

### Invariant: names are unique per rendered page

A `view-transition-name` must be unique among the elements actually rendered on a page. If two elements share one (e.g. the same article rendered as a card twice), the browser **skips that navigation's transition** — a benign no-op, never a crash, and only for that name/navigation.

In practice listing pages render each entry once, so this holds. If a page ever needs the same card twice, suppress the name on the non-canonical copy — because the name is opt-in (`var(--vt-name, none)`), that just means not setting `--vt-name` on it. Add a real `morph={false}`-style prop only if a genuine page needs one; don't build it speculatively.

### What morphs today

| Morph | From | To | Name |
| --- | --- | --- | --- |
| Note (whole card) | full `NoteCard` on `/notes`, compact `CompactNoteCard` anywhere | standalone note page | `note-<id>` |
| Article title | `HomepageLatestArticles`, `/writing` list, full `ArticleCard` | article `<h1>` | `article-title-<id>` |
| Article cover | full `ArticleCard` cover image | article hero image | `article-cover-<id>` |
| Footer | any page | any page | `site-footer` (stays stable) |

Article title morphs also work list-to-list — e.g. homepage → `/writing`, because the titles share names and appear in the same order.

**Ownership:** the card/element owns its own name, derived from `item.id`. Don't set `--vt-name` on an ancestor wrapper.

**Suppression:** externally-published articles (those with a `redirectURL`) don't emit names — the page redirects off-site, so the morph would only flash. See `ArticleCard.astro` / `Article.astro`.

### Timing and reduced motion

One knob tunes everything (morphs and the root cross-fade):

```css
:root {
  --vt-duration: 200ms;
  --vt-easing: ease-in-out;
}
```

Every group and cross-fade reads these. To give one type its own timing, add a `view-transition-class` to those elements and override `::view-transition-group(.that-class)`.

Reduced motion is handled in `_view-transitions.css`: the global `*` reset in `_reset.css` can't reach the `::view-transition-*` pseudo-elements, so they're disabled explicitly under `prefers-reduced-motion: reduce` — navigation still happens, as an instant cut.

### Adding a new one

1. Give the source element `view-transition-name: var(--vt-name, none)` in its scoped CSS and set `--vt-name: <type>-<id>` inline.
2. Give the matching element on the destination the same name.
3. Keep names unique per page.

---

## Same-page (state) transitions

Used on `/toolbox`, where the category filter is pure-CSS (radio `:checked` + `:has()`). The filtering works with no JS; a small progressive enhancement wraps the state change in a transition so the cards animate between filter states:

```js
document.startViewTransition(() => {
  input.checked = true
})
```

Each card carries `view-transition-name: tool-<id>`, so cards that survive a filter change morph to their new position while others fade. It's guarded by feature detection and `prefers-reduced-motion`, and falls back to the instant CSS-only behaviour. See [`src/pages/toolbox.astro`](../../src/pages/toolbox.astro).

This is the place to document any future in-page or bespoke transitions.
