import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { CONFIG } from '@config/site';
import { filterContentForListing } from '@utils/content';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  // Note: React components in MDX will be skipped (caught by try/catch below)
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const articles = filterContentForListing(await getCollection('articles'));

  // Sort by publication date (newest first)
  articles.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  // Process articles with full MDX rendering
  const items = [];
  for (const article of articles) {
    try {
      const { Content } = await render(article);
      const content = await container.renderToString(Content);

      items.push({
        ...article.data,
        link: `/writing/${article.id}/`,
        content,
      });
    } catch (error) {
      console.warn(`Failed to render content for ${article.id}:`, error);
      // Skip problematic items
      continue;
    }
  }

  return rss({
    title: `${CONFIG.site.name} - Articles`,
    description: `Articles from ${CONFIG.descriptions.site}`,
    site: context.site,
    items,
  });
}
