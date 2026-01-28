import type { APIRoute } from 'astro';
import { getConfig } from '@config/config';

export const GET: APIRoute = () => {
  const config = getConfig();

  const manifest = {
    name: config.site.name,
    short_name: config.site.shortName,
    description: config.descriptions.short,
    start_url: '/',
    display: 'browser',
    background_color: config.site.themeColor,
    theme_color: config.site.themeColor,
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.png',
        sizes: '150x150',
        type: 'image/png',
      },
      {
        src: '/icon.jpg',
        sizes: '2400x2400',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
};
