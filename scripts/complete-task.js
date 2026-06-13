#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DOCS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const TODO_DIR = path.join(DOCS_DIR, 'tasks-todo');
const DONE_DIR = path.join(DOCS_DIR, 'tasks-done');

const query = process.argv.slice(2).join(' ').trim();
if (!query) {
  console.error('Usage: bun task:complete TASK_NAME_OR_NUMBER');
  process.exit(1);
}

const tasks = fs.readdirSync(TODO_DIR).filter(f => f.endsWith('.md'));
const matches = tasks.filter(f => f.toLowerCase().includes(query.toLowerCase()));

if (matches.length === 0) {
  console.error(`No task matching "${query}". Available tasks:`);
  tasks.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

if (matches.length > 1) {
  console.error(`Multiple tasks match "${query}":`);
  matches.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

const [filename] = matches;
const date = new Date().toISOString().slice(0, 10);
const newFilename = filename.replace(/^task-/, `task-${date}-`);

fs.renameSync(path.join(TODO_DIR, filename), path.join(DONE_DIR, newFilename));
console.log(`tasks-todo/${filename} -> tasks-done/${newFilename}`);
