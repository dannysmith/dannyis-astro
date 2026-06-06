#!/usr/bin/env tsx
/**
 * Create (or update) this site's site.standard.publication record.
 *
 * One-time setup: run once, then paste the printed AT-URI into
 * siteConfig.standardSite.publicationUri. The publication lexicon uses a TID
 * record key (not a fixed "self"), so this looks up any existing publication
 * record and updates it in place; otherwise it creates a new one and lets the
 * PDS assign the key. Re-running is therefore idempotent.
 *
 * Sets the publication icon (avatar, shown in Bluesky's enhanced link cards) and
 * a basicTheme derived from the brand palette (the OKLCH light-mode tokens in
 * src/styles/_foundation.css, converted to sRGB).
 *
 * Usage:
 *   ATPROTO_APP_PASSWORD=xxxx bun run standard-site:publication [--dry-run]
 *
 * Reference: https://standard.site/
 */

import { readFileSync } from 'node:fs';
import { login } from './auth.ts';
import { getConfig } from '../../src/config/config.ts';

const COLLECTION = 'site.standard.publication';
const ICON_PATH = 'public/avatar-circle.png';

/** Brand palette (light-mode `_foundation.css` tokens, converted OKLCH → sRGB). */
const rgb = (r: number, g: number, b: number) => ({
  $type: 'site.standard.theme.color#rgb',
  r,
  g,
  b,
});
const basicTheme = {
  // Bluesky's ingester needs the $type discriminator on the theme object even
  // though the lexicon types basicTheme as a ref — without it our publication
  // record is silently dropped and cards never enrich.
  $type: 'site.standard.theme.basic',
  background: rgb(248, 241, 227), // beige  oklch(96% 0.02 85)
  foreground: rgb(35, 42, 44), // ink    oklch(28% 0.01 210)
  accent: rgb(250, 104, 99), // coral  oklch(70% 0.18 25)
  accentForeground: rgb(255, 255, 255), // white
};

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const config = getConfig();

  const baseRecord = {
    $type: COLLECTION,
    url: config.site.url,
    name: config.site.shortName,
    description: config.descriptions.site,
    basicTheme,
    preferences: { showInDiscover: true },
  };

  if (dryRun) {
    console.log(`📄 ${COLLECTION} (dry run — nothing written; icon would be ${ICON_PATH}):`);
    console.log(JSON.stringify(baseRecord, null, 2));
    return;
  }

  const { agent, did } = await login();

  // Upload the icon blob and attach its ref.
  const iconBytes = new Uint8Array(readFileSync(ICON_PATH));
  const iconRes = await agent.uploadBlob(iconBytes, { encoding: 'image/png' });
  const record = { ...baseRecord, icon: iconRes.data.blob };

  // Reuse an existing publication record if one is already present.
  const existing = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: COLLECTION,
    limit: 1,
  });
  const existingUri = existing.data.records[0]?.uri;

  let uri: string;
  if (existingUri) {
    const rkey = existingUri.split('/').pop()!;
    const res = await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: COLLECTION,
      rkey,
      record,
    });
    uri = res.data.uri;
    console.log('✅ Existing publication record updated.');
  } else {
    // Omit rkey so the PDS assigns a valid TID for this tid-keyed collection.
    const res = await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: COLLECTION,
      record,
    });
    uri = res.data.uri;
    console.log('✅ Publication record created.');
  }

  console.log('');
  console.log('AT-URI (paste into siteConfig.standardSite.publicationUri):');
  console.log(`  ${uri}`);
}

main().catch(err => {
  console.error('❌ Failed to create publication record:', err);
  process.exit(1);
});
