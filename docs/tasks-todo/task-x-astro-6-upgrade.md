# Upgrade to Astro 6

## Overview

Upgrade from Astro 5 to Astro 6, addressing breaking changes, updating dependencies, and enabling new features. Astro 6 brings Vite 7, Zod 4, Shiki 4, a built-in Fonts API, stable CSP, and an experimental Rust compiler.

Reference: https://docs.astro.build/en/guides/upgrade-to/v6/

## Phase 1: Core Upgrade

Run the automated upgrade and fix breaking changes.

### 1a. Run the upgrade tool

```bash
npx @astrojs/upgrade
```

This handles Astro itself plus official integrations (`@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/react`, `@astrojs/check`, `@astrojs/markdown-remark`).

### 1b. Fix `z` import in content config

`z` from `astro:content` is deprecated. Update `src/content.config.ts`:

```ts
// Before
import { defineCollection, z } from 'astro:content';

// After
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
```

### 1c. Handle Zod 4 deprecations in schemas

`z.string().url()` is deprecated in Zod 4 — should become `z.url()`. Three places in `src/content.config.ts`:

- `redirectURL: z.string().url().optional()` → `z.url().optional()`
- `sourceURL: z.string().url().optional()` → `z.url().optional()`
- `url: z.string().url()` → `z.url()`

Check if `z.url()` returns a `ZodURL` type rather than `ZodString` — if this causes downstream type issues, keep the deprecated form for now (it still works, just warns).

### 1d. Remove experimental flags from `astro.config.mjs`

These are now stable or the default behaviour:

```js
// Remove from experimental block:
experimental: {
  headingIdCompat: true,  // Now the default
  csp: false,             // Moved to security.csp
  svgo: true,             // Check if stabilized
}
```

Also remove the `headingIdCompat` option from the rehype plugin:

```js
// Before
[rehypeHeadingIds, { headingIdCompat: true }],
// After
rehypeHeadingIds,
// (or remove entirely if Astro handles it by default now)
```

### 1e. Remove standalone Zod dependency

`devDependencies` has `"zod": "^4.1.12"`. Since Astro 6 ships Zod 4 via `astro/zod`, check whether anything imports from `zod` directly. If not, remove it and import from `astro/zod` everywhere.

### 1f. Check third-party integrations

These need to be compatible with Astro 6 / Vite 7:

- `astro-expressive-code` — check for Astro 6 / Shiki 4 compatible version
- `astro-icon` — check compatibility
- `astro-embed` — check compatibility
- `@astropub/icons` — check compatibility

### 1g. Verify

```bash
bun run build
bun run check:all
```

Visually inspect:
- Both light and dark themes
- Responsive images (implementation changed from inline styles to `data-*` attributes)
- Heading anchor links (trailing hyphen behaviour changed)
- Code blocks (Shiki 4 upgrade)

## Phase 2: Vitest Compatibility

The project currently uses `vitest: "^4.0.12"` which should meet Astro 6's requirement (v3.2+ or v4.1+). However, there's a breaking change around client environments.

### 2a. Check vitest environment config

`vitest.config.ts` uses `environment: 'happy-dom'`. Astro 6 forbids rendering Astro components in client environments like `happy-dom`. We don't currently use the Container API in tests, so this probably isn't an issue — but verify after the upgrade.

If any tests fail with environment-related errors, either:
- Switch specific test files to `environment: 'node'` via `// @vitest-environment node` comments
- Or change the global default if none of our tests need DOM APIs

### 2b. Run tests

```bash
bun run test:unit
bun run test:e2e
```

Fix any failures.

## Phase 3: Content Security Policy

Astro 6 stabilizes CSP. Currently set to `experimental.csp: false`.

### 3a. Enable basic CSP

```js
export default defineConfig({
  security: {
    csp: true,
  },
});
```

This auto-hashes all scripts and styles in pages and generates appropriate CSP headers.

### 3b. Test thoroughly

CSP can break things silently (blocked resources, inline styles). Check:

- All pages render correctly
- Expressive Code blocks work (they inject styles)
- Any inline styles/scripts aren't blocked
- External resources (fonts, images) still load
- Mermaid diagrams (rendered as inline SVG)

### 3c. Add custom directives if needed

If the basic config blocks legitimate resources, configure specific directives:

```js
security: {
  csp: {
    directives: [
      "default-src 'self'",
      "img-src 'self' data:",
      // Add others as needed
    ],
  },
},
```

### 3d. Verify in production

CSP can behave differently in dev vs production. Deploy a preview and check browser console for CSP violations.

## Phase 4: Experimental Rust Compiler

The new Rust compiler replaces the Go-based `.astro` compiler. Faster, better diagnostics.

### 4a. Install and enable

```bash
bun add @astrojs/compiler-rs
```

```js
export default defineConfig({
  experimental: {
    rustCompiler: true,
  },
});
```

### 4b. Test

```bash
bun run build
bun run check:all
```

Compare build output and timing against the Go compiler. If anything breaks, disable and file an issue — it's experimental.

## Out of Scope (Future Consideration)

- **Built-in Fonts API** — could replace `@fontsource-variable/fira-code` and self-hosted font loading, but font selection is a separate task (`task-x-typography-font-selection.md`). Revisit once fonts are finalised.
- **Live Content Collections** — not needed, content is all local markdown.
- **Queued Rendering** — experimental, wait for it to mature.
- **Route Caching** — static site, not applicable.
