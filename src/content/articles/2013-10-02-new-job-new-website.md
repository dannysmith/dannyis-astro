---
title: 'New Job, New Website'
pubDate: 2013-10-02
slug: new-job-new-website
draft: false
description: 'Transitioning from designer to Ruby developer and building a custom Sinatra-based website'
tags: ['ruby', 'sinatra', 'web development', 'career', 'personal']
---

I've recently transitioned from being a designer to a Ruby developer in London. As part of this change, I decided to build a completely custom website using Sinatra rather than relying on existing platforms.

## Why Build Custom?

After trying various blogging platforms, I couldn't find one that met my specific requirements:

- **Writing in Markdown** - I wanted to write everything in Markdown
- **Full control over HTML and CSS** - Complete creative freedom
- **Easy image management** - Simple way to include images
- **Understanding all the code** - I wanted to know exactly how everything worked

## The Technical Setup

The website is built using a custom Sinatra application with several key features:

- **Static assets compiled locally** - CSS and JavaScript are processed before deployment
- **Custom Redcarpet renderer** - Markdown is parsed with custom formatting rules
- **Special tag system** - Images and gists can be inserted using custom tags like `{{image: 1}}`
- **Pygments syntax highlighting** - Code blocks are highlighted using Pygments.rb

## Deployment

The site is deployed to Heroku with New Relic monitoring to prevent the app from going to sleep. This ensures fast loading times even during periods of low traffic.

## Custom Styling

I've implemented custom styling for all standard Markdown elements:

- **Lists** - Both ordered and unordered with custom styling
- **Blockquotes** - Styled for emphasis and readability
- **Code blocks** - Syntax highlighted with clean typography
- **Tables** - Responsive and well-formatted

## Reflection

This project reflects my journey from designer to developer. Rather than using off-the-shelf solutions, I prefer building custom tools that give me complete creative and technical control. The site was quickly developed and deployed, proving that custom solutions don't always require extensive development time.

The key is understanding your exact requirements and building just what you need, nothing more.