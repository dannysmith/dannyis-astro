/**
 * Vercel-specific deploy step. NOT part of the portable build.
 *
 * Reads the base Build Output API config (vercel.output-config.json) and the
 * host-agnostic redirect manifest emitted by the Astro build (dist/redirects.json),
 * turns each redirect into a real HTTP redirect route, injects them ahead of the
 * markdown-negotiation / filesystem routes, and writes the final config to
 * .vercel/output/config.json.
 *
 * Runs in the "Prepare Vercel output" CI step (after `astro build`). Pass
 * --stdout to print the result instead of writing it (local inspection):
 *   bun run build && bun scripts/build-vercel-config.mjs --stdout
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'vercel.output-config.json';
const MANIFEST = 'dist/redirects.json';
const OUT = '.vercel/output/config.json';
// Inject redirects right after this route — a sibling redirect that already sits
// before the markdown-negotiation and filesystem routes.
const ANCHOR_SRC = '^/cv\\.pdf$';

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = JSON.parse(readFileSync(BASE, 'utf8'));

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(`Missing ${MANIFEST}. Run \`bun run build\` first (the Astro build emits it).`);
    process.exit(1);
  }
  throw err;
}

const redirectRoutes = manifest.redirects.map(({ source, destination, status }) => ({
  src: `^${escapeRegex(source)}/?$`,
  status: status ?? 302,
  headers: { location: destination },
}));

const anchor = config.routes.findIndex(r => r.src === ANCHOR_SRC);
if (anchor === -1) {
  console.error(`Could not find anchor route (${ANCHOR_SRC}) in ${BASE}.`);
  process.exit(1);
}
config.routes.splice(anchor + 1, 0, ...redirectRoutes);

const out = JSON.stringify(config, null, 2) + '\n';

if (process.argv.includes('--stdout')) {
  process.stdout.write(out);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`Wrote ${OUT} (${redirectRoutes.length} generated redirect routes).`);
}
