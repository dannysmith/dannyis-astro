import { describe, it, expect } from 'vitest';
import { processPanels, type Panel } from '../../src/lib/tabs/process-panels';

/** A panel wrapper as `TabItem.astro` renders it, with arbitrary inner HTML. */
function panel(label: string, inner: string): string {
  return `<div data-tab-label="${label}">${inner}</div>`;
}

describe('processPanels', () => {
  it('wires two panels with linked, unique ids and hides all but the first', () => {
    const { html, panels } = processPanels(panel('bun', '<p>one</p>') + panel('npm', '<p>two</p>'));

    expect(panels).toHaveLength(2);
    const [first, second] = panels as [Panel, Panel];

    // Ids are unique and cross-linked (button <-> panel).
    expect(first.tabId).not.toBe(second.tabId);
    expect(first.panelId).not.toBe(second.panelId);
    expect(first.label).toBe('bun');
    expect(second.label).toBe('npm');

    // Panel ARIA serialised correctly.
    expect(html).toContain(`id="${first.panelId}"`);
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain(`aria-labelledby="${first.tabId}"`);
    expect(html).toContain(`aria-labelledby="${second.tabId}"`);

    // First active (tabindex, not hidden); second starts hidden.
    expect(html).toMatch(new RegExp(`id="${first.panelId}"[^>]*tabindex="0"`));
    expect(html).toMatch(new RegExp(`id="${second.panelId}"[^>]*hidden`));
    expect(html).not.toMatch(new RegExp(`id="${first.panelId}"[^>]*hidden`));

    // Inner content preserved; label kept for the no-JS fallback.
    expect(html).toContain('<p>one</p>');
    expect(html).toContain('<p>two</p>');
    expect(html).toContain('data-tab-label="bun"');
  });

  it('does not double-process an already-wired nested panel', () => {
    // A panel whose content contains a nested <Tabs> that already ran: its
    // inner panel keeps its own data-tab-label, but the OUTER pass must not
    // re-wire it (SKIP stops descent).
    const nested = panel(
      'outer',
      `<div class="tabs"><div data-tab-label="inner" role="tabpanel" id="tab-panel-99"><p>deep</p></div></div>`
    );
    const { html, panels } = processPanels(nested);

    // Only the outer panel is collected by this pass.
    expect(panels).toHaveLength(1);
    expect(panels[0]?.label).toBe('outer');
    // The pre-existing nested id is left untouched.
    expect(html).toContain('id="tab-panel-99"');
  });

  it('round-trips a hydrated framework island intact', () => {
    const island =
      '<astro-island uid="abc" component-url="/x.js" props=\'{"n":1}\'><button>hi</button></astro-island>';
    const { html } = processPanels(panel('demo', island));

    expect(html).toContain('<astro-island');
    expect(html).toContain('uid="abc"');
    expect(html).toContain('component-url="/x.js"');
    expect(html).toContain('<button>hi</button>');
  });
});
