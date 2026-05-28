# Upgrade to Astro 6.4 and bump remaining dependencies

## Goal

Move from `astro@^6.1.1` to the latest 6.4.x, bring all official integrations and third-party packages to current versions, and selectively adopt the new APIs introduced across 6.2 → 6.4 where they're actually useful for this site.

**Do not start this task until `task-1-reduce-npm-dependency-surface.md` has shipped.** Cleaning the dependency surface first means a smaller blast radius during the version bump.

## References

- Astro 6.2 release post — https://astro.build/blog/astro-620/
- Astro 6.3 release post — https://astro.build/blog/astro-630/
- Astro 6.4 release post — https://astro.build/blog/astro-640/
- Astro `v6` upgrade guide (still the canonical breaking-changes doc for the 6.x line) — https://docs.astro.build/en/guides/upgrade-to/v6/
- `withastro/astro` changelog — https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md

## Phases

Run `bun run check:all` and `bun run build` after each phase. Commit per phase to keep the diff bisectable.

### Phase 1 — Run the official upgrade tool

```bash
bunx @astrojs/upgrade
```

This bumps `astro` and the official integrations (`@astrojs/mdx`, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/markdown-remark`, `@astrojs/check`) to compatible versions in one go. Expected jumps include `@astrojs/mdx` 5 → 6 and `@astrojs/react` 5 → 6.

Run `bun run build` immediately afterwards. Resolve any breakage before moving to the next phase.

### Phase 2 — Required config changes

#### 2a. Rename `experimental.svgo` → `experimental.svgOptimizer`

The 6.2 release renamed the flag and introduced a pluggable `SvgOptimizer` interface. In `astro.config.mjs`:

```js
// Before
experimental: {
  svgo: true,
},

// After (defaults — same behaviour as `true`)
experimental: {
  svgOptimizer: true,
},
```

If finer control is wanted later, import `svgoOptimizer` from `astro/config` and pass an SVGO config object. Not needed for this site initially.

#### 2b. Image config audit (6.3 changes)

- `image.dangerouslyProcessSVG` — default flipped to `false` in 6.3. Only matters if `<Image>` / `<Picture>` / `getImage()` is ever called with an `.svg` source. The site uses SVGs via `astro-icon`, not via `<Image>`, so this should be a no-op. Verify by grepping for any `<Image src="*.svg"` and any `getImage(...)` call passing an SVG path.
- Remote image redirects (6.3) — Astro now follows up to 10 redirects when fetching remote images, but every URL in the chain must match `image.remotePatterns` / `image.domains`. The site doesn't currently configure remote image sources; check whether the build complains about anything in `astro-embed` previews or social-card thumbnails.

### Phase 3 — Bump remaining dependencies

After Phase 1, check each of these against latest and update as appropriate:

- `astro-expressive-code` (currently `^0.41.7` — target `^0.42.x`)
- `astro-embed` (currently `^0.12.0` — target `^0.13.x`)
- `astro-icon` (currently `^1.1.5` — verify latest, peer constraint vs. Astro 6.4)
- `rehype-mermaid`, `mermaid`, `marked`, `mdast-util-to-string`, `reading-time`, `rehype-autolink-headings`, `rehype-external-links`, `satori`, `sharp`, `@resvg/resvg-js`
- `@iconify-json/heroicons`, `@iconify-json/simple-icons`
- `@fontsource-variable/fira-code`
- All `devDependencies`: `vitest`, `@playwright/test`, `playwright`, `eslint` + plugins, `prettier`, `prettier-plugin-astro`, `typescript`, `tsx`, `knip`, `jscpd`
- `@types/react`, `@types/react-dom`
- `react`, `react-dom`, `@dannysmith/datepicker`

Use `bun outdated` to enumerate. For each major bump, skim the changelog for breaking changes before applying.

### Phase 4 — Migrate to `markdown.processor` API

The top-level `markdown.remarkPlugins` / `markdown.rehypePlugins` / `markdown.remarkRehype` / `markdown.gfm` / `markdown.smartypants` options were deprecated in 6.4 and will be removed in **Astro 8.0**. Migrate now to avoid the churn later.

In `astro.config.mjs`:

```js
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  // ...
  markdown: {
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
});
```

The custom remark/rehype plugins in `src/lib/` are plain unified plugins and require no changes themselves.

If `@astrojs/mdx` exposes the same `processor` option (it should mirror the top-level config), apply the same migration there.

**Do not** adopt `@astrojs/markdown-satteri`. It's faster but does not support remark/rehype plugins, and the site relies on `rehype-mermaid`, `rehype-autolink-headings`, `rehype-external-links`, and four custom remark plugins.

### Phase 5 — Swap OG font stack: League Spartan → Geist + Figtree

The Satori OG image pipeline (`src/utils/og-image-generator.ts`) currently loads `LeagueSpartan-Regular.ttf` and `LeagueSpartan-Bold.ttf` from `public/fonts/`. The rest of the site now uses Geist + Figtree (WOFF2) loaded through CSS.

Constraint: **Satori cannot consume WOFF2** — it parses fonts via opentype.js, which only handles TTF/OTF. So this is _not_ a Fonts-API adoption; it's a font swap that keeps the existing `fs.readFile(...)` mechanism.

1. Source TTF copies of the Geist and Figtree weights used by the OG templates (likely Regular + Bold or Regular + SemiBold — check the template files in `src/utils/og-templates.*`). Geist is published under SIL OFL on GitHub (`vercel/geist-font`) with TTF builds available; Figtree is also OFL with TTF builds on GitHub (`erikdkennedy/figtree`) and Google Fonts.
2. Add the TTFs to `public/fonts/` using the same naming convention as the existing variable-font files for traceability.
3. Update the font-loading paths and `name` values in `og-image-generator.ts` to point at the new files.
4. Smoke-test the OG endpoint locally for an article, a note, and the default fallback. Confirm the rendered text uses the new typefaces and there's no font-fallback flicker to a system font.
5. Once the new fonts work, delete `public/fonts/LeagueSpartan-Regular.ttf` and `public/fonts/LeagueSpartan-Bold.ttf`.

**`experimental_getFontFileURL` is intentionally not used here.** The 6.2 API is designed to expose Astro-managed fonts to tools like Satori, but the Fonts API serves WOFF2 to browsers — there's no obvious way to ask it for a TTF variant. Revisit if Astro adds an explicit format option to that helper.

### Phase 6 — Investigate `compressHTML: 'jsx'`

Added in 6.2. Strips whitespace using JSX rules — denser HTML output without losing significant inline spacing. Whitespace inside `<pre>` is preserved, so expressive code blocks are safe.

1. Add `compressHTML: 'jsx'` to `astro.config.mjs`.
2. Build, then diff a sample of rendered pages (article, note, list page, styleguide) against the previous output. Look for visible whitespace regressions in inline elements, especially around `<Notion>`, `<Embed>`, footnotes, and emoji-bearing inline spans.
3. Keep if clean, revert if any regression.

### Phase 7 — Verify and tidy

1. `bun run check:all` clean.
2. `bun run build` clean. Inspect the production build locally with `bun run preview`.
3. Visually verify in both light and dark themes:
   - Article pages (typography, code blocks, callouts)
   - Note pages (including the datepicker note's React island)
   - Styleguide
   - RSS feeds (`/rss.xml`, `/notes-rss.xml`, etc.)
   - OG image endpoints (article + note + default)
   - Mermaid diagrams (if any current content uses them; otherwise drop a temporary `mermaid` block in a draft to confirm)
4. Run `bun run scrape-toolbox` to confirm the Playwright-based scraper still works.
5. Update `docs/developer/` where any of these changes touch documented patterns:
   - `design-tokens.md` / `fonts.md` if the OG fonts are documented anywhere
   - `architecture-guide.md` if config shape changed (e.g. `markdown.processor`)
   - `content-system.md` for any new OG image stack notes

## Captured for later (not in this task)

- **OG visual rework** — Danny has new design direction for the OG cards that's distinct from the font swap above. Capture as a separate task once design intent is sketched.
- **`experimental_getFontFileURL` adoption** — only if Astro adds a way to request TTF/OTF variants from the Fonts API (current API likely serves WOFF2 only).
- **`@astrojs/markdown-satteri`** — only viable if the site ever drops its remark/rehype plugin set.
- **Astro 7** — the Rust compiler becomes the default and `experimental.rustCompiler` is deprecated. No action needed in 6.x; track for the eventual 7.0 upgrade.
