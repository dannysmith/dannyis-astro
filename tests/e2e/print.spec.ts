import { test, expect } from '@playwright/test'

/**
 * Print-stylesheet regressions (src/styles/_print.css).
 *
 * These assert the things that are invisible on screen and so would rot
 * silently — you only find out when you print something.
 */
test.describe('Print styles', () => {
  test('screen-only chrome is hidden when printing an article', async ({ page }) => {
    await page.goto('/writing/article-styleguide/')
    await page.emulateMedia({ media: 'print' })

    // `.skip-link` in particular: it's position: fixed and merely translated
    // off-screen, so before _print.css Chrome painted it onto every single page.
    for (const selector of [
      '.skip-link',
      '.nav-open',
      '.main-navigation',
      '.back-to-top',
      '.markdown-actions',
      'footer',
    ]) {
      await expect(page.locator(selector).first()).toBeHidden()
    }
  })

  test('a dark-mode reader still prints dark ink on white', async ({ browser }) => {
    // The theme script sets `color-scheme` *inline* on <html>, which survives
    // into print — so every light-dark() would otherwise resolve to its dark
    // value and print pale beige text on white paper.
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await page.goto('/writing/article-styleguide/')
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' })

    const colorScheme = await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    )
    expect(colorScheme).toBe('light')

    // Body text should resolve to the light-mode ink, not the dark-mode beige.
    const lightness = await page.evaluate(() => {
      const paragraph = document.querySelector('.longform-prose p')
      if (!paragraph) throw new Error('no prose paragraph found')
      const match = getComputedStyle(paragraph).color.match(/oklch\(([\d.]+)/)
      if (!match) throw new Error('expected an oklch() colour')
      return Number(match[1])
    })
    expect(lightness).toBeLessThan(0.5)

    await context.close()
  })

  test('collapsed details expand so their content reaches the page', async ({ page }) => {
    await page.goto('/writing/article-styleguide/')
    const details = page.locator('details:not([open])').first()
    const screenHeight = await details.evaluate(el => el.getBoundingClientRect().height)

    await page.emulateMedia({ media: 'print' })
    const printHeight = await details.evaluate(el => el.getBoundingClientRect().height)

    expect(printHeight).toBeGreaterThan(screenHeight)
  })
})
