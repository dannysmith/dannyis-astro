---
title: 'Controlling the Rag with Redcarpet'
slug: controlling-the-rag-with-redcarpet
draft: false
description: 'Improving web typography by preventing orphans and controlling line breaks with custom Redcarpet renderer'
pubDate: 2014-05-04
tags: ['typography', 'ruby', 'redcarpet', 'markdown', 'web design']
---

Good typography is about the accumulation of small improvements. As Mark Boulton puts it:

> "Good typographic design — on the web, in print; anywhere, in fact — relies on small, measurable improvements across an entire body of work"

I've implemented several typographic improvements in my Ruby-based website using a custom Redcarpet renderer that automatically fixes common typography issues.

## The Problems We're Solving

1. **Orphans** - Single words hanging alone on the last line of a paragraph
2. **Short phrase breaks** - Emphasized phrases breaking across lines
3. **Awkward line breaks** - Lines breaking after prepositions, dashes, or short words

## Custom Redcarpet Renderer

Here's how I implemented these fixes:

### Preventing Orphans

```ruby
def paragraph(text)
  # Replace the space between the last two words with a non-breaking space
  text.gsub!(/\s+(\S+)\s*$/, '&nbsp;\1')
  "<p>#{text}</p>"
end
```

### Keeping Short Phrases Together

```ruby
def do_not_break_string(text)
  # Keep short emphasized phrases together
  text.gsub!(/<(em|strong)>([^<]{1,15})<\/(em|strong)>/) do |match|
    match.gsub(' ', '&nbsp;')
  end
  text
end
```

### Preventing Breaks After Short Words

```ruby
def avoid_breaking_after_short_words(text)
  # Complex regex to identify words that shouldn't be broken
  text.gsub!(/(\s)(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)(\s)/i) do |match|
    "#{$1}#{$2}&nbsp;"
  end
  text
end
```

## The Results

These small improvements compound to create noticeably better text rendering:

- **Fewer orphans** - Paragraphs end more naturally
- **Better emphasis** - Short emphasized phrases stay together
- **Smoother reading** - Fewer awkward line breaks interrupt the flow

## Implementation Details

The custom renderer processes Markdown content before it's converted to HTML, applying these typographic rules automatically. This means I can write naturally in Markdown while getting professionally typeset results.

## Typography Principles

The key insight is that good typography happens at the micro level. Each individual improvement might seem small, but together they create text that's:

- **More readable** - Fewer distractions from poor line breaks
- **More professional** - Attention to typographic detail shows craftsmanship
- **More accessible** - Better text flow helps all readers

## Conclusion

Controlling the rag (the uneven right edge of left-aligned text) and preventing orphans are foundational typography skills. By automating these improvements in my Redcarpet renderer, I ensure consistently good typography across all my content.

These techniques work especially well on the web, where we have tools like non-breaking spaces to fine-tune text rendering without sacrificing the flexibility of HTML and CSS.
