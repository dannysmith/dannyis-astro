/**
 * standard.site publication verification document.
 *
 * Serves the AT-URI of this site's site.standard.publication record at the
 * canonical URL /.well-known/site.standard.publication.
 *
 * This file follows the site-wide `.well-known` scheme: well-known resources
 * are authored under a non-dot `well-known/` path (here as an Astro route, so
 * the content can be generated) and emitted to `dist/well-known/`. A `postbuild`
 * step copies that to `dist/.well-known/` for portable hosts, and a single
 * rewrite in `vercel.output-config.json` (`/.well-known/* -> /well-known/*`)
 * makes the canonical dot-path resolve on Vercel, which does not serve dotfile
 * directories. See docs/tasks-done for the agent-readiness task.
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
