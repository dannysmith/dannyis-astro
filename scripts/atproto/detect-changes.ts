/**
 * Report whether the records this site shows have changed on the PDS since it
 * was last deployed. The logic is src/utils/atproto/changes.ts; this is the
 * command line around it.
 *
 *   bun scripts/atproto/detect-changes.ts https://danny.is/atproto-state.json
 *
 * Run by .github/workflows/atproto-detect-changes.yml every couple of hours, from a
 * sparse checkout with no `bun install` — so nothing here, or in anything it
 * imports, may import from npm.
 *
 * Exits 0 whenever it simply can't tell — no manifest yet, the PDS down. That's
 * not a failure worth an email; it just means no rebuild this time. Anything
 * else (a manifest our own build mangled, say) is a bug, and is left to throw:
 * the run fails, nothing is dispatched, and someone finds out.
 *
 * Under GitHub Actions the result is also written to $GITHUB_OUTPUT as
 * `changed`, `state` and `built_at`.
 */

import { appendFileSync } from 'node:fs'
import { detectChanges } from '../../src/utils/atproto/changes.ts'

const manifestUrl = process.argv[2]
if (!manifestUrl) {
  console.error('Usage: bun scripts/atproto/detect-changes.ts <manifest-url>')
  process.exit(2)
}

const result = await detectChanges(manifestUrl)

if (result.changed) {
  console.log(`Changed since the last build: ${result.changedSources.join(', ')}`)
  console.log(`PDS state ${result.state}; site built at ${result.builtAt}`)
} else {
  console.log(`No rebuild: ${result.reason}.`)
}

if (process.env.GITHUB_OUTPUT) {
  const outputs = result.changed
    ? { changed: 'true', state: result.state, built_at: result.builtAt }
    : { changed: 'false' }
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`)
  appendFileSync(process.env.GITHUB_OUTPUT, lines.join(''))
}
