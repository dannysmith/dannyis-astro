---
title: Website Redesign Part XVI - A Header and Footer for Articles
slug: website-redesign-xvi
pubDate: 2020-08-29
---

I pretty much finished designing the article pages back in [Part XI](/writing/website-redesign-xi), and after [deciding on a typeface and some general design rules](/writing/website-redesign-xv) for the rest of the site it's time to finish it off by adding a header and footer to the article pages.

## The Article Header

Here are a few ideas I played around with for the header.

![Header Example 1](/uploads/2020-08-13-headers1.png)
![Header Example 2](/uploads/2020-08-13-headers2.png)
![Header Example 3](/uploads/2020-08-13-headers3.png)
![Header Example 4](/uploads/2020-08-13-headers4.png)

Although I quite like some of these, it feels like I'm overcomplicating things a bit. It might be better to go with something really simple for now – just a link back to the homepage in the top left corner.

## The Article Footer

The footer needs to include some links, my name and a copyright notice. After a little playing about I ended up with something like this...

![Footer Example](/uploads/2020-08-13-footers1.png)

While I like this, it needs more thought to make in work well on small screens, and I'll be a challenge to implement without overcomplicating the code because of how I've set up the article CSS. So much like the header, I think it makes more sense to keep things simple and just provide a link to the articles index, rather than listing related/recent articles. I expect I'll revisit this in the future.

![Final Footer](/uploads/2020-08-13-footers-final.png)

## The Code

Here's what I ended up with for the CSS...

<script src="https://gist.github.com/dannysmith/e108ee4b0f243623182e98c6d5c1e8d5.js"></script>

<script src="https://gist.github.com/dannysmith/904d92a12f16a67cc3a0a0df47d4bc1e.js"></script>

There's definitely some scope to simplify this, and to add some more "features" to the footer, but this feels like it's enough to call the articles _done_ and move on to the rest of the site.
