---
title: Website Redesign Part I - The Tech
slug: website-redesign-i
pubDate: 2020-03-14
---

Over the years, this website has taken many forms. Initially, it was a Wordpress blog. Then is was a hand-rolled Sinatra app that rendered markdown pages. More recently I've blogged on Medium and at the time of writing, my website is a much simpler Sinatra app.

A few months ago I had an ongoing problem with medium which lasted about three months. I got a new Monzo card and medium couldn't charge it. Although none of my articles were behind the paywall, it did mean that I couldn't read other people's paywalled articles. And even though I was happy to pay, I **couldn't**. Eventually, after many many emails between me, Monzo and Medium, I involved Medium's payment processor Stipe. Turns out that the problem was some bad data on their end. We resolved it, but only because I knew about stripe.

This whole experience left a bad taste in my mouth, and like a lot of other people it feels like time to move the canonical version of my writing onto a platform that I own... my own website.

At the same time, I've also become frustrated with my website. Considering what it does, it's most definitely over-engineered. It's not fun to play with any more, and I seem to spend most of my time on it updating dependancies. I also have to pay Heroku to keep it running.

Time to simplify things, then. I need a static site.

Why a static site?

If my site is just HTML and CSS then it's easy to change, even if I've not touched it in years. There are no complex mental models to remember, no dependancies to manage, no security vulnerabilities to patch. I can also deploy it anywhere. I'm not reliant on any specific third parties. Static sites are also [web scale](https://www.youtube.com/watch?v=b2F-DItXtZs) by default when hosted in the right place.

So that's my starting point... plain old HTML and CSS, deployed to Github Pages. When I want to write a new article I just make an HTML page. Simple.

But I also want to enjoy writing articles, which probably means writing in markdown.

So a static site generator is the obvious choice. All the cool kids are using Gatsby and Hugo, but after spending some time with both I think Jekyll is the best option for me. It's simple, is battle-tested and is very very stable.

Before going any further with the tech, I need some values and principles to guide my decisions.

## Values

After some time with a pen and paper, these seem appropriate:

- Simple
- Beautiful
- Authentic
- Content-first

## Engineering Principles

Based on these values, I've pulled out some principles to guide my decisions on tech stack:

1. As few dependencies as possible (both build-time and run-time dependancies).
2. Use defaults wherever possible.
3. Write as little code as possible.
4. Do not over-abstract. Avoid fallbacks, polyfills and hacks.
5. Bake accessibility in.

I'll come back to these regularly.

## Jekyll Plugins

It's tempting to install a whole bunch of plugins – there are some great ones out there. But every plugin is a build-time dependancy, so I've settled on just three.

- **[Optional Front Matter](https://github.com/benbalter/jekyll-optional-front-matter)**. This makes the front-matter optional, obviously. I want it so that my HTML pages don't need any front matter.
- **[SEO Tag](https://github.com/jekyll/jekyll-seo-tag)**. This adds a bunch of SEO-related meta tags in a pretty intelligent way.
- **[Redirect From](https://github.com/jekyll/jekyll-redirect-from)**. This lets me set up redirects in a super-intuitive way. I can crate an empty page or post, specify the redirect in the front matter and be done with it.

## But what about dynamic stuff?

My current website has some dynamic stuff. The only bits I still care about are my reading list and highlights. My medium highlights are pulled in [via their private API](https://github.com/dannysmith/dannyis/blob/master/lib/medium_request.rb#L74) and cached in Redis.

My pocket items and medium recommendations work a bit differently. When I clap for an article on medium or archive one in pocket IFTTT sends a request to an endpoint which stores the details in a Postgres database which the Sinatra app can access.

On reflection, I don't care about the highlights right now.

But I definitely want to retain the likes from Pocket and Medium. I don't want to maintain a Postgres database though.

Enter Airtable. I can have IFTTT create a record in Airtable whenever I clap for a medium article or archive a pocket item.

![Airtable Screenshot](/uploads/2020-03-17-airtable1.png)
![Airtable Screenshot](/uploads/2020-03-17-airtable2.png)

Although this means I'm dependant on Airtable for this part of my website, I'm okay with that because it's not a core part of my site: if airtable goes down or kill my account then 🤷‍♂️. The advantages well outweigh the overhead of managing my own server and database. Also...

- It's easy to pipe data into Airtable from all sorts of places.
- It's easy to edit data in airtable, especially because I use it a bunch anyway.
- It has a very nice API.

There is one problem, though. For my javascript to access this data it needs my Airtable API key. I can't just bung that in my code because then everyone would have it. This is something Netlify's [lambda functions](https://www.netlify.com/products/functions/) are great at: they can act as an intermediate layer between my client-side javascript and the Airtable API.

Netlify also makes a lot of sense for hosting: it has some bells and whistles Github Pages lacks.

So here's where we're at so far...

#### Core Stuff

- Just HTML, CSS and Markdown.
- Jekyll (with a couple of plugins).
- Netlify for hosting.

#### Reading List Stuff

- Airtable - data store.
- Netlify Functions - accessing Airtable.
- IFTTT - piping stuff into Airtable from elsewhere.

## What about the writing experience?

For the most part, I'm happy to write locally in [iA Writer](https://ia.net/writer) or VSCode. For writing on-the-go, [Forestry](https://forestry.io/) seems like the best option. I'd dearly love to find a git-based-jekyll-compatible editor that works like Ghost or Medium, but that can wait.

With these decisions made, it took a surprisingly small amount of time to get all this wired up. Less than two hours. That's the value of simplicity, I suppose.
