import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { getConfig } from '@config/config';
import { filterContentForListing } from '@utils/content';

export async function GET(context) {
  // Initialize Container API for MDX rendering
  // Note: React components in MDX will be skipped (caught by try/catch below)
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
    } catch {
      // Only the MDX renderer is available in this feed context, so notes whose
      // content includes a React island (e.g. a client:only demo) can't be
      // rendered here. Omit them from the feed rather than failing the build.
      console.warn(`RSS: omitting note "${note.id}" — its content includes a component that can't render in a feed.`);
      continue;
    }
  }

  const config = getConfig();

  return rss({
    title: `${config.site.name} - Notes`,
    description: `Latest notes from ${config.site.name}`,
    site: context.site,
    items,
  });
}
