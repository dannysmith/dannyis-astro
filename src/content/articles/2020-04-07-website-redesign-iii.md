---
title: Website Redesign Part III - A Base to Start From
slug: website-redesign-iii
pubDate: 2020-04-07
---

I'm trying to keep the CSS as minimal as possible here, but I do want a decent blank slate to work from. So I've normalised browser styles with [normalize.css](https://necolas.github.io/normalize.css/) and set up some of my own base styles.

- Reset some basic styles to the way I like them.
- Set up some variables and use them for base colours and typography.
- Remove styles from all lists that have a class - they're probably part of the UI, not the content.
- Remove styles from links that have a class - same reason.
- Set default link styles for body copy.
- Remove all animations and transitions for people that prefer not to see them.

I'm sure these will change over time, but here they are for now...

<script src="https://gist.github.com/dannysmith/dc8930ee00a9c47588b096b74870f27b.js"></script>

<script src="https://gist.github.com/dannysmith/3e4d15914c9b809b447bb7e7538ae545.js"></script>

## A starting point for article typography

Since I'm writing on this site now, there'll be a lot more written content. My **Content-first** value means I should probably start with that, while my **Simplicity** value means I should probably ignore layout and start by making the article copy as beautiful and readable as I can.

So taking a [leaf out of Frank Chimero's book](https://frankchimero.com/blog/2020/redesign-this-design/), I'm starting with a very very simple set of styles for my articles.

<script src="https://gist.github.com/dannysmith/0cdf7bde3a20a9453d47c20155ba1d82.js"></script>

I'll focus in on this soon but until I choose a better typeface, `--font-copy` is set to Georgia. Like Frank, I still like it.
