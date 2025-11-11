import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { generateOGImage } from '../../../utils/og-image-generator.js';
import { filterContentForPage } from '../../../utils/content.js';

const SITE_URL = 'https://danny.is';

export async function getStaticPaths() {
  const articles = filterContentForPage(await getCollection('articles'));

  return articles.map(article => ({
    params: { slug: article.id },
    props: { article },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as { article: CollectionEntry<'articles'> };

  // Build canonical URL using article.id for the slug
  const url = `${SITE_URL}/writing/${article.id}`;

  try {
    const ogImageBuffer = await generateOGImage(
      {
        title: article.data.title,
        description: article.data.description,
        site: 'danny.is',
        type: 'article',
        url,
      },
      {
        template: 'article',
        width: 1200,
        height: 630,
      }
    );

    return new Response(ogImageBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to generate OG image for article:', article.id, error);
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
};
