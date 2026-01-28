import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getConfig } from '@config/config';
import { filterContentForListing } from '@utils/content';
import nowMarkdown from './now/_now.md?raw';

// =============================================================================
// CUSTOMIZABLE CONTENT
// Update these sections as needed. The rest is auto-generated.
// =============================================================================

const config = getConfig();

const AI_SUMMARY = `${config.author.fullName} is a ${config.author.jobTitle.toLowerCase()} based in London. This is his personal website where he shares articles and notes on remote work, leadership, and technology.`;

const ABOUT_CONTENT = `Danny helps companies build healthy remote teams and optimize operations. He writes about remote work practices, organizational health, leadership, and occasionally technology and design.

This site serves as Danny's corner of the web - a place to share thoughts, experiences, and work, as well as a creative playground for experimenting with CSS, HTML, and AI-assisted development.`;

// Pages to exclude from "Other Pages" (matched against URL path)
const EXCLUDED_PAGES = ['/scratchpad/', '/toolboxtest/', '/404/'];

// =============================================================================
// PAGE DISCOVERY
// Auto-discovers static pages from src/pages/, excluding dynamic routes and partials
// =============================================================================

function discoverStaticPages(): Array<{ path: string; title: string }> {
  // Glob all .astro page files (eager: false since we only need paths)
  const pageFiles = import.meta.glob('./**/*.astro', { eager: false });

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
          .replace(/\/index\.astro$/, '/') // /foo/index.astro -> /foo/
          .replace(/\.astro$/, '/'); // /foo.astro -> /foo/

      // Derive title from path: /foo-bar/ -> Foo Bar
      const title = path
        .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return { path, title };
    })
    .filter(({ path }) => !EXCLUDED_PAGES.includes(path))
    .sort((a, b) => a.title.localeCompare(b.title));
}

// =============================================================================
// GENERATION LOGIC
// =============================================================================

export const GET: APIRoute = async () => {
  const articles = filterContentForListing(await getCollection('articles')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const notes = filterContentForListing(await getCollection('notes')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const lines: string[] = [];

  // Title
  lines.push(`# ${config.site.name}`);
  lines.push('');

  // AI Summary
  lines.push(`> ${AI_SUMMARY}`);
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

  // Now (imported from src/pages/now/_now.md)
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
