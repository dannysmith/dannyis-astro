---
allowed-tools: [Read, Bash, Glob, TodoWrite, Edit, Explore]
description: 'Review the whole codebase for opportunities to improve'
---

# /cleanup-session - Check Work

## Purpose

Review the whole codebase for opportunities to improve

## Usage

```
/cleanup-session
```

## Execution

1. Run `pnpm check:all`
2. Run `pnpm check:knip` and `pnpm check:dupes`
3. Run any other available commands which might give an indication of areas for improvement.
4. Explore the whole codebase for opportunities to clean up, refactor, reduce complexity, improve consistency, improve naming and generally make things better.
5. Make suggestions to the user about what we should work on next.
