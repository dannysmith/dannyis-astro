import { describe, it, expect } from 'vitest'
import { markdownToHtml, defineHastPlugin } from 'satteri'
import { satteriListDensity } from '../../src/lib/satteri-list-density.mjs'

const LONG =
  'This is a much longer list item that contains enough text to exceed the default threshold of 120 characters when averaged across all items in the list.'

/** Render markdown through the real pipeline with the plugin registered. */
async function render(source: string, options?: { threshold?: number }): Promise<string> {
  const result = await markdownToHtml(source, {
    hastPlugins: [satteriListDensity(options)],
  })
  return result.html
}

describe('satteriListDensity', () => {
  describe('class application', () => {
    it('does not add class to lists with short items', async () => {
      const html = await render('- Short item\n- Another short\n- Third one\n')
      expect(html).not.toContain('long-list-items')
    })

    it('adds class to lists with long items', async () => {
      const html = await render(`- ${LONG}\n- ${LONG}\n`)
      expect(html).toContain('<ul class="long-list-items">')
    })

    it('preserves classes added by earlier plugins', async () => {
      const addClass = defineHastPlugin({
        name: 'add-class',
        element: {
          filter: ['ul'],
          visit(node, ctx) {
            ctx.setProperty(node, 'className', ['existing-class'])
          },
        },
      })
      const result = await markdownToHtml(`- ${LONG}\n- ${LONG}\n`, {
        hastPlugins: [addClass, satteriListDensity()],
      })
      expect(result.html).toContain('existing-class')
      expect(result.html).toContain('long-list-items')
    })
  })

  describe('nested list handling', () => {
    it('does not add class to nested lists', async () => {
      const html = await render(`- Parent item\n  - ${LONG}\n  - ${LONG}\n`)
      expect(html).not.toContain('long-list-items')
    })

    it('excludes nested list text from parent item length calculation', async () => {
      const html = await render(`- Short\n  - ${LONG}\n- Also short\n- Third short\n`)
      expect(html).not.toContain('long-list-items')
    })

    it('classes a long top-level list even when it contains a nested list', async () => {
      const html = await render(`- ${LONG}\n  - nested short\n- ${LONG}\n`)
      // Exactly one classed list: the top-level one, not the nested one.
      expect(html.match(/long-list-items/g)).toHaveLength(1)
      expect(html).toMatch(/^<ul class="long-list-items">/)
    })
  })

  describe('threshold configuration', () => {
    it('respects custom threshold option', async () => {
      const source =
        '- This is about fifty characters of text here.\n- And this one is also around fifty chars total.\n'
      expect(await render(source)).not.toContain('long-list-items')
      expect(await render(source, { threshold: 40 })).toContain('long-list-items')
    })
  })

  describe('edge cases', () => {
    it('counts text inside inline elements (em, strong, a, code)', async () => {
      const source =
        '- Start **bold text that adds to the character count** and [a link with more text](https://example.com) and `some code` end.\n' +
        '- *This entire item is emphasized and contains quite a lot of text to push the average up*\n'
      expect(await render(source, { threshold: 80 })).toContain('long-list-items')
    })

    it('works with ordered lists (ol)', async () => {
      const html = await render(`1. ${LONG}\n2. ${LONG}\n`)
      expect(html).toContain('<ol class="long-list-items">')
    })
  })
})
