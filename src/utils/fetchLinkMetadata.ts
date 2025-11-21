/**
 * Fetch metadata (title, description, image) from a URL using Open Graph tags
 * Falls back gracefully if fetch fails or metadata is unavailable
 */

export interface LinkMetadata {
	url: string;
	title: string | null;
	description: string | null;
	image: string | null;
	domain: string;
}

/**
 * Fetches metadata from a URL with proper browser-like headers
 * Returns null if fetch fails or if the URL is invalid
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
	try {
		// Parse URL to extract domain
		const urlObj = new URL(url);
		const domain = urlObj.hostname.replace('www.', '');

		// Fetch with browser-like headers to avoid 403s
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Accept-Encoding': 'gzip, deflate, br',
				Connection: 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
			},
			// Follow redirects
			redirect: 'follow',
			// Set a reasonable timeout
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
			return null;
		}

		const html = await response.text();

		// Extract metadata from HTML
		const metadata: LinkMetadata = {
			url,
			domain,
			title: extractMetaTag(html, [
				'og:title',
				'twitter:title',
				'title',
				'<title>',
				'og:site_name',
			]),
			description: extractMetaTag(html, [
				'og:description',
				'twitter:description',
				'description',
			]),
			image: extractMetaTag(html, ['og:image', 'twitter:image']),
		};

		// Ensure we have at least a title
		if (!metadata.title) {
			metadata.title = domain;
		}

		return metadata;
	} catch (error) {
		if (error instanceof Error) {
			console.warn(`Error fetching metadata for ${url}:`, error.message);
		}
		return null;
	}
}

/**
 * Extract a meta tag value from HTML, trying multiple tag names
 */
function extractMetaTag(html: string, names: string[]): string | null {
	for (const name of names) {
		let value: string | null = null;

		// Special case for <title> tag
		if (name === '<title>') {
			const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
			if (titleMatch) {
				value = titleMatch[1];
			}
		} else {
			// Try property="name"
			const propRegex = new RegExp(
				`<meta[^>]*property=["']${escapeRegex(name)}["'][^>]*content=["']([^"']+)["']`,
				'i',
			);
			const propMatch = html.match(propRegex);

			// Try name="name"
			const nameRegex = new RegExp(
				`<meta[^>]*name=["']${escapeRegex(name)}["'][^>]*content=["']([^"']+)["']`,
				'i',
			);
			const nameMatch = html.match(nameRegex);

			// Try content first, then property
			const contentRegex = new RegExp(
				`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapeRegex(name)}["']`,
				'i',
			);
			const contentMatch = html.match(contentRegex);

			value = propMatch?.[1] || nameMatch?.[1] || contentMatch?.[1] || null;
		}

		if (value) {
			// Decode HTML entities and clean up
			return decodeHtmlEntities(value.trim());
		}
	}

	return null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
		'&nbsp;': ' ',
	};

	return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}
