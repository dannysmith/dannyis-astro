---
title: How I use Claude skills and projects in the desktop app
slug: claude-skills-projects-desktop-app
pubDate: 2026-10-20
---

Since Opus 5.5, Claude's responses are again sufficiently readable for me to want to use it more outside the CLI. The desktop app has also come on an awful lot since I last made heavy use of it outside the *Claude Code* tab.

The [merging of "normal Claude" and Cowork](https://claude.com/resources/articles/cowork-is-now-claude) in September makes normal conversations way more powerful because each now gets its own sandboxed Linux workspace if it needs one. The [memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context) features are also much better than they used to be.

I've found myself using a very simple pattern loads lately:

1. Creating very specific informational skills and saving them to my Claude account rather than into a plugin in my [personal marketplace](https://github.com/dannysmith/claude-marketplace).
2. Using Projects in Claude Web & Desktop with a simple instruction that says "Always load this skill in here".

For example, I have a skill which contains a load of technical and reference material about my car with this description:

> Reference for the owner’s car, a 2004 Vauxhall Astra G 1.4 16v (HK54CXM). Use whenever the user mentions their car, the Astra, repairs, parts, MOT, servicing or noises.

And another about Minecraft with this:

> Danny’s N19 Minecraft world and server: rules, seed, server details, builds and live Notion docs. Load whenever Danny talks about Minecraft, even without naming it (farms, redstone, mobs, Nether, Cam, N19).

Both of these are single `SKILL.md` files and the descriptions above reliably cause them to get loaded in web, desktop, mobile and CLI sessions when it makes sense.

But I also have a Claude Project for each to keep car-related or Minecraft-related conversations together. The instructions for these projects simply say "Always load XXX Skill". This means that any conversation which I start or move into my Minecraft project will always have the skill loaded at the beginning and will also have access to the project memories. In both cases I've switched off access to the global memories.
