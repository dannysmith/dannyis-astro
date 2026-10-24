import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { getConfig } from '@config/config'
import { filterContentForListing } from '@utils/content'
import { feedResponse } from './_feed'

export async function GET(context: APIContext) {
  const config = getConfig()

  return feedResponse({
    title: `${config.site.name} - Notes`,
    description: `Latest notes from ${config.site.name}`,
    entries: filterContentForListing(await getCollection('notes')),
    url: context.url,
  })
}
