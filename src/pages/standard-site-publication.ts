/**
 * standard.site publication verification document.
 *
 * Serves the AT-URI of this site's site.standard.publication record. The
 * canonical URL is /.well-known/site.standard.publication, but Vercel does not
 * reliably serve files Astro builds into a dotfile directory (dist/.well-known/),
 * so — exactly like /security.txt — this endpoint is emitted at a normal path
 * and `vercel.output-config.json` rewrites /.well-known/site.standard.publication
 * here.
 *
 * Returns 404 until the record exists and its AT-URI is set in
 * siteConfig.standardSite.publicationUri (created via
 * scripts/standard-site/create-publication.ts).
 *
 * Reference: https://standard.site/
 */

import type { APIRoute } from 'astro';
import { getConfig } from '@config/config';

export const prerender = true;

export const GET: APIRoute = () => {
  const { publicationUri } = getConfig().standardSite;

  if (!publicationUri) {
    return new Response(null, { status: 404 });
  }

  return new Response(publicationUri, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
