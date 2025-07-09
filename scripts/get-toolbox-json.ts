import puppeteer from 'puppeteer';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const OUTPUT_PATH = join(process.cwd(), 'src', 'content', 'toolboxPages.json');

(async () => {
  try {
    console.log('Starting to scrape toolbox pages...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
    const page = await browser.newPage();
    await page.goto('https://betterat.work/tool/');

    const data = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.notion-collection-card__anchor')).map(anchor => {
        const url = (anchor as HTMLAnchorElement).href;
        const title = (anchor.textContent ?? '').trim();

        // Generate stable ID from URL slug
        const urlPath = new URL(url).pathname;
        const slug = urlPath.split('/').filter(Boolean).pop() || '';
        const id =
          slug ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        return {
          id,
          title,
          url,
        };
      })
    );

    await browser.close();

    if (data.length < 5) {
      console.log(
        `Only found ${data.length} toolbox items, expected at least 5. Skipping update of toolboxPages.json.`
      );
      return;
    }

    // Check if data has changed
    try {
      const existingData = JSON.parse(await readFile(OUTPUT_PATH, 'utf-8'));
      const newDataString = JSON.stringify(data, null, 2);
      const existingDataString = JSON.stringify(existingData, null, 2);

      if (existingDataString === newDataString) {
        console.log('No changes detected, skipping update of toolboxPages.json.');
        return;
      }
    } catch {
      // File doesn't exist or is invalid, proceed with write
    }

    // Ensure the directory exists
    await mkdir(dirname(OUTPUT_PATH), { recursive: true });

    await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote ${data.length} items to toolboxPages.json`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
