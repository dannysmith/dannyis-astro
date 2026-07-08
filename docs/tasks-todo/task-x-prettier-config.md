# Task: Modernise Prettier config

Spun out of `task-x-some-little-bits.md` item 4 — turned out to be more than a one-line tidy.

## Background / findings

- **`.astro` files aren't being formatted at all.** `prettier-plugin-astro` is a devDependency but is never loaded: Prettier 3 dropped automatic plugin discovery, and `.prettierrc` has no `plugins` array. `prettier --check .` silently skips `.astro` (unknown extension), so `check:format` is green while ignoring every `.astro` file. Forcing the plugin reveals real formatting drift.
- **You can't fold `.prettierignore` into `.prettierrc`.** Prettier has no config-level ignore option; ignore patterns only live in `.prettierignore` / `.gitignore` / `--ignore-path`.
- **Prettier 3.8 respects `.gitignore` by default** (verified with a malformed probe file in a git-ignored dir — it was skipped). Plus it always ignores `node_modules`. So most `.prettierignore` lines are redundant.
- Several `.prettierrc` options just restate Prettier defaults.
- The `*.md`/`*.mdx` override in `.prettierrc` is dead code — those files are ignored via `.prettierignore`, so the override never runs.

## Decisions (agreed)

- Enable `.astro` formatting (add the plugin, one-time reformat). **Yes.**
- `trailingComma`: modernise `"es5"` → `"all"` (v3 default, cleaner diffs).
- YAML: do **last** as an experiment — un-ignore `*.yml`/`*.yaml`, run Prettier, and see how noisy it is. Likely originally ignored to avoid churn/conflicts with generated YAML; may re-ignore if lots of issues surface.

## Plan (in order — each step its own commit)

- [x] **1. Non-behavioural slim (no reformatting).** Trimmed `.prettierrc` to `singleQuote`, `printWidth`, `arrowParens`, `trailingComma`; dropped dead `md`/`mdx` override. Slimmed `.prettierignore` to `*.yml`/`*.yaml`/`*.md`/`*.mdx`. `check:format` stayed green.
- [x] **2. `trailingComma` → `"all"` + `bun run format`.** 31 JS/TS files, trailing commas only.
- [x] **3. Enable Astro plugin + `bun run format`.** Added `"plugins": ["prettier-plugin-astro"]`; reformatted 34 `.astro` files. Fixed `SeriesCallout.astro` (wrapped adjacent `<Callout>`/`<Spacer>` in a `<>…</>` fragment — the plugin's JSX parser rejected the un-wrapped siblings that Astro's compiler had tolerated). `bun run check:all` fully green (astro check, prettier, eslint, 337 unit, 13 e2e).
- [ ] **4. YAML experiment (last).** Remove `*.yml`/`*.yaml` from `.prettierignore`, run `prettier --check .`, review issue count with Danny, then keep-ignored or format.
