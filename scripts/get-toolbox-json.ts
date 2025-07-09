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

    // Navigate and wait for network to be idle
    await page.goto('https://betterat.work/tool/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for the specific elements to appear with a timeout
    console.log('Waiting for toolbox cards to load...');
    await page.waitForSelector('.notion-collection-card__anchor', {
      timeout: 20000,
      visible: true,
    });

    // Wait for a reasonable number of elements to load
    await page.waitForFunction(
      () => document.querySelectorAll('.notion-collection-card__anchor').length >= 5,
      { timeout: 15000 }
    );

    console.log('Content loaded, starting to scrape...');

    const data = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.notion-collection-card__anchor')).map(
        (anchor, index) => {
          const url = (anchor as HTMLAnchorElement).href;
          const title = (anchor.textContent ?? '').trim();

          return {
            id: index.toString(), // Simple string ID from array index
            title,
            url,
          };
        }
      )
    );

    await browser.close();

    console.log(`Found ${data.length} toolbox items`);

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
