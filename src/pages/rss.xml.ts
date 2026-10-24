import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { getConfig } from '@config/config'
import { filterContentForListing } from '@utils/content'
import { feedItems } from '@utils/feed/index'

export async function GET(context: APIContext) {
  const config = getConfig()
  const articles = filterContentForListing(await getCollection('articles'))
  const notes = filterContentForListing(await getCollection('notes'))

  return rss({
    title: `${config.site.name} - Articles & Notes`,
    description: config.descriptions.site,
    site: context.site!,
    items: await feedItems([...articles, ...notes]),
  })
}
