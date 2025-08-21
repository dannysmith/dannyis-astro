---
title: 'Tauri Template'
sourceURL: 'https://github.com/dannysmith/tauri-template'
slug: announcing-tauri-template
pubDate: 2025-08-20
tags:
  - tauri
  - react
---

While building [Astro Editor](https://astroeditor.danny.is) I learned a fair bit about Tauri and how to develope simple macOS/React apps with it using Claude Code.

So I spent a few hours building the boilerplate I wish I'd had when I started, [tauri-template](https://github.com/dannysmith/tauri-template). It comes with:

- A basic boilerplate for Tauri 2, React & Typescript
- A sensible state management system using Zustand and Tanstack Query
- UI components based on shadcn and tailwind 4
- A command system with a command pallete, macOS menus and keyboard shortcuts
- An auto-update and release system using GitHub Actions.
- A notifications system with in-app toasts and native notifications.
- A minimal logging system
- A preferences pane and preferences persistance system
- A basic UI with a unified title bar, sidebars and a main panel
- Sensible [developer documentation](https://github.com/dannysmith/tauri-template/tree/main/docs/developer), [AI instructions](https://github.com/dannysmith/tauri-template/blob/main/CLAUDE.md) and linting/formatting/tests to help AI Agents make fewer errors.
- Some other sensible boilerplate.

This is mainly meant for **me** to use as a starting point when building other macOC apps with Tauri & React.
