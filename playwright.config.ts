import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'bun run dev',
    // `url` (not `port`) so the readiness/reuse check is a real HTTP request —
    // robust when an existing server is listening on IPv6 (`::1`) only.
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 120000,
    // Astro 7's `astro dev` auto-detects agent/CI environments (via `am-i-vibing`)
    // and runs the dev server as a *background* process, so the foreground command
    // returns immediately and Playwright reports "webServer exited early". Setting
    // `ASTRO_DEV_BACKGROUND` disables that auto-backgrounding (see astro's
    // cli/dev/index.js), forcing a normal long-running foreground server whether a
    // human or an agent runs the tests.
    env: { ASTRO_DEV_BACKGROUND: '1' },
  },
})
