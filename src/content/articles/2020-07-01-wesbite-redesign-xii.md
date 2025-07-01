---
title: Website Redesign Part XII - Responsive Images
slug: website-redesign-xii
pubDate: 2020-07-01
---

The last time I built a content-heavy website, responsive images weren't really a thing. In fact they were a definite problem for most developers. We could control the visual size of an image with percentage widths and media queries, but we had no easy way of controlling the actual image used by the browser. The easiest thing to do was just supply a very big high-res image that would look good on wide viewports and accept that smaller viewport devices would end up downloading a file with more detail than they could use.

The last time I gave any real attention to this problem I was working on a site with a lot of high-res background images. I dealt with it in three ways. Firstly, I used a jpeg that was too big for even the largest viewport, but with JPEG compression turned all the way up. This was then scaled down with CSS. This actually _reduced_ the file size, and generally looked pretty good – even on new-fangled retina screens[^1].

Secondly, I spent ages blurring parts of the image in photoshop. The idea was that the fewer individual colours there were in the JPEG, the smaller the filesize. Take a look at this photo:

![Hot air ballon in the sky](/uploads/2020-07-02-hot-air-baloon.jpg)

There are probably hundreds of different shades of blue and grey in the sky, each one taking up bytes in the JPEG. By blurring the sky as much as possible, we end up with far fewer shades of blue and so reduce the filesize. Doing this was a pain in the arse.

All the other stuff involved swapping out images with javascript.

Thankfully that was ages ago, and we now have some much better ways of handling responsive images. Both `secret` and the `<picture>` element were being talked about when I stopped making websites for a living, but both are now well-supported by modern browsers.

## SRCSET

The `srcset` attribute allows us to specify different image files to use at different resolutions and viewport widths. It looks like this.

```html
<img src="small.png" alt="..." srcset="medium.png 1000w large.png 2000w" />
```

This uses the small version by default, but on larger screens the browser will download and use either the medium or large version of the image. All we have to do is make the three versions and bung them in our `/images` folder.

The general rule here is to use an image of the same dimensions as the original and just scale it down to make the smaller versions. As [Chris Coiyer says](https://css-tricks.com/responsive-images-youre-just-changing-resolutions-use-srcset/):

> Most responsive images uses will be: “I have multiple versions of this graphic. Here they are, use the right one.”

## The picture element

The picture element is far more powerful, but also more complex. It allows us to do a bit more at direction as our image size changes – we can use images of different dimensions and control how they are displayed using media query-like rules. A quick google will turn up umpteen articles on how to do this.

## Images on this website

Right now, most images on this site are included via standard markdown image tags, and the generated HTML is pretty simple:

```html
<img src="/uploads/an-image.png" alt="An image" />
```

By default, these images would display at their natural size, so we're using some CSS to constrain them to 100% of their container.

```css
img {
  display: block;
  max-width: 100%;
}
```

Inside essays, this means that smallish images display at their natural size and will not be stretched (we're using `max-width` not `width`), but very large images will be scaled down to fit in the essay container.

The problem with this is that I often include quite large high-res images and set them to full-bleed (more on that later). This is fine for large viewports, but smaller devices will be forced to download the massive high-res file.

The obvious solution is to generate smaller versions of these high-res images and then use `srcset` to let the browser decide which one to show. Except that **this is a blog**. And if I have to create multiple versions and write a long chunk of HTML every time I want to include an image in my markdown I'll just stop writing altogether. Clearly, we need a way to automate this.

While we're at it, there are a few other things we should consider. Firstly, it's a good idea to explicitly declare the dimensions of an image in the HTML using the `height` and `width` attributes. Assuming we don't override it with CSS, this prevents reflow by telling the browser how much room the image will take up so it can draw the right sized box _before_ the image has downloaded. So while we're automating image things we should probably add hight and width to image elements.

What's more, modern browsers will soon be able to infer the aspect ratio of an image based on these attributes, and use that to draw a correctly-sized content box _even if we've changed the width with CSS_. Cool.

Secondly, HTML [now supports](https://caniuse.com/#feat=loading-lazy-attr) native lazy loading via the `loading` attribute. This is obviously good for performance and is as easy as adding `loading="lazy"` to our image tags. Addy Osmani has a [much more detailed explanation](https://addyosmani.com/blog/lazy-loading/).

This ten-minute video from Jen Simmons foes a great job of explaining how all of this works.

<iframe width="560" height="315" src="https://www.youtube.com/embed/4-d_SoCHeWE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## How do we automate this stuff?

Good question. Back when I started this redesign, I made the decision to keep the tech super simple. Here are the principles I defined:

1. As few dependencies as possible (both build-time and run-time dependancies).
2. Use defaults wherever possible.
3. Write as little code as possible.
4. Do not over-abstract. Avoid fallbacks, polyfills and hacks.
5. Bake accessibility in.

I _really_ don't want to add unnecessary complexity to this site. But it feels like this is important enough to add a just little more complexity. If there's a jekyll plugin that can read my markdown image tags, generate smaller versions of my images and insert appropriate `srcset` attributes, I'll take it. Bonus points if it can add `width`, `height` and `loading` attributes too.

My initial search actually led me to some awesome plugins for [Eleventy](https://www.11ty.dev/). [This one](https://github.com/liamfiddler/eleventy-plugin-lazyimages#readme) does some cool lazy-loading with javascript and data URLs, [this one](https://github.com/nhoizey/eleventy-plugin-images-responsiver) creates picture elements, [this one](https://github.com/eeeps/eleventy-respimg#readme) does just what I want for cloud-hosted images and [this one](https://github.com/chromeos/static-site-scaffold-modules/tree/master/modules/eleventy-plugin-local-respimg) basically does what I want but without the bonus points.

Reading though the source code of these was super interesting, and had nudged me to look further at Eleventy (there are some strong arguments for moving this site to it). But since we're on Jekyll here, none of these are much use. What we need is the [Jekyll Responsive Image](https://github.com/wildlyinaccurate/jekyll-responsive-image) plugin.

This looks like it solves half the problem. It lets us specify [our own template](https://github.com/wildlyinaccurate/jekyll-responsive-image/tree/master/sample-templates) for the generated image HTML which means we can add width, height and lazy loading ourselves. The only downside is that we have to use a liquid tag rather than standard markdown to insert images. No thanks.

And then jekyll hooks came to the rescue with [this tutorial from Ivo Valchev](https://medium.com/@ivo.v.valchev/jekyll-responsive-images-with-srcset-5da131415d0f). Let's walk through the process...

### Install the stuff

The plugin uses Rmagick which is a wrapper around imagemagick which is – and has always been – a nightmare. So first step is to update or install it and then try installing the gem manually.

```shell
brew install imagemagick
gem install jekyll-responsive-image
```

Now we can add it to our Gemfile and Jekyll config as per the README. There are a lot of config options available but I started with these: a path to the template, the sizes to generate and an instruction to only save the generated files in the build folder.

```yaml
responsive_image:
  template: _includes/responsive-image.html
  sizes:
    - width: 480
    - width: 800
    - width: 1400
  save_to_source: false
```

How we need to create our template. I stole most of this straignt from the docs, but I've added lazy loading and width/height attributes.

```html
{% raw %} {% capture srcset %} {% for i in resized %} /{{ i.path }} {{ i.width }}w, {% endfor %} {%
endcapture %}
<img
  src="/{{ path }}"
  alt="{{ alt }}"
  loading="lazy"
  srcset="{{ srcset | strip_newlines }}"
  width="{{ original.width }}"
  height="{{ original.height }}"
/>
{% endraw %}
```

So far so good. We can now insert responsive images with

```html
{% raw %} {% responsive_image path: image.jpg alt: "My Image" %} {% endraw %}
```

To get this working with standard markdown, we need to register a hook that replaces markdown image syntax with this new tag at build-time. We can create `_plugins/img_tag_transform.rb` and add the following.

```ruby
Jekyll::Hooks.register :posts, :pre_render do |post, _payload|
  docExt = post.extname.tr('.', '')
  post.content = post.content.gsub(/!\[(.*)\]\(([^\)]+)\)(?:{:([^}]+)})*/, '{% raw %}{% responsive_image path: \2 \3 %}{% endraw %}')
  post.content = post.content.gsub 'path: /', 'path: '
end
```

It's a bit hacky, but it works.

## Is it worth it?

My biggest concern with this approach is the added complexity. Not only have I added Imagemagick as a dependancy, I've also added a new jekyll plugin and a slightly hacky custom plugin.

For now, this feels like an acceptable trade-off, but if I find myself adding more similar stuff in the future I'll have to revisit this and reconsider the value/complexity ratio.

---

## Full-bleed Images

While we're on the subject of images, I've also added a few utility classes to make my images a little more interesting. Normal images are constrained to the width of the element they appear in, but sometimes I want full-bleed images that extend out to the edges of the viewport, like this:

We can do this with a utility class and some `calc()` magic.

```css
.essay {
  .full-bleed {
    width: 100vw;
    margin-left: calc(50% - 50vw);

    // For images that are not wide enough to fill the gap
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
}
```

These styles are applied to the _container_ rather than the image itself so that images smaller than the container are never scaled up. We can apply this style in markdown like this

```markdown
{% raw %}
{:.full-bleed}
![Image](/uploads/2020-07-02-hot-air-baloon.jpg)
{% endraw %}
```

Which will produce the following HTML

```html
<p class="full-bleed">
  <img src="/uploads/images.jpg" alt="Image" ... />
</p>
```

As well as full bleed, I've also added classes for left and right bleed

```scss
.essay {
  .left-bleed {
    margin-left: calc(50% - 50vw);
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
  }

  .right-bleed {
    margin-right: calc(50% - 50vw);
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
}
```

## Summing up

Although it's ben years since I've built a proper website like this, I've kept myself fairly up-to-speed with developments in CSS. Digging into responsive images has been a nice reminder that there is a whole raft of standards that I've ignored and know very little about. I'm now itching to explore some of the other stuff that I remember being discussed and has since matured. I expect I'll have a play with with SVG (a lot has changed), web components and browser APIs for audio, motion and the like sometime.

That said, it wasn't really my intention to go this deep into any performance-related stuff at this stage of the redesign, so while I'm tempted to follow up on this with a load more optimisation I'm gong to force myself back into design mode for a little while and focus on getting the non-blog bits of the site looking nice. Until next time.

[^1]: There was an excellent article on this at the time, but I can't seem to find it.
