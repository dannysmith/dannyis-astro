import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const notes = await getCollection('notes', ({ data }) => !data.styleguide);

  const items = notes.map(note => ({
    ...note.data,
    link: `/notes/${note.id}/`,
    content: sanitizeHtml(parser.render(typeof note.body == 'string' ? note.body : ''), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    }),
  }));

  return rss({
    title: `${SITE_TITLE} - Notes`,
    description: `Notes from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
