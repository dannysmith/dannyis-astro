import type { APIRoute } from 'astro';
import { generateOGImage } from '@utils/og-image-generator.js';
import { getConfig } from '@config/config';
import { OG_IMAGE_PAGES } from '@config/og-images';

// One generated cover per registered non-collection page. getStaticPaths only
// emits the registered paths, so this catch-all does not collide with the
// article/note og-image endpoints (which emit their own slug paths).
export function getStaticPaths() {
  return OG_IMAGE_PAGES.map(page => ({
    params: { page: page.path.replace(/^\//, '') },
    props: { title: page.title, path: page.path },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, path } = props as { title: string; path: string };
  const url = `${getConfig().site.url}${path}`;

  try {
    const ogImageBuffer = await generateOGImage(
      {
        title,
        site: 'danny.is',
        type: 'page',
        url,
      },
      {
        template: 'default',
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
    console.error('Failed to generate OG image for page:', path, error);
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
};
