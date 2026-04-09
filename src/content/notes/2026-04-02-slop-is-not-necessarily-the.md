---
title: 'Slop Is Not Necessarily The Future'
sourceURL: 'https://www.greptile.com/blog/ai-slopware-future'
draft: true
pubDate: 2026-04-02
---

I agree with this point of view.

GitHub is awash with AI-generated slop right now (including plenty of [my own](https://danny.is/notes/roberts-radios/)) but while LLM's have made it both cheap and fast to **write** code, the initial development of a project has never been the most time-consuming thing. Long-term maintainance has.

I see new projects daily with hundreds of thousands of lines of AI-generated code, and while it's amazing that folks can build & ship products of this size in a matter of weeks, I don't expect many such projects to have any longevity.

Anyone who's been around for long enough knows this is true:

> In A *Philosophy of Software Design*, John Ousterhout argues that complexity is the #1 enemy of well-designed software. Broadly he argues that good code is:
> 
> - Simple and easy to understand
> - Easy to modify
> Bad code is the opposite, needs lots of context and mental bandwidth to understand and is almost impossible to modify.

And in the long-term it's true whether code is written by humans or LLMs. 

Over the last nine months or so I've built a bunch of projects with AI coding tools, ranging from *totally-vibe-coded* to *I've-read-every-line*. Reflecting on this just now I realised that one of my biggest unconcious concerns with **all of these** was the avoidence of complexity.

[Astro Editor](https://astroeditor.danny.is/) was my first project using Claude Code and I threw the first version of it out as soon as it started to feel too complex. The rebuild was rooted in strong principles about what it should and shouldn't do as a product, plus some very strong opinions about how it should work under the hood. The only really meaty feature [I have left on the backlog](https://github.com/dannysmith/astro-editor/issues/82) is *entirely about reducing both cognative and technical complexity*.

When developing [Taskdn](https://tdn.danny.is/), I spent a good few days thinking and iterating on [the specification](https://tdn.danny.is/specification/overview/) for the underlying markdown/YAML files with the sole purpose of making it as **simple and uncomplex as possible**. Taskdn is made up of four completeley independant tools to reduce the complexity of each. The Obsidian plugin does three things and nothing more, and the code is uncomplicated as a result.

My [recent minecraft projects](https://danny.is/notes/minecraft-bluemap-plugins/) are intentionally limited in their features for the same reason. And this (entirely vibe-coded) [menubar app](https://github.com/dannysmith/roberts-radio) is intentially a single file of swift.



## Comparing Handy with Voiceink

### Beans


