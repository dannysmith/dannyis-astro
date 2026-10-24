/**
 * Builds the full-content RSS feeds for articles and notes. Used by the three
 * feed endpoints (`/rss.xml`, `/rss/articles.xml`, `/rss/notes.xml`), which
 * only choose the entries and the channel's title and description.
 *
 * Each item's HTML comes from the `FeedItem` component (the MDX body framed by
 * what its page shows around it), rendered with the Container API and passed
 * through `cleanFeedHtml` so it holds up in feed readers. It renders with
 * `Astro.locals.feed` set, so a component can output simpler markup for feeds.
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx/container-renderer'
import { loadRenderers } from 'astro:container'
import type { CollectionEntry } from 'astro:content'
import rss, { type RSSFeedItem } from '@astrojs/rss'
import { escapeUTF8 } from 'entities'
import { FeedItem } from '@components/layout/index'
import { getConfig } from '@config/config'
import { generateSummary } from '@utils/content-summary'
import { cleanFeedHtml } from '@utils/feed-html'

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
async function feedItems(entries: FeedEntry[]): Promise<RSSFeedItem[]> {
  const container = await getContainer()
  const { site } = getConfig()
  const creator = `<dc:creator>${escapeUTF8(site.name)}</dc:creator>`
  const sorted = [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  // The project's `*.astro` module shim is looser than the factory type the
  // Container expects; the component is a real Astro component.
  const component = FeedItem as unknown as Parameters<AstroContainer['renderToString']>[0]

  const items: RSSFeedItem[] = []
  for (const entry of sorted) {
    const path = entryPath(entry)
    const html = await container.renderToString(component, {
      props: { entry, path },
      locals: { feed: true },
    })

    items.push({
      title: entry.data.title,
      // The same fallback the page uses for its meta description.
      description: entry.data.description?.trim() || generateSummary(entry),
      pubDate: entry.data.pubDate,
      link: path,
      categories: entry.data.tags,
      customData: creator,
      content: cleanFeedHtml(html, new URL(path, site.url).href),
    })
  }
  return items
}

interface FeedOptions {
  title: string
  description: string
  entries: FeedEntry[]
  /** The endpoint's own URL (`context.url`), for the feed's self link. */
  url: URL
}

/** The RSS response for a feed of `entries`. */
export async function feedResponse({ title, description, entries, url }: FeedOptions) {
  const { site } = getConfig()
  const selfUrl = new URL(url.pathname, site.url).href

  return rss({
    title,
    description,
    site: site.url,
    xmlns: { atom: 'http://www.w3.org/2005/Atom', dc: 'http://purl.org/dc/elements/1.1/' },
    customData: [
      `<language>${site.locale.replace('_', '-').toLowerCase()}</language>`,
      `<image><url>${site.url}/favicon.png</url><title>${escapeUTF8(title)}</title><link>${site.url}/</link></image>`,
      `<atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    items: await feedItems(entries),
  })
}
