/**
 * Turns a post's rendered HTML into HTML that holds up in feed readers.
 *
 * The site's HTML assumes the site's CSS and JS. Readers have neither, and
 * sanitise what they're given: most drop `script`/`style`, strip `class` and
 * `style`, remove tags like `div`, `span`, `svg` and `input` (keeping their
 * text), and either hide or delete anything marked `hidden`. RSS also has no
 * base URL, so relative URLs break. This pass makes the generic fixes, so most
 * components need no feed-specific work:
 *
 * - URLs (`href`, `src`, `poster`) are made absolute against the post's URL,
 *   and `<picture>` / `srcset` collapse to one plain `<img src>`.
 * - Expressive Code blocks become plain `<pre><code>` with real newlines.
 * - `md preview` and `tree` blocks (raw `<markdown-preview>` / `<file-tree>`,
 *   whose content is in a `code` attribute) become plain code blocks.
 * - Markdown image captions (a `caption` attribute meant for BasicImage)
 *   become a `<figure>` with a `<figcaption>`.
 * - Mermaid diagrams and interactive islands become a link to the post.
 * - Every iframe is followed by a link: its fallback content, or its source.
 * - Interactive and visually-hidden markup is removed: scripts, styles,
 *   templates, buttons, decorative SVG icons and screen-reader-only text.
 * - Task-list checkboxes become ☐ / ☑, and footnotes use the `fn:N` /
 *   `fnref:N` ids that readers with footnote popovers look for.
 * - Leftover custom elements are unwrapped, and presentational attributes
 *   (`class`, `style`, `data-*`, ARIA wiring) are stripped.
 *
 * Used by the feed builder in `./index.ts` on every item.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { rehype } from 'rehype'
import { SKIP, visit } from 'unist-util-visit'

/** Elements dropped along with their content. */
const DROP_TAGS = new Set(['script', 'style', 'link', 'template', 'button', 'noscript'])

/** Classes for text that is only meant for screen readers. */
const VISUALLY_HIDDEN_CLASSES = ['sr-only', 'visually-hidden', 'lyt-visually-hidden']

/** Attributes holding a single URL, made absolute against the post's URL. */
const URL_PROPS = ['href', 'src', 'poster']

/** Properties kept on every element; everything presentational is dropped. */
const KEEP_PROPS = new Set([
  'href',
  'src',
  'poster',
  'alt',
  'title',
  'id',
  'width',
  'height',
  'controls',
  'frameBorder',
  'allow',
  'allowFullScreen',
  'cite',
  'dateTime',
  'colSpan',
  'rowSpan',
  'start',
  'reversed',
  'lang',
  'dir',
  'target',
  'rel',
  'ariaLabel',
])

function el(tagName: string, properties: Element['properties'], children: ElementContent[]) {
  return { type: 'element', tagName, properties, children } satisfies Element
}

function text(value: string) {
  return { type: 'text' as const, value }
}

function classes(node: Element): string[] {
  const className = node.properties.className
  return Array.isArray(className) ? className.map(String) : []
}

function textContent(node: RootContent | Root): string {
  if (node.type === 'text') return node.value
  if ('children' in node) return node.children.map(textContent).join('')
  return ''
}

/** HTML in a string (an iframe's raw-text fallback) as nodes. */
function parseFragment(html: string): ElementContent[] {
  if (!html) return []
  const tree = rehype().data('settings', { fragment: true }).parse(html)
  return tree.children.filter((child): child is ElementContent => child.type !== 'doctype')
}

/** Iframes already given their link, so the structural pass doesn't add another. */
const linkedIframes = new WeakSet<Element>()

function findElement(node: Element, test: (el: Element) => boolean): Element | undefined {
  let found: Element | undefined
  visit(node, 'element', child => {
    if (found) return SKIP
    if (test(child)) found = child
  })
  return found
}

/** A code block, captioned with its title (a filename, usually) when there is one. */
function codeBlock(code: string, language: string | undefined, title: string | undefined) {
  const pre = el('pre', {}, [
    el('code', language ? { className: [`language-${language}`] } : {}, [text(code)]),
  ])
  if (!title) return pre
  return el('figure', {}, [el('figcaption', {}, [el('code', {}, [text(title)])]), pre])
}

/** A short note pointing at the post, standing in for something a reader can't show. */
function viewOnSite(what: string, link: string) {
  return el('p', {}, [
    el('em', {}, [
      text(`This post includes ${what}. `),
      el('a', { href: link }, [text('View it on danny.is')]),
      text('.'),
    ]),
  ])
}

/** Expressive Code's figure → a plain code block, one line of text per `.ec-line`. */
function plainExpressiveCode(node: Element) {
  const pre = findElement(node, child => child.tagName === 'pre')
  if (!pre) return undefined
  const lines: string[] = []
  visit(pre, 'element', child => {
    if (!classes(child).includes('ec-line')) return
    const code = findElement(child, line => classes(line).includes('code'))
    lines.push(code ? textContent(code) : '')
    return SKIP
  })
  const titleEl = findElement(node, child => classes(child).includes('title'))
  const language = pre.properties.dataLanguage
  return codeBlock(
    lines.join('\n'),
    typeof language === 'string' && language !== 'plaintext' ? language : undefined,
    titleEl ? textContent(titleEl).trim() || undefined : undefined,
  )
}

/** What replaces `node` in the feed: `undefined` keeps it, `[]` removes it. */
function replacement(node: Element, link: string): ElementContent[] | undefined {
  const { tagName, properties } = node
  const nodeClasses = classes(node)

  if (DROP_TAGS.has(tagName)) return []

  // Footnotes: the heading is screen-reader-only on the site, so an <hr>
  // separates the list from the post instead.
  if (tagName === 'h2' && properties.id === 'footnote-label') return [el('hr', {}, [])]

  if (nodeClasses.some(c => VISUALLY_HIDDEN_CLASSES.includes(c))) return []

  if (nodeClasses.includes('expressive-code')) {
    const block = plainExpressiveCode(node)
    return block ? [block] : []
  }

  if (tagName === 'markdown-preview' || tagName === 'file-tree') {
    const title = typeof properties.title === 'string' ? properties.title : undefined
    const language = tagName === 'markdown-preview' ? 'markdown' : undefined
    return [codeBlock(String(properties.code ?? '').trim(), language, title)]
  }

  if (tagName === 'svg') {
    // Mermaid diagrams keep mermaid's `mermaid-…` id; every other inline SVG
    // in post content is a decorative icon.
    return String(properties.id ?? '').startsWith('mermaid-') ? [viewOnSite('a diagram', link)] : []
  }

  if (tagName === 'astro-island') return [viewOnSite('an interactive demo', link)]

  // Plenty of readers strip iframes, so every iframe is followed by a link:
  // its fallback content (parsed as raw text) moved out, or one to its source.
  if (tagName === 'iframe' && !linkedIframes.has(node)) {
    const fallback = parseFragment(textContent(node).trim())
    const src = typeof properties.src === 'string' ? properties.src : undefined
    const label = typeof properties.title === 'string' ? properties.title : 'Open the embed'
    const after = fallback.length ? fallback : src ? [el('a', { href: src }, [text(label)])] : []
    const iframe: Element = { ...node, children: [] }
    linkedIframes.add(iframe)
    return after.length ? [iframe, el('p', {}, after)] : [iframe]
  }

  if (tagName === 'picture') {
    const img = node.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'img',
    )
    return img ? [img] : []
  }

  if (tagName === 'img' && typeof properties.caption === 'string' && properties.caption) {
    const { caption, ...rest } = properties
    return [
      el('figure', {}, [{ ...node, properties: rest }, el('figcaption', {}, [text(caption)])]),
    ]
  }

  if (tagName === 'input' && properties.type === 'checkbox') {
    return [text(properties.checked ? '☑' : '☐')]
  }

  // Unwrap custom elements nothing above handled, keeping their content.
  if (tagName.includes('-')) return node.children

  return undefined
}

/** `#user-content-fn-1` → `#fn:1`, `user-content-fnref-1` → `fnref:1`. */
function footnoteId(value: string): string {
  return value.replace(/user-content-fnref-/, 'fnref:').replace(/user-content-fn-/, 'fn:')
}

function absoluteUrl(value: string, base: string): string {
  // Leave fragments (in-post links, footnotes) and anything with a scheme.
  if (value.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value
  return new URL(value, base).href
}

/** Strip presentational attributes, fix URLs and footnote ids. */
function cleanProperties(node: Element, base: string) {
  const { properties } = node
  const languageClass =
    node.tagName === 'code' ? classes(node).filter(c => c.startsWith('language-')) : []

  for (const key of Object.keys(properties)) {
    if (!KEEP_PROPS.has(key)) delete properties[key]
  }
  if (languageClass.length) properties.className = languageClass
  if (properties.title === '') delete properties.title

  for (const key of URL_PROPS) {
    const value = properties[key]
    if (typeof value === 'string') properties[key] = footnoteId(absoluteUrl(value, base))
  }
  if (typeof properties.id === 'string') properties.id = footnoteId(properties.id)
}

/**
 * @param html The post's rendered HTML.
 * @param link The post's absolute URL: the base for relative URLs, and where
 *   "view it on danny.is" notes point.
 */
export function cleanFeedHtml(html: string, link: string): string {
  const file = rehype()
    .data('settings', { fragment: true })
    .use(() => (tree: Root) => {
      // Structural pass: replace or remove whole elements. Re-visits whatever
      // took a node's place, so nested custom elements unwrap fully.
      visit(tree, 'element', (node, index, parent) => {
        if (!parent || index === undefined) return
        const nodes = replacement(node, link)
        if (!nodes) return
        parent.children.splice(index, 1, ...nodes)
        return [SKIP, index]
      })

      // Attribute pass, plus links left empty by the removals above: heading
      // anchors (fragment links) go, anything else shows its URL so a reader
      // always has something to follow.
      visit(tree, 'element', (node, index, parent) => {
        cleanProperties(node, link)
        if (node.tagName !== 'a' || !parent || index === undefined) return
        if (node.children.some(child => child.type === 'element' || textContent(child).trim())) {
          return
        }
        const href = node.properties.href
        if (typeof href !== 'string' || href.startsWith('#')) {
          parent.children.splice(index, 1)
          return [SKIP, index]
        }
        node.children = [text(href)]
      })
    })
    .processSync(html)

  return String(file).trim()
}
