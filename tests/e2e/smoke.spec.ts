import { test, expect } from '@playwright/test';

test.describe('Critical Path Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Danny Smith/);
  });

  test('writing page loads and has articles', async ({ page }) => {
    await page.goto('/writing');
    
    // Verify writing page has article listings
    const articles = page.locator('section li');
    expect(await articles.count()).toBeGreaterThan(0);
    
    // Check page has the expected structure
    await expect(page.locator('h1')).toHaveText('Writing');
  });

  test('RSS feed returns valid XML', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()['content-type'];
    expect(contentType).toMatch(/xml|rss/);
    
    const content = await response?.text();
    expect(content).toContain('<?xml');
    expect(content).toContain('<rss');
    expect(content).toContain('</rss>');
  });

  test('404 page works correctly', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);
    
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found/i);
  });
});

test.describe('Content Filtering Tests', () => {
  test('styleguide article renders individually', async ({ page }) => {
    const response = await page.goto('/writing/article-styleguide/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('styleguide note renders individually', async ({ page }) => {
    const response = await page.goto('/notes/note-styleguide/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('writing page excludes styleguide even in development', async ({ page }) => {
    await page.goto('/writing');
    
    // Even in development, styleguide content is excluded from listings
    // Just verify there are articles shown
    const articles = page.locator('li');
    expect(await articles.count()).toBeGreaterThan(0);
    
    // Check that styleguide content is NOT in the listing
    const pageContent = await page.textContent('main');
    expect(pageContent).not.toMatch(/Article Styleguide/i); // Should be excluded
  });

  test('notes page shows content in development', async ({ page }) => {
    await page.goto('/notes');
    
    // Verify there are notes shown
    const notes = page.locator('article');
    expect(await notes.count()).toBeGreaterThan(0);
  });

  test('RSS feeds include content in development', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    const content = await response?.text();
    
    // Should contain items
    expect(content).toContain('<item>');
    
    // Basic XML structure
    expect(content).toContain('<?xml');
    expect(content).toContain('<rss');
  });
});