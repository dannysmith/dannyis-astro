import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('articles', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;

  // Build markdown with title as H1
  let markdown = `# ${post.data.title}\n\n`;

  // Handle articles with no body content
  if (!post.body || post.body.trim() === '') {
    return new Response(markdown.trim(), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Remove import statements only from the top of MDX files
  const lines = post.body.split('\n');
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
