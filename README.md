# danny.is

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

Danny Smith's personal website – http://danny.is

## 🗂️ Project Structure

```
src/
├── components/       # Organized component library
│   ├── layout/       # Page structure components
│   ├── mdx/          # Components for MDX content
│   ├── navigation/   # Navigation components
│   └── ui/           # Reusable UI utilities
├── content/          # Content collections
│   ├── articles/     # Long-form articles
│   └── notes/        # Short-form notes
├── icons/            # Custom SVG icons
├── config/           # Centralized configuration
├── styles/           # CSS architecture (layered partials)
└── utils/            # Utility functions
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                  | Action                                           |
| :----------------------- | :----------------------------------------------- |
| `bun install`            | Installs dependencies                            |
| `bun run dev`            | Starts local dev server at `localhost:4321`      |
| `bun run build`          | Build your production site to `./dist/`          |
| `bun run preview`        | Preview your build locally, before deploying     |
| `bun run check`          | Run Astro type checking                          |
| `bun run check:lint`     | Run ESLint to check for issues                   |
| `bun run check:knip`     | Check for unused dependencies, exports, and files |
| `bun run check:dupes`    | Check for duplicate code blocks                  |
| `bun run lint:fix`       | Run ESLint and automatically fix issues          |
| `bun run format`         | Format code with Prettier                        |
| `bun run check:format`   | Check if code is properly formatted              |
| `bun run scrape-toolbox` | Scrape toolbox data from betterat.work           |
| `bun run astro ...`      | Run CLI commands like `astro add`, `astro check` |
| `bun run standard-site:sync` | Sync posts to the AT Protocol network (see [docs](docs/developer/standard-site.md)) |

## Creating a New Note

New draft notes can also be created using [this Chrome extension](https://github.com/dannysmith/dannyischromeextension) or [Astro Editor](https://astroeditor.dannyu.is).
