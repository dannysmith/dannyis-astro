# Task: Upgrade `@astrojs/mdx` to v6 and migrate to the unified Markdown processor

## Background

Astro 6.4 deprecated the top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` config options. On every build we get this one-time warning:

```
[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` directly instead.
```

The recommended replacement is `markdown.processor: unified({ remarkPlugins, rehypePlugins })` from `@astrojs/markdown-remark`.

**This warning is cosmetic.** The legacy API still works. The only reason to do this task is to clear the warning and stay current — there's no functional regression today.

## Why this is its own task (the trap)

A first attempt simply moved the plugins into `markdown.processor: unified({...})`. It cleared the warning but **silently broke every MDX file** — articles, notes, and the new `Page.astro`-based pages. Reading-time, the `file-tree` and `markdown-preview` block transforms, list-density, and Expressive Code all stopped running on MDX content. (The styleguide kept working only because it uses those features as real `<FileTree>` / component tags, which don't depend on the remark transforms.)

**Root cause:** the installed `@astrojs/mdx@5.0.6` builds its own plugin pipeline by reading **only** the legacy `markdown.remarkPlugins` / `markdown.rehypePlugins` arrays (see `markdownConfigToMdxOptions` in `node_modules/@astrojs/mdx/dist/index.js`). It has no awareness of `markdown.processor`. Since essentially all our content is MDX, moving plugins into the processor left MDX with an empty plugin list.

The "MDX extends `markdown.processor` automatically" behavior described in the current Astro docs only exists in **`@astrojs/mdx` v6**. We are a major version behind (v5.0.6; latest is v6.x), which predates the processor API. So the migration **cannot** be done without first upgrading the MDX integration.

The attempt was rolled back; `main` is back to the known-good legacy config.

## Scope

1. **Upgrade `@astrojs/mdx` v5 → v6** (major version bump — the risky part).
2. **Migrate `astro.config.mjs`** to `markdown.processor: unified({...})` once MDX v6 honors it.
3. **Upgrade `astro-expressive-code` 0.42.0 → 0.43.1+** so it registers with the unified processor instead of the legacy `markdown.rehypePlugins` API.

## Detail

### 1. `@astrojs/mdx` v5 → v6

This is a major bump and the source of any real risk. Before touching config:

- Read the [`@astrojs/mdx` CHANGELOG](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/CHANGELOG.md) for the v6.0.0 breaking changes and migrate accordingly.
- Confirm peer-dependency alignment with Astro 6.4.x.
- Re-run the full build and watch for behavior changes in: the auto-import plugin (`astro-auto-import` + `AutoImport`), `MDX_COMPONENT_REMAPPING`, and our custom remark plugins in `src/lib/`.

### 2. Migrate `astro.config.mjs` to `markdown.processor`

Once on MDX v6, replace the legacy arrays:

```js
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';

// ...
markdown: {
  // syntaxHighlight stays at the markdown level — `unified()` does not accept it.
  // The processor passes it through untouched via `...shared`.
  syntaxHighlight: {
    type: 'shiki',
    excludeLangs: ['mermaid'],
  },
  processor: unified({
    remarkPlugins: [
      remarkReadingTime,
      remarkFootnoteDetector,
      remarkMarkdownPreview,
      remarkTreeBlock,
      remarkPageComponents,
    ],
    rehypePlugins: [
      rehypeHeadingIds,
      rehypeAutolinkHeadings,
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      [rehypeMermaid, { mermaidConfig }],
      rehypeListDensity,
    ],
  }),
},
```

Notes confirmed during the failed attempt:

- `unified()`'s accepted options are only `remarkPlugins`, `rehypePlugins`, `remarkRehype`, `gfm`, `smartypants` (see `node_modules/@astrojs/markdown-remark/dist/processor.d.ts`). `syntaxHighlight` and `shikiConfig` are **not** accepted there and must stay at the `markdown` level.
- Astro's `coerceLegacyMarkdownPlugins` shim appends any integration-registered legacy rehype plugins (e.g. Expressive Code) **after** the processor's own, preserving plugin order. Verify order is still correct after the upgrade regardless.
- MDX v6 also accepts `processor` (and `extendMarkdownConfig`) on the `mdx({...})` integration itself if `.mdx` ever needs a different pipeline from `.md`. We don't need that today — default extension should be fine — but it's the escape hatch.

### 3. `astro-expressive-code` → 0.43.1+

- 0.43.1 changelog: *"Avoids Astro 6.4 deprecation warnings by registering Expressive Code with the Unified Markdown processor when available."* Without this bump, EC keeps pushing its plugin through the legacy `markdown.rehypePlugins` API and the warning persists even after step 2.
- `bun add astro-expressive-code@^0.43.1`.
- Expressive Code controls all code-block rendering, so this needs a visual pass (see verification).

## Verification (do not skip the visual checks)

`bun run check:all` passes but does **not** catch the MDX breakage — the failure was silent. Confirm by eye on a running dev server, in **both light and dark themes**:

- [ ] No `markdown.*Plugins ... deprecated` warning in the build/dev output.
- [ ] Code blocks render with Expressive Code styling + syntax highlighting (in an **article/note**, not just the styleguide).
- [ ] A ` ```tree ` block renders as a FileTree in an article.
- [ ] A ` ```md preview ` block renders as a markdown block in an article.
- [ ] Reading time shows on an article.
- [ ] List-density styling applies.
- [ ] Mermaid diagrams still render (and are still excluded from Shiki via `excludeLangs`).
- [ ] Footnotes still detected (`remarkFootnoteDetector`).
- [ ] `Page.astro` MDX pages (now/ai/privacy/colophon) still get `MDX_COMPONENT_REMAPPING` via `remarkPageComponents`.
- [ ] `bun run check:all` green.

## Out of scope

- Any rewrite of the custom remark plugins in `src/lib/`. They should work unchanged once MDX reads the processor.
- Touching `markdown.syntaxHighlight` / Shiki config beyond leaving it where it is.

## Reference

- Astro Markdown docs — the unified processor + MDX extension: <https://docs.astro.build/en/guides/markdown-content/>
- Astro MDX integration docs: <https://docs.astro.build/en/guides/integrations-guide/mdx/>
- Relevant local files: `astro.config.mjs`, `src/lib/remark-*.mjs`, `src/lib/rehype-list-density.mjs`, `src/config/mdx-components.ts`.
