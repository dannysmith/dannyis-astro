// Full-page screenshots of the homepage at a few viewport widths, for eyeballing
// layout work. Needs a running server (dev or preview).
//
//   bun run dev            # in another terminal (or already running)
//   bun run shoot:home     # writes PNGs to docs/tasks-todo/temporary/
//
// Override the target with BASE_URL, e.g. BASE_URL=http://localhost:4322 bun run shoot:home
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL || 'http://localhost:4321'
const PATH = process.env.SHOOT_PATH || '/'
const OUT = 'docs/tasks-todo/temporary'
const WIDTHS = (process.env.WIDTHS || '390,768,1440').split(',').map(Number)

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(`${BASE}${PATH}`, { waitUntil: 'networkidle', timeout: 30000 })
    const file = `${OUT}/home-${width}.png`
    await page.screenshot({ path: file, fullPage: true })
    console.log(`✓ ${width}px → ${file}`)
    await page.close()
  }
} finally {
  await browser.close()
}
