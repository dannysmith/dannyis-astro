# danny.is

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

Danny Smith's personal website – http://danny.is

## 🗂️ Project Structure

```
src/
├── components/        # Organized component library
│   ├── layout/        # Page structure components
│   ├── mdx/          # Components for MDX content
│   ├── navigation/    # Navigation components
│   └── ui/           # Reusable UI utilities
├── content/          # Content collections
│   ├── articles/     # Long-form articles
│   └── notes/        # Short-form notes
├── icons/            # Custom SVG icons
├── config/           # Centralized configuration
└── utils/            # Utility functions
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`            | Installs dependencies                            |
| `pnpm run dev`            | Starts local dev server at `localhost:4321`      |
| `pnpm run build`          | Build your production site to `./dist/`          |
| `pnpm run preview`        | Preview your build locally, before deploying     |
| `pnpm run check`          | Run Astro type checking                          |
| `pnpm run lint`           | Run ESLint to check for issues                   |
| `pnpm run lint:fix`       | Run ESLint and automatically fix issues          |
| `pnpm run format`         | Format code with Prettier                        |
| `pnpm run format:check`   | Check if code is properly formatted              |
| `pnpm run scrape-toolbox` | Scrape toolbox data from betterat.work           |
| `pnpm run astro ...`      | Run CLI commands like `astro add`, `astro check` |
| `pnpm run newnote`        | Create a new note                                |

## Creating a New Note

You can run `pnpm newnote` to create a new note in `src/content/notes` with the correct frontmatter and filename. Examples:

```shell
pnpm run newnote                          # Asks the user for a title
pnpm run newnote "Some Title Here"        # Uses the supplied title
pnpm run newnote "https://some-url.com"   # Fetches the og:title or <title> and sets sourceUR to the URL.
```

New draft notes can also be created using this Chrome extension https://github.com/dannysmith/dannyischromeextension. Working on a desktop editor at https://github.com/dannysmith/astro-editor
