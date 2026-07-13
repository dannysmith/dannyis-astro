# Task 5: Frontmatter Plugins, Mermaid & Finalise Sätteri

## Overview

Restore the last two feature groups — frontmatter-writing plugins and Mermaid — then clean up dependencies and lock in the Sätteri migration with a full quality pass. This is the final task: after it the site is fully on Sätteri, on Astro 7.

**Prerequisite:** Task 4 complete (content-transform plugins ported). Task 1 already proved frontmatter read-back works (for `.md`; `.mdx` handled below).

## Phases

### Phase 1 — Reading-time & footnote detection (moved OUT of the markdown pipeline)

**Task 1 finding:** the `ctx.data.astro.frontmatter` write-back works for `.md` but is **silently dropped for `.mdx`** (`@astrojs/mdx` v6 exports `frontmatter` from the original parsed YAML and never reads the Sätteri data bag back). Porting `remark-reading-time` / `remark-footnote-detector` as-is would lose `minutesRead` / `hasFootnotes` on all **76 `.mdx` files** (23 articles + 53 notes).

**Approach:** compute both **outside** the markdown pipeline, from `entry.body` (raw markdown), so it's format-agnostic and works uniformly for `.md` and `.mdx`. This deletes both remark plugins entirely.

- **Reading time** — a shared util (`reading-time` over `entry.body`) called where entries are loaded/rendered (content-collection config `transform`, or the Article/Note layouts + `writing/[...slug]/index.astro`, which already read `minutesRead`).
- **Footnote detection** — derive `hasFootnotes` from `entry.body` (e.g. presence of `[^…]:` definitions) in the same place.

Verify: `minutesRead` and `hasFootnotes` are correct on **both** `.md` and `.mdx` articles/notes and render in layouts. Confirm current readers (`src/layouts/Article.astro`, `src/pages/writing/[...slug]/index.astro`) still get the values.

### Phase 2 — Mermaid via `@xingwangzhe/satteri-mermaid`

Decision (issue #132): **keep build-time Mermaid** (no client JS), adopt the community package rather than dropping it. It's used only in `src/content/notes/note-styleguide.mdx` today but we want to retain the capability.

- Install `@xingwangzhe/satteri-mermaid` (v0.2.8; peer deps `satteri >= 0.8`, `mermaid >= 11`).
- Register both plugins — the dual approach is required because Sätteri's text transforms otherwise corrupt Mermaid's diamond-node syntax:
  ```js
  import { mermaidMdast, mermaidHast } from '@xingwangzhe/satteri-mermaid';
  satteri({
    mdastPlugins: [/* ...ours... */, mermaidMdast()],
    hastPlugins: [/* ...ours... */, mermaidHast()],
  });
  ```
- Reconcile with `markdown.syntaxHighlight.excludeLangs: ['mermaid']` (behaviour recorded in Task 1) so Mermaid fences aren't also syntax-highlighted.
- Remove the old `rehype-mermaid` wiring and confirm whether `src/config/mermaid.ts` config still applies (map onto the new plugin if needed).

Verify: the styleguide Mermaid diagram renders at **build time** with **zero client-side JS**; check both themes.

### Phase 3 — Dependency cleanup & quality pass

- Remove now-unused deps from `package.json`: `astro-auto-import`, `rehype-autolink-headings`, `rehype-external-links`, `rehype-mermaid`, and `@astrojs/markdown-remark` / `unified` if nothing else imports them. Run `bun run check:knip` to catch stragglers.
- Update `astro.config.ts` comments and remove the Task 2 TODO checklist.
- Update `docs/developer/` (markdown pipeline / architecture guide) to describe the Sätteri plugin set.
- Full `bun run check:all` (types → format → lint → unit + e2e), plus `check:knip` and `check:dupes`.
- Manual sweep of representative articles/notes/pages in **both themes**.

## Success criteria

- [ ] `minutesRead` + `hasFootnotes` populate correctly.
- [ ] Mermaid renders at build time, zero client JS, both themes.
- [ ] Old remark/rehype/mermaid/auto-import deps removed; `knip` clean.
- [ ] `bun run check:all` green.
- [ ] Developer docs updated. Site is fully on Sätteri (still Astro 6.4).

## References

- Plugins: `src/lib/remark-reading-time.mjs`, `remark-footnote-detector.mjs`
- Mermaid config: `src/config/mermaid.ts`
- `@xingwangzhe/satteri-mermaid`: <https://github.com/xingwangzhe/satteri-mermaid>
