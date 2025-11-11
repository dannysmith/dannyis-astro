# Code Quality

Guidance and rules for keeping code quality high.

## Quality Mindset

- **Automated checks catch errors** - Run `pnpm run check:all` frequently
- **Test in production builds** - Dev mode hides issues
- **Review before committing** - Quick scan prevents issues
- **Update docs when patterns change** - Keep documentation current
- **Ask when uncertain** - Better to clarify than break things

Remember: The goal is **clarity and completeness**, not bureaucracy. Quality gates exist to catch mistakes early and maintain a high-quality codebase.

## Quality Checks

We have various tools available to help with maintaining code quality:

1. **TypeScript** - Type checking
2. **Astro** - Framework-specific validation
3. **Prettier** - Format checking
4. **ESLint** - Linting
5. **Vitest** - Unit tests
6. **Playwright** - E2E tests

These can be run together wirth `pnpm run check:all`.
