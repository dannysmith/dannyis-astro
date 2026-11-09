/**
 * The markdown versions of articles and notes (`/writing/<id>.md`,
 * `/notes/<id>.md`), also served to agents that ask for `text/markdown`.
 *
 * Uses the post's source body, so MDX components stay as written. URLs are
 * made absolute so the file still works when pasted elsewhere.
 */
import type { ImageMetadata } from 'astro'
import type { CollectionEntry } from 'astro:content'
import { posix } from 'node:path'
import { getConfig } from '@config/config'
import { stripLeadingEsm } from '@utils/content-summary'

const config = getConfig()

/** Content images, keyed by their path from the project root (`src/assets/…`). */
const assetImages = import.meta.glob<ImageMetadata>(
  '/src/assets/**/*.{png,jpg,jpeg,gif,webp,avif}',
  { eager: true, import: 'default' },
)

/**
 * The built URL of an image in `src/assets`. Reading `src` is also what tells
 * Astro to keep the original file in the build, so only look up images a post
 * actually uses.
 */
function assetImageUrl(projectPath: string): string | undefined {
  return assetImages[`/${projectPath}`]?.src
}

/** Fenced code blocks and inline code, which are left exactly as written. */
const CODE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$|`[^`\n]+`/gm

/**
 * Markdown link/image destinations (`](url`, `[ref]: url`, but not footnotes)
 * and HTML/JSX `href`/`src` attributes. Group 1 is everything before the URL,
 * group 2 the URL.
 */
const URL_SLOT = /(\]\(|^[ \t]*\[(?!\^)[^\]\n]+\]:[ \t]*|\b(?:href|src)=["'])([^\s)"'>]+)/gm

/**
 * Make a post body's URLs absolute, outside code. A relative URL (`./`, `../`)
 * is resolved against the post's source file and rewritten only when it lands
 * on an image in `src/assets`; root-relative URLs (`/writing/…`) get `siteUrl`.
 *
 * @param body The post's markdown/MDX body.
 * @param filePath The post's source path from the project root
 *   (`src/content/articles/foo.mdx`), as on a content entry's `filePath`.
 * @param resolveAsset Built URL for a project-root image path, if it's a known asset.
 */
export function absoluteUrls(
  body: string,
  filePath: string,
  siteUrl: string,
  resolveAsset: (projectPath: string) => string | undefined,
): string {
  const sourceDir = posix.dirname(filePath)

  const rewrite = (prose: string) =>
    prose.replace(URL_SLOT, (match, before: string, url: string) => {
      if (url.startsWith('/') && !url.startsWith('//')) return before + siteUrl + url
      if (url.startsWith('./') || url.startsWith('../')) {
        const asset = resolveAsset(posix.join(sourceDir, url))
        if (asset) return before + new URL(asset, siteUrl).href
      }
      return match
    })

  let result = ''
  let last = 0
  for (const code of body.matchAll(CODE)) {
    result += rewrite(body.slice(last, code.index)) + code[0]
    last = code.index + code[0].length
  }
  return result + rewrite(body.slice(last))
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * The full markdown file for a post: title, a byline with dates and the
 * canonical URL, a pointer to llms.txt, a note's source link or an external
 * article's real home, then the body.
 *
 * @param path The post's canonical path, e.g. `/writing/foo/`.
 */
export function postMarkdown(
  entry: CollectionEntry<'articles'> | CollectionEntry<'notes'>,
  path: string,
): string {
  const { title, pubDate } = entry.data
  const siteUrl = config.site.url
  const updatedDate = 'updatedDate' in entry.data ? entry.data.updatedDate : undefined
  const sourceURL = 'sourceURL' in entry.data ? entry.data.sourceURL : undefined
  const redirectURL = 'redirectURL' in entry.data ? entry.data.redirectURL : undefined

  const byline = [
    `By ${config.author.fullName}`,
    `Published ${isoDay(pubDate)}`,
    updatedDate && `Updated ${isoDay(updatedDate)}`,
    `<${siteUrl}${path}>`,
  ]
    .filter(Boolean)
    .join(' · ')

  const parts = [
    `# ${title}`,
    byline,
    // Points agents at the site index (afdocs llms-txt-directive-md).
    `> For the complete site index, see [llms.txt](${siteUrl}/llms.txt)`,
  ]
  if (sourceURL) parts.push(`Source: <${sourceURL}>`)
  // Articles published elsewhere (Medium, mostly) have no body here.
  if (redirectURL) parts.push(`Published at <${redirectURL}>`)

  const body = stripLeadingEsm(entry.body ?? '')
  if (body) parts.push(absoluteUrls(body, entry.filePath ?? '', siteUrl, assetImageUrl))

  return parts.join('\n\n') + '\n'
}
