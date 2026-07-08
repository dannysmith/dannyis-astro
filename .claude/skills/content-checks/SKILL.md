---
name: content-checks
description: Check and prepare Danny's articles and notes (MD & MDX) for publishing — prose, markup, Astro components, frontmatter, and light SEO. Use when the user asks to check, review, proofread, or prepare an article or note for publishing.
allowed-tools: Read, Edit, Grep, Glob
---

# Content Checks

Check content (MD & MDX files) for the user, providing feedback and making changes where necessary.

## Rules

- Do not rewrite whole sentences without first confirming with the user. You may make small edits (spelling, formatting etc) without prior confirmation. If in doubt, ALWAYS ask the user before editing.
- When presenting recommendations, be concise and make it easy for the user to say yes/no/<comment> to multiple suggestions in a single response.
- Where a check is mechanical (paths resolve, code fences, filename dates, frontmatter fields), VERIFY it with your tools (Grep/Glob/Read) rather than by eye. Specific hints are given inline below.
- When working on SEO, marketing etc: balance your **expert knowledge in these fields** with your intimate knowledge of Danny and the purpose & content of this site.
  - ACTUALLY improve his content's performance -> He'll love you.
  - Act like a shitty SEO/Marketing consultant, or deliver AI slop -> He'll HATE you.
- If unsure about your task -> ask the user with reference to the "commands" below.

## "Commands"

You will likely be asked to check one of four things:

### Article - Check

When asked to check an article, review in detail using this guidance:

1. Prose, voice & anti-slop
   - Use the `writing:guide` skill for this — it is the source of truth for Danny's voice, style and anti-slop rules. Prefer it over your own judgement.
   - If `writing:guide` isn't available on this machine, fall back to these basics:
     - No spelling or grammar errors
     - Consistent case and punctuation for headings, lists etc
     - Final paragraph is a proper sentence (so the endmark works)

2. Markup
   - Proper markdown heading hierarchy — no skipped levels (scan the headings in order)
   - Markdown image tags have suitable alt text
   - Acronyms wrapped in `<abbr>` tag
   - Keyboard shortcuts wrapped in `<kbd>` tag
   - Inline code, filenames etc wrapped in backticks
   - No errors in other markdown formatting (bold, italic, links etc)
   - Footnotes properly formatted and referenced at end
   - Code blocks have a language where appropriate (grep for fenced blocks with no language to catch misses)
   - Where appropriate, recommend use of semantic tags like `<sub>`, `<sup>` etc

3. Astro Components
   - `src/components/mdx/` holds every component available in MDX — scan it for the full set rather than relying on the examples below.
   - All components are used correctly, consistently and have appropriate props.
   - Where `<BasicImage>` is used directly, suggest appropriate values for bleed, source etc.
   - Where appropriate, suggest using `<BlockQuoteCitation>` with appropriate props instead of plain markdown blockquotes.
   - Where code blocks are used, suggest appropriate features from expressiveCode. Eg:
     - Language `ruby title="my-test-file.rb"` -> renders a "filename tab"
     - Language `bash` -> renders a "terminal window"
     - etc.
   - If the first paragraph is wrapped in `<IntroParagraph>`, no links in the first ~80 characters (will interfere with first-line styling).

4. Very Obvious Mistakes (think "copyeditor" not "editor" role here)
   - Repeated or incomplete words or phrases.
   - Prose which obviously makes no sense.
   - Obvious errors in code examples etc.

5. Other Recommendations
   - Identify any missed opportunities to cross-link to other site content (grep other articles/notes for related topics).

### Article - Pre-Publishing Check

When asked to check/prepare an article for publishing:

1. Run "Article - Check" review (above) if not just done.
2. Recommend any SMALL, SIMPLE SEO improvements to content (esp in intro para, summary etc).
3. Review (or generate) title, description, slug, tags etc in frontmatter, checking against the zod schema in `src/content.config.ts` (the source of truth for allowed/required fields). Tweak for better SEO if needed.
   - Don't change title without confirming.
   - Don't change any existing description, slug, tags etc without confirming.
   - Ensure description is compelling and under 160 characters.
   - Max 3-5 APPROPRIATE tags. If adding tags not already in use, ask user.
   - No AI or SEO slop - this is a personal site not a landing page.
4. If pubDate is in the past (and the article isn't already published), set it to today.
5. Harmonise title, slug and filename (intelligently).
6. Ensure the date in the filename matches pubDate.
7. Verify local paths for images, files and internal links actually resolve — glob/read the referenced path relative to the file rather than eyeballing it. Ask the user to run the dev server and visually check if still unsure.
8. Remove draft field from frontmatter.
9. Check frontmatter for correctness/formatting (against the schema referenced in step 3).
10. Give feedback to user.

### Note - Check

Notes are usually so short you won't be asked to check them. If you are, use its contents + the "Article - Check" process to quickly guess what the user wants and ask them to confirm and/or give more detail. Then focus on that.

### Note - Pre-Publishing Check

As for "Article - Pre-Publishing Check" but skip 1-3 (unless you feel strongly you shouldn't).

## Technical References

- [content.config.ts](../../../src/content.config.ts) — zod schema for article/note frontmatter (the source of truth).
- [content-authoring.md](../../../docs/developer/content-authoring.md) — technical authoring guidance.
- [mdx/](../../../src/components/mdx/) — all components available in MDX files.
