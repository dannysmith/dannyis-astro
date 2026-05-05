/**
 * Build-time fetcher for LoomClone video metadata (v.danny.is/<slug>.json).
 *
 * Used by <LCVid> to embed self-hosted videos in MDX content. Failures
 * (404, non-complete, private) throw and fail the build — typos in slugs
 * and stale references should not silently ship to production.
 *
 * Fetches are deduplicated across the build: the same JSON URL fetched
 * from multiple components (or pages) only hits the network once.
 */

/* global fetch */

export interface LoomCloneSource {
  height: number;
  width: number;
  type: string;
  url: string;
}

export interface LoomCloneUrls {
  page: string;
  raw: string;
  hls: string;
  poster: string;
  embed: string;
  json: string;
  md: string;
  mp4: string;
  captions: string | null;
  storyboard: string | null;
  storyboardImage: string | null;
}

export interface LoomCloneVideo {
  id: string;
  slug: string;
  status: 'recording' | 'healing' | 'complete' | 'failed';
  visibility: 'public' | 'unlisted' | 'private';
  title: string | null;
  description: string | null;
  durationSeconds: number;
  durationFormatted: string;
  source: 'recorded' | 'uploaded';
  width: number;
  height: number;
  aspectRatio: number;
  sources: LoomCloneSource[];
  transcript: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  url: string;
  urls: LoomCloneUrls;
}

const cache = new Map<string, Promise<LoomCloneVideo>>();

/**
 * Resolve a `src` prop to the canonical JSON endpoint URL.
 * Accepts: full URL (`https://v.danny.is/foo`), absolute path (`/foo`),
 * or bare slug (`foo`). Strips any trailing extension or sub-path.
 */
export function resolveJsonUrl(src: string, baseUrl: string): string {
  let path: string;

  if (/^https?:\/\//i.test(src)) {
    try {
      path = new URL(src).pathname;
    } catch {
      throw new Error(`invalid URL "${src}"`);
    }
  } else {
    path = src;
  }

  // Take the first path segment, strip any trailing extension.
  const slug = path
    .replace(/^\/+/, '')
    .split('/')[0]
    .replace(/\.(json|md|mp4)$/, '');

  if (!/^[a-z0-9](-?[a-z0-9])*$/.test(slug)) {
    throw new Error(`could not extract a valid slug from "${src}"`);
  }

  const trimmedBase = baseUrl.replace(/\/+$/, '');
  return `${trimmedBase}/${slug}.json`;
}

export async function fetchLoomCloneVideo(jsonUrl: string): Promise<LoomCloneVideo> {
  const existing = cache.get(jsonUrl);
  if (existing) return existing;

  const promise = doFetch(jsonUrl);
  cache.set(jsonUrl, promise);
  return promise;
}

async function doFetch(jsonUrl: string): Promise<LoomCloneVideo> {
  let response: Response;
  try {
    response = await fetch(jsonUrl, { redirect: 'follow' });
  } catch (err) {
    throw new Error(
      `network error fetching ${jsonUrl}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (response.status === 404) {
    throw new Error(
      `video not found at ${jsonUrl} (404). Was it deleted, renamed or made private?`
    );
  }
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status} ${response.statusText}) for ${jsonUrl}`);
  }

  const data = (await response.json()) as LoomCloneVideo;

  if (data.status !== 'complete') {
    throw new Error(
      `video at ${jsonUrl} has status "${data.status}", not "complete" — refusing to embed`
    );
  }
  if (data.visibility === 'private') {
    throw new Error(`video at ${jsonUrl} is private — refusing to embed`);
  }

  return data;
}
