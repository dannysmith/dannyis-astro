# Task: Update docs after astro 7 upgrade and Satteri migration

We'll need to upgrade the developer docs, READMEs, AGENTS.md and the like to account for the various changes we've made.

## Phase 1 - Docs cleanup [DONE]

### Final cleanup (deferred from Task 5)

- Deleted the 8 old unified plugins (`src/lib/remark-*.mjs`, `rehype-*.mjs`) and their 4 test files — preserved in git history; every replacement `satteri-*` plugin has its own suite.
- Removed `mdast-util-to-string` (only the old reading-time plugin used it) and the stale `'mermaid'` knip ignore. Fixed `satteri-mermaid.mjs`'s JSDoc, which type-imported from the removed `mermaid` package.
- knip's migration-related findings are now clear (remaining hits — `BasicPage.astro`, `simple-icons`, `date-fns`, `Props` exports — are pre-existing and unrelated). jscpd's old-vs-new clone pairs are gone.
- Clean-env verification (`rm -rf node_modules && bun install --frozen-lockfile && build && check:all`) green.

### Docs updated

- **`docs/developer/content-system.md`** — the big one: "Markdown Plugins Configuration" rewritten for Sätteri (processor, pipeline order, full MDAST/HAST plugin list including mermaid); reading-time section updated; build-config and external-deps mentions.
- **`docs/developer/architecture-guide.md`** — `src/lib/` description, external-link security, reading-time injection, and the routed-`.mdx`-pages paragraph (auto-imports + Page.astro remapping now via `satteri-mdx-imports`).
- **`docs/developer/content-authoring.md`** — auto-import mechanism, unwrap-images and FileTree plugin references. (The authoring workflow itself is unchanged — content authors notice nothing.)
- **`docs/developer/code-quality.md`** — knip ignore example no longer lists `mermaid`.
- **`AGENTS.md`** — tech stack: Astro 7+, Sätteri pipeline note (remark/rehype plugins do not run).
- `README.md` had no stale references. `remarkPluginFrontmatter` mentions stay — that's still the live Astro API name.


## Phase 2 - Review [DONE]

- [x] Review all the new satteri files in lib for:
  - [x] Any opportunities to clean up/refactor the code without affecting functionality
  - [x] The initial comments should clearly describe what the thing does and why it exists, and potentially use JSDOC format if that seems actually helpful, but should NOT be "AI slop" comments with tons of useless detail and non-evergreen references to phases, tasks, findings etc or repetitions of stuff obvious from the code below
- [x] Review all other new files we've written on this branch in a similar way. Keep things simple and concise.

Outcome: `satteri-mdx-imports` rebuilt on the shared `defineRootPlugin` helper (was duplicating its fire-once/climb-to-root mechanism and visitor-key list); all plugin headers de-slopped (dropped "Port of…" lines, task/spike/old-plugin references, community-package comparison) while keeping evergreen constraints (raw-splice rule, factory requirements, CSS-glyph rationale, vendored-code attribution); test suites share a new `tests/unit/satteri-helpers.ts` (`astroData`, `mdastCapturer`, `attr`/`hasAttr` were copy-pasted across 7 files); config comments trimmed of issue refs and one contradictory sentence. Left alone deliberately: the 9-line jscpd overlap between the two fence plugins (parallel by design; a shared factory would couple them) and pre-existing knip/jscpd noise in untouched files.


## Phase X - Final checks

- [x] Delete task 1 doc
- [x] Complete task 2 doc as-is
- [x] Merge task docs 3-5 into one doc and simpleify them so they're actually useful as a historical record and don't have tons of crap in them, then complete the consilidated doc
- [x] Delete any leftovers we don;t need any more
- [x] Run check:all
- [x] Final smoke test by user in dev server

At this point we will open a PR and see what CI and CodeRabbit have to say. Task 6 doc should be left where it is for now.
