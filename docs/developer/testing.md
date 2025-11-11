# Testing

Guidance and patterns for writing and maintaining tests.

## Testing Stack

This project uses a dual testing approach optimized for different types of validation:

**Vitest** for unit tests of pure business logic and utility functions.

**Playwright** for E2E tests - Browser-based tests for critical user journeys and integration points.

**Commands:**

- `pnpm run test:unit` - Run Vitest unit tests
- `pnpm run test:e2e` - Run Playwright E2E tests
- `pnpm run test:all` - Run both test suites

## What to Test

Focus testing effort on areas where bugs would have the highest impact:

- **Pure utility functions** - e.g. SEO helpers, content summary generation, date formatting
- **Content filtering logic** - e.g. Draft/styleguide exclusion, collection queries
- **Critical user paths** - e.g. Main navigation, RSS feed generation, 404 pages
- **Business logic** - Any function with complex conditional logic or data transformation

Avoid testing:

- Simple UI rendering without logic
- Stuff which is common, idiomatic Astro code
- Third-party library internals
- Trivial getters/setters

## Test File Organization

```
tests/
├── unit/         # Pure logic tests (utils, business logic)
└── e2e/          # User journey tests (navigation, RSS, critical paths)
```

Unit tests live alongside the code they test when appropriate, or in `tests/unit/` for integration scenarios.

E2E tests in `tests/e2e/` mirror user workflows rather than file structure.

## Examples

See existing tests as reference implementations:

- **Unit tests:** Check `tests/unit/` for examples of testing utility functions
- **E2E tests:** Check `tests/e2e/` for examples of testing critical user paths

**See Also:**

- [component-patterns.md](./component-patterns.md) - Component testing considerations
- [code-quality.md](./code-quality.md) - Quality checks that run during testing
