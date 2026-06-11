# Task: Tabs component improvements

Make the shared `Tabs`/`TabItem` components (`src/components/mdx/`) server-render their tab buttons at build time and shrink the runtime to a tiny delegated state-toggler — **without changing the `<TabItem label="…">` authoring API or the accessibility guarantees**. Split out of the styleguide rework ([task-1-styleguide-rework.md](./task-1-styleguide-rework.md)), where the JS-heavy switcher (which builds every button in the browser) contributed to mobile heat.

## Context

`Tabs` follows the WAI-ARIA Tabs pattern. It stays JavaScript-enhanced — not a CSS-only `:checked` radio approach — because:

- **ARIA tab semantics need dynamic attributes CSS can't set** — `aria-selected` must update as you switch; CSS cannot set/change ARIA state. A radio-based version is announced as a radio group, not tabs.
- **The tabs keyboard contract** — roving `tabindex` (only the active tab is in the tab order; `Tab` exits to the panel) plus `←/→/Home/End`. A radio group can't replicate this with tab semantics.

The decision after research: **real ARIA tabs require JavaScript** (consensus: WAI-ARIA APG, Scott O'Hara, Heydon Pickering — and you must *not* bolt `role="tab"` onto a CSS-only radio hack). The zero-JS `<details name>` exclusive accordion is the only modern no-JS primitive, but it's an accordion, not tabs — out of scope here because we want real tabs usable in article/note content in the future.

So the win isn't "less semantics" — it's **moving the work that's currently done in the browser to build time.** The buttons ship in the static HTML; the browser only toggles state.

### Current implementation (what to change)

`src/components/mdx/Tabs.astro` ships an empty `.tabs-list` and, at runtime, `TabsController`:

- builds a `<button>` per `TabItem` (`createElement` + ~8 `setAttribute`s + `appendChild`),
- calls `crypto.randomUUID()` per panel for IDs,
- attaches `click` + `keydown` listeners **per button** (`2 × panels` per instance),
- manages `aria-selected` / `hidden` / roving `tabindex`,
- re-runs on `astro:page-load` (View Transitions).

Without JS the buttons never exist (they're built client-side), so no-JS users only ever see the stacked-panel fallback — the `role="tab"` controls are not real HTML-first progressive enhancement today.

### Blast radius

`Tabs`/`TabItem` are exported as content components but **currently only the styleguide uses them** (`SGTypographySwitcher`, `_DesignTokens.astro`) — nothing in articles/notes yet. Both call sites map an array *into* `<TabItem>`s, which is unaffected. Low risk today, and the future intent is real use in article/note content, so the `<TabItem label>` authoring API and a11y must stay intact.

## Approach: server-render the buttons (HTML-first PE)

This is the [Starlight `<Tabs>`](https://github.com/withastro/starlight) pattern, which keeps the exact slot-based authoring API. The key realisation: `Astro.slots.render('default')` renders the slot **fully** — every markdown, MDX expression, code block and `.astro` component inside a `<TabItem>` has already become final HTML before we ever look at it. So we parse the *rendered output*, never the author's source, and component content inside a `TabItem` keeps working exactly as it does outside one.

### Authoring API (unchanged)

```mdx
<Tabs>
  <TabItem label="bun">
    ```sh
    bun add the-thing
    ```
    Full **markdown**, code, images, and `.astro` components all work in here.
  </TabItem>
  <TabItem label="npm">…</TabItem>
</Tabs>
```

### Build time

1. `Tabs.astro` calls `await Astro.slots.render('default')` → HTML string of all panels.
2. A small rehype processor (`src/lib/tabs/process-panels.ts`, mirroring `src/lib/file-tree/parse-tree.ts`) parses that fragment, and for each panel wrapper (identified by the `data-tab-label` attribute `TabItem` already emits):
   - reads its `label`,
   - assigns a build-time, counter-based `id` (`tab-N` / `tab-panel-N` — no `crypto.randomUUID()`),
   - sets `role="tabpanel"`, `id`, `aria-labelledby`, `hidden` (on all but the first), `tabindex="0"` (on the first),
   - **keeps `data-tab-label`** (the no-JS `::before` label fallback relies on it),
   - returns `SKIP` so it does not descend into a panel's children (nested `<Tabs>` are already processed by their own render pass).
3. `Tabs.astro` renders the real `<button role="tab">`s from the returned panel metadata (first is `aria-selected="true"`, `tabindex="0"`; rest `aria-selected="false"`, `tabindex="-1"`) and outputs the processed panel HTML via `set:html`.

Result: fully-wired tabs in the static HTML. Nothing is constructed in the browser.

### Runtime (tiny, delegated)

A single pair of **document-level** delegated listeners (attached once), replacing the per-button listeners and the `TabsController` DOM construction:

- `click` → resolve `event.target.closest('[role="tab"]')`, activate it.
- `keydown` → same resolution, handle `←/→/Home/End` (roving), activate + focus the target tab.
- `activate(list, tab)` reads state from the DOM: toggles `aria-selected` + roving `tabindex` across the tablist's tabs, and toggles `hidden` + `tabindex` across the matching panels (matched via the tab's `aria-controls`).
- `initTabs()` only adds `.tabs-initialized` to each `[data-tabs]` (and re-runs on `astro:page-load` for View Transitions). No per-panel work.

### CSS / progressive enhancement (improved)

- No-JS now degrades from real HTML: the `<button>`s exist but are inert, so hide the tablist with `.tabs:not(.tabs-initialized) .tabs-list { display: none; }`.
- Keep the existing stacked-panel fallback (`:not(.tabs-initialized)` + `::before` labels from `data-tab-label`), and un-hide the SSR'd `hidden` panels for no-JS: `.tabs:not(.tabs-initialized) .tabs-panels [role="tabpanel"][hidden] { display: block; }`.
- With JS, `.tabs-initialized` reveals the tablist and the native `hidden` collapses inactive panels — no per-element JS needed to set initial visibility.

### TabItem

Stays essentially as-is — a wrapper carrying `data-tab-label={label}` plus the slot. ARIA (`role`, `id`, `aria-labelledby`, `hidden`, `tabindex`) is now owned by the build-time processor, so it can be dropped from `TabItem` itself.

## Tests

- **Unit** (`tests/unit/`, mirroring `file-tree-parser.test.ts`): `process-panels.ts` — two panels produce two wired panels with unique `tab-N`/`tab-panel-N` ids, `aria-labelledby` linking, `hidden` on all but the first, `data-tab-label` preserved; nested `<Tabs>` HTML is not double-processed; an `<astro-island>` (hydrated framework island) string round-trips intact (the one content case worth proving). This covers the regression-prone part — the build-time wiring.
- **No E2E for now.** The runtime is simple delegated DOM toggling, and the only consumer today is the styleguide — which is image-heavy (flaky to drive) and itself being reworked in task-1. An interaction test belongs against a stable page; add one when tabs land in real article/note content.

## Acceptance

- `Tabs`/`TabItem` public API unchanged; existing styleguide usages render identically; markdown/MDX/`.astro` components inside `TabItem` work exactly as outside.
- Buttons are server-rendered in the static HTML; no runtime DOM construction and no `crypto.randomUUID()`.
- Listener count per page reduced to a small constant (document-level delegation), not `2 × panels` per switcher.
- Accessibility unchanged: ARIA roles/states, roving `tabindex`, `←/→/Home/End`, and the no-JS stacked fallback all still work — and the no-JS path is now real HTML-first PE.
- `bun run check:all` passes.
