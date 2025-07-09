import puppeteer from 'puppeteer';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const OUTPUT_PATH = join(process.cwd(), 'src', 'content', 'toolboxPages.json');

(async () => {
  try {
    console.log('Starting to scrape toolbox pages...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://betterat.work/tool/');

    const data = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.notion-collection-card__anchor')).map(
        (anchor, index) => ({
          id: index + 1,
          title: (anchor.textContent ?? '').trim(),
          url: (anchor as HTMLAnchorElement).href,
        })
      )
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

    await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote ${data.length} items to toolboxPages.json`);
  } catch (error) {
    console.error('Error:', error);
  }
})();
