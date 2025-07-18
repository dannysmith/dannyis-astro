---
title: 'A Pretty Readability Archive with Ruby and CSS'
slug: a-pretty-readability-archive-with-ruby-and-css
draft: false
description: 'Building a visual bookmarks display using the Readability API, Ruby, and CSS 3D transforms'
pubDate: 2014-04-20
tags: ['ruby', 'css', 'api', 'readability', 'sinatra', 'design']
---

I've always found it interesting to see what other people read. Not just the things that they share on twitter, but the articles they read on a daily basis.

I decided to build a web application to display my Readability bookmarks using Ruby, Sinatra, and CSS transitions to create an interactive card-based layout.

## The Technical Implementation

The application follows these key steps:

1. **Environment variable setup** - Secure authentication credential storage
2. **Readit gem integration** - Ruby library for the Readability API
3. **XAuth authentication** - Secure API authentication
4. **Bookmark fetching** - Retrieving archived articles
5. **Interactive card display** - CSS 3D transforms for flippable cards

## API Integration

Using the Readit gem, I configured the Readability API connection:

```ruby
# Configure the Readit API
Readit.configure do |config|
  config.consumer_key = ENV['READABILITY_KEY']
  config.consumer_secret = ENV['READABILITY_SECRET']
end

# Authenticate via XAuth
client = Readit::Client.new(
  oauth_token: ENV['READABILITY_TOKEN'],
  oauth_token_secret: ENV['READABILITY_TOKEN_SECRET']
)

# Fetch archived bookmarks
bookmarks = client.bookmarks
```

## Interactive Card Design

The CSS creates an engaging card-based layout where each bookmark has:

- **Front face** - Title and background image from the article
- **Back face** - Article excerpt and metadata
- **Flip animation** - Smooth 3D transform on hover

The cards use CSS 3D transforms to create a flipping effect that reveals additional information about each article when you hover over them.

## Key Features

- **Responsive design** - Cards adapt to different screen sizes
- **Visual appeal** - Each card shows the article's featured image
- **Rich metadata** - Article excerpts, publication dates, and sources
- **Smooth animations** - CSS transitions for polished interactions

## Future Improvements

Potential enhancements I'm considering:

- **Infinite scrolling** - Load more bookmarks as you scroll
- **Responsive grid** - Replace fixed-width layout with flexible grid
- **Filtering** - Sort by date, source, or tags
- **Search functionality** - Find specific articles quickly

## Reflection

This project combines API integration, responsive design, and interactive CSS to create something genuinely useful. It's a great example of how modern web technologies can transform simple data into engaging experiences.

The combination of Ruby for backend processing and CSS for frontend interactions creates a fast, visually appealing way to browse through saved articles.
