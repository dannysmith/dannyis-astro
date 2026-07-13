import type { KnipConfig } from 'knip';

export default {
  entry: [
    'src/pages/**/*.{astro,mdx,js,ts}',
    'scripts/**/*.{ts,js}',
    'src/lib/**/*.{ts,mjs}',
    'tests/**/*.{test,spec}.ts',
  ],
  project: ['src/**/*.{ts,tsx,astro}', 'scripts/**/*.{ts,js}', 'tests/**/*.ts'],
  ignoreDependencies: ['@iconify-json/heroicons'],
} satisfies KnipConfig;
