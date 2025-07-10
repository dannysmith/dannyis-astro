# danny.is

Danny Smith's personal website – http://danny.is

## 🛠️ Tech Stack

- **Astro** - Core framework
- **TypeScript** - Type safety
- **MDX** - Enhanced markdown for content
- **CSS** - Modern styling with CSS variables and layers
- **Vercel** - Deployment and hosting

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
├── config/           # Centralized configuration
└── utils/            # Utility functions
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                  | Action                                           |
| :----------------------- | :----------------------------------------------- |
| `npm install`            | Installs dependencies                            |
| `npm run dev`            | Starts local dev server at `localhost:4321`      |
| `npm run build`          | Build your production site to `./dist/`          |
| `npm run preview`        | Preview your build locally, before deploying     |
| `npm run check`          | Run Astro type checking                          |
| `npm run lint`           | Run ESLint to check for issues                   |
| `npm run lint:fix`       | Run ESLint and automatically fix issues          |
| `npm run format`         | Format code with Prettier                        |
| `npm run format:check`   | Check if code is properly formatted              |
| `npm run scrape-toolbox` | Scrape toolbox data from betterat.work           |
| `npm run astro ...`      | Run CLI commands like `astro add`, `astro check` |
| `npm run newnote`        | Create a new note                                |
