# Task: Improve AI Documentation and Config

Having worked on a separate project and learnt a lot about using AI tools, I want to rework the AI documentation of this personal website. Developer documents should live in `docs/developer` and be primarily for the reference of AI models.

We currently have some guidance in CLAUDE.md and we have a load of documents in `.cursor/rules`. I would like to consolidate all of the documentation which explains best practices and how things work into sensible files in the developer docs. And then I'd like to extract out rules for how to work with stuff into CLAUDE or potentially some CLAUDE agents.

To do this we'll need to review the entire codebase and the various structures that we have in place here. The main goal with this task is to make it so that Claude code can conduct bigger and more complicated tasks without getting confused or breaking patterns.

- [ ] Generate `docs` directory with suitable docs
- [ ] Cut down Cursor Rules a lot (move good stuff into docs or Claude.md etc)
- [ ] Set up proper Claude commands and agents to help with Astro, and especially with design/CSS etc. See dannysmith/tauri-template and dannysmith/astro-editor for some inspiration
- [x] Set up same task system as in other projects
- [ ] Add unit tests, end-to-end browser smoke tests, better linter, prettier and ts rules etc
- [ ] Add `npm run check` command which runs all linters, tests and checks.
- [ ] Check integration with GitHub Issues for task tracking etc
- [ ] Improve CLAUDE.md
