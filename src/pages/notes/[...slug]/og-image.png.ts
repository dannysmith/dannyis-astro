import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { generateOGImage } from '../../../utils/og-image-generator.js';

const SITE_URL = 'https://danny.is';

export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return notes.map(note => ({
    params: { slug: note.id },
    props: { note },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { note } = props as { note: CollectionEntry<'notes'> };

  // Build canonical URL using note.id for the slug
  const url = `${SITE_URL}/notes/${note.id}`;

  try {
    const ogImageBuffer = await generateOGImage(
      {
        title: note.data.title || 'Note',
        site: 'danny.is',
        type: 'note',
        url,
      },
      {
        template: 'note',
        width: 1200,
        height: 630,
      }
    );

    return new Response(ogImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to generate OG image for note:', note.id, error);

    // Return a 500 error if image generation fails
    return new Response('Failed to generate image', {
      status: 500,
    });
  }
};
