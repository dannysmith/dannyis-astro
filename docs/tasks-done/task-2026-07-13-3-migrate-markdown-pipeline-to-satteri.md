# Task 3–5 (consolidated): Migrate the Markdown Pipeline to Sätteri

> Consolidated historical record of the three tasks that moved the site from the `unified()` (remark/rehype) pipeline to [Sätteri](https://satteri.bruits.org/), Astro's native Rust-based Markdown/MDX processor. Follows the Astro 7 upgrade (task-2 doc) and the earlier spike that proved the load-bearing unknowns (ESM injection into MDX, frontmatter write round-trip). Full detail lives in git history; issue #132 has the original analysis.

## What was done

- `markdown.processor` flipped from `unified()` to `satteri()`. The `astro-auto-import` integration, `rehypeHeadingIds`, all remark/rehype plugin registrations, and the vite `rollupOptions.external` workaround were removed.
- Every plugin was rewritten as a Sätteri plugin in `src/lib/satteri-*.mjs`, each with a unit suite in `tests/unit/` driving the real compile API (`markdownToHtml` / `mdxToJs`). Shared test helpers live in `tests/unit/satteri-helpers.ts`. The final plugin set and its ordering are documented in `astro.config.mjs` and `docs/developer/content-system.md`.
- The old unified plugins and their tests were deleted once all ports were verified, along with the deps: `astro-auto-import`, `rehype-autolink-headings`, `rehype-external-links`, `rehype-mermaid`, `@astrojs/markdown-remark` (direct dep only — `@astrojs/mdx` still carries it transitively), `mermaid`, `mdast-util-to-string`. Added: `mermaid-isomorphic`. Kept: `rehype` + `unist-util-visit` (still imported by `src/lib/tabs/process-panels.ts`, which is unrelated to the markdown pipeline).

## Key decisions

- **ESM injection is our own plugin** (`satteri-mdx-imports`): injects the `@components/mdx` barrel import into every `.mdx` file, plus `export const components = MDX_COMPONENT_REMAPPING` for routed pages using `Page.astro`. A module-level `mdxjsEsm` node compiles from a bare `value` string — no estree needed.
- **Reading time & footnote detection stay in the pipeline** as frontmatter-bag writes (`ctx.data.astro.frontmatter`). An `entry.body`-based approach was considered but rejected: the plugin approach keeps the `remarkPluginFrontmatter` contract (zero consumer changes) and AST-based footnote detection correctly ignores footnote-like syntax in code. Frontmatter writes round-trip for **both** formats on Astro 7 (`@astrojs/mdx` v6 dropped them for `.mdx`; v7 exports the read-back bag).
- **Mermaid renders at build time via our own plugin** (`satteri-mermaid` + `mermaid-isomorphic`, the Playwright-based renderer inside `rehype-mermaid`) — zero client JS. The community package (`@xingwangzhe/satteri-mermaid`) was rejected because it renders client-side. Sätteri's async visitors make the build-time approach possible.
- **External links** use SmartLink's definition of external (http(s) and not danny.is) — a deliberate small change from `rehype-external-links`, which blank-targeted all absolute URLs.
- **Heading anchors** are empty `<a href="#slug" aria-label="…">` elements with the `#` glyph CSS-generated (`_typography.css`), because the built-in heading-IDs pass records TOC text via `textContent` after our plugins run — literal anchor text would pollute every `TableOfContents` entry.

## Sätteri API learnings (the non-obvious ones)

- **No root visitor.** Plugins needing the whole document once use `src/lib/satteri-root-plugin.mjs` (`defineRootPlugin`): subscribe to every root-child node type, fire once, climb to the root via `ctx.parent()`.
- **Nodes are read-only views over Rust memory.** They can't be re-inserted as new content, and `structuredClone` leaks internal fields that crash the op-stream encoder — hand-roll plain spec-shaped copies. `ctx.replaceNode` takes a **single** node (no arrays); to replace one node with several, `insertBefore(array)` + `removeNode`.
- **Splicing pre-rendered HTML/SVG verbatim needs a per-format mechanism.** Parsing it into hast elements breaks SVG presentation attributes (`marker-end` → `markerEnd`, only partially mapped back). `.md`: a `raw` hast node passes through byte-for-byte. `.mdx`: the JSX compiler escapes `raw` nodes to text — return a `Fragment` JSX element with a `set:html` attribute instead (the mechanism `@astrojs/mdx`'s `optimizeStatic` uses).
- **Built-in passes run after user `hastPlugins`** (highlight → user plugins → image marker/component → heading-IDs). To read heading `id`s in a user plugin, register `satteriHeadingIdsPlugin()` ahead of it — **as a factory** (`() => satteriHeadingIdsPlugin()`): it builds its slugger at construction, so a shared instance leaks slug dedup across documents. The trailing built-in run is idempotent (withastro/astro#17165).
- **Plugin factories reset per document** — use them for any per-document state. Later plugins DO visit nodes freshly built by earlier plugins (the test suites' capture-plugin pattern relies on this).
- `ctx.sourceFormat` (`'markdown' | 'mdx'`) is the right gate for format-specific transforms.

## Verification practice

Every plugin verified three ways: unit tests against the compile API, greps over `dist/` output on real content (checking for *unescaped* output — a grep for an attribute passes on escaped text too, which briefly masked the mermaid `.mdx` bug), and Danny's visual review in both themes. Dependency changes verified in a clean environment (`rm -rf node_modules && bun install --frozen-lockfile && build && check:all`) — phantom transitive deps bit us in the Astro 7 upgrade and the discipline stuck.
