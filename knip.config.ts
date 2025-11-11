import type { KnipConfig } from 'knip';

export default {
  // Knip's Astro plugin auto-detects these by default:
  // - astro.config.{js,cjs,mjs,ts,mts}
  // - src/pages/**/*.{astro,mdx,js,ts}
  // - src/content.config.ts
  // - src/middleware.ts

  // Add additional entry points not covered by Astro plugin
  entry: [
    // Default Astro entries (auto-detected)
    'src/pages/**/*.{astro,mdx,js,ts}',
    'src/content.config.ts',
    'astro.config.mjs',

    // Additional project-specific entries
    'scripts/**/*.{ts,js}', // Utility scripts
    'src/lib/**/*.{ts,mjs}', // Custom remark/rehype plugins
    'tests/**/*.{test,spec}.ts', // Test files

    // Config files
    'vitest.config.ts',
    'playwright.config.ts',
    'eslint.config.js',
  ],

  // Define which files to analyze for unused exports
  project: ['src/**/*.{ts,tsx,astro}', 'scripts/**/*.{ts,js}', 'tests/**/*.ts'],

  // Standard ignores
  ignore: ['dist/**', 'node_modules/**', '.astro/**', 'public/**'],

  // Ignore certain dependencies that might be flagged incorrectly
  ignoreDependencies: [
    '@astropub/icons', // Used in astro-icon integration
    '@iconify-json/heroicons', // Icon set for astro-icon
    '@vercel/og', // Used for OG image generation (dynamic import)
    'mermaid', // Used by rehype-mermaid plugin
    'prettier-plugin-astro', // Used by Prettier (plugin detection)
    'jscpd', // Analysis tool, not imported in source
  ],
} satisfies KnipConfig;
