// Builds src/content/toolboxPages.json — rich metadata for every public toolbox page.
//
// Two unauthenticated requests, joined on the Notion page UUID:
//   1. https://betterat.work/tool/ — super.so server-renders the gallery and embeds a
//      Notion-ish recordMap as Next.js RSC flight data in the HTML. Gives: title, slug,
//      Notion UUID, icon, cover image (stable spr.so CDN), timestamps, display order.
//   2. Notion's unofficial v3 queryCollection API — works without auth because the
//      workspace is published to web (required for super.so to render it). Gives:
//      Category, AI Summary and canonical created/last-edited times.
//
// See https://github.com/dannysmith/dannyis-astro/issues/47 for background.

import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const OUTPUT_PATH = join(process.cwd(), 'src', 'content', 'toolboxPages.json');
const BAW_BASE_URL = 'https://betterat.work';
const NOTION_V3 = 'https://www.notion.so/api/v3';
const NOTION_SITE_BASE = 'https://dannysmith.notion.site';
const MIN_EXPECTED_TOOLS = 5;

// Fallbacks if discovery from the flight data ever fails (current live values).
const FALLBACK_IDS = {
  collectionId: '63c2a253-1d27-4522-876a-0f1205d5f689',
  viewId: 'da9b9dae-3f05-4797-a594-aa656ea8ed5c',
  spaceId: '5ba1b849-6c3c-4714-994f-691d775d2303',
};

interface ToolboxPage {
  id: string; // slug, used as the content collection entry id
  title: string;
  url: string; // canonical public URL (betterat.work)
  notionId: string; // dashed Notion page UUID
  notionUrl: string; // public notion.site URL
  emoji?: string; // exactly one of emoji/iconUrl is usually present
  iconUrl?: string;
  coverImage?: string;
  category?: string;
  summary?: string;
  created: string; // ISO datetime
  lastEdited: string; // ISO datetime
  displayOrder: number; // gallery order on betterat.work
}

/** Extract and concatenate all RSC flight chunks: self.__next_f.push([1,"..."]) */
function extractFlightData(html: string): string {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)];
  return chunks.map(m => JSON.parse(m[1]) as string).join('');
}

/** Find the balanced JSON object starting at `startMarker` within a larger string. */
function extractJsonObject(text: string, startMarker: string): unknown {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Marker not found in flight data: ${startMarker}`);
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error('Unbalanced JSON object in flight data');
}

/** Notion rich-text array -> plain string. Segments are [text, annotations?]. */
function richTextToPlain(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const text = (value as unknown[][])
    .map(seg => (typeof seg?.[0] === 'string' ? seg[0] : ''))
    .join('')
    .trim();
  return text || undefined;
}

/** Notion v3 records are wrapped in varying layers of {spaceId?, value: {role?, value?}}. */
function unwrapRecord(entry: unknown): Record<string, unknown> | null {
  let v = entry as Record<string, unknown> | null;
  while (v && typeof v === 'object' && !('id' in v) && 'value' in v) {
    v = v.value as Record<string, unknown>;
  }
  return v && typeof v === 'object' && 'id' in v ? v : null;
}

async function fetchSuperIndex() {
  console.log(`Fetching ${BAW_BASE_URL}/tool/ ...`);
  const res = await fetch(`${BAW_BASE_URL}/tool/`);
  if (!res.ok) throw new Error(`betterat.work returned ${res.status}`);
  const html = await res.text();

  const props = extractJsonObject(extractFlightData(html), '{"pageReplacement"') as {
    records: { block: Record<string, Record<string, unknown>> };
  };
  const blocks = props.records.block;

  const tools = new Map<
    string, // notion UUID
    { title: string; slug: string; icon?: string; cover?: string; created: number; edited: number }
  >();
  for (const block of Object.values(blocks)) {
    if (block?.type !== 'page' || typeof block.uri !== 'string' || !block.uri.startsWith('/tool/'))
      continue;
    tools.set(block.blockId as string, {
      title: richTextToPlain(block.title) ?? '',
      slug: block.uri.replace('/tool/', ''),
      icon: (block.icon as string | null) ?? undefined,
      cover: (block.cover as string | null) ?? undefined,
      created: block.createdTime as number,
      edited: block.lastEditedTime as number,
    });
  }

  // The collection block carries the collection/view/space IDs and gallery display order.
  const collectionBlock = Object.values(blocks).find(b => b?.type === 'collection_page');
  const views = (collectionBlock?.views as Record<string, unknown>[] | undefined) ?? [];
  const galleryOrder = ((views[0]?.items as string[] | undefined) ?? []).map(id =>
    id.replace(/^tool-/, ''),
  );
  const ids = {
    collectionId: (collectionBlock?.collectionId as string) ?? FALLBACK_IDS.collectionId,
    viewId: (views[0]?.id as string) ?? FALLBACK_IDS.viewId,
    spaceId: (collectionBlock?.spaceId as string) ?? FALLBACK_IDS.spaceId,
  };

  console.log(`Found ${tools.size} tool pages on betterat.work`);
  return { tools, galleryOrder, ids };
}

async function fetchNotionRows(ids: typeof FALLBACK_IDS) {
  console.log('Querying Notion v3 queryCollection (unauthenticated) ...');
  const res = await fetch(`${NOTION_V3}/queryCollection`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      source: { type: 'collection', id: ids.collectionId, spaceId: ids.spaceId },
      collectionView: { id: ids.viewId, spaceId: ids.spaceId },
      loader: {
        reducers: { collection_group_results: { type: 'results', limit: 100 } },
        searchQuery: '',
        userTimeZone: 'Europe/London',
        type: 'reducer',
      },
    }),
  });
  if (!res.ok) throw new Error(`queryCollection returned ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    result: { reducerResults: { collection_group_results: { blockIds: string[] } } };
    recordMap: { collection: Record<string, unknown>; block: Record<string, unknown> };
  };

  // Property keys are opaque hashes (e.g. "YJEd") — resolve them via the collection schema.
  const collection = unwrapRecord(Object.values(data.recordMap.collection)[0]);
  const schema = (collection?.schema ?? {}) as Record<string, { name: string }>;
  const keyFor = (name: string) =>
    Object.entries(schema).find(([, s]) => s.name === name)?.[0] ?? null;
  const categoryKey = keyFor('Category');
  const summaryKey = keyFor('AI Summary');

  const rows = new Map<
    string, // notion UUID
    { category?: string; summary?: string; created?: number; edited?: number }
  >();
  for (const id of data.result.reducerResults.collection_group_results.blockIds) {
    const block = unwrapRecord(data.recordMap.block[id]);
    if (!block) continue;
    const properties = (block.properties ?? {}) as Record<string, unknown>;
    rows.set(id, {
      category: categoryKey ? richTextToPlain(properties[categoryKey]) : undefined,
      summary: summaryKey ? richTextToPlain(properties[summaryKey]) : undefined,
      created: block.created_time as number | undefined,
      edited: block.last_edited_time as number | undefined,
    });
  }
  console.log(`Found ${rows.size} rows in the Notion database`);
  return rows;
}

(async () => {
  try {
    const { tools, galleryOrder, ids } = await fetchSuperIndex();
    const rows = await fetchNotionRows(ids);
    const orderIndex = new Map(galleryOrder.map((slug, i) => [slug, i]));

    const unmatched = [...tools.keys()].filter(uuid => !rows.has(uuid));
    if (unmatched.length > 0) {
      console.warn(`Warning: ${unmatched.length} tools have no matching Notion row:`, unmatched);
    }

    const data: ToolboxPage[] = [...tools.entries()]
      .map(([uuid, tool]) => {
        const row = rows.get(uuid);
        const isImageIcon = tool.icon?.startsWith('http');
        return {
          id: tool.slug,
          title: tool.title,
          url: `${BAW_BASE_URL}/tool/${tool.slug}`,
          notionId: uuid,
          notionUrl: `${NOTION_SITE_BASE}/${uuid.replaceAll('-', '')}`,
          emoji: isImageIcon ? undefined : tool.icon,
          iconUrl: isImageIcon ? tool.icon : undefined,
          coverImage: tool.cover,
          category: row?.category,
          summary: row?.summary,
          created: new Date(row?.created ?? tool.created).toISOString(),
          lastEdited: new Date(row?.edited ?? tool.edited).toISOString(),
          displayOrder: orderIndex.get(tool.slug) ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (data.length < MIN_EXPECTED_TOOLS) {
      console.log(
        `Only found ${data.length} toolbox items, expected at least ${MIN_EXPECTED_TOOLS}. Skipping update of toolboxPages.json.`,
      );
      return;
    }

    const newDataString = JSON.stringify(data, null, 2) + '\n';
    try {
      const existingDataString = await readFile(OUTPUT_PATH, 'utf-8');
      if (existingDataString === newDataString) {
        console.log('No changes detected, skipping update of toolboxPages.json.');
        return;
      }
    } catch {
      // File doesn't exist or is unreadable, proceed with write
    }

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, newDataString);
    console.log(`Successfully wrote ${data.length} items to toolboxPages.json`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
