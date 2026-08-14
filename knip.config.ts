import type { KnipConfig } from 'knip'

export default {
  entry: [
    'src/pages/**/*.{astro,mdx,js,ts}',
    'scripts/**/*.{ts,js}',
    'src/lib/**/*.{ts,mjs}',
    'tests/**/*.{test,spec}.ts',
  ],
  project: ['src/**/*.{ts,tsx,astro}', 'scripts/**/*.{ts,js}', 'tests/**/*.ts'],
  // astro-icon resolves icon sets by string name at build time (`<Icon
  // name="simple-icons:x" />`), so nothing ever imports these packages and
  // knip's import graph can't see them.
  ignoreDependencies: ['@iconify-json/heroicons', '@iconify-json/simple-icons'],
} satisfies KnipConfig
