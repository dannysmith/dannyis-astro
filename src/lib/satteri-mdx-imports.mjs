/**
 * Sätteri MDAST plugin: module-level ESM injection for MDX.
 *
 * Replaces two things the `unified()` pipeline used to do, folded into one
 * plugin because they share the same "inject a module-level `mdxjsEsm` node at
 * the top of the document, once" mechanism:
 *
 * 1. **Auto-imports** (was the `astro-auto-import` integration). Injects
 *    `import { Accordion, Callout, … } from '@components/mdx'` into *every*
 *    `.mdx` file so content never needs explicit imports. The component list is
 *    derived from the barrel in `astro.config.mjs` (single source of truth) and
 *    passed in as `componentNames`.
 *    Consequence (unchanged from before): never explicitly import from
 *    `@components/mdx` in `.mdx` — the auto-injected import would collide
 *    (duplicate declaration).
 *
 * 2. **Page components** (was `src/lib/remark-page-components.mjs`). Routed
 *    `.mdx` pages using the `Page.astro` layout render themselves and hand the
 *    result to the layout via `<slot />`, so the layout can't apply
 *    `MDX_COMPONENT_REMAPPING` the way `.astro` pages do with
 *    `<Content components={…} />`. For those pages we inject
 *    `import { MDX_COMPONENT_REMAPPING } from '@config/mdx-components';
 *     export const components = MDX_COMPONENT_REMAPPING;`
 *    so element/component remapping applies. Skipped if the page already
 *    declares its own `export const components`.
 *
 * ## Mechanics
 *
 * A module-level `mdxjsEsm` node compiles through Sätteri's oxc MDX path from
 * a bare `value` string alone — no hand-built estree needed (proven in the
 * Task 1 spike; the old `remark-page-components` had to build one).
 *
 * Injection happens once per document, from the first visited node: Sätteri
 * walks pre-order, so the first visitor to fire is on a direct child of the
 * root. We subscribe to every node type that can appear at the root, climb to
 * the root via `ctx.parent()`, scan its children for an author-declared
 * `export const components`, and prepend our ESM nodes. The frontmatter
 * `layout` is read from `ctx.data.astro.frontmatter` — `@astrojs/mdx` seeds
 * the parsed frontmatter there before plugins run.
 *
 * Registered as a factory so the fire-once flag resets between documents.
 */
import { defineMdastPlugin } from 'satteri';

/** A module-level ESM node from a source string (no estree needed). */
function esm(value) {
  return { type: 'mdxjsEsm', value };
}

/** True if `program` (ESTree) declares a module-level `const components`. */
function programDeclaresComponents(program) {
  return program.body.some(
    statement =>
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration?.type === 'VariableDeclaration' &&
      statement.declaration.declarations.some(declarator => declarator.id?.name === 'components'),
  );
}

/** True if any module-level ESM among `children` exports `components`. */
function hasComponentsExport(children) {
  return children.some(node => {
    if (node.type !== 'mdxjsEsm') return false;
    // Prefer the parsed program; fall back to a source-text check.
    const program = typeof node.parseExpression === 'function' ? node.parseExpression() : null;
    if (program) return programDeclaresComponents(program);
    return /export\s+const\s+components\b/.test(node.value ?? '');
  });
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
  // Factory: called once per document, so `done` resets between files.
  return () => {
    let done = false;

    function inject(node, ctx) {
      if (done) return;
      if (ctx.sourceFormat !== 'mdx') return;
      done = true;

      let root = ctx.parent(node);
      while (root && root.type !== 'root') root = ctx.parent(root);
      if (!root) return;

      const nodes = [];

      // 1. Auto-import every barrel component into every .mdx file.
      if (componentNames.length) {
        nodes.push(esm(`import { ${componentNames.join(', ')} } from '${componentsFrom}';`));
      }

      // 2. For Page.astro-layout pages without their own components export,
      //    apply the element/component remapping.
      const layout = ctx.data.astro?.frontmatter?.layout;
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
        );
      }

      if (nodes.length) ctx.prependChild(root, nodes);
    }

    return defineMdastPlugin({
      name: 'satteri-mdx-imports',
      // Every node type that can appear as a direct child of the root — the
      // first one visited (pre-order) triggers the one-shot injection.
      yaml: inject,
      mdxjsEsm: inject,
      heading: inject,
      paragraph: inject,
      blockquote: inject,
      list: inject,
      code: inject,
      html: inject,
      table: inject,
      thematicBreak: inject,
      definition: inject,
      footnoteDefinition: inject,
      mdxJsxFlowElement: inject,
      mdxFlowExpression: inject,
    });
  };
}
