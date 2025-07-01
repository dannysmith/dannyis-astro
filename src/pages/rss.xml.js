import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = (
    await getCollection('articles', ({ data }) => {
      return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
    })
  ).map(post => ({ ...post, type: 'post' }));

  const notes = (await getCollection('notes', ({ data }) => !data.styleguide)).map(note => ({
    ...note,
    type: 'note',
  }));

  let all = posts.concat(notes);
  all.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: all.map(item => ({
      ...item.data,
      link: item.type === 'note' ? `/notes/${item.id}/` : `/writing/${item.id}/`,
      content: sanitizeHtml(parser.render(typeof item.body == 'string' ? item.body : ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
  });
}
