import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { contentCacheKey, filterContentForPage } from '@utils/content'
import { postMarkdown } from '@utils/content-markdown'

export async function getStaticPaths() {
  const notes = filterContentForPage(await getCollection('notes'))
  return notes.map(note => ({
    params: { slug: note.id },
    props: { note },
    cacheKey: contentCacheKey(note),
  }))
}

export const GET: APIRoute = ({ props }) =>
  new Response(postMarkdown(props.note, `/notes/${props.note.id}/`), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
