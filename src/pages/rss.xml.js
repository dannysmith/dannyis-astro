import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '@config/seo';
import { filterContentForListing } from '@utils/content';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  // Get articles and notes with filtering
  const articles = filterContentForListing(await getCollection('articles')).map(post => ({
    ...post,
    type: 'article',
  }));

  const notes = filterContentForListing(await getCollection('notes')).map(note => ({
    ...note,
    type: 'note',
  }));

  // Combine and sort by publication date
  let all = articles.concat(notes);
  all.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  // Process items with full MDX rendering
  const items = [];
  for (const item of all) {
    try {
      const { Content } = await render(item);
      const content = await container.renderToString(Content);

      items.push({
        ...item.data,
        link: item.type === 'note' ? `/notes/${item.id}/` : `/writing/${item.id}/`,
        content,
      });
    } catch (error) {
      console.warn(`Failed to render content for ${item.id}:`, error);
      // Skip problematic items
      continue;
    }
  }

  return rss({
    title: `${SITE_TITLE} - Articles & Notes`,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
