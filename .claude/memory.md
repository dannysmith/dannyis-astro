# Claude Code Memory

This file provides persistent context for Claude Code sessions in this repository.

## Project Context

**What**: Danny Smith's personal website - a content-first blog and digital playground
**Purpose**: Share thoughts/work + experiment with code/design (especially CSS/AI tools)
**Philosophy**: Simple, authentic, performant, maintainable, and fun to work on
**Audience**: Danny (creative expression), interested readers (content consumption), people checking Danny out (professional context)

## Key Design Decisions

### Technical Architecture

- **Astro 5.8** chosen for zero-JavaScript-by-default, content-first approach
- **No CSS frameworks** - custom CSS with variables, layers, and container queries
- **Static generation** for performance and simplicity
- **Content collections** for type-safe frontmatter and structured content
- **MDX support** for rich content with custom components

### Design Philosophy

- **Typographically-driven** with oversized, expressive text
- **Constructivist/modernist influences** (asymmetric layouts, bold diagonals)
- **Monochrome base + strategic red accent** color scheme
- **Experimental feel** - "personal zine-meets-manifesto" not generic portfolio
- **Sharp, intentional whitespace** with grid-based but flexible layouts

### Content Strategy

- **Articles** (`/writing/`) - Long-form articles about development, design, business
- **Notes** (`/notes/`) - Shorter thoughts, links, and commentary
- **Combined RSS feed** - All content in chronological order
- **Styleguides** - Three different contexts (main, article, note) for visual QA

## Content Creation Patterns

### File Naming Convention

- Articles: `YYYY-MM-DD-descriptive-slug.mdx` in `src/content/articles/`
- Notes: `YYYY-MM-DD-descriptive-slug.md` in `src/content/notes/`
- Use today's date unless specified otherwise
- Keep slugs concise but descriptive

### Frontmatter Essentials

- **Articles**: `title`, `pubDate`, `draft: true` (until ready), optional `description`, `cover`, `tags`
- **Notes**: `title`, `pubDate`, optional `sourceURL` (for link posts), `tags`
- Both support `styleguide: true` to exclude from indexes

### Component Usage

- `<Embed url="...">` - Universal embed (YouTube, Twitter, Vimeo, Loom) with BookmarkCard fallback
- `<BookmarkCard url="...">` - Rich URL previews
- `<Callout type="blue" icon="💡" title="Tip">` - Highlighted information
- `<Notion>` - Notion page references with auto-title fetching
- Always import components in MDX files

## Common Workflows

### Content Commands (from .cursor/rules/content.mdc)

- `"new note"` → Creates timestamped note template
- `"new note [URL]"` → Fetches title from URL, creates note with sourceURL
- `"new article [topic]"` → Creates article template with topic-based title
- `"check article"` → Validates formatting, headings, components, spelling
- `"pre-publishing checklist"` → Full publication review including SEO

### Quality Gates

**ALWAYS run before completing tasks:**

1. `npm run lint` - ESLint validation
2. `npm run check` - Astro/TypeScript checking
3. `npm run build` - Production build test
4. Manual Vercel preview verification

### Styleguide Maintenance

When adding/changing components:

1. Update `/styleguide` page with realistic examples
2. Add to `src/content/notes/note-styleguide.mdx` if relevant for notes
3. Add to `src/content/articles/article-styleguide.mdx` if relevant for articles
4. Update component documentation in `.cursor/rules/component-guidelines.mdc`

## Common Gotchas

### Content Issues

- **First paragraph** must be long enough for drop-cap to render well
- **No links** in first couple sentences of articles (interferes with drop-cap)
- **Heading hierarchy** must not skip levels (H1 → H2 → H3, never H1 → H3)
- **Acronyms** should be wrapped in `<abbr>` tags
- **External links** need `target="_blank" rel="noopener noreferrer"`

### Technical Issues

- **Image imports** in MDX require proper import statements and Astro Image component
- **Component props** must match TypeScript interfaces exactly
- **Draft content** is visible in dev but filtered in production builds
- **Container queries** need proper container setup (`.cq` class or `container-type`)

### Build Failures

- Check `astro.config.mjs` for integration issues
- Verify content schema matches frontmatter in `src/content.config.ts`
- Ensure all imported components exist and are properly exported
- Watch for TypeScript errors in components with external API calls

## Development Preferences

### Code Style

- **Zero-JavaScript by default** - only add interactivity when necessary
- **CSS variables** for theming and consistency
- **CSS layers** for proper cascade management (reset → base → prose → theme)
- **Container queries** for component responsiveness over media queries
- **Error handling** with try-catch blocks and meaningful fallbacks

### Content Style

- **Quality over quantity** - thoughtful, well-crafted posts
- **Personal voice** - authentic and experimental, not corporate
- **Visual hierarchy** - clear distinction between content types
- **Accessibility first** - semantic HTML, proper alt text, keyboard navigation

## Site URLs and Redirects

Key redirects configured in `astro.config.mjs`:

- `/meeting` → Cal.com booking
- `/cv` → PDF resume
- `/linkedin` → LinkedIn profile
- `/working` → BetterAt.Work
- `/tools` → Toolbox page

## Deployment Context

- **Hosting**: Vercel with automatic deployments
- **Branch**: `main` for production
- **Preview**: Every PR gets Vercel preview deployment
- **Build time**: OpenGraph images generated automatically
- **RSS**: Available at `/rss.xml` with combined articles and notes
