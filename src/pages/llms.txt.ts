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

  // Other pages
  lines.push('## Other Pages');
  lines.push('');
  lines.push(`- [Now](${config.site.url}/now/): What Danny is currently doing`);
  lines.push(`- [Writing](${config.site.url}/writing/): All articles`);
  lines.push(`- [Notes](${config.site.url}/notes/): All notes`);

  const content = lines.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
