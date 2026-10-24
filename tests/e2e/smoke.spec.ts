import { test, expect } from '@playwright/test'

// A feed's first request on a cold dev server renders every post, fetching any
// uncached link previews and Mermaid images, which can take well over the
// default 30s in CI. Feed tests check the HTTP response, so they use the
// request API with this longer timeout rather than a page navigation.
const FEED_TIMEOUT = 120_000

test.describe('Critical Path Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveTitle(/Danny Smith/)
  })

  test('writing page loads and has articles', async ({ page }) => {
    await page.goto('/writing')

    // Verify writing page has article listings
    const articles = page.locator('section li')
    expect(await articles.count()).toBeGreaterThan(0)

    // Check page has the expected structure
    await expect(page.locator('main h1')).toHaveText('Writing')
  })

  test.describe('with JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false })

    test('writing calendar opens a day of posts', async ({ page }) => {
      await page.goto('/writing/calendar')
      await expect(page.locator('main h1')).toHaveText('Writing')

      const popover = page.locator('.calendar-year .popover').first()
      await expect(popover).toBeHidden()
      await page.locator('.calendar-year .mark').first().click()
      await expect(popover).toBeVisible()
      await expect(popover.locator('a').first()).toHaveAttribute('href', /^\/(writing|notes)\//)
    })
  })

  test('RSS feed returns valid XML', async ({ request }) => {
    test.setTimeout(FEED_TIMEOUT)
    const response = await request.get('/rss.xml', { timeout: FEED_TIMEOUT })

    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type']
    expect(contentType).toMatch(/xml|rss/)

    const content = await response.text()
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
    expect(content).toContain('</rss>')
  })

  test('404 page works correctly', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist')
    expect(response?.status()).toBe(404)

    const pageContent = await page.textContent('body')
    expect(pageContent).toMatch(/404|not found/i)
  })

  test('styleguide page loads successfully', async ({ page }) => {
    const response = await page.goto('/styleguide/')
    expect(response?.status()).toBe(200)
  })

  test('using hub and sub-pages load', async ({ page }) => {
    for (const path of [
      '/using/',
      '/using/bag/',
      '/using/office/',
      '/using/software/',
      '/using/outdoors/',
    ]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.locator('main h1')).toBeVisible()
    }
  })
})

test.describe('Generated Files', () => {
  test('llms.txt has expected sections', async ({ page }) => {
    const response = await page.goto('/llms.txt')
    expect(response?.status()).toBe(200)

    const content = await response?.text()
    expect(content).toContain('# Danny Smith')
    expect(content).toContain('## Articles')
    expect(content).toContain('## Notes')
    expect(content).toContain('## Other Pages')
    expect(content).toContain('## External')
  })

  test('site.webmanifest returns valid JSON', async ({ page }) => {
    const response = await page.goto('/site.webmanifest')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toContain('application/manifest+json')

    const content = await response?.text()
    const manifest = JSON.parse(content || '{}')
    expect(manifest.name).toBe('Danny Smith')
    expect(manifest.short_name).toBe('danny.is')
    expect(manifest.icons).toBeInstanceOf(Array)
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  test('humans.txt contains author info', async ({ page }) => {
    const response = await page.goto('/humans.txt')
    expect(response?.status()).toBe(200)

    const content = await response?.text()
    expect(content).toContain('Danny Smith')
    expect(content).toContain('London')
    expect(content).toContain('https://danny.is')
  })
})

test.describe('Lightbox', () => {
  test('prose images still open the lightbox', async ({ page }) => {
    await page.goto('/writing/article-styleguide/')
    const figureImg = page.locator('.figure img').first()
    await expect(figureImg).toBeVisible()
    await figureImg.click()
    await expect(page.locator('.lightbox.is-open')).toBeVisible()
  })

  test('card cover images do not trigger the lightbox', async ({ page }) => {
    await page.goto('/styleguide/components/')
    // Stop the card link from navigating so we can observe the click in place —
    // otherwise the click would just land us on a fresh page with a closed lightbox.
    await page.evaluate(() =>
      document
        .querySelectorAll('a.card-link')
        .forEach(a => a.addEventListener('click', e => e.preventDefault())),
    )
    const cover = page.locator('.article-card .card-cover img').first()
    await expect(cover).toBeVisible()
    await cover.click()
    await expect(page.locator('.lightbox.is-open')).toHaveCount(0)
  })
})

// The menu is a native popover, so it should work with no script at all.
test.describe('Main menu', () => {
  test.use({ javaScriptEnabled: false })

  test('opens, marks the current section and closes on Escape', async ({ page }) => {
    await page.goto('/writing/article-styleguide/')
    const menu = page.locator('#main-navigation')

    await expect(menu).toBeHidden()
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Writing' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })

  test('search on a phone opens the command palette in place of the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const menu = page.locator('#main-navigation')

    await page.getByRole('button', { name: 'Menu' }).click()
    await menu.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('#command-palette')).toBeVisible()
    await expect(menu).toBeHidden()
  })
})

test.describe('Content Filtering Tests', () => {
  test('styleguide article renders individually', async ({ page }) => {
    const response = await page.goto('/writing/article-styleguide/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('styleguide note renders individually', async ({ page }) => {
    const response = await page.goto('/notes/note-styleguide/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('main h1')).toBeVisible()
  })

  test('writing page excludes styleguide even in development', async ({ page }) => {
    await page.goto('/writing')

    // Even in development, styleguide content is excluded from listings
    // Just verify there are articles shown
    const articles = page.locator('main li')
    expect(await articles.count()).toBeGreaterThan(0)

    // Check that styleguide content is NOT in the listing
    const pageContent = await page.textContent('main')
    expect(pageContent).not.toMatch(/Article Styleguide/i) // Should be excluded
  })

  test('notes page shows content in development', async ({ page }) => {
    await page.goto('/notes')

    // Verify there are notes shown
    const notes = page.locator('article')
    expect(await notes.count()).toBeGreaterThan(0)
  })

  test('RSS feeds include content in development', async ({ request }) => {
    test.setTimeout(FEED_TIMEOUT)
    const response = await request.get('/rss.xml', { timeout: FEED_TIMEOUT })
    const content = await response.text()

    // Should contain items
    expect(content).toContain('<item>')

    // Basic XML structure
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
  })
})
