#!/usr/bin/env tsx

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createNote() {
  // Get title from user
  const { title } = await inquirer.prompt([
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
sourceURL: ""
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
