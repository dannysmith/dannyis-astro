import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { getConfig } from '@config/config'
import { filterContentForListing } from '@utils/content'
import { feedResponse } from './rss/_feed'

export async function GET(context: APIContext) {
  const config = getConfig()
  const articles = filterContentForListing(await getCollection('articles'))
  const notes = filterContentForListing(await getCollection('notes'))

  return feedResponse({
    title: `${config.site.name} - Articles & Notes`,
    description: config.descriptions.site,
    entries: [...articles, ...notes],
    url: context.url,
  })
}
