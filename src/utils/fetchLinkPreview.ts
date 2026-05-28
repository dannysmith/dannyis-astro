/* global fetch, setTimeout, clearTimeout */

// Notion's public pages serve page-specific <title> / og: / favicon metadata
// only to known social-crawler UAs. Every other UA gets the generic
// JS-hydrated shell with `<title>Notion</title>`. `facebookexternalhit/1.1`
// is the standard sentinel used by unfurl.js, Slack, Discord, etc., and
// also gets sensible OG metadata from most blogs and news sites.
const USER_AGENT = 'facebookexternalhit/1.1';
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024;

export interface LinkPreview {
  title?: string;
  ogTitle?: string;
  favicon?: string;
}

export async function fetchLinkPreview(url: string, signal?: AbortSignal): Promise<LinkPreview> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`fetchLinkPreview: ${response.status} ${response.statusText} from ${url}`);
    }
    const html = await readCapped(response, MAX_BYTES);
    return parseLinkPreview(html, url);
  } finally {
    clearTimeout(timer);
  }
}

export function parseLinkPreview(html: string, baseUrl: string): LinkPreview {
  return {
    title: extractTitle(html),
    ogTitle: extractOgTitle(html),
    favicon: extractFavicon(html, baseUrl),
  };
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return await response.text();
  const decoder = new TextDecoder();
  let html = '';
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxBytes - total;
    if (value.length > remaining) {
      html += decoder.decode(value.subarray(0, remaining));
      break;
    }
    total += value.length;
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  await reader.cancel();
  return html;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return undefined;
  const value = decodeEntities(match[1]).trim();
  return value || undefined;
}

// Tolerant of attribute order (property first OR content first) and quote style.
function extractOgTitle(html: string): string | undefined {
  for (const m of html.matchAll(/<meta\b[^>]*\bproperty=(["'])og:title\1[^>]*>/gi)) {
    const content = m[0].match(/\bcontent=(["'])([\s\S]*?)\1/i);
    if (content) return decodeEntities(content[2]).trim() || undefined;
  }
  for (const m of html.matchAll(/<meta\b[^>]*\bcontent=(["'])([\s\S]*?)\1[^>]*>/gi)) {
    if (/\bproperty=(["'])og:title\1/i.test(m[0])) {
      return decodeEntities(m[2]).trim() || undefined;
    }
  }
  return undefined;
}

function extractFavicon(html: string, baseUrl: string): string | undefined {
  for (const m of html.matchAll(/<link\b[^>]*\brel=(["'])(?:shortcut )?icon\1[^>]*>/gi)) {
    const href = m[0].match(/\bhref=(["'])([\s\S]*?)\1/i);
    if (href) {
      try {
        return new URL(href[2], baseUrl).href;
      } catch {
        // Skip malformed hrefs; try the next match.
      }
    }
  }
  return undefined;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function safeCodePoint(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return '';
  try {
    return String.fromCodePoint(n);
  } catch {
    return '';
  }
}
