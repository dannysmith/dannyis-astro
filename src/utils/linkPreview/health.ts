/**
 * One end-of-build report for everything that went wrong fetching external
 * links and their images.
 *
 * Warnings print as they happen (so you can see which page triggered them) and
 * collect into a summary, because scrolling back through a 227-page build to
 * count them is how link rot goes unnoticed. Nothing here ever fails the build:
 * other people's sites breaking is not our build error.
 */

/* global process */

/** A link that isn't HTML is not a problem — a PDF link is a good link. */
export type LinkProblem = 'blocked' | 'dead' | 'unreachable' | 'image'

// The summary lines themselves, so the same page rendering four times reports
// once — but a page that is both dead and missing its image reports both.
const problems = new Set<string>()

export function recordProblem(url: string, problem: LinkProblem, detail?: string): void {
  problems.add(`${problem}: ${url}`)
  // Leading newline: these land mid-render, in the middle of Astro's progress lines.
  console.warn(`\nLink ${problem}${detail ? ` (${detail})` : ''}: ${url}`)
}

process.on('exit', () => {
  if (problems.size === 0) return
  console.warn(`\nLink health: ${problems.size} problem(s) with external links.`)
  for (const line of problems) console.warn(`  ${line}`)
})
