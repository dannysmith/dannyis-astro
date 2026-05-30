/**
 * Generates the static default OG image (public/og-default.png) using the same
 * pipeline, background and fonts as the dynamic per-page covers, so it stays
 * visually consistent. This is a one-off: the file is committed and served
 * statically (used for the home page and any page without its own cover).
 *
 * Re-run after changing branding, the background, or the profile template:
 *   bun run generate-og-image
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateOGImage } from '../src/utils/og-image-generator.ts';
import { getConfig } from '../src/config/config.ts';

const config = getConfig();

const png = await generateOGImage(
  { title: config.author.fullName, url: config.site.url },
  { template: 'profile', width: 1200, height: 630 }
);

const outPath = path.join(process.cwd(), 'public', 'og-default.png');
await fs.writeFile(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes)`);
