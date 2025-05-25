import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { generateOGImage } from '../../../utils/og-image-generator.js';

const SITE_URL = 'https://danny.is';

export async function getStaticPaths() {
  const articles = await getCollection('blog', ({ data }) => {
    return !data.draft;
  });

  return articles.map(article => ({
    params: { slug: article.id },
    props: { article },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as { article: any };

  // Build canonical URL (adjust if your domain/structure changes)
  const url = `${SITE_URL}/writing/${article.slug}`;

  try {
    const ogImageBuffer = await generateOGImage(
      {
        title: article.data.title,
        description: article.data.description,
        site: 'danny.is',
        type: 'article',
        profileImage: `${SITE_URL}/avatar-circle.png`,
        authorName: 'Danny Smith',
        url,
      },
      {
        template: 'article',
        width: 1200,
        height: 630,
      }
    );

    return new Response(ogImageBuffer, {
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
