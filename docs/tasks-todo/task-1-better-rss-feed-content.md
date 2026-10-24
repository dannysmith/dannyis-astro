# Task: Better full-content RSS feeds

## Motivation

The three feeds (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`) are meant to be full-content feeds. As feeds they're fine and show up properly in readers, but the body that readers display is often not what it should be. Some examples, from using them in Feedly:

- Images don't always show up, possibly when they're wrapped in figures with figcaptions.
- Code blocks don't look great.
- Callouts and some other components don't show up well or at all. Ideally callouts appear in some format readers are likely to display, perhaps a blockquote with some text at the start.
- Markdown blocks sometimes don't show up at all. In a reader, any `md preview` block should just be a plain markdown code block. The same goes for the file tree component: it should just be a plain fenced code block.
- Bookmark links, embedded tweets, embedded videos and so on sometimes show up and sometimes don't. Where we can embed something that'll work in readers, do. Where we can't, or even where we do but readers might strip it, there should always be a link so people can find the thing rather than seeing nothing.
- Frontmatter and the automatic series callout aren't in the feed at all. Some of that probably belongs at the top of each item.
- Each item could end with something like a link to the markdown version and to the post itself.
- Footnotes should render properly in feeds.

The goal: people who read in a feed reader, and only ever see the feed, get the fullest and best experience possible. It should work well across readers in general, not just in Feedly. The approach should mean new MDX components mostly just work in feeds, or need only a small, obvious change. It should take as little code as possible and lean on defaults, but clean, well-made, resilient code is fine where it's needed. Code that exists only for rendering feeds is fine.

## How the feeds work today

Each endpoint (`src/pages/rss.xml.js`, `src/pages/rss/articles.xml.js`, `src/pages/rss/notes.xml.js`) is a near-identical copy. It renders each entry's MDX `Content` with the experimental Container API (MDX renderer only) and hands the raw HTML to `@astrojs/rss` as `content`. Nothing else happens to it. Entries that throw while rendering (anything with a React island) are left out.

Two consequences explain most of the problems below:

1. **The feed gets the site's interactive HTML, unchanged.** That means relative URLs, `<picture>`/`srcset`, Expressive Code markup, buttons, templates, scripts, `hidden` panels, screen-reader-only text, inline SVG and custom elements.
2. **The feed gets only the MDX body.** The page wraps the body in layout pieces (a note's `sourceURL` embed, the series callout, the cover image) and passes `MDX_COMPONENT_REMAPPING` to `<Content>`. The feed does neither.

## Findings

From comparing every feed item in a fresh build against its built page (visible-text diff plus a survey of tags and classes), checking the live feed, and reading how readers sanitise HTML. Miniflux's sanitiser is open source and a reasonable stand-in for typical reader behaviour:

- Allowed: `figure`, `picture`, `video`, `img srcset`.
- Removed along with their content: elements with `hidden`, and `script`/`style`.
- Tags removed but text kept: `div`, `span`, `details`/`summary`, `svg`, `input`.
- `style` attributes stripped everywhere.
- Iframes allowed only from a short list of hosts (YouTube, Vimeo, Bandcamp, Spotify…).

Webview-based readers (NetNewsWire, Reeder, Feedly web) also honour `hidden` through the browser's default styles.

### Missing entirely

- **Link posts have no link.** 92 of 159 notes have a `sourceURL`, which the note page renders as an `<Embed>`. The feed never includes it. Six notes have only a `sourceURL`, so their items are empty.
- **33 external/Medium articles are empty items** (`<content:encoded/>`). Their link goes to a page that redirects.
- **The series callout is missing** on all 20 series articles.
- **Cover images are missing** (3 articles).
- **`md preview` blocks and `tree` blocks show nothing.** Without `MDX_COMPONENT_REMAPPING`, `<markdown-preview>` and `<file-tree>` arrive raw, with all their content in a `code="…"` attribute. The Claude daily-log note loses about 1,500 words this way.
- **Image captions are lost.** 38 `caption="…"` attributes are only read by `BasicImage`, which the feed never maps to.
- **Tab panels after the first are invisible.** They carry `hidden`.
- **The datepicker note is left out of the feed**, because it can't render a React island.

### Present but broken

- **Relative URLs** in `img src`, `srcset`, `<picture><source srcset>`, `video src`/`poster` and internal links. RSS has no base URL, and the W3C validator flags relative references. The likely cause of "images in figures don't show": `BasicImage` emits `<picture>` with relative AVIF/WebP `srcset`s. A reader that fixes `src` but not `srcset` leaves the browser choosing a broken source.
- **Code blocks.** Expressive Code puts each line in its own `<div>`, mostly with no newline between them. Readers that strip `div`s collapse the block onto one line, and the colours are CSS variables that do nothing in a reader.
- **Visually-hidden text shows up as plain text:** "Terminal window" on terminal code blocks, "Play" on YouTube embeds, and the "Footnotes" heading.
- **Mermaid diagrams** are inline SVG themed with CSS variables. Readers that strip SVG leave the node labels as loose words.
- **Task-list checkboxes** are `<input>`s, which sanitisers remove, so the list markers disappear.
- **Footnote popovers don't work.** The ids are `#user-content-fn-1`. NetNewsWire and Feedbin only show popovers for links matching `sup > a[href*='#fn']`, and the `fn:1` / `fnref:1` convention works there.
- **Embeds.**
  - YouTube is a `<lite-youtube>` with a CSS-background thumbnail, so readers show a bare "Play" link.
  - LCVid is a button, a `<template>` and a script.
  - Tweets include an SVG `<use href="#…">` logo.
  - Bookmark cards wrap block content in an `<a>` and use relative `/mirrored/…` images.
  - The Bandcamp iframe has no fallback link outside it.
  - Gists are a `<script>`, so they show nothing.
- **Build paths leak into `<script src>`**, e.g. `/Users/danny/dev/…/LCVid.astro?astro&type=script` locally and the CI runner's path live. It's harmless but noisy.
- **Clutter:** `data-astro-cid-*`, `class`, `style`, heading anchor links, copy buttons, `<link rel=stylesheet>`. `rss.xml` is 1.95 MB.

### Feed metadata

- Only 22 of 227 items have a `<description>`. The page falls back to `generateSummary()`; the feed doesn't.
- There's no `<category>`, because `@astrojs/rss` wants `categories`, not `tags`.
- There's no author.
- The channel has no `<language>`, `<image>` or `atom:link rel="self"`.

### Markdown endpoints

The `.md` twins output the raw MDX source, so components appear as JSX. That's fine for LLMs, and `md preview`/`tree` fences are already readable code blocks there. The only gaps: article `.md` files don't mention their series, and Medium articles have only a title. Out of scope here except where it's free.

## Decisions

- **Item `<link>` and `<guid>` never change.** `@astrojs/rss` uses `link` as the `guid`, so changing either would make readers treat every affected item as new. Link posts keep their own note page as `<link>`, with the source shown prominently at the top of the content. Medium articles keep their danny.is link (it already redirects), and their content becomes a short "originally published on Medium" paragraph with a link.
- **Embeds get the real embed and a link.** Where an iframe works it's the best experience. Where a reader strips it, the link is still there. This applies to YouTube, Vimeo, Loom and LoomClone videos (LCVid already has an `embed` URL in its metadata).
- **Mermaid gets a placeholder:** "This post includes a diagram — view it on danny.is", linking to the post. A PNG of the diagram plus that link is a small step on from there (Phase 4), because the existing render can produce the PNG.
- **Keep every item ever.** Capping long feeds is the reader's job. A personal blog publishes rarely, and the cleanup will shrink the file a lot anyway.
- **One short footer line per item**, not an email-style signature. See Phase 2.

## Approach

Three layers, so most new components need no feed-specific work:

1. **One shared feed builder** (e.g. `src/utils/feed.ts`) used by all three endpoints. It renders each entry, wraps it with a header and footer, runs the cleanup pass, and maps frontmatter to item fields.
2. **Feed versions of the components that need them.** Render with Container `locals: { feed: true }`. A component that needs different markup checks `Astro.locals.feed`. Pass a feed `components` map to `<Content>` for the remapped tags (`markdown-preview`, `file-tree`, `img`). The capitalised components are auto-imported by `satteriMdxImports`, so the `components` prop can't override them. That's why `locals` is the way in.
3. **A general HTML cleanup pass** over each item's final HTML, using `rehype` and `unist-util-visit` (both already dependencies). It covers everything generic and is the safety net for anything not handled above. It's a pure HTML-in, HTML-out function, so it can be unit-tested with fixtures.

## Phase 1: Shared builder and general cleanup

The biggest win, and almost all of it generic.

- [x] Check first, because it decides how Phases 2 and 3 work: render with Container `locals: { feed: true }` and confirm `Astro.locals.feed` reaches a component nested inside MDX content. Add the flag to `App.Locals`. It does.
- [x] Move the shared logic into one feed builder. The endpoints just choose collections, title and description.
- [x] Cleanup pass:
  - [x] Make `href`, `src` and `poster` absolute against `site`.
  - [x] Replace `<picture>` with its `<img>`, and drop `srcset`/`sizes`, so every image is one absolute URL.
  - [x] Turn Expressive Code into a plain `<pre><code>` with newline-separated lines. Keep the file title as a caption (e.g. `<figure><figcaption><code>recording.json</code></figcaption><pre>…</pre></figure>`).
  - [x] Remove `script`, `style`, `link`, `template`, `button` and `noscript`, plus screen-reader-only text, decorative SVG icons and heading anchor links.
  - [x] Strip `class`, `style`, `data-*`, `loading` and `decoding` attributes.
  - [x] Replace task-list checkboxes with ☐/☑.
  - [x] Rewrite footnote ids and links to `fn:N` / `fnref:N`, and swap the hidden "Footnotes" heading for an `<hr>` before the list.
  - [x] Replace Mermaid SVGs with the placeholder link.
  - [x] Replace React islands with "This post includes an interactive demo — view it on danny.is", so these entries render instead of being left out, and the datepicker note comes back into the feed. React's container renderer can't load outside Vite (it imports a virtual module), so a placeholder renderer claims framework components instead.
  - [x] Turn `<markdown-preview>` / `<file-tree>` into plain code blocks from their `code` attribute, and markdown image captions into `<figcaption>`s. Cheaper here than through a feed `components` map.
  - [x] Unwrap unknown custom elements that are left over, keeping their content.
- [x] Unit tests for the cleanup function, with small focused fixtures.
- [x] Check the leftover-element survey and the page-vs-feed text diff again (the scripts used for the findings above).

## Phase 2: Item framing and metadata

- [ ] **Header**, before the body:
  - Notes with a `sourceURL`: rendered through `Embed`, as the note page does. Until Phase 3 gives `Embed` its feed versions, the cleanup pass leaves at least a working link, and Phase 3 then improves it for free.
  - Series articles: the series callout (`SeriesCallout` renders through the feed-mode `Callout`).
  - Articles with a cover: the cover image.
  - External/Medium articles: one paragraph — description if there is one, then "Originally published on Medium" with a link.
- [ ] **Footer**, after the body: one small line, separated by an `<hr>`. For example: *Posted on [danny.is](…) on 24 October 2026 · [Web](…) · [Markdown](…) · [Reply by email](mailto:…)*.
  - "Reply by email" is a `mailto:` link with the subject pre-filled: `Re: <post title>`, URL-encoded. Possibly a feed-specific plus-address (e.g. `hi+rss@danny.is`, following `contactEmail` in `src/config/site.ts`) to show which replies came from feeds.
  - Recommendation: no socials on every item. Readers who want to follow or reply have the post link and email, and the site has the rest.
  - If socials are wanted, add Bluesky and Mastodon only, at the end of the same line, from `src/config/site.ts`.
- [ ] Item fields:
  - `description`: frontmatter or `generateSummary()`, as the page does.
  - `categories`: from `tags`.
  - Author: `customData` with `dc:creator`, or `author` in the RSS email form.
- [ ] Channel fields: `<language>`, `<image>` (avatar), and `atom:link rel="self"` via `xmlns` and `customData`.
- [ ] Run the W3C feed validator on all three feeds.

## Phase 3: Feed-mode components

- [ ] Per component, in feed mode:
  - **Callout:** `<blockquote>` opening with a bold line made of the emoji/icon and the title (or a sensible label if there's no title), then the content.
  - **Embed and the video family:** YouTube, Vimeo, Loom and LCVid each emit an iframe plus a linked thumbnail or title paragraph. LCVid uses its `embed` URL and poster.
  - **Tweet:** `<blockquote>` with the text, any media, and a "— Name (@handle), date" line linking to the tweet.
  - **Bluesky and Mastodon posts:** check `astro-embed`'s output. If it doesn't hold up in a reader, use the same blockquote shape as Tweet.
  - **Gist:** a link to the gist.
  - **BookmarkCard / Notion / ContentCard / ToolCard:** a simple paragraph with the linked title, the description, and the domain in small text, with the preview image only if it adds something.
  - **Tabs:** each panel in turn under its label (a bold paragraph or a small heading), with nothing hidden.
  - **Grid:** its children in sequence.
  - **Accordion:** leave as `details`/`summary`. Readers that strip them still show the content.
- [ ] Bandcamp and other raw iframes in content: add a link after them, either by hand in the content or with a generic "iframe without a following link" rule in the cleanup pass.
- [ ] Keep the "Adding a component" note in `docs/developer/content-system.md` in step with whatever this phase settles on.

## Phase 4 (optional): Raster Mermaid diagrams

This replaces the Phase 1 placeholder with a real image. It's small enough that it doesn't need to wait for Mermaid to become common.

`satteri-mermaid` can pass `screenshot: true` in its existing render call, and `mermaid-isomorphic` then returns a PNG next to the SVG. The colours are already right: the placeholder colours are the light-theme values (they double as the `var()` fallbacks), so no second render is needed. The work is:

- Write each PNG to a cache under `node_modules/.astro/`, named by a hash of the diagram source, and copy the cache into `dist/` at the end of the build. This follows `mirrored-images-integration.mjs`, and keeps the PNGs in step when incremental builds skip re-rendering a post.
- Add a data attribute holding the PNG's URL to the inline SVG, so the cleanup pass can swap the SVG for that `<img>` and a "view on danny.is" link.
- Check the screenshot is sharp enough on high-density screens. If it isn't, look for a device-scale option in `mermaid-isomorphic`.

## Phase 5: Verify and document

- [ ] Look at a handful of representative items in a couple of real readers, before and after.
- [ ] Update `docs/developer/content-system.md` and the RSS section of `docs/developer/architecture-guide.md`.
- [ ] Run `bun run check:all`.

Representative items:

| Item                                                  | Covers                                    |
| ----------------------------------------------------- | ----------------------------------------- |
| `writing/loomclone-part-1`                            | callouts, LCVid, intro paragraph, series  |
| `writing/how-voicepad-works`                          | tabs, grid captions, file trees, code     |
| `notes/claude-daily-log`                              | `md preview`, Mermaid                     |
| `writing/vibe-coding-ios-app-chrome-extension-publish-notes` | `BasicImage` / `<picture>`         |
| `writing/an-actual-homepage`                          | footnotes                                 |
| `notes/2026-08-14-better-tweets-on-this-site`         | tweet                                     |
| `writing/introducing-astro-editor`                    | YouTube                                   |
| a body-less `sourceURL` note and a Medium article     | header framing                            |

## Notes

- Changing the content of all 227 items doesn't re-surface them in readers, because readers key on `guid`. A few readers may show some as "updated".
- `bun run build` needs to run outside the bash sandbox, because Mermaid's headless Chromium is blocked inside it.
