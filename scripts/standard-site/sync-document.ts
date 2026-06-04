#!/usr/bin/env tsx
/**
 * Sync blog posts to AT Protocol as site.standard.document records.
 *
 * Used by the standard-site-sync CI workflow (and runnable locally). For each
 * selected post that qualifies (published, not a styleguide, on/after
 * siteConfig.standardSite.since), upserts a site.standard.document record at a
 * deterministic rkey derived from the post — so the record key matches the
 * AT-URI the site renders in its link tag, with no stored mapping. Idempotent:
 * re-running updates in place, which is also how edits propagate.
 *
 * Usage:
 *   # Sync specific posts (CI passes added/modified files):
 *   ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- \
 *     src/content/articles/2012-06-05-a-simpler-responsive-grid.mdx [more…] [--dry-run]
 *
 *   # Backfill every post (ignores the `since` cutoff with --force):
 *   ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --all --force
 *
 *   # Delete records (full undo of a backfill):
 *   ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete --all
 *   ATPROTO_APP_PASSWORD=xxxx bun run standard-site:sync -- --delete <files…>
 *
 * Flags:
 *   --dry-run  Preview without writing to the PDS (skips the coverImage upload).
 *   --all      Operate on every post in both collections (instead of file args).
 *   --force    Upsert even posts before the `since` cutoff (for backfilling).
 *              Never overrides the draft/styleguide exclusions.
 *   --delete   Remove records instead of upserting. With --all, enumerates and
 *              deletes the entire site.standard.document collection.
 *
 * Reference: https://standard.site/docs/lexicons/document/
 */

/* global fetch */

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import matter from 'gray-matter';
import { getConfig } from '../../src/config/config.ts';
import {
  getDocumentRkey,
  getDocumentPath,
  qualifiesForStandardSite,
  type StandardSiteCollection,
} from '../../src/utils/standard-site.ts';
import { login, type Session } from './auth.ts';

const COLLECTION = 'site.standard.document';
const DIRS: Record<StandardSiteCollection, string> = {
  articles: 'src/content/articles',
  notes: 'src/content/notes',
};
// Dated post files (date prefix, optional slug). Excludes styleguides and other
// non-dated files so --all never pushes a bogus record.
const POST_FILE_RE = /(^|\/)\d{4}-\d{2}-\d{2}(-.+)?\.mdx?$/;

// Keep textContent well under atproto's per-record size ceiling; truncate very
// long posts rather than failing the putRecord.
const MAX_TEXT_CONTENT = 50_000;
// Lexicon coverImage blob cap.
const MAX_BLOB_BYTES = 1_000_000;

/** Reduce markdown/MDX to a plaintext approximation for the document's textContent. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^\s*(import|export)\s.*$/gm, ' ') // MDX import/export statements
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // blockquotes
    .replace(/[*_~]{1,3}/g, '') // emphasis markers
    .replace(/<[^>]+>/g, ' ') // raw HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}

/** The collection a content file belongs to (from its path). */
function collectionFromPath(file: string): StandardSiteCollection | null {
  if (file.includes('content/articles')) return 'articles';
  if (file.includes('content/notes')) return 'notes';
  return null;
}

/**
 * The canonical content-layer id for a post: `slug` frontmatter when present
 * (Astro's glob loader uses it as the entry id), else the filename stem. Must
 * match what the site renders, or build and sync disagree on rkey + path.
 */
function canonicalPostId(file: string, data: Record<string, unknown>): string {
  if (typeof data.slug === 'string' && data.slug) return data.slug;
  return basename(file).replace(/\.mdx?$/, '');
}

/** Every dated post file across both collections. */
function allPostFiles(): string[] {
  const files: string[] = [];
  for (const dir of Object.values(DIRS)) {
    for (const f of readdirSync(dir, { recursive: true })) {
      const rel = String(f);
      if (POST_FILE_RE.test(rel)) files.push(join(dir, rel));
    }
  }
  return files;
}

interface DocumentRecord {
  $type: 'site.standard.document';
  site: string;
  title: string;
  publishedAt: string;
  path: string;
  description?: string;
  tags?: string[];
  textContent?: string;
  updatedAt?: string;
  coverImage?: unknown; // BlobRef from uploadBlob
  // putRecord types `record` with an open index signature; satisfy it.
  [key: string]: unknown;
}

/**
 * Fetch the post's deployed OG image and upload it as a blob. Runs after deploy,
 * so the URL is live. Returns undefined (with a warning) on any failure or if the
 * image exceeds the 1 MB cap — a missing cover never fails the sync.
 */
async function uploadCoverImage(
  session: Session,
  collection: StandardSiteCollection,
  postId: string
): Promise<unknown> {
  const url = `${getConfig().site.url}${getDocumentPath(collection, postId)}og-image.png`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`⚠️  ${postId}: OG image ${res.status} at ${url}, skipping coverImage`);
      return undefined;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_BLOB_BYTES) {
      console.warn(`⚠️  ${postId}: OG image ${bytes.byteLength}B > 1MB, skipping coverImage`);
      return undefined;
    }
    const up = await session.agent.uploadBlob(bytes, { encoding: 'image/png' });
    return up.data.blob;
  } catch (err) {
    console.warn(
      `⚠️  ${postId}: OG image fetch failed (${(err as Error).message}), skipping coverImage`
    );
    return undefined;
  }
}

async function buildRecord(
  session: Session | null,
  collection: StandardSiteCollection,
  postId: string,
  pubDate: Date,
  data: Record<string, unknown>,
  body: string
): Promise<DocumentRecord> {
  const config = getConfig();
  const record: DocumentRecord = {
    $type: 'site.standard.document',
    site: config.standardSite.publicationUri || config.site.url,
    title: String(data.title ?? ''),
    publishedAt: pubDate.toISOString(),
    path: getDocumentPath(collection, postId),
  };
  if (typeof data.description === 'string' && data.description) {
    record.description = data.description;
  }
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    record.tags = data.tags.map(t => String(t));
  }
  if (data.updatedDate) {
    record.updatedAt = new Date(data.updatedDate as string).toISOString();
  }
  let textContent = stripMarkdown(body);
  if (textContent.length > MAX_TEXT_CONTENT) {
    console.warn(
      `⚠️  ${postId}: textContent truncated from ${textContent.length} to ${MAX_TEXT_CONTENT} chars`
    );
    textContent = textContent.slice(0, MAX_TEXT_CONTENT);
  }
  if (textContent) {
    record.textContent = textContent;
  }
  if (session) {
    const cover = await uploadCoverImage(session, collection, postId);
    if (cover) record.coverImage = cover;
  }
  return record;
}

/** Enumerate and delete every record in the collection — the full backfill undo. */
async function deleteEntireCollection(session: Session, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`🔎 Would delete every record in ${COLLECTION} (dry run)`);
    return;
  }
  let cursor: string | undefined;
  let count = 0;
  do {
    const res = await session.agent.com.atproto.repo.listRecords({
      repo: session.did,
      collection: COLLECTION,
      limit: 100,
      cursor,
    });
    for (const rec of res.data.records) {
      const rkey = rec.uri.split('/').pop()!;
      await session.agent.com.atproto.repo.deleteRecord({
        repo: session.did,
        collection: COLLECTION,
        rkey,
      });
      count++;
    }
    cursor = res.data.cursor;
  } while (cursor);
  console.log(`🗑️  Deleted ${count} record(s) from ${COLLECTION}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const force = args.includes('--force');
  const del = args.includes('--delete');
  const fileArgs = args.filter(a => !a.startsWith('--'));

  const session = dryRun ? null : await login();

  // Full-collection wipe (true undo) — independent of source files / keys.
  if (del && all) {
    await deleteEntireCollection(session!, dryRun);
    return;
  }

  const files = all ? allPostFiles() : fileArgs;
  if (files.length === 0) {
    console.error(
      'Usage: standard-site:sync -- <post-file…> | --all  [--delete] [--force] [--dry-run]'
    );
    process.exit(1);
  }

  for (const file of files) {
    const collection = collectionFromPath(file);
    if (!collection) {
      console.warn(`⚠️  ${file}: not under a known content collection, skipping`);
      continue;
    }

    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const postId = canonicalPostId(file, data);
    const pubDate = new Date(data.pubDate as string);
    const rkey = getDocumentRkey(collection, postId, pubDate);

    if (del) {
      if (dryRun) {
        console.log(`🔎 ${postId} → would delete ${COLLECTION}/${rkey}`);
        continue;
      }
      try {
        await session!.agent.com.atproto.repo.deleteRecord({
          repo: session!.did,
          collection: COLLECTION,
          rkey,
        });
        console.log(`🗑️  ${postId} → deleted ${COLLECTION}/${rkey}`);
      } catch (err) {
        console.warn(
          `⚠️  ${postId}: delete failed (record may not exist): ${(err as Error).message}`
        );
      }
      continue;
    }

    if (data.draft === true) {
      console.log(`⏭️  ${postId}: draft, skipping`);
      continue;
    }
    if (data.styleguide === true) {
      console.log(`⏭️  ${postId}: styleguide, skipping`);
      continue;
    }
    // Externally-hosted posts (their page just redirects off-site) never get a
    // record — not even with --force.
    if (data.redirectURL) {
      console.log(`⏭️  ${postId}: external (redirectURL), skipping`);
      continue;
    }
    if (
      !force &&
      !qualifiesForStandardSite({
        draft: data.draft as boolean,
        styleguide: data.styleguide as boolean,
        redirectURL: data.redirectURL as string | undefined,
        pubDate,
      })
    ) {
      console.log(
        `⏭️  ${postId}: before since=${getConfig().standardSite.since}, skipping (use --force)`
      );
      continue;
    }

    const record = await buildRecord(session, collection, postId, pubDate, data, content);

    if (dryRun) {
      console.log(`📄 ${postId} → ${COLLECTION}/${rkey}`);
      console.log(JSON.stringify(record, null, 2));
      continue;
    }

    await session!.agent.com.atproto.repo.putRecord({
      repo: session!.did,
      collection: COLLECTION,
      rkey,
      record,
    });
    console.log(`✅ ${postId} → at://${session!.did}/${COLLECTION}/${rkey}`);
  }
}

main().catch(err => {
  console.error('❌ sync-document failed:', err);
  process.exit(1);
});
