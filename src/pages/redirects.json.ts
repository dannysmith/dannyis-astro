/**
 * Host-agnostic redirect manifest.
 *
 * Unions the two sources of "logical" redirects on this site:
 *   1. Manual short links from src/config/redirects.ts (e.g. /meeting, /cv).
 *   2. Cross-posted articles with a `redirectURL` (e.g. old Medium posts).
 *
 * Both are also rendered as meta-refresh fallbacks for static/non-Vercel hosts
 * (short links via astro.config's `redirects`; articles via Article.astro). This
 * manifest is the machine-readable, deploy-target-neutral version: on Vercel,
 * scripts/build-vercel-config.mjs turns it into real HTTP redirect routes; any
 * other host could translate it the same way.
 *
 * Sources use the content-collection `id` (the same value the /writing route
 * uses), so they always match the real page URL. Match each source with an
 * optional trailing slash.
 *
 * Excluded from the sitemap (astro.config) and not listed in llms.txt.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { redirects as manualRedirects } from '@config/redirects';
import { filterContentForPage } from '@utils/content';

export const prerender = true;

interface RedirectEntry {
  source: string;
  destination: string;
  status: number;
}

export const GET: APIRoute = async () => {
  // Manual short links.
  const manual: RedirectEntry[] = Object.entries(manualRedirects).map(([source, destination]) => ({
    source,
    destination,
    status: 302,
  }));

  // Cross-posted articles that redirect elsewhere. filterContentForPage matches
  // the /writing route's getStaticPaths (non-drafts), so every source has a page.
  const articles = filterContentForPage(await getCollection('articles'));
  const articleRedirects: RedirectEntry[] = [];
  for (const article of articles) {
    if (article.data.redirectURL) {
      articleRedirects.push({
        source: `/writing/${article.id}`,
        destination: article.data.redirectURL,
        status: 302,
      });
    }
  }

  const body = {
    version: 1,
    redirects: [...manual, ...articleRedirects],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
