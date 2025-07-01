---
title: Auto Generating Jekyll Posts that Redirect to Medium
slug: auto-generating-jekyll-posts-from-medium
pubDate: 2020-08-13
---

I'm making quite heavy use of the [jekyll-redirect-from](https://github.com/jekyll/jekyll-redirect-from) plugin. This allows me to create a normal apge or post file with a special frontmatter item and have the page 301 redirect to the specified URL. I'm already using this to forward URLs like <danny.is/using> to Notion, but I also want to use it for blog posts that I've written elsewhere.

I've recently written an article for [Delocate](https://www.delocate.co/), and I can quickly add that to this site by creating a file in `_posts` called `2020-07-31-not-all-comms-needs-a-purpose.md` with the following frontmatter.

```yaml
title: Not all communication needs a definite purpose
redirectURL: 'https://www.delocate.co/blog/not-all-communication-needs-a-definite-purpose'
platform: delocate
```

The post will behave totally normally as far as Jekyll is concerned, but instead of rendering the empty body, it will 301 redirect to the specified URL.

Although I'd like to move all my medium posts over to this site in the end, that's a big job. So for now I want to create a file like this for every medium post I've written. Creating 40 of these files by hand isn't very appealing, so I whipped up a quick ruby script to do it for me.

I started out trying to parse medium's RSS feed but it doesn't include all the posts, so I'm using medium's private API instead. The script hits the medium API, extracts the data I need into an array and then loops over it creating a correctly formatted file for each post. It lives in `scripts` so I can run it whenever I want with `ruby ./scriipts/generate_medium_forwards.rb` to pull any new medium articles in.(If the whole `Medium` class seems like overkill, it's because I based this on some old code that was more reusable.) Here's the code...

<script src="https://gist.github.com/dannysmith/f984e6fd68583af0a4ae1e2ea708a84f.js"></script>

This worked a treat and I only had one hiccup: I spend far too long trying to work out why many of the articles had identical `published_at` dates before I eventually realised that I needed the `firstPublishedAt` value rather than the `publishedAt` one – the latter gets updated every time the post is edited and re-published.
