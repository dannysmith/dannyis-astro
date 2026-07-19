/**
 * Sätteri MDAST plugin: module-level ESM injection for MDX.
 *
 * Two injections share the "insert an `mdxjsEsm` node at the top of the
 * document, once" mechanism:
 *
 * 1. **Auto-imports.** Injects `import { Callout, … } from '@components/mdx'`
 *    into every `.mdx` file so content never writes explicit imports. The
 *    component list is derived from the barrel in `astro.config.mjs` (single
 *    source of truth) and passed in as `componentNames`. Consequence: content
 *    must never import from `@components/mdx` itself — the auto-injected
 *    import would collide (duplicate declaration).
 *
 * 2. **Page components.** Routed `.mdx` pages using the `Page.astro` layout
 *    render themselves and hand the result to the layout via `<slot />`, so
 *    the layout can't apply `MDX_COMPONENT_REMAPPING` the way `.astro` pages
 *    do with `<Content components={…} />`. For those pages we also inject
 *    `export const components = MDX_COMPONENT_REMAPPING`. Skipped if the page
 *    declares its own `export const components`.
 *
 * A module-level `mdxjsEsm` node compiles from a bare `value` string alone —
 * no hand-built estree needed. The frontmatter `layout` is read from
 * `ctx.data.astro.frontmatter`, which Astro seeds before plugins run.
 */
import { defineRootPlugin } from './satteri-root-plugin.mjs'

/** A module-level ESM node from a source string. */
function esm(value) {
  return { type: 'mdxjsEsm', value }
}

/** True if `program` (ESTree) declares a module-level `const components`. */
function programDeclaresComponents(program) {
  return program.body.some(
    statement =>
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration?.type === 'VariableDeclaration' &&
      statement.declaration.declarations.some(declarator => declarator.id?.name === 'components'),
  )
}

/** True if any module-level ESM among `children` exports `components`. */
function hasComponentsExport(children) {
  return children.some(node => {
    if (node.type !== 'mdxjsEsm') return false
    // Prefer the parsed program; fall back to a source-text check.
    const program = typeof node.parseExpression === 'function' ? node.parseExpression() : null
    if (program) return programDeclaresComponents(program)
    return /export\s+const\s+components\b/.test(node.value ?? '')
  })
}

/**
 * @param {object} opts
 * @param {string[]} opts.componentNames  PascalCase names to auto-import from the barrel.
 * @param {string} [opts.componentsFrom]  Import specifier for the barrel.
 * @param {string} [opts.remappingFrom]   Import specifier for the component remapping.
 * @param {string} [opts.remappingName]   Exported name of the remapping object.
 * @param {string} [opts.pageLayout]      Layout basename that triggers the components export.
 */
export function satteriMdxImports({
  componentNames,
  componentsFrom = '@components/mdx',
  remappingFrom = '@config/mdx-components',
  remappingName = 'MDX_COMPONENT_REMAPPING',
  pageLayout = 'Page.astro',
}) {
  return defineRootPlugin('satteri-mdx-imports', (root, ctx) => {
    if (ctx.sourceFormat !== 'mdx') return

    const nodes = []

    if (componentNames.length) {
      nodes.push(esm(`import { ${componentNames.join(', ')} } from '${componentsFrom}';`))
    }

    const layout = ctx.data.astro?.frontmatter?.layout
    if (
      typeof layout === 'string' &&
      layout.split('/').pop() === pageLayout &&
      !hasComponentsExport(root.children)
    ) {
      nodes.push(
        esm(
          `import { ${remappingName} } from '${remappingFrom}';\n` +
            `export const components = ${remappingName};`,
        ),
      )
    }

    if (nodes.length) ctx.prependChild(root, nodes)
  })
}
