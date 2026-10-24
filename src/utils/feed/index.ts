/**
 * Builds full-content RSS items for articles and notes. Used by the three feed
 * endpoints (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`), which only
 * choose the entries and the channel's title and description.
 *
 * Each entry's MDX is rendered with the Container API, then passed through
 * `cleanFeedHtml` so it holds up in feed readers. Content renders with
 * `Astro.locals.feed` set, so a component can output simpler markup for feeds.
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx/container-renderer'
import { loadRenderers } from 'astro:container'
import { type CollectionEntry, render } from 'astro:content'
import type { RSSFeedItem } from '@astrojs/rss'
import { getConfig } from '@config/config'
import { cleanFeedHtml } from './clean-html'

type FeedEntry = CollectionEntry<'articles'> | CollectionEntry<'notes'>

// One container for the whole build, shared by all three feeds.
let containerPromise: Promise<AstroContainer> | undefined

async function createContainer() {
  const container = await AstroContainer.create({
    renderers: await loadRenderers([getMDXRenderer()]),
  })
  // Framework renderers (React's needs a Vite virtual module) can't load
  // here, so this one claims any framework component and renders nothing.
  // Hydrated components still get their <astro-island> wrapper, which
  // cleanFeedHtml swaps for a link to the post.
  container.addServerRenderer({
    name: 'feed-island-placeholder',
    renderer: { check: async () => true, renderToStaticMarkup: async () => ({ html: '' }) },
  })
  return container
}

function getContainer() {
  containerPromise ??= createContainer()
  return containerPromise
}

/** The entry's page path, e.g. `/writing/some-article/`. */
function entryPath(entry: FeedEntry) {
  return entry.collection === 'notes' ? `/notes/${entry.id}/` : `/writing/${entry.id}/`
}

/** Feed items for `entries`, newest first. */
export async function feedItems(entries: FeedEntry[]): Promise<RSSFeedItem[]> {
  const container = await getContainer()
  const sorted = [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const items: RSSFeedItem[] = []
  for (const entry of sorted) {
    const path = entryPath(entry)
    const { Content } = await render(entry)
    const html = await container.renderToString(Content, { locals: { feed: true } })

    items.push({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: path,
      content: cleanFeedHtml(html, new URL(path, getConfig().site.url).href),
    })
  }
  return items
}
