import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { filterContentForPage } from '@utils/content';

export async function getStaticPaths() {
  const notes = filterContentForPage(await getCollection('notes'));
  return notes.map(note => ({
    params: { slug: note.id },
    props: { note },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { note } = props;

  // Build markdown with title as H1
  let markdown = `# ${note.data.title}\n\n`;

  // Add source URL if present (notes-specific)
  if (note.data.sourceURL) {
    markdown += `${note.data.sourceURL}\n\n`;
  }

  // Handle notes with no body content
  if (!note.body || note.body.trim() === '') {
    return new Response(markdown.trim(), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Remove import statements only from the top of MDX files
  const lines = note.body.split('\n');
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip import statements and empty lines at the top
    if (trimmed.startsWith('import ') || trimmed === '') {
      contentStartIndex = i + 1;
    } else {
      // Hit actual content, stop stripping
      break;
    }
  }

  const bodyContent = lines.slice(contentStartIndex).join('\n');

  // Add cleaned body content (MDX components remain as-is)
  markdown += bodyContent;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
