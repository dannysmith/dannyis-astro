# Task: Desktop Table of Contents with SVG Scroll Indicator

## Overview

Add a fixed TOC to articles on wide viewports (≥1100px) that appears to the right of the content column. An SVG path traces alongside the TOC links and animates to highlight currently visible sections as the user scrolls. Hidden completely on narrow viewports.

## Technical Context

**Current article grid** (in `Article.astro`):
```css
grid-template-columns:
  minmax(var(--gutter), 1fr)           /* Left gutter - expands */
  min(60ch, calc(100% - gutter * 2))   /* Content - max 60ch */
  minmax(var(--gutter), 1fr);          /* Right gutter - expands */
```

At wide viewports, the right gutter becomes large enough to hold the TOC. Content maxes at 60ch (~600px), so on a 1400px viewport there's ~400px in each gutter.

**Positioning approach**: Use `position: fixed` with `left: calc(50% + 32ch)` to place TOC just right of the centered 60ch content column.

## Implementation

### 1. Create `src/components/layout/TableOfContents.astro`

```astro
---
import type { MarkdownHeading } from 'astro';

export interface Props {
  headings: MarkdownHeading[];
}

interface TocHeading extends MarkdownHeading {
  subheadings: TocHeading[];
}

const { headings } = Astro.props;

// Build nested structure from flat headings array
function buildToc(flatHeadings: MarkdownHeading[]): TocHeading[] {
  const toc: TocHeading[] = [];
  const parentHeadings = new Map<number, TocHeading>();

  flatHeadings
    .filter(h => h.depth >= 2 && h.depth <= 3)
    .forEach((h) => {
      const heading: TocHeading = { ...h, subheadings: [] };
      parentHeadings.set(heading.depth, heading);

      if (heading.depth === 2) {
        toc.push(heading);
      } else {
        // If h3 appears before any h2, treat as top-level
        const parent = parentHeadings.get(heading.depth - 1);
        if (parent) {
          parent.subheadings.push(heading);
        } else {
          toc.push(heading);
        }
      }
    });

  return toc;
}

const toc = buildToc(headings);
---

{toc.length > 0 && (
<nav class="toc ui-style" aria-label="Table of contents">
  <ul class="toc-list">
    {toc.map((heading) => (
      <li>
        <a href={`#${heading.slug}`} class="toc-link">{heading.text}</a>
        {heading.subheadings.length > 0 && (
          <ul class="toc-sublist">
            {heading.subheadings.map((sub) => (
              <li>
                <a href={`#${sub.slug}`} class="toc-link">{sub.text}</a>
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
  <!-- SVG for animated marker - positioned absolutely, path drawn by JS -->
  <svg class="toc-marker" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="0 0 0 1000"
      stroke-dashoffset="1"
    />
  </svg>
</nav>
)}

<style>
  .toc {
    /* Hidden by default */
    display: none;
    position: fixed;

    /* Position: just right of the 60ch content column */
    top: var(--space-xl);
    left: calc(50% + 32ch);

    /* Sizing */
    width: 220px;
    max-height: calc(100vh - var(--space-2xl));
    overflow-y: auto;

    /* Typography */
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);

    /* Lower z-index than main nav */
    z-index: 100;
  }

  @media (min-width: 1100px) {
    .toc {
      display: block;
    }
  }

  .toc-list,
  .toc-sublist {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-list {
    padding-left: var(--space-s); /* Room for SVG marker */
  }

  .toc-sublist {
    padding-left: var(--space-m);
  }

  .toc-list li {
    margin: 0;
    padding: 0;
  }

  .toc-link {
    display: block;
    padding: var(--space-2xs) 0;
    line-height: var(--leading-snug);
    transition: color var(--duration-fast) var(--ease-in-out);
  }

  .toc-link:hover {
    color: var(--color-text);
  }

  .toc-link[data-active] {
    color: var(--color-accent);
  }

  /* SVG marker overlay */
  .toc-marker {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    color: var(--color-accent);
    transition: stroke-dasharray var(--duration-slow) var(--ease-in-out);
  }

  @media (prefers-reduced-motion: reduce) {
    .toc-marker {
      transition: none;
    }
  }
</style>

<script>
  // Store cleanup function to prevent listener accumulation on ViewTransitions
  let cleanup: (() => void) | null = null;

  function initToc() {
    // Clean up previous instance
    cleanup?.();

    const toc = document.querySelector<HTMLElement>('.toc');
    const path = document.querySelector<SVGPathElement>('.toc-marker path');
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc-link'));

    if (!toc || !path || links.length === 0) {
      cleanup = null;
      return;
    }

    // Store each link's position along the path
    interface LinkData {
      link: HTMLAnchorElement;
      target: HTMLElement | null;
      pathStart: number;
      pathEnd: number;
    }
    let linkData: LinkData[] = [];
    let pathLength = 0;

    // Draw SVG path alongside links
    function drawPath() {
      const pathData: (string | number)[] = [];
      let prevLeft = 0;

      links.forEach((link, i) => {
        const x = link.offsetLeft - 8; // Offset for marker line
        const y = link.offsetTop;
        const height = link.offsetHeight;

        if (i === 0) {
          // Move to top-left of first link, draw down
          pathData.push('M', x, y, 'L', x, y + height);
        } else {
          // If indentation changed, draw horizontal first
          if (prevLeft !== x) {
            pathData.push('L', prevLeft, y);
          }
          pathData.push('L', x, y, 'L', x, y + height);
        }
        prevLeft = x;
      });

      path.setAttribute('d', pathData.join(' '));
      pathLength = path.getTotalLength();

      // Calculate each link's segment on the path
      let runningLength = 0;
      linkData = links.map((link, i) => {
        const targetId = link.getAttribute('href')?.slice(1);
        const target = targetId ? document.getElementById(targetId) : null;

        // Approximate segment length for this link
        const segmentLength = link.offsetHeight + (i > 0 ?
          Math.abs(link.offsetLeft - links[i-1].offsetLeft) : 0);

        const data = {
          link,
          target,
          pathStart: runningLength,
          pathEnd: runningLength + link.offsetHeight,
        };

        runningLength += segmentLength;
        return data;
      });

      // Normalize to actual path length
      const scale = pathLength / runningLength;
      linkData.forEach(d => {
        d.pathStart *= scale;
        d.pathEnd *= scale;
      });
    }

    // Update stroke-dasharray based on visible sections
    function updatePath() {
      // Find the first and last active links for continuous highlight
      let firstActive = -1;
      let lastActive = -1;

      linkData.forEach((data, i) => {
        if (data.link.hasAttribute('data-active')) {
          if (firstActive === -1) firstActive = i;
          lastActive = i;
        }
      });

      if (firstActive === -1) {
        // Nothing active - hide the marker
        path.style.strokeDasharray = `0 0 0 ${pathLength}`;
      } else {
        // Draw from start of first active to end of last active
        const start = linkData[firstActive].pathStart;
        const end = linkData[lastActive].pathEnd;
        path.style.strokeDasharray = `0 ${start} ${end - start} ${pathLength}`;
      }
    }

    // Track visible headings with IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('id');
          const link = document.querySelector<HTMLAnchorElement>(`.toc-link[href="#${id}"]`);

          if (entry.isIntersecting) {
            link?.setAttribute('data-active', '');
          } else {
            link?.removeAttribute('data-active');
          }
        });
        updatePath();
      },
      {
        // Active zone: top 20% to bottom 40% of viewport
        rootMargin: '-20% 0% -40% 0%',
      }
    );

    // Observe all headings that have TOC links
    linkData.forEach(({ target }) => {
      if (target) observer.observe(target);
    });

    // Redraw on resize (debounced)
    let resizeTimeout: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(drawPath, 100);
    }
    window.addEventListener('resize', handleResize);

    // Initial setup
    drawPath();
    updatePath();

    // Store cleanup for ViewTransitions
    cleanup = () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }

  // Initialize on load and after ViewTransitions
  initToc();
  document.addEventListener('astro:after-swap', initToc);
</script>
```

### 2. Modify `src/layouts/Article.astro`

Add `headings` prop and render TOC:

```diff
---
import type { CollectionEntry } from 'astro:content';
+import type { MarkdownHeading } from 'astro';
// ... other imports
+import TableOfContents from '@components/layout/TableOfContents.astro';

-type Props = CollectionEntry<'articles'>['data'] & { readingTime: string };
+type Props = CollectionEntry<'articles'>['data'] & {
+  readingTime: string;
+  headings: MarkdownHeading[];
+};
const {
  // ... existing props
+  headings,
} = Astro.props;
---

<body>
  <MainNavigation />
+ <TableOfContents headings={headings} />
  <main>
    <!-- existing article content -->
  </main>
  <Footer />
</body>
```

### 3. Modify `src/pages/writing/[...slug]/index.astro`

Pass headings through to layout:

```diff
---
const post = Astro.props;
-const { Content, remarkPluginFrontmatter } = await render(post);
+const { Content, headings, remarkPluginFrontmatter } = await render(post);
const readingTime = remarkPluginFrontmatter.minutesRead;
-const postData = { ...post.data, readingTime };
+const postData = { ...post.data, readingTime, headings };
---
```

### 4. Export from barrel

Add to `src/components/layout/index.ts`:

```typescript
export { default as TableOfContents } from './TableOfContents.astro';
```

## Key Design Decisions

1. **Breakpoint: 1100px** - 60ch content (~600px) + 220px TOC + gaps needs ~1000px minimum. 1100px provides comfortable margins.

2. **Position via `left: calc(50% + 32ch)`** - Centers relative to the 60ch content column. Works regardless of viewport width once past breakpoint.

3. **SVG stroke-dasharray animation** - The path traces down the left edge of TOC links. `stroke-dasharray: "0 START LENGTH REST"` draws only the active segment. CSS transition animates smoothly between states.

4. **Multiple active sections** - Unlike highlighting just one item, the SVG approach naturally shows a continuous line through all visible sections.

5. **No JS fallback** - TOC links work without JS. Only the animated marker requires JS.

## Testing Checklist

- [ ] TOC visible at ≥1100px viewport
- [ ] TOC hidden at <1100px viewport
- [ ] SVG marker highlights current section while scrolling
- [ ] Multiple sections highlighted when multiple headings visible
- [ ] Marker animates smoothly between sections
- [ ] Marker respects `prefers-reduced-motion`
- [ ] TOC links scroll to correct sections
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] ViewTransitions: TOC re-initializes after navigation
- [ ] Empty headings array: no TOC rendered
- [ ] Long TOC scrolls independently

## Files

| File | Action |
|------|--------|
| `src/components/layout/TableOfContents.astro` | Create |
| `src/components/layout/index.ts` | Add export |
| `src/layouts/Article.astro` | Add headings prop, render TOC |
| `src/pages/writing/[...slug]/index.astro` | Pass headings to layout |

## References

- [kld.dev - Building a Table of Contents](https://kld.dev/building-table-of-contents/)
- [kld.dev - TOC Progress Animation](https://kld.dev/toc-animation/)
- [Hakim El Hattab's Progress Nav](https://lab.hakim.se/progress-nav/)
