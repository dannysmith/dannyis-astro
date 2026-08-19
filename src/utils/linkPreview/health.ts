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

export type LinkProblem = 'blocked' | 'dead' | 'unreachable' | 'non-html' | 'image'

const problems = new Map<string, LinkProblem>()

export function recordProblem(url: string, problem: LinkProblem, detail?: string): void {
  problems.set(url, problem)
  // Leading newline: these land mid-render, in the middle of Astro's progress lines.
  console.warn(`\nLink ${problem}${detail ? ` (${detail})` : ''}: ${url}`)
}

process.on('exit', () => {
  if (problems.size === 0) return
  console.warn(`\nLink health: ${problems.size} link(s) did not resolve cleanly.`)
  for (const [url, problem] of problems) console.warn(`  ${problem}: ${url}`)
})
