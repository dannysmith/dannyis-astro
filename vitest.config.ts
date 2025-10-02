import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components/index.ts', import.meta.url)),
      '@components/layout': fileURLToPath(
        new URL('./src/components/layout/index.ts', import.meta.url)
      ),
      '@components/navigation': fileURLToPath(
        new URL('./src/components/navigation/index.ts', import.meta.url)
      ),
      '@components/mdx': fileURLToPath(new URL('./src/components/mdx/index.ts', import.meta.url)),
      '@components/ui': fileURLToPath(new URL('./src/components/ui/index.ts', import.meta.url)),
      '@components/icons': fileURLToPath(
        new URL('./src/components/icons/index.ts', import.meta.url)
      ),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
});
