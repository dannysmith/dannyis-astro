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

## Common Quality Issues

### Issue 1: Using Base Color Tokens Directly

Always use semantic color variables instead of base tokens. This ensures proper theme switching and maintainability.

```css
/* ❌ BAD - Using base tokens directly */
.component {
  background: var(--color-red-500);
  color: var(--color-blue-700);
}

/* ✅ GOOD - Using semantic variables */
.component {
  background: var(--color-bg-primary);
  color: var(--color-text-link);
}
```

**Why:** Semantic variables automatically switch values based on the current theme (`data-theme` attribute), while base tokens remain static.

### Issue 2: Missing Path Aliases

Always use path aliases for imports. Relative imports will cause build failures and make refactoring difficult.

```typescript
// ❌ BAD - Relative imports
import { BaseHead } from '../../components/layout/BaseHead.astro';
import { generatePageTitle } from '../../../utils/seo';

// ✅ GOOD - Path aliases
import { BaseHead } from '@components/layout';
import { generatePageTitle } from '@utils/seo';
```

**Why:** Path aliases are configured in `tsconfig.json` and ensure imports work correctly regardless of file location. They also make imports more readable and easier to maintain.

### Issue 3: Missing Props Interface

All components must have an explicit Props interface for type safety.

```astro
<!-- ❌ BAD - No interface, no type safety -->
---
const { title, description } = Astro.props;
---

<!-- ✅ GOOD - Explicit interface -->
---
export interface Props {
  title: string;
  description?: string;
}
const { title, description } = Astro.props;
---
```

**Why:** TypeScript can't validate props without an explicit interface, leading to runtime errors when required props are missing or wrong types are passed.

**See Also:**

- [architecture-guide.md](./architecture-guide.md) - Core Principles for project-specific rules
- [component-patterns.md](./component-patterns.md) - Component best practices
