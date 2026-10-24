import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { getConfig } from '@config/config'
import { filterContentForListing } from '@utils/content'
import { feedResponse } from './_feed'

export async function GET(context: APIContext) {
  const config = getConfig()

  return feedResponse({
    title: `${config.site.name} - Articles`,
    description: `Latest articles from ${config.site.name}`,
    entries: filterContentForListing(await getCollection('articles')),
    url: context.url,
  })
}
