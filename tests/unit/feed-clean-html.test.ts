import { describe, it, expect } from 'vitest'
import { cleanFeedHtml } from '../../src/utils/feed/clean-html'

const LINK = 'https://danny.is/writing/some-post/'
const clean = (html: string) => cleanFeedHtml(html, LINK)

describe('cleanFeedHtml', () => {
  describe('URLs', () => {
    it('makes root-relative and relative URLs absolute', () => {
      expect(clean('<a href="/notes/x/">x</a>')).toBe('<a href="https://danny.is/notes/x/">x</a>')
      expect(clean('<img src="/_astro/a.webp" alt="">')).toBe(
        '<img src="https://danny.is/_astro/a.webp" alt="">',
      )
      expect(clean('<a href="other/">x</a>')).toBe(
        '<a href="https://danny.is/writing/some-post/other/">x</a>',
      )
      expect(clean('<video src="/v.mp4" poster="/p.jpg" controls></video>')).toBe(
        '<video src="https://danny.is/v.mp4" poster="https://danny.is/p.jpg" controls></video>',
      )
    })

    it('leaves absolute URLs, other schemes and in-post fragments alone', () => {
      const html =
        '<a href="https://example.com/a">a</a><a href="mailto:hi@danny.is">b</a><a href="#intro">c</a>'
      expect(clean(html)).toBe(html)
    })

    it('collapses <picture> and srcset to a single image', () => {
      const html =
        '<picture><source srcset="/a.avif 300w" type="image/avif"><img src="/a.jpg" srcset="/a.jpg 300w, /b.jpg 600w" sizes="100vw" alt="A" loading="lazy" decoding="async" width="300" height="200"></picture>'
      expect(clean(html)).toBe(
        '<img src="https://danny.is/a.jpg" alt="A" width="300" height="200">',
      )
    })
  })

  describe('code', () => {
    it('turns Expressive Code into a plain code block with its title', () => {
      const html =
        '<div class="expressive-code"><link rel="stylesheet" href="/_astro/ec.css"><script type="module" src="/_astro/ec.js"></script>' +
        '<figure class="frame has-title"><figcaption class="header"><span class="title">config.json</span></figcaption>' +
        '<pre data-language="json"><code><div class="ec-line"><div class="code"><span style="--0:#fff">{</span></div></div>' +
        '<div class="ec-line"><div class="code"><span class="indent">  </span><span style="--0:#fff">"a": 1</span></div></div>' +
        '<div class="ec-line"><div class="code">}</div></div></code></pre>' +
        '<div class="copy"><button title="Copy to clipboard" data-code="x"><div></div></button></div></figure></div>'
      expect(clean(html)).toBe(
        '<figure><figcaption><code>config.json</code></figcaption><pre><code class="language-json">{\n  "a": 1\n}</code></pre></figure>',
      )
    })

    it('drops the hidden terminal label and the caption when there is no title', () => {
      const html =
        '<div class="expressive-code"><figure class="frame is-terminal"><figcaption class="header"><span class="title"></span><span class="sr-only">Terminal window</span></figcaption>' +
        '<pre data-language="sh"><code><div class="ec-line"><div class="code">bun run build</div></div></code></pre></figure></div>'
      expect(clean(html)).toBe('<pre><code class="language-sh">bun run build</code></pre>')
    })

    it('turns md preview and tree blocks into code blocks', () => {
      expect(
        clean('<markdown-preview code="\n# Title\n\nText\n" title="README.md"></markdown-preview>'),
      ).toBe(
        '<figure><figcaption><code>README.md</code></figcaption><pre><code class="language-markdown"># Title\n\nText</code></pre></figure>',
      )
      expect(clean('<file-tree code="src/\n└── index.ts"></file-tree>')).toBe(
        '<pre><code>src/\n└── index.ts</code></pre>',
      )
    })
  })

  describe('images', () => {
    it('turns a markdown image caption into a figcaption', () => {
      expect(clean('<img src="/a.webp" alt="Alt text" title="" caption="A caption">')).toBe(
        '<figure><img src="https://danny.is/a.webp" alt="Alt text"><figcaption>A caption</figcaption></figure>',
      )
    })
  })

  describe('things readers cannot show', () => {
    it('replaces Mermaid diagrams with a link to the post and drops icon SVGs', () => {
      expect(
        clean('<svg id="mermaid-3-0" class="flowchart"><style>.a{}</style><text>Node</text></svg>'),
      ).toBe(
        `<p><em>This post includes a diagram. <a href="${LINK}">View it on danny.is</a>.</em></p>`,
      )
      expect(
        clean(
          '<a href="https://x.com/a">Open <svg aria-hidden="true"><path d="M0"></path></svg></a>',
        ),
      ).toBe('<a href="https://x.com/a">Open </a>')
    })

    it('swaps a Mermaid diagram for its feed image, with its labels as alt text', () => {
      expect(
        clean(
          '<svg id="mermaid-0-0" data-feed-image="/feed-images/mermaid-abc.webp" data-feed-image-width="970"><style>.n{fill:red}</style><g><foreignObject><div><span>Claude</span></div></foreignObject><text>Worker</text></g></svg>',
        ),
      ).toBe(
        `<p><a href="${LINK}"><img src="https://danny.is/feed-images/mermaid-abc.webp" alt="Diagram: Claude Worker" width="970"></a></p>`,
      )
    })

    it('replaces interactive islands with a link to the post', () => {
      expect(
        clean('<astro-island uid="1" component-url="/x.js"><div>Calendar</div></astro-island>'),
      ).toBe(
        `<p><em>This post includes an interactive demo. <a href="${LINK}">View it on danny.is</a>.</em></p>`,
      )
    })

    it('replaces task-list checkboxes with characters', () => {
      expect(
        clean(
          '<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> Done</li><li><input type="checkbox" disabled> Todo</li></ul>',
        ),
      ).toBe('<ul><li>☑ Done</li><li>☐ Todo</li></ul>')
    })
  })

  describe('iframes', () => {
    it('moves fallback content out to a paragraph after the iframe', () => {
      expect(
        clean(
          '<iframe src="https://bandcamp.com/EmbeddedPlayer/album=1" style="border: 0" seamless><a href="https://x.bandcamp.com/album/y">This New Noise</a></iframe>',
        ),
      ).toBe(
        '<iframe src="https://bandcamp.com/EmbeddedPlayer/album=1"></iframe><p><a href="https://x.bandcamp.com/album/y">This New Noise</a></p>',
      )
    })

    it('links to the source of an iframe with no fallback, using its title', () => {
      expect(
        clean(
          '<iframe src="https://www.youtube.com/embed/x" frameborder="0" allowfullscreen></iframe>',
        ),
      ).toBe(
        '<iframe src="https://www.youtube.com/embed/x" frameborder="0" allowfullscreen></iframe><p><a href="https://www.youtube.com/embed/x">Open the embed</a></p>',
      )
      expect(clean('<iframe src="https://v.danny.is/a/embed" title="A demo"></iframe>')).toBe(
        '<iframe src="https://v.danny.is/a/embed" title="A demo"></iframe><p><a href="https://v.danny.is/a/embed">A demo</a></p>',
      )
    })
  })

  describe('footnotes', () => {
    it('uses fn:N / fnref:N ids and swaps the hidden heading for a rule', () => {
      const html =
        '<p>Text<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup></p>' +
        '<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes<a href="#footnote-label"></a></h2>' +
        '<ol><li id="user-content-fn-1"><p>Note. <a href="#user-content-fnref-1" data-footnote-backref aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p></li></ol></section>'
      expect(clean(html)).toBe(
        '<p>Text<sup><a href="#fn:1" id="fnref:1">1</a></sup></p>' +
          '<section><hr><ol><li id="fn:1"><p>Note. <a href="#fnref:1" aria-label="Back to reference 1">↩</a></p></li></ol></section>',
      )
    })
  })

  describe('site-only markup', () => {
    it('drops scripts, styles, templates, buttons and screen-reader-only text', () => {
      expect(
        clean(
          '<p>Keep</p><script>x()</script><style>p{}</style><template><p>T</p></template><button>Play</button><span class="sr-only">Hidden</span>',
        ),
      ).toBe('<p>Keep</p>')
    })

    it('strips presentational attributes but shows hidden content', () => {
      expect(
        clean(
          '<div class="tabs-panels" data-astro-cid-x><div role="tabpanel" id="p-2" hidden tabindex="-1" style="color: red">Panel</div></div>',
        ),
      ).toBe('<div><div id="p-2">Panel</div></div>')
    })

    it('removes heading anchors but gives other empty links their URL', () => {
      expect(clean('<h2 id="a">Title<a href="#a" aria-label="Link to “Title”"></a></h2>')).toBe(
        '<h2 id="a">Title</h2>',
      )
      expect(
        clean('<a href="https://youtube.com/watch?v=x"> <span class="sr-only">Play</span> </a>'),
      ).toBe('<a href="https://youtube.com/watch?v=x">https://youtube.com/watch?v=x</a>')
    })

    it('unwraps unknown custom elements, keeping their content', () => {
      expect(clean('<lite-youtube videoid="x"><p>Inside</p></lite-youtube>')).toBe('<p>Inside</p>')
    })
  })
})
