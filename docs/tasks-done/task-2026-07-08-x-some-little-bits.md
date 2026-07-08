# Task: Some little bits

Okay, there's a few very small features I'd just like to add to this website.

## 1. Back to top link [✅ DONE]

Let's add some very subtle back to top link to articles, notes, styleguide pages and any pages using the `Page.astro` layout. This should be trivial to add using a simple link and perhaps a new `id` on `<main>` or `<body>`? Let's make sure that when we do this we follow whatever the currently accepted accessibility best practices are for this kind of thing.

## 2. Skip to content link [✅ DONE]

I'm not sure what the best practice for these is in July 2026, I feel like it might be a good idea to add a `sr-only` "Skip to content" link at the top of the doc for people using screenreaders. This should probably just scroll to `<main>`. I guess we should probably also take this opportunity to make sure that we have a consistent ID on things like `<main>` in all our layouts and pages? Again, this is one where we should look up current best practice before implementing, but should be simple. We obviously also need to think about keyboard navigation and tabbing to this here. I think it used to be the case that if somebody just like hasn't clicked on anything yet in the document and they press tab this would actually become visible as the first thing tabbed to and then be invisiblae when tabbed away?

## 3. Fix bug with hamburger menu on iOS mobile [✅ DONE]

The hamburger menu which opens MainNavigation works fine on Chromium but on Safari (mobile and desktop). It *works* fine,  but the actual `<button class="nav-open">` is too narrow even though the SVG inside it overflows and is visible. 


## 4. Some tidying up [✅ DONE]

This is mostly just about cleaning up various config files we have for developer tooling. We need to be careful with doing these things that we are not actually gonna remove useful stuff. ie we should keep any config which was added for specific reasons and is still useful/relevant, But there may be opportunities to remove or modernise anything which is either no longer needed or which we perhaps didn't need to configure explicitly in the first place.

- [x] Remove `.mcp.json` - Contact 7 should be loaded globally on my machine anyway.
- [x] Clean up/modernise our prettier config
- [x] Is there any modernisation/cleanup we should be doing for our ESLint config?
- [x] Is there any modernisation/cleanup we should be doing for our tsconfig?
- [x] Can we slim down `knip.config.json` at all by removing comments and anything which overrides the defaults to no purpose.

We could also look at potentially cleaning up some of the developer scripts in `package.json`. Obviously some of these scripts are standard in astro projects or for tooling that we have. Some of them we use regularly (eg `check:all`) It feels like it's probably worth a quick review of all of these for any which we don't use often this probably needs to be collaborative with me. Obviously some of these are used as part of CI/demployment and the like.

## 5. Refactor `.claude/commands` into skills

We currently have `./claude/commands/content-checks.md` which was written a long time ago. We should refactor this into a modern skill according to the latest guidance from anthropic. May also want to take this opportunity to collaboratively tweak and update the actual contents of the skill.

## 6. Update developer docs a appropriate

- Ensure the new series.json content collection is included in the relevant docs, along with the new optional "series" field on articles.
- Ensure the docs accuratley represent the remark/rehype plugins we have etc. Same with any MDX overrides which we've added since these were written.
- Ensure our recent changes to the package.json scripts are accurate in all docs.
