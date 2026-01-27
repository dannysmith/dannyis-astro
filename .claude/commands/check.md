---
allowed-tools: [Read, Bash, Glob, TodoWrite, Edit]
description: 'Check recent work for adherance with architecture & patterns, and run checks'
---

# /check - Check Work

## Purpose

Check recent work for adherance with architecture & patterns, and run checks.

## Usage

```
/check
```

## Execution

1. Check all work in this session for adherance with `docs/developer/architecture-guide.md` and the common issues in `docs/developer/code-quality.md`. (Only run specialised code quality tools if you really thing it nececarry).
2. If any design/CSS -> check for adhernece with `docs/developer/design.md` and `docs/developer/design-tokens.md` and the modern CSS best practice.
3. Check for any leftovers from recent work: `console.logs`, code from failed approaches, unhelpful AI-slop "moved X to X because Z" comments etc.
4. ALWAYS Run `bun check:all` and IMMEDIATLY fix any errors.

## Additional Guidance

- What to review:
  - Use current session context as guidance.
  - If working on a task in `docs/tasks-todo` use that as guidance.
  - Focus first on uncomitted changes but also consider last few commits.
  - If unsure of scope, ask user where to focus.
  - Sometimes user may run as general check -> scope is whole project, intelligently.
- Be thorough but quick - user runs this command regularly as a sanity-check, but also expects it to flag any issues properly.
- For non-trivial fixes, discuss with the user before diving down the rabbit hole.
