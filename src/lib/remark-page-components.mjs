/**
 * Remark plugin to auto-apply MDX_COMPONENT_REMAPPING to routed MDX pages
 * that use the `Page.astro` layout.
 *
 * Routed `.mdx` pages (those in `src/pages/` that set a `layout` in
 * frontmatter) render *themselves* and hand the result to the layout via
 * `<slot />`. That means the layout can't apply the project's HTML-element
 * remapping (`a -> SmartLink`, `img -> BasicImage`, `table -> WrappedTable`,
 * plus the dashed `file-tree` / `markdown-preview` block tags) the way the
 * `.astro` pages do with `<Content components={MDX_COMPONENT_REMAPPING} />`.
 *
 * The documented Astro mechanism is to `export const components` from the MDX
 * file itself. Rather than hand-write that in every page, this plugin injects
 * it at build time for any `.mdx` file whose layout basename is `Page.astro`:
 *
 *     import { MDX_COMPONENT_REMAPPING } from '@config/mdx-components';
 *     export const components = MDX_COMPONENT_REMAPPING;
 *
 * Notes:
 * - MDX treats `export const components` specially and must see it at the
 *   mdast (remark) stage, before component resolution is wired up — so the
 *   injection happens here, not in a recma plugin.
 * - Plain `.md` can't do component remapping, so those files are skipped.
 * - If a page already declares its own `export const components`, injection is
 *   skipped so the page keeps full control (and we avoid a duplicate
 *   declaration build error).
 *
 * @returns {Function} Remark transformer function
 */

const IMPORT_SOURCE = '@config/mdx-components';
const IMPORTED_NAME = 'MDX_COMPONENT_REMAPPING';

// Pre-built ESM node (value + matching estree). @mdx-js reads `data.estree`
// from `mdxjsEsm` nodes when collecting module-level imports/exports, so the
// estree must be supplied — a bare `value` would be silently dropped.
function buildEsmNode() {
  const importDeclaration = {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: IMPORTED_NAME },
        local: { type: 'Identifier', name: IMPORTED_NAME },
      },
    ],
    source: { type: 'Literal', value: IMPORT_SOURCE },
  };

  const exportDeclaration = {
    type: 'ExportNamedDeclaration',
    declaration: {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'components' },
          init: { type: 'Identifier', name: IMPORTED_NAME },
        },
      ],
    },
    specifiers: [],
    source: null,
  };

  return {
    type: 'mdxjsEsm',
    value: `import { ${IMPORTED_NAME} } from '${IMPORT_SOURCE}';\nexport const components = ${IMPORTED_NAME};`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [importDeclaration, exportDeclaration],
      },
    },
  };
}

/** True if the tree already has a module-level `export const components`. */
function hasComponentsExport(tree) {
  return tree.children.some(
    node =>
      node.type === 'mdxjsEsm' &&
      node.data?.estree?.body?.some(
        statement =>
          statement.type === 'ExportNamedDeclaration' &&
          statement.declaration?.type === 'VariableDeclaration' &&
          statement.declaration.declarations.some(
            declarator => declarator.id?.name === 'components'
          )
      )
  );
}

export function remarkPageComponents() {
  return function (tree, file) {
    // Only routed `.mdx` files — plain `.md` can't remap components.
    if (file.extname !== '.mdx') return;

    const layout = file.data.astro?.frontmatter?.layout;
    if (typeof layout !== 'string') return;
    if (layout.split('/').pop() !== 'Page.astro') return;

    // Respect a page that already defines its own components mapping.
    if (hasComponentsExport(tree)) return;

    tree.children.unshift(buildEsmNode());
  };
}
