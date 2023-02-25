# Danny's Website - Rebuilt in Astro

This is an evolution on my personal site. The [previous version](https://github.com/dannysmith/dannyis-jekyll) was built on Jekyll. This one is built on [Astro](https://astro.build).

## Design Values

1. Simple
1. Beautiful
1. Authenntic
1. Content-first

## Engineering Principles

1. Use defaults wherever possible.
1. Write as little code as possible.
1. Optimize for DX (and ease of maintainance and writing).
1. Do not over-abstract. Avoid fallbacks, polyfills and hacks.
1. Bake accessibility in.
1. As few dependencies as possible.

## Project Structure

```
├── public/
│   └── favicon.svg
├── src/
│   └── pages/
│   |   ├── index.astro
│   |   ├── about.astro
│   |   └── writing/
|   |       ├── my-article.mdx
|   |       ├── my-other-article.md
|   |       └── my-fancy-custom-magazine-article.astro
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   │   └── ArticleLayout.astro
│   └── scripts/
│   |   └── script.ts
│   └── styles/
│       └── global.css
└── package.json
```

Astro looks for `.astro`, `.md` or `.mdx` files in the `src/pages/` directory. Each page is exposed as a route based on its file name. There's nothing special about the other directories in `src`, but we follow the conventions in the Astro docs for structure.

## Astro Components

The following hand-rolled "base" components are available for use in other pages/articles etc (not an exhaustive list)...

- [ ] Primatives
  - [ ] Button
  - [ ] Icon
  - [ ] Card

## Coding Guidelines

Default to Astro components wherever possible, except for long-form writing. This means that most pages, layouts and UI components should be Astro components.

#### CSS

- Keep global styles to a minimum.
- Components should always use Astro's scoped styles (ie not `is:global`). The exception is when setting CSS Custom Properties on `:root` from inside a component.
- Use CSS Custm Properties on `:root` for global colours and other design tokens.
- Components should never affect things outside of them – no margins etc.
- Default CSS Grid for layout and spacing. Fall back to flexbox where it makes for significantly less code.
- Use component queries over media queries, except in layouts.

#### JS

- All JS should be typescript, whether or not you include type definitions.
- Use modern Javascript and favour readability.
- If possible, use CSS & custom properties for UI interaction stuff.
- For simple things, default to vanilla JS scoped to the Astro component.
- Avoid shipping **any** global javascript (ie in `src/scripts/`).
- Only reach for a React component when **you really need it**.

## Integrations & Libraries

We use the following Astro Integrations

| Integration       | Description                                                             | Installed |
| :---------------- | :---------------------------------------------------------------------- | --------- |
| @astrojs/image    | Optimising images and providing `<Image/>` and `<Picture/>` components. | [ ]       |
| @astrojs/mdx      | Allows the use of Astro & React components in markdown files            | [ ]       |
| @astrojs/prefetch | Speed. Adds a prefetch script to all pages so `rel="prefetch" works     | [ ]       |
| @astrojs/sitemap  | Generates a sitemap based on routes                                     | [ ]       |
| @astrojs/netlify  | Enables Netlify serverless functions                                    | [ ]       |
| @astrojs/rss      | Generating an RSS feed                                                  | [ ]       |

## Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                           |
| :---------------------- | :----------------------------------------------- |
| `pnpm install`          | Installs dependencies                            |
| `pnpm run dev`          | Starts local dev server at `localhost:3000`      |
| `pnpm run build`        | Build your production site to `./dist/`          |
| `pnpm run preview`      | Preview your build locally, before deploying     |
| `pnpm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro --help` | Get help using the Astro CLI                     |
