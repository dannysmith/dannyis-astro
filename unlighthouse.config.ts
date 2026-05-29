// Configuration for Unlighthouse — site-wide Lighthouse audits. Unlighthouse
// is NOT a project dependency; it is run on demand via `bunx`. The recommended
// way to run it is `bun run audit` against a local build — see
// docs/developer/lighthouse-audits.md.
//
// This file is a plain object (no import from the package) so that it stays
// type-checkable by `astro check` without Unlighthouse being installed.
import { readdirSync, readFileSync } from 'fs';
import { redirects } from './src/config/redirects.ts';

// Both kinds of redirect on this site bounce the crawler off to external sites
// (Medium, Notion, YouTube…), where it wastes minutes running Lighthouse on
// pages we don't own. We exclude both, derived from source so new redirects are
// covered automatically.
//
// 1. Global redirects (src/config/redirects.ts) — anchored regexes per path.
const redirectExcludes = Object.keys(redirects).map(path => `^${path}/?$`);

// 2. Article redirects — posts with a `redirectURL` frontmatter field render a
// meta-refresh (see src/layouts/Article.astro). Their URL is /writing/<id>/,
// and the id is just the filename, so we glob the articles for that field.
const articlesDir = new URL('./src/content/articles/', import.meta.url);
const articleRedirectExcludes = readdirSync(articlesDir)
  .filter(file => /\.mdx?$/.test(file))
  .filter(file => /^redirectURL:/m.test(readFileSync(new URL(file, articlesDir), 'utf8')))
  .map(file => `^/writing/${file.replace(/\.mdx?$/, '')}/?$`);

export default {
  // Defaults to the live production site, but the `audit` script overrides
  // this with `--site http://localhost:4321` to scan a local build instead.
  // Auditing localhost avoids the 403s Vercel's DDoS mitigation throws when a
  // multi-sample crawl hammers production from one IP.
  site: process.env.UNLIGHTHOUSE_SITE || 'https://danny.is',

  // Accuracy settings — see https://unlighthouse.dev/guide/recipes/improving-accuracy
  scanner: {
    // Run each page multiple times and keep the best result, reducing
    // run-to-run noise in timing-based metrics.
    samples: 5,
    // Simulate a throttled (4G) connection. On by default, set explicitly.
    throttle: true,
    // Scan every route. Unlighthouse otherwise groups similar pages and scans
    // only a representative sample of each group; we want full coverage.
    dynamicSampling: false,
    // Don't follow redirect URLs off to external sites (see above).
    exclude: [...redirectExcludes, ...articleRedirectExcludes],
  },

  puppeteerClusterOptions: {
    // Scan one page at a time so parallel scans don't compete for CPU and
    // skew timing metrics (LCP/TBT). Slower, but more stable month-to-month.
    maxConcurrency: 1,
  },
};
