---
title: Website Redesign Part IX - Lists
slug: website-redesign-ix
pubDate: 2020-06-25
---

Lists are incredibly useful for certain sorts of article. I tend to make quite heavy use of lists in some of my articles, so it's important that I give some thought to how they're styled. Since I'm going for a "bookish" vibe, I'd rather keep the vertical rhythm the same as for all the other text on the page, so I'll be sticking with the standard top-margin of 1 &times; _line height_ and leaving the margin and line height of the list items as they are. With that decision made, we only need to worry about styling the list markers: bullets, numbers and checkboxes.

After a bit of playing around, I think it's a bit too jarring to hand the markers in the margin and flush-align the text. If this was for print it might look less wierd, but we're so used to seing indented lists on the web that it just feels wrong for this medium. So we'll aim to flish-align the markers and set 1em of left-padding on all list items. As long as we keep the markers set to `outside` we'll end up with the start of out text neatly aligned at 1em from the left margin.

```css
.essay li,
.essay li {
  padding-left: 1em;
}
```

## Bulleted Lists

After a bit of playing around, I've decided to keep the bullets super sumple. We'll just use a mid-sized bullet and ad a little left padding to pull them inline with the margin.

```css
.essay ul {
  padding-left: 0.4em;
  list-style-type: '•';
}
```

Annoyingly, iOS Safari and Chrome don't yet support string values for `list-style-type`, but since they both support `@supports`, we can add a fallback.

```scss
@supports (not (list-style-type: '•')) {
  &:not(.task-list) {
    // Begin fix for browsers that don't support list-style-type: <string>
    list-style-type: none;
    padding-left: 0.9em;
    li {
      padding-left: 0.5em;
      position: relative;
      &:before {
        content: '•';
        position: absolute;
        left: -1em;
      }
    }
    // End fix
  }
}
```

## Numbered Lists

We're decreasing both the size and optical size for numbers to the same as we did for for `abbr` elements, and falling back to the _Literata Caption_ if variable fonts aren't supported. We're also making them slightly bolder than abbreviation since, as markers, it's important they stand out a little more. We're then adding some left padding to bring the first character inline with the left margin: single digit numbers will be flush with the margin while extra digits will extend outwards to the left.

1. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
1. Aliquam tincidunt mauris eu risus.
1. Vestibulum auctor dapibus neque.
1. Nunc dignissim risus id metus.
1. Cras ornare tristique elit.
1. Vivamus vestibulum ntulla nec ante.
1. Praesent placerat risus quis eros.
1. Fusce pellentesque suscipit nibh.
1. Integer vitae libero ac risus egestas placerat.
1. Vestibulum commodo felis quis tortor.
1. Ut aliquam sollicitudin leo.
1. Cras iaculis ultricies nulla.
1. Donec quis dui at dolor tempor interdum.

```scss
.essay ol {
  padding-left: 0.8em;

  ::marker {
    font-size: 0.85em;
    font-family: 'Literata Caption', Georgia, 'Times New Roman', serif;
    font-weight: 600;

    @supports (font-variation-settings: normal) {
      font-family: 'Literata Variable', Georgia, 'Times New Roman', serif;
      font-variation-settings: 'opsz' 10;
      font-weight: 610;
    }
  }
}
```

## Checklists

Jekyll allows us to use [Github Flavoured Markdown task lists](https://github.github.com/gfm/#task-list-items-extension-), and I occasionally make use of this in my articles. They work like this

```markdown
- [ ] Item 1
- [x] Item 2
- [ ] Item 3
```

This will produce the following output and HTML

- [ ] Item 1
- [x] Item 2
- [ ] Item 3

```html
<ul class="task-list">
  <li class="task-list-item">
    <input type="checkbox" class="task-list-item-checkbox" disabled="disabled" />Item 1
  </li>
  <li class="task-list-item">
    <input
      type="checkbox"
      class="task-list-item-checkbox"
      disabled="disabled"
      checked="checked"
    />Callout inline styles
  </li>
  <li class="task-list-item">
    <input type="checkbox" class="task-list-item-checkbox" disabled="disabled" />Item 2
  </li>
  <li class="task-list-item">
    <input type="checkbox" class="task-list-item-checkbox" disabled="disabled" />Item 3
  </li>
</ul>
```

We can use these generated classes to style the checkboxes. We'll remove the default list styles and padding and set up each `li` as a flex container. Each have two flex items – the checkbox and the text. This ensures that the text doesn't wrap dowin under the checkbox for multi-line items.

```css
.task-list {
  list-style-type: none;
  padding-left: 0;
}

.task-list-item {
  position: relative;
  display: flex;
  align-content: center;
  padding-left: 0;
}
```

Next, we'll remove the default appearance, set a hight and width and nudge the box with some margin so it's about the same height as lowercase characters and is aligned a tiny bit above the baseline. We'll also add a border of our own.

```css
.task-list-item-checkbox {
  margin: 0.5em 1em 0 0;
  height: 0.7em;
  width: 0.7em;
  min-width: 0.7em; /* Prevent flex-shrinking */

  -webkit-appearance: none;
  -moz-appearance: none;
  -o-appearance: none;
  appearance: none;
  outline: none;

  border: 1px solid rgba(0, 0, 0, 0.3);
}
```

Finally, we'll add a tick (&#x2713;) to any that are checked, style it and position it properly within the box.

```css
.task-list-item-checkbox:checked:before {
  content: '\2713';
  position: absolute;
  top: 0.645em;
  font-size: 0.6em;
  font-weight: 600;
}
```

To make this work properly on iOS, we also need to explicitly set the background and border-radius, and bump the opacity of disabled checkboxes up to 1.

```scss
.task-list-item-checkbox {
  // ...
  border-radius: 0px;
  background: transparent;
  //...
}

.task-list-item-checkbox[disabled] {
  opacity: 1;
}
```

And that just about wraps up styling for lists. I'm sure I'll revisit some of this when I start to add colour to the site, but for now this is a definite improvement over the defaults.
