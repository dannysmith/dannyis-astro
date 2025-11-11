# Chrome DevTools MCP Guide

## Overview

Gives AI agents control of a live Chrome browser for closed-loop development: generate code → test visually → iterate on real browser data.

**Capabilities:**
- Inspect DOM and CSS in real-time
- Take screenshots and analyze visual changes
- Record performance traces
- Monitor console messages and network requests
- Emulate devices for responsive testing

## When to Use

- CSS debugging (layout, overflow, alignment)
- Visual verification of design changes
- Performance analysis
- Responsive testing across viewports
- Console error investigation

## Workflow Patterns

### Visual Verification
When making CSS changes:
1. Apply code changes
2. Navigate to dev server (must be running)
3. Take screenshot to verify
4. Inspect computed styles to confirm

Example:
```
"Update hero section to 48px font-size and #1e90ff color.
Navigate to localhost:4321, screenshot it, and verify computed styles."
```

### Closed-Loop Iteration
Make one change → verify in browser → analyze result → iterate. Don't accumulate blind changes.

### DOM Inspection
For complex layout issues: inspect computed styles and DOM structure to identify specificity conflicts or cascade behavior.

### Performance
Record trace during page load → analyze main thread and network timing → get specific suggestions → measure impact.

### Security
Runs isolated browser by default (temp profile, auto-cleared). Don't navigate to pages with sensitive data during agent sessions.

## Example Requests

**Visual design iteration:**
```
"Update the nav bar. Navigate to localhost:4321, screenshot it, then help
adjust spacing. Screenshot after each change."
```

**Responsive testing:**
```
"Emulate iPhone 14 and check if article layout breaks. Screenshot mobile,
tablet, and desktop widths."
```

**CSS specificity debugging:**
```
"Button hover state isn't working. Navigate to /buttons, inspect computed
styles on .btn-primary, identify what's overriding."
```

**Console monitoring:**
```
"Navigate to localhost:4321/articles and check console for errors or warnings."
```

## Project-Specific Notes

- Dev server: `localhost:4321`
- Focus areas: typography, spacing, visual hierarchy
- Test both themes (inspect CSS custom properties)
- Verify zero-JS (check network tab)
- Screenshot comparisons against design refs

## OpenAI Codex Setup

Edit `~/.codex/config.toml`:

```toml
[[mcp.servers]]
name = "chrome-devtools"
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest"]
```

Or via CLI:
```bash
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

Restart Codex after adding.
