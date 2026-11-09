import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { contentCacheKey, filterContentForPage } from '@utils/content'
import { postMarkdown } from '@utils/content-markdown'

export async function getStaticPaths() {
  const posts = filterContentForPage(await getCollection('articles'))
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
    // Emits the article's own title and body as text — no layout and no
    // components — so the digest alone is enough, series articles included.
    cacheKey: contentCacheKey(post),
  }))
}

export const GET: APIRoute = ({ props }) =>
  new Response(postMarkdown(props.post, `/writing/${props.post.id}/`), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
