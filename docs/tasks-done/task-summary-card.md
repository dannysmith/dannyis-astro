# Task: Summary Cards for Articles and Notes

Okay, pretty soon I'm going to want to be able to include articles and notes as a kind of card. You can imagine on the homepage I want to include the latest two articles and the latest three notes as cards. These cards should obviously include the title, they should include some marker as to whether it's a note or an article and should be expandable in the future if I have other content types. They should maybe include some kind of summary, which might mean we have to generate those summaries by grabbing the first meaningful text from the content. and ideally I would simply be able to pass in a note or article Astro object which produces one of these cards. Clearly these also need to be responsive so that they can be placed anywhere in any width container and still behave correctly. Obviously clicking on them should take you to the actual article. If there is a cover image, it should also include that in the card.

## Implementation Plan

### 1. Component Architecture & API Design

**Primary Component: `ContentCard.astro`**

- Location: `src/components/ui/ContentCard.astro`
- Unified summary card for all content types

```typescript
interface Props {
  content: CollectionEntry<'articles'> | CollectionEntry<'notes'>;
  variant?: 'compact' | 'featured' | 'minimal';
  showSummary?: boolean;
  summaryLength?: number;
}
```

**Design Rationale:**

- Single component handles all content types (articles, notes, future types)
- Uses discriminated unions for type safety
- Variants provide layout flexibility
- Optional summary with configurable length

**Supporting Utility: Content Summary Generator**

- Location: `src/utils/content-summary.ts`
- Purpose: Extract meaningful text snippets from content

### 2. Summary Generation Strategy

**Approach: Frontmatter-First with Fallback**

1. Use existing `description` field if present
2. Extract first meaningful paragraph from content body
3. Intelligent text cleaning (remove MDX imports, code blocks)
4. Configurable length limits (150-300 chars for cards)

```typescript
function generateSummary(entry: ContentEntry, maxLength: number = 200): string {
  // 1. Check frontmatter description
  if (entry.data.description) return entry.data.description;

  // 2. Extract from content body
  const cleanText = stripMDXElements(entry.body);
  const firstParagraph = extractFirstMeaningfulParagraph(cleanText);

  // 3. Truncate intelligently
  return truncateAtSentence(firstParagraph, maxLength);
}
```

**Benefits:**

- Respects manual descriptions when available
- Automatic fallback for content without descriptions
- Consistent summary quality
- No AI/external dependencies

### 3. Content Type Discrimination & Visual Design

**Type Indicators:**

- **Articles:** Book icon + "Article" label
- **Notes:** Sticky note icon + "Note" label
- **Future types:** Easily extensible system

**Visual Hierarchy:**

```css
.content-card {
  /* Base card styling matching existing NoteCard patterns */
  background: var(--color-card-bg);
  border-radius: var(--radius-md);
  border-top: 4px solid var(--color-content-type-accent);
}

.content-card[data-type='article'] {
  --color-content-type-accent: var(--color-article-accent);
}

.content-card[data-type='note'] {
  --color-content-type-accent: var(--color-note-accent);
}
```

### 4. Responsive Layout Strategy

**Container Query-Based Design:** Following existing patterns from `NoteCard.astro`:

```css
.content-card {
  container-type: inline-size;
}

/* Compact: Title only, minimal spacing */
@container (width < 300px) {
  .card-summary {
    display: none;
  }
  .card-image {
    display: none;
  }
}

/* Standard: Title + summary, side-by-side layout option */
@container (width > 400px) {
  .content-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-md);
  }
}

/* Featured: Full layout with image */
@container (width > 600px) {
  .card-image {
    width: 120px;
    height: 80px;
    object-fit: cover;
  }
}
```

**Layout Variants:**

- **Compact:** Title + type indicator only
- **Standard:** Title + summary + meta
- **Featured:** Title + summary + meta + image

### 5. Image Handling Strategy

**Cover Image Priority:**

1. Article `cover` field (optimized with Astro's Image component)
2. Default type-specific illustrations
3. Graceful degradation with no image

**Performance Considerations:**

```astro
{cover && (
  <Image
    src={cover}
    alt={coverAlt || `Cover for ${title}`}
    width={120}
    height={80}
    loading="lazy"
    class="card-image"
  />
)}
```

### 6. Implementation Phases

**Phase 1: Core Component** _(1-2 hours)_

1. Create `ContentCard.astro` with basic layout
2. Implement content type discrimination
3. Add responsive container queries
4. Basic styling following design system

**Phase 2: Summary Generation** _(2-3 hours)_

1. Create `content-summary.ts` utility
2. Text extraction and cleaning functions
3. Intelligent truncation logic
4. Integration with ContentCard component

**Phase 3: Image Integration** _(1 hour)_

1. Cover image handling
2. Responsive image sizing
3. Fallback and placeholder logic

**Phase 4: Usage Integration** _(1 hour)_

1. Update homepage to use ContentCard
2. Create example layouts (2 articles + 3 notes)
3. Test responsive behavior across breakpoints

**Phase 5: Styleguide Integration** _(30 mins)_

1. Add ContentCard examples to `/styleguide` page
2. Test all variants and responsive behavior
3. Document usage patterns and props

**Phase 6: Testing & Validation** _(1 hour)_

1. Unit tests for `content-summary.ts` utility functions
2. Cross-theme testing (light/dark)
3. Accessibility audit (focus states, ARIA labels, keyboard navigation)
4. Performance validation (image loading, layout shift)

**Phase 7: Documentation Review** _(15 mins)_

1. Check if `docs/` needs updates (likely minimal)
2. Add brief note to `CLAUDE.md` about ContentCard component
3. Update component exports in barrel files

### 7. API Usage Examples

**Homepage Implementation:**

```astro
---
const latestArticles = await getCollection('articles', {limit: 2});
const latestNotes = await getCollection('notes', {limit: 3});
---

<section class="recent-content">
  <h2>Latest Writing</h2>
  <div class="content-grid">
    {latestArticles.map(article => (
      <ContentCard
        content={article}
        variant="featured"
        showSummary={true}
        summaryLength={180}
      />
    ))}
  </div>

  <h2>Recent Notes</h2>
  <div class="notes-grid">
    {latestNotes.map(note => (
      <ContentCard
        content={note}
        variant="compact"
        showSummary={true}
        summaryLength={120}
      />
    ))}
  </div>
</section>
```

### 8. Design System Integration

**New CSS Variables Needed (following existing patterns in global.css):**

```css
/* Add to @layer theme section */
:root[data-theme='light'] {
  --color-contentcard-bg: var(--color-brand-white);
  --color-contentcard-border: var(--color-border);
  --color-contentcard-article-accent: var(--color-coral-500);
  --color-contentcard-note-accent: var(--color-blue-500);
  --color-contentcard-meta: var(--color-text-secondary);
  --color-contentcard-summary: var(--color-text-primary);
}

:root[data-theme='dark'] {
  --color-contentcard-bg: var(--color-bg-secondary);
  --color-contentcard-border: var(--color-border);
  --color-contentcard-article-accent: var(--color-red-500);
  --color-contentcard-note-accent: var(--color-blue-400);
  --color-contentcard-meta: var(--color-text-secondary);
  --color-contentcard-summary: var(--color-text-primary);
}

/* Auto theme inherits from light theme base */
@media (prefers-color-scheme: dark) {
  :root {
    --color-contentcard-bg: var(--color-bg-secondary);
    --color-contentcard-article-accent: var(--color-red-500);
    --color-contentcard-note-accent: var(--color-blue-400);
  }
}
```

### 9. Future Extensibility

**Adding New Content Types:**

1. Extend TypeScript interfaces in `content-summary.ts`
2. Add new color variables for type accent
3. Add new icon/label in component logic
4. Update tests and documentation

**Advanced Features (Future):**

- Reading time estimation
- Tag-based color coding
- Social engagement metrics
- Related content suggestions

### 10. Quality Assurance Plan

**Testing Strategy:**

1. **Visual regression:** Compare cards across themes
2. **Responsive testing:** Verify container query breakpoints
3. **Content variety:** Test with different content lengths and types
4. **Performance:** Image loading and layout shift metrics
5. **Accessibility:** Keyboard navigation and screen reader testing

**Success Criteria:**

- ✅ Cards display consistently across all container sizes
- ✅ Summaries are meaningful and appropriately truncated
- ✅ Type discrimination is visually clear
- ✅ Performance impact < 10ms per card render
- ✅ Accessibility score maintains 100/100
- ✅ Design matches constructivist aesthetic

This plan balances functionality, performance, and maintainability while building on the existing design system and code patterns. The phased approach allows for iterative development and testing.

## Critical Plan Review

### Potential Issues & Mitigations

**1. Summary Generation Complexity**

- **Risk**: Text extraction could be fragile with malformed MDX or edge cases
- **Mitigation**: Start with simple text extraction, add robust error handling, fallback to title-only display

**2. Performance Considerations**

- **Risk**: Runtime summary generation could slow page loads
- **Solution**: Execute at build time in Astro components, results are cached

**3. Browser Compatibility**

- **Risk**: Container queries have good but not universal support
- **Mitigation**: Include CSS fallbacks using media queries as backup

**4. Type Safety & Extensibility**

- **Risk**: Discriminated unions could get complex with more content types
- **Solution**: Use proper TypeScript interfaces, consider using content collection type introspection

### Simplifications for V1

**Start Simpler:**

1. **Two variants only**: "compact" and "standard" (defer "featured")
2. **Functional summary logic**: Description field first, then intelligent content extraction with proper MDX handling
3. **Essential image handling**: Cover image or nothing (defer placeholders)
4. **Core accessibility**: Focus states and labels only initially

**Enhanced Error Handling:**

1. **Graceful degradation**: Card works even if summary generation fails
2. **Image error states**: Handle missing/broken cover images elegantly
3. **Content validation**: Ensure cards render with minimal content

### Implementation Priorities

**Must Have:**

- Basic card layout with title and type indicator
- Description field usage (encourage authors to add descriptions)
- Responsive container queries with media query fallbacks
- Basic theme support

**Should Have:**

- Intelligent content-based summary generation (MDX-aware)
- Cover image support
- Proper TypeScript interfaces
- Unit tests for utilities

**Could Have:**

- Advanced truncation logic
- Multiple layout variants
- Image optimizations and placeholders

**Updated Timeline:** 7-9 hours total (was 6-8)

- Includes additional testing and simplification of complex features
- Better error handling and fallback logic
- More thorough styleguide integration
