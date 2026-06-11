/**
 * Build-time processor for the `<Tabs>` component.
 *
 * Takes the already-rendered HTML of a `<Tabs>` default slot (every panel's
 * markdown / MDX / `.astro` component content has already become final HTML
 * by this point) and:
 *
 * - finds each panel wrapper by the `data-tab-label` attribute `TabItem` emits,
 * - reads its label,
 * - assigns a counter-based id (`tab-N` / `tab-panel-N`) — no `crypto.randomUUID()`,
 * - wires the WAI-ARIA Tabs roles/state onto the panel (`role`, `id`,
 *   `aria-labelledby`, `hidden` on all but the first, `tabindex` on the first),
 * - keeps `data-tab-label` (the no-JS `::before` label fallback relies on it),
 * - returns `SKIP` so a panel's children are not descended into, leaving any
 *   nested `<Tabs>` (already processed by its own render pass) untouched.
 *
 * `Tabs.astro` renders the real `<button role="tab">`s from the returned
 * `panels` metadata, so the buttons ship in the static HTML and the browser
 * only toggles state.
 */
import type { Element, Root } from 'hast';
import { rehype } from 'rehype';
import { SKIP, visit } from 'unist-util-visit';

export interface Panel {
  /** Visible tab label, read from `data-tab-label`. */
  label: string;
  /** `id` of the `<button role="tab">`; the panel's `aria-labelledby`. */
  tabId: string;
  /** `id` of the panel; the button's `aria-controls`. */
  panelId: string;
}

/**
 * Monotonic across the whole build so ids are unique on any page that has
 * more than one `<Tabs>`. Ids only need to be unique within a page; a shared
 * counter guarantees that without coordination between instances.
 */
let counter = 0;

export function processPanels(html: string): { html: string; panels: Panel[] } {
  const panels: Panel[] = [];

  const file = rehype()
    .data('settings', { fragment: true })
    .use(() => (tree: Root) => {
      visit(tree, 'element', (node: Element) => {
        const props = node.properties;
        if (!props || props.dataTabLabel == null) return;

        const label = String(props.dataTabLabel);
        const n = ++counter;
        const tabId = `tab-${n}`;
        const panelId = `tab-panel-${n}`;
        const isFirst = panels.length === 0;

        props.role = 'tabpanel';
        props.id = panelId;
        props.ariaLabelledby = tabId;
        // First panel is the active one; the rest start hidden. The no-JS CSS
        // fallback un-hides them, and the runtime collapses them once enhanced.
        if (isFirst) {
          props.tabIndex = 0;
        } else {
          props.hidden = true;
        }

        panels.push({ label, tabId, panelId });

        // Don't descend: a nested <Tabs> inside this panel was already wired
        // by its own render pass.
        return SKIP;
      });
    })
    .processSync(html);

  return { html: String(file), panels };
}
