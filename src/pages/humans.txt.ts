import type { APIRoute } from 'astro';
import { getConfig } from '@config/config';

export const GET: APIRoute = () => {
  const config = getConfig();

  const content = `/* AUTHOR */

	Name:        ${config.author.fullName}
	Location:    ${config.author.location}
	Site:        ${config.site.url}

/* META */

	Built with: AstroJS & CSS.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
