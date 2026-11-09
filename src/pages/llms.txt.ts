import type { APIRoute } from 'astro'
import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import { getConfig } from '@config/config'
import { filterContentForListing, getSortedProjects } from '@utils/content'
import { absoluteUrls } from '@utils/content-markdown'
import { generateSummary, stripLeadingEsm } from '@utils/content-summary'
import nowRaw from './now.mdx?raw'

const config = getConfig()

// The prose of now.mdx: no frontmatter, imports or standalone component tags,
// headings nested under "## Now", links absolute.
const nowMarkdown = absoluteUrls(
  stripLeadingEsm(nowRaw.replace(/^---\n[\s\S]*?\n---\n/, ''))
    .replace(/^[ \t]*<\/?[A-Z][^>]*>[ \t]*$/gm, '')
    .replace(/^(#+) /gm, '#$1 ')
    .replace(/\n{3,}/g, '\n\n')
    .trim(),
  'src/pages/now.mdx',
  config.site.url,
  () => undefined,
)

// =============================================================================
// CUSTOMIZABLE CONTENT
// Update these sections as needed. The rest is auto-generated.
// =============================================================================

const ABOUT_CONTENT = `Danny is a consultant who helps companies with leadership, remote work and operations. He also makes software, including Taskdn and Astro Editor, and writes about work, leadership, technology, design and building software with AI.

This site is Danny's corner of the web - a place to share thoughts, experiences and work, and a creative playground for experimenting with CSS, HTML and AI-assisted development.`

// Pages to exclude from "Other Pages" (matched against URL path)
const EXCLUDED_PAGES = ['/scratchpad/', '/404/']

// Styleguide pages are listed under "Optional" below, with hand-written titles,
// and are excluded from the auto-discovered "Other Pages" list.
const STYLEGUIDE_PAGES: Array<{ path: string; title: string }> = [
  { path: '/styleguide/', title: 'Overview' },
  { path: '/styleguide/foundations/', title: 'Foundations' },
  { path: '/styleguide/typography/', title: 'Typography' },
  { path: '/styleguide/components/', title: 'Content' },
  { path: '/styleguide/ui/', title: 'UI' },
  { path: '/styleguide/html/', title: 'HTML' },
]

// =============================================================================
// PAGE DISCOVERY
// Auto-discovers static pages from src/pages/, excluding dynamic routes and partials
// =============================================================================

function discoverStaticPages(): Array<{ path: string; title: string }> {
  // Glob all .astro/.mdx page files (eager: false since we only need paths)
  const pageFiles = import.meta.glob('./**/*.{astro,mdx}', { eager: false })

  return Object.keys(pageFiles)
    .filter(file => {
      // Exclude dynamic routes (contain [...])
      if (file.includes('[')) return false
      // Exclude partials (start with _)
      if (file.includes('/_')) return false
      // Exclude the homepage
      if (file === './index.astro') return false
      return true
    })
    .map(file => {
      // Convert file path to URL path: ./foo/index.astro -> /foo/
      const path =
        '/' +
        file
          .replace(/^\.\//, '') // Remove leading ./
          .replace(/\/index\.(astro|mdx)$/, '/') // /foo/index.astro -> /foo/
          .replace(/\.(astro|mdx)$/, '/') // /foo.mdx -> /foo/

      // Derive title from path: /foo-bar/ -> Foo Bar, /about/team/ -> About Team
      const title = path
        .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
        .split(/[-/]/) // Split on both hyphens and slashes
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      return { path, title }
    })
    .filter(({ path }) => !EXCLUDED_PAGES.includes(path) && !path.startsWith('/styleguide'))
    .sort((a, b) => a.title.localeCompare(b.title))
}

// =============================================================================
// GENERATION LOGIC
// =============================================================================

/**
 * `: <summary>` after a post's link, to help agents pick what to fetch. Empty
 * when the post has no description and no body to summarise.
 */
function linkDescription(entry: CollectionEntry<'articles'> | CollectionEntry<'notes'>): string {
  const summary = generateSummary(entry)
  return summary === `${entry.data.title}...` ? '' : `: ${summary}`
}

export const GET: APIRoute = async () => {
  const articles = filterContentForListing(
    await getCollection('articles'),
  ) as CollectionEntry<'articles'>[]
  articles.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const notes = filterContentForListing(await getCollection('notes')) as CollectionEntry<'notes'>[]
  notes.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const lines: string[] = []

  // Title
  lines.push(`# ${config.site.name}`)
  lines.push('')

  // AI Summary
  lines.push(`> ${config.descriptions.aiSummary}`)
  lines.push('')

  // About
  lines.push(ABOUT_CONTENT)
  lines.push('')

  // External links
  lines.push('## Links')
  lines.push('')
  lines.push(`- [Website](${config.site.url})`)
  lines.push(`- [Avatar](${config.author.avatarUrl})`)
  lines.push(`- [Email](mailto:${config.author.email})`)
  for (const profile of config.socialProfiles) {
    lines.push(`- [${profile.name}](${profile.url})`)
  }
  lines.push('')

  // Now (imported from src/pages/now.mdx)
  lines.push('## Now')
  lines.push('')
  lines.push(nowMarkdown.trim())
  lines.push('')

  // Articles
  lines.push('## Articles')
  lines.push('')
  lines.push('Long-form articles by Danny.')
  lines.push('')
  for (const article of articles) {
    // Link to the .md variant so agents fetch markdown directly (afdocs
    // llms-txt-links-markdown). Every listed article has a .md route: llms.txt
    // uses filterContentForListing (no drafts, no styleguide), a subset of the
    // .md routes' filterContentForPage (no drafts).
    const url = `${config.site.url}/writing/${article.id}.md`
    lines.push(`- [${article.data.title}](${url})${linkDescription(article)}`)
  }
  lines.push('')

  // Notes
  lines.push('## Notes')
  lines.push('')
  lines.push('Short-form thoughts and observations.')
  lines.push('')
  for (const note of notes) {
    // Link to the .md variant (see Articles loop above).
    const url = `${config.site.url}/notes/${note.id}.md`
    lines.push(`- [${note.data.title}](${url})${linkDescription(note)}`)
  }
  lines.push('')

  // Projects (no per-project routes, so each links to its /making anchor).
  // Cast for the same reason as the articles/notes loops above: the generic
  // helper's return would otherwise widen to its constraint type here.
  const projects = getSortedProjects(
    await getCollection('projects'),
  ) as CollectionEntry<'projects'>[]
  lines.push('## Projects')
  lines.push('')
  lines.push('Things Danny has made and is making.')
  lines.push('')
  for (const project of projects) {
    const url = `${config.site.url}/making#${project.id}`
    lines.push(`- [${project.data.title}](${url}): ${project.data.byline}`)
  }
  lines.push('')

  // Other pages (auto-discovered)
  const staticPages = discoverStaticPages()
  lines.push('## Other Pages')
  lines.push('')
  for (const page of staticPages) {
    lines.push(`- [${page.title}](${config.site.url}${page.path})`)
  }
  lines.push('')

  // External links from config
  if (config.externalLinks.length > 0) {
    lines.push('## External')
    lines.push('')
    for (const link of config.externalLinks) {
      const desc = link.description ? `: ${link.description}` : ''
      lines.push(`- [${link.name}](${link.url})${desc}`)
    }
    lines.push('')
  }

  // "Optional" is the llms.txt spec's section for links agents can skip when
  // they need a shorter context.
  lines.push('## Optional')
  lines.push('')
  for (const page of STYLEGUIDE_PAGES) {
    const url = `${config.site.url}${page.path}`
    lines.push(`- [Styleguide: ${page.title}](${url}): the site's design system and components`)
  }

  const content = lines.join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
