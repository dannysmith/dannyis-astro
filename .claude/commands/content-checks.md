---
description: Check and prepare content for publishing
allowed-tools: Read, Edit
---

# Content Checks Command

Check content (MD & MDX files) forthe user, providing feedback and making changes where nececarry. 

## Rules

- Do not rewrite whole sentences without first confirming with user. You may make small edits (spelling, formatting etc) without prior confirmation. If in doubt, ALWAYS ask the user before editing.
- When presenting reccomendations, be concise and make it easy for the user to say yes/no/<comment> to multiple suggestions in a single response.
- When working on SEO, marketing etc: balance your **expert knowledge in these fields** with your intimate knowledge of Danny and the purpose & content of this site.
  - ACTUALLY improve his content's performance -> He'll love you.
  - Act like a shitty SEO/Marketing consultant, or deliver AI slop -> He'll HATE you.
- If unsure about your task -> ask the user with reference to the "commands" below.

## "Commands"

You will likeley be asked to check one of four things:

### Article - Check

When asked to check an article, review in detail using this guidance:

1. Prose
   - No spelling errors
   - Go grammar errors
   - Consistent case, punctuation etc for headings, lists etc
   - Final paragraph is proper sentence (so endmark works)

2. Markup
   - Proper markdown heading hierarchy (no skipped levels)
   - Markdown image tags have suitable Alt text
   - Acronyms wrapped in `<abbr>` tag
   - Keyboard shortcuts wrapped in `<kbd>` tag.
   - Inline code, filenames etc wrapped in backticks.
   - No errors in other markdown formatting (bold, italic, links etc).
   - Footnotes properly formatted and referenced at end.
   - Code blocks have a language (where appropriate)
   - Where appropriate, reccomend use of semantic tags like `<sub>`, `<sup>` etc.

3. Astro Components
  - All components are used correctly, consistently and have appropriate props.
  - Where <BasicImage> is used directly, suggest apropriate values for bleed, source etc.
  - Where appropriate, suggest using <BlockQuoteCitation> with appropriate props instead of plain markdown blockquotes.
  - Where code blocks are used, suggest appropriate features from expressiveCode. Eg.
    - Language `ruby title="my-test-file.rb"` -> renders a "filename tab"
    - Language `bash` -> renders a "terminal window"
    - etc.
  - If first paragraph wrapped in <IntroParagraph>, no links in first ~80 characters (will intefere with first-line styling)

4. Very Obvious Mistakes (think "copyeditor" not "editor" role here)
   - Repeated or incomplete words or phrases.
   - Prose which obviously makes no sense.
   - Obvious errors in code examples etc.

5. Other Reccomendations
   - Identify internal any missed opportunities to cross-link to other site content


### Article - Pre-Publishing Check

When asked to check/prepare an article for publishing:

1. Run "Check Article" review (above) if not just done.
2. Reccomend any SMALL, SIMPLE SEO improvements to content (esp in intro para, summary etc)
3. Review (or generate) title, description, slug, tags etc in frontmatter. Tweak for better SEO if needed.
   - Don't change title without confirming
   - Don't change any existing description, slug, tags etc without confirming
   - Ensure description is compelling and under 160 characters
   - Max 3-5 APPROPRIATE tags. If adding tags not already in use, ask user
   - No AI or SEO slop - this is a personal site not a langing page
4. If pubDate is in the past (and the article isn't already published), set it to today.
5. Harmonise title, slug and filename (intelligently).
6. Ensure date in filename matches pubDate.
7. Check corectness of local paths for images, files or links to other pages etc (ask user to run dev server and visually check if unsure)
8. MDX files: check imports are correct
9. Remove draft field from frontmatter
10. Check frontmatter for correctness/formatting
11. Give feedback to user

### Note - Check

Notes are usually so short you won't be asked to check them. If you are, use it's contents + the "Article - Check" process to quickly guess what the user wants and ask them to confirmand/or give more detail. Then focus on that.

### Note - Pre-Publishing Check

As for "Article - Pre-Publishing Check" but skip 1-3 (unless you feel strongly you shouldn't).

## Technical References

- [content-authoring.md](../../docs/developer/content-authoring.md) provides relevant technical guidance.
- [mdx/](../../src/components/mdx/) contains all components available for use in MDX files.
