import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { getConfig } from '@config/config'
import { filterContentForListing } from '@utils/content'
import { feedItems } from '@utils/feed/index'

export async function GET(context: APIContext) {
  const config = getConfig()
  const articles = filterContentForListing(await getCollection('articles'))

  return rss({
    title: `${config.site.name} - Articles`,
    description: `Latest articles from ${config.site.name}`,
    site: context.site!,
    items: await feedItems(articles),
  })
}
