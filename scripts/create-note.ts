#!/usr/bin/env tsx

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { unfurl } from 'unfurl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if a string is a URL
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Fetch title from URL using Open Graph or fallback to HTML title
async function fetchTitleFromUrl(url: string): Promise<string> {
  try {
    console.log(`Fetching title from: ${url}`);
    const result = await unfurl(url);

    // Try Open Graph title first, then fallback to regular title
    const title = result.open_graph?.title || result.title || '';

    return escapeTitle(title);
  } catch (error) {
    console.warn(`Failed to fetch title from URL: ${error}`);
    return ''; // Fallback to the URL itself
  }
}

// Escape problematic characters in titles
function escapeTitle(title: string): string {
  return title
    .replace(/&/g, 'and') // Replace ampersands with 'and'
    .replace(/"/g, '\\"') // Escape quotes
    .trim();
}

async function createNote() {
  // Get title from command line argument or prompt user
  let title: string;
  let sourceURL: string = '';

  const commandLineInput = process.argv[2];

  if (commandLineInput) {
    if (isUrl(commandLineInput)) {
      // It's a URL - fetch the title and store the URL
      title = await fetchTitleFromUrl(commandLineInput);
      sourceURL = commandLineInput;
    } else {
      // It's a regular title
      title = escapeTitle(commandLineInput);
    }
  } else {
    const response = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is the title of your note?',
        validate: input => {
          if (input.trim() === '') {
            return 'Title cannot be empty';
          }
          return true;
        },
      },
    ]);
    title = escapeTitle(response.title);
  }

  // Create filename
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  const filename = `${year}-${month}-${day}-${slug}.mdx`;

  // Create frontmatter
  const frontmatter = `---
title: "${title}"
pubDate: ${date.toISOString()}
slug: "${slug}"
sourceURL: "${sourceURL}"
---

`;

  // Write file directly in smidgeons directory
  const smidgeonsDir = path.join(__dirname, '..', 'src', 'content', 'notes');
  const filePath = path.join(smidgeonsDir, filename);
  await fs.writeFile(filePath, frontmatter);

  console.log(`Created new note at: ${filePath}`);

  // Open in Cursor
  exec(`cursor ${filePath}`, error => {
    if (error) {
      console.error('Could not open file in VS Code:', error);
    }
  });
}

createNote().catch(console.error);
