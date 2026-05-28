// Configuration for Unlighthouse — site-wide Lighthouse audits of the
// production site. Unlighthouse is NOT a project dependency; it is run on
// demand via `bunx unlighthouse`. See docs/developer/lighthouse-audits.md.
//
// This file is a plain object (no import from the package) so that it stays
// type-checkable by `astro check` without Unlighthouse being installed.
export default {
  site: 'https://danny.is',

  // Accuracy settings — see https://unlighthouse.dev/guide/recipes/improving-accuracy
  scanner: {
    // Run each page multiple times and keep the best result, reducing
    // run-to-run noise in timing-based metrics.
    samples: 5,
    // Simulate a throttled (4G) connection. On by default, set explicitly.
    throttle: true,
  },

  puppeteerClusterOptions: {
    // Scan one page at a time so parallel scans don't compete for CPU and
    // skew timing metrics (LCP/TBT). Slower, but more stable month-to-month.
    maxConcurrency: 1,
  },
};
