import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => {
    return (import.meta.env.PROD ? data.draft !== true : true) && !data.styleguide;
  });

  const items = articles.map(article => ({
    ...article.data,
    link: `/writing/${article.id}/`,
    content: sanitizeHtml(parser.render(typeof article.body == 'string' ? article.body : ''), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    }),
  }));

  return rss({
    title: `${SITE_TITLE} - Articles`,
    description: `Articles from ${SITE_DESCRIPTION}`,
    site: context.site,
    items,
  });
}
