import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const articles = (
    await getCollection('articles', ({ data }) => {
      return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
    })
  ).map(post => ({ ...post, type: 'article' }));

  const notes = (await getCollection('notes', ({ data }) => !data.styleguide)).map(note => ({
    ...note,
    type: 'note',
  }));

  let all = articles.concat(notes);
  all.sort((b, a) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

  return rss({
    title: `${SITE_TITLE} - Articles & Notes`,
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
