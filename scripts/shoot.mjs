// Full-page screenshots of any page, at a spread of viewport widths and in both
// OS themes, for visual inspection while working. Writes PNGs to
// docs/tasks-todo/temporary by default. Needs a running server (usually `bun run dev`).
//
//   bun run shoot                     # the homepage ("/"), all default widths, light + dark
//   bun run shoot /writing            # a specific path from the site root
//   bun run shoot /notes --theme=dark # dark only
//   bun run shoot / --widths=390,1440 # custom widths
//   bun run shoot / --out=some/dir --base=http://localhost:4322
//
// Flags: --widths=<csv>  --theme=light|dark|both  --out=<dir>  --base=<url>
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const args = process.argv.slice(2)
const flags = Object.fromEntries(
  args
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=')
      return [k, v ?? true]
    }),
)
const path = args.find(a => !a.startsWith('--')) || '/'

const fail = msg => {
  console.error(`shoot: ${msg}`)
  process.exit(1)
}

// Value-taking flags passed bare (e.g. `--theme` with no `=…`) parse as `true`.
for (const key of ['base', 'out', 'theme', 'widths']) {
  if (flags[key] === true) fail(`--${key} needs a value, e.g. --${key}=…`)
}
if (flags.theme && !['light', 'dark', 'both'].includes(flags.theme)) {
  fail(`--theme must be light, dark or both (got "${flags.theme}")`)
}

// Trailing slash would double up against the slash-prefixed path.
const base = (flags.base || process.env.BASE_URL || 'http://localhost:4321').replace(/\/+$/, '')
const out = flags.out || 'docs/tasks-todo/temporary'
// A generalised spread from a small phone to an ultra-wide monitor.
const widths = String(flags.widths || '375,430,768,1024,1440,1920,2560')
  .split(',')
  .map(Number)
if (widths.some(w => !Number.isFinite(w) || w <= 0)) {
  fail(`--widths must be comma-separated positive numbers (got "${flags.widths}")`)
}
const themes = flags.theme && flags.theme !== 'both' ? [flags.theme] : ['light', 'dark']

// Filename-safe slug of the path ("/" → "home", "/writing/x" → "writing-x"), and
// a shared run timestamp (YYYYMMDD-HHMMSS) so a run's shots group together.
const slug =
  path
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase() || 'home'
const stamp = new Date()
  .toISOString()
  .slice(0, 19)
  .replace(/[:T-]/g, m => (m === 'T' ? '-' : ''))

await mkdir(out, { recursive: true })

const browser = await chromium.launch()
try {
  for (const theme of themes) {
    const context = await browser.newContext({ colorScheme: theme })
    for (const width of widths) {
      const page = await context.newPage()
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
      const file = `${out}/${slug}-${theme}-${width}-${stamp}.png`
      await page.screenshot({ path: file, fullPage: true })
      console.log(`✓ ${theme} ${width}px → ${file}`)
      await page.close()
    }
    await context.close()
  }
} finally {
  await browser.close()
}
