import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { getConfig } from '@config/config';
import { filterContentForListing } from '@utils/content';
import nowRaw from './now.mdx?raw';

// now.mdx is an MDX page (frontmatter + MDX components). For the plain-text
// llms.txt we want only its prose, so strip the frontmatter block and any
// standalone MDX component tags, leaving the markdown body intact.
const nowMarkdown = nowRaw
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^[ \t]*<\/?[A-Z][^>]*>[ \t]*$/gm, '')
  .trim();

// =============================================================================
// CUSTOMIZABLE CONTENT
// Update these sections as needed. The rest is auto-generated.
// =============================================================================

const config = getConfig();

const ABOUT_CONTENT = `Danny helps companies build healthy remote teams and optimize operations. He writes about remote work practices, organizational health, leadership, and occasionally technology and design.

This site serves as Danny's corner of the web - a place to share thoughts, experiences, and work, as well as a creative playground for experimenting with CSS, HTML, and AI-assisted development.`;

// Pages to exclude from "Other Pages" (matched against URL path)
const EXCLUDED_PAGES = ['/scratchpad/', '/toolboxtest/', '/404/'];

// Styleguide pages get their own section below, with hand-written titles, and
// are excluded from the auto-discovered "Other Pages" list.
const STYLEGUIDE_PAGES: Array<{ path: string; title: string }> = [
  { path: '/styleguide/', title: 'Overview' },
  { path: '/styleguide/foundations/', title: 'Foundations' },
  { path: '/styleguide/typography/', title: 'Typography' },
  { path: '/styleguide/components/', title: 'Content' },
  { path: '/styleguide/ui/', title: 'UI' },
  { path: '/styleguide/html/', title: 'HTML' },
];

// =============================================================================
// PAGE DISCOVERY
// Auto-discovers static pages from src/pages/, excluding dynamic routes and partials
// =============================================================================

function discoverStaticPages(): Array<{ path: string; title: string }> {
  // Glob all .astro/.mdx page files (eager: false since we only need paths)
  const pageFiles = import.meta.glob('./**/*.{astro,mdx}', { eager: false });

  return Object.keys(pageFiles)
    .filter(file => {
      // Exclude dynamic routes (contain [...])
      if (file.includes('[')) return false;
      // Exclude partials (start with _)
      if (file.includes('/_')) return false;
      // Exclude the homepage
      if (file === './index.astro') return false;
      return true;
    })
    .map(file => {
      // Convert file path to URL path: ./foo/index.astro -> /foo/
      const path =
        '/' +
        file
          .replace(/^\.\//, '') // Remove leading ./
          .replace(/\/index\.(astro|mdx)$/, '/') // /foo/index.astro -> /foo/
          .replace(/\.(astro|mdx)$/, '/'); // /foo.mdx -> /foo/

      // Derive title from path: /foo-bar/ -> Foo Bar, /about/team/ -> About Team
      const title = path
        .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
        .split(/[-/]/) // Split on both hyphens and slashes
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return { path, title };
    })
    .filter(({ path }) => !EXCLUDED_PAGES.includes(path) && !path.startsWith('/styleguide'))
    .sort((a, b) => a.title.localeCompare(b.title));
}

// =============================================================================
// GENERATION LOGIC
// =============================================================================

export const GET: APIRoute = async () => {
  const articles = filterContentForListing(
    await getCollection('articles')
  ) as CollectionEntry<'articles'>[];
  articles.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const notes = filterContentForListing(await getCollection('notes')) as CollectionEntry<'notes'>[];
  notes.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const lines: string[] = [];

  // Title
  lines.push(`# ${config.site.name}`);
  lines.push('');

  // AI Summary
  lines.push(`> ${config.descriptions.aiSummary}`);
  lines.push('');

  // About
  lines.push(ABOUT_CONTENT);
  lines.push('');

  // External links
  lines.push('## Links');
  lines.push('');
  lines.push(`- [Website](${config.site.url})`);
  lines.push(`- [Avatar](${config.author.avatarUrl})`);
  lines.push(`- [Email](mailto:${config.author.email})`);
  for (const profile of config.socialProfiles) {
    lines.push(`- [${profile.name}](${profile.url})`);
  }
  lines.push('');

  // Now (imported from src/pages/now.mdx)
  lines.push('## Now');
  lines.push('');
  lines.push(nowMarkdown.trim());
  lines.push('');

  // Articles
  lines.push('## Articles');
  lines.push('');
  lines.push('Long-form articles by Danny.');
  lines.push('');
  for (const article of articles) {
    const url = `${config.site.url}/writing/${article.id}/`;
    const description = article.data.description ? `: ${article.data.description}` : '';
    lines.push(`- [${article.data.title}](${url})${description}`);
  }
  lines.push('');

  // Notes
  lines.push('## Notes');
  lines.push('');
  lines.push('Short-form thoughts and observations.');
  lines.push('');
  for (const note of notes) {
    const url = `${config.site.url}/notes/${note.id}/`;
    lines.push(`- [${note.data.title}](${url})`);
  }
  lines.push('');

  // Other pages (auto-discovered)
  const staticPages = discoverStaticPages();
  lines.push('## Other Pages');
  lines.push('');
  for (const page of staticPages) {
    lines.push(`- [${page.title}](${config.site.url}${page.path})`);
  }
  lines.push('');

  // Styleguide (the design-system reference pages)
  lines.push('## Styleguide');
  lines.push('');
  lines.push("Reference pages documenting the site's design system and components.");
  lines.push('');
  for (const page of STYLEGUIDE_PAGES) {
    lines.push(`- [${page.title}](${config.site.url}${page.path})`);
  }
  lines.push('');

  // External links from config
  if (config.externalLinks.length > 0) {
    lines.push('## External');
    lines.push('');
    for (const link of config.externalLinks) {
      const desc = link.description ? `: ${link.description}` : '';
      lines.push(`- [${link.name}](${link.url})${desc}`);
    }
  }

  const content = lines.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
