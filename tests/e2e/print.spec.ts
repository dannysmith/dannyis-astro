import { test, expect } from '@playwright/test'

/**
 * Print stylesheet (src/styles/_print.css) — none of this is visible on screen,
 * so it would otherwise rot silently.
 *
 * Runs in a dark-mode context deliberately: the theme script sets `color-scheme`
 * inline on <html>, which survives into print, so this is the case that breaks.
 */
test('print stylesheet applies and hides screen-only chrome', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()
  await page.goto('/writing/article-styleguide/')
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' })

  // The sheet is applied: a dark-mode reader still prints the light palette.
  await expect(page.locator(':root')).toHaveCSS('color-scheme', 'light')

  // `.skip-link` especially: it's position: fixed and merely translated
  // off-screen, so Chrome used to paint it onto every printed page.
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

  await context.close()
})
