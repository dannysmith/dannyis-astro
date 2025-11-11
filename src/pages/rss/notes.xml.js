import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';
import { filterContentForListing } from '@utils/content';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const notes = filterContentForListing(await getCollection('notes'));

  // Sort by publication date (newest first)
  notes.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  // Process notes with full MDX rendering
  const items = [];
  for (const note of notes) {
    try {
      const { Content } = await render(note);
      const content = await container.renderToString(Content);

      items.push({
        ...note.data,
        link: `/notes/${note.id}/`,
        content,
      });
    } catch (error) {
      console.warn(`Failed to render content for ${note.id}:`, error);
      // Skip problematic items
      continue;
    }
  }

  return rss({
    title: `${SITE_TITLE} - Notes`,
    description: `Notes from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
