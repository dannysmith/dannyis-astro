import type { KnipConfig } from 'knip'

export default {
  entry: [
    'src/pages/**/*.{astro,mdx,js,ts}',
    'scripts/**/*.{ts,js}',
    'src/lib/**/*.{ts,mjs}',
    'tests/**/*.{test,spec}.ts',
  ],
  project: ['src/**/*.{ts,tsx,astro}', 'scripts/**/*.{ts,js}', 'tests/**/*.ts'],
  // Kept for future pages, not yet used by any.
  ignore: ['src/layouts/BasicPage.astro'],
  // astro-icon resolves icon sets by string name at build time (`<Icon
  // name="simple-icons:x" />`), so nothing ever imports these packages and
  // knip's import graph can't see them.
  ignoreDependencies: ['@iconify-json/heroicons', '@iconify-json/simple-icons'],
  // Astro reads a component's exported `Props` interface implicitly, so knip
  // sees every one as an unused export.
  ignoreIssues: { 'src/**/*.astro': ['types'] },
} satisfies KnipConfig
