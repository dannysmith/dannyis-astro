import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_URL, AUTHOR, SOCIAL_PROFILES } from '@config/seo';
import { filterContentForListing } from '@utils/content';

// =============================================================================
// CUSTOMIZABLE CONTENT
// Update these sections as needed. The rest is auto-generated.
// =============================================================================

const AI_SUMMARY = `${AUTHOR.name} is a ${AUTHOR.jobTitle.toLowerCase()} based in London. This is his personal website where he shares articles and notes on remote work, leadership, and technology.`;

const ABOUT_CONTENT = `Danny helps companies build healthy remote teams and optimize operations. He writes about remote work practices, organizational health, leadership, and occasionally technology and design.

This site serves as Danny's corner of the web - a place to share thoughts, experiences, and work, as well as a creative playground for experimenting with CSS, HTML, and AI-assisted development.`;

const NOW_CONTENT = `- Consulting on leadership, remote working and operations
- Building Taskdn, a system for managing tasks and projects as plain markdown files
- Building Astro Editor, a markdown editor for Astro content collections
- Learning how to work effectively with AI to build things fast and well
- Playing at Open Mic nights in Islington, North London`;

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
  lines.push(`# ${SITE_TITLE}`);
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
  lines.push(`- [Website](${SITE_URL})`);
  lines.push(`- [Avatar](${AUTHOR.image})`);
  lines.push(`- [Email](mailto:${AUTHOR.email})`);
  for (const profile of SOCIAL_PROFILES) {
    const name = profile.includes('linkedin')
      ? 'LinkedIn'
      : profile.includes('github')
        ? 'GitHub'
        : profile.includes('twitter')
          ? 'Twitter'
          : 'Social';
    lines.push(`- [${name}](${profile})`);
  }
  lines.push('');

  // Now
  lines.push('## Now');
  lines.push('');
  lines.push(NOW_CONTENT);
  lines.push('');

  // Articles
  lines.push('## Articles');
  lines.push('');
  lines.push('Long-form articles by Danny.');
  lines.push('');
  for (const article of articles) {
    const url = `${SITE_URL}/writing/${article.id}/`;
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
    const url = `${SITE_URL}/notes/${note.id}/`;
    lines.push(`- [${note.data.title}](${url})`);
  }
  lines.push('');

  // Other pages
  lines.push('## Other Pages');
  lines.push('');
  lines.push(`- [Now](${SITE_URL}/now/): What Danny is currently doing`);
  lines.push(`- [Writing](${SITE_URL}/writing/): All articles`);
  lines.push(`- [Notes](${SITE_URL}/notes/): All notes`);

  const content = lines.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
