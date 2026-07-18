/**
 * Shared helpers for the Sätteri plugin test suites, which drive the real
 * compile API (`markdownToHtml` / `mdxToJs`) rather than mocking the pipeline.
 */
import { defineMdastPlugin } from 'satteri'

export type JsxNode = {
  type: string
  name?: string
  attributes?: { name: string; value: unknown }[]
}
export type CodeNode = { type: string; lang?: string | null }

/** The `data.astro` bag Astro's processors seed before plugins run. */
export function astroData(frontmatter: Record<string, unknown> = {}) {
  return {
    astro: {
      frontmatter,
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  }
}

/**
 * Capture plugin: records the mdxJsxFlowElement and code nodes that reach it.
 * Register it after the plugin under test — later plugins visit nodes built
 * by earlier ones, so it sees replacements as well as untouched originals.
 */
export function mdastCapturer() {
  const jsx: JsxNode[] = []
  const code: CodeNode[] = []
  const plugin = defineMdastPlugin({
    name: 'capturer',
    mdxJsxFlowElement(node: unknown) {
      jsx.push(structuredClone(node) as JsxNode)
    },
    code(node: unknown) {
      code.push(structuredClone(node) as CodeNode)
    },
  })
  return { plugin, jsx, code }
}

/** Read an mdxJsxAttribute value by name. */
export function attr(node: JsxNode, name: string): string | undefined {
  const a = node.attributes?.find(x => x.name === name)
  return typeof a?.value === 'string' ? a.value : undefined
}

/** Does the node carry an attribute with the given name? */
export function hasAttr(node: JsxNode, name: string): boolean {
  return Boolean(node.attributes?.some(x => x.name === name))
}
