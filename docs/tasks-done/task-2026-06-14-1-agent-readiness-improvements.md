# Making the site agent-ready

A log of the changes that made danny.is readable and navigable by AI agents and crawlers, with the reasoning behind each. Kept as an archive of the work and as the basis for a future write-up.

Related: [GitHub issue #127 — LLM-Ready Checks](https://github.com/dannysmith/dannyis-astro/issues/127).

## Background

"Agent-ready" here means a simple thing: an AI agent or crawler that lands on the site can discover its structure, fetch clean machine-readable content, and follow links and redirects — without executing JavaScript or guessing at conventions.

Two tools framed the work and gave us before/after numbers:

- **afdocs** (`bunx afdocs check https://danny.is`, spec at [agentdocsspec.com](https://agentdocsspec.com/spec/)) — checks whether _content_ is agent-readable: is there an `llms.txt`, can pages be fetched as Markdown, do redirects use real HTTP status codes, does real content sit near the top of the page, and so on.
- **[isitagentready.com](https://isitagentready.com/)** (Cloudflare) — checks adoption of emerging agent _discovery_ standards (content signals, `Link` headers, markdown negotiation, and a long tail of newer protocol stuff).

One principle ran through everything:

> **The static build stays portable.** `astro build` produces a `dist/` folder that works on any host. Anything a plain static host can serve, we do in `dist/`. Only the few things that genuinely need server/edge behaviour — header-based content negotiation and real HTTP redirects — live in the Vercel routing layer (`vercel.output-config.json`), and even those degrade gracefully on a dumb host.

The Vercel routing layer is worth understanding before the steps below. The site has no Vercel adapter — `astro build` emits plain static files, and a CI step assembles them into Vercel's [Build Output API](https://vercel.com/docs/build-output-api) layout: `dist/` is copied to `.vercel/output/static/`, and a routing config is written to `.vercel/output/config.json`. That config is the only Vercel-shaped thing in the repo; it only describes headers and routing, never build behaviour.

## What we did

### 1. Declare how AI may use the content

A one-line, advisory declaration in `public/robots.txt` using the [Content Signals](https://contentsignals.org/) convention, scoped to the standard `User-agent: *` group:

```
User-Agent: *
Content-Signal: search=yes, ai-input=yes
Allow: /
```

`search` (index and link to the content) and `ai-input` (use it as real-time input to a model, e.g. RAG) are allowed; `ai-train` is **deliberately omitted**, which the spec reads as "no stated preference" — leaving the training question open rather than answering it either way. The file also carries the longer human-readable Content Signals policy text as comments.

It's a preference signal, not access control — it states intent, it doesn't enforce anything.

### 2. Serve `.well-known` files so they work everywhere

Standard machine-readable files (`security.txt`, the standard.site publication record) belong at `/.well-known/…`. Getting them there cleanly ran into two quirks:

- **Vercel won't serve a dotfile directory** — anything under `dist/.well-known/` returns a 404.
- **Astro won't reliably build routes placed in a dotfile directory** under `src/pages/`, so a _generated_ well-known file can't simply live at `src/pages/.well-known/…`.

The fix is to author everything under a **non-dot `well-known/`** and synthesise the canonical dot-path at build time:

- Static files live in `public/well-known/` (e.g. `security.txt`).
- Generated ones are normal Astro routes in `src/pages/well-known/` (e.g. `site.standard.publication.ts`, which emits a value only when configured).
- Both build to `dist/well-known/`, which Vercel serves fine because it's an ordinary directory.

Then two small pieces tie it together. A `postbuild` step copies the tree to the canonical dot-path so any _other_ static host serves it natively:

```jsonc
// package.json
"postbuild": "rm -rf dist/.well-known && cp -R dist/well-known dist/.well-known"
```

And a single rewrite in the Vercel config maps the canonical URL onto the served path:

```jsonc
{ "src": "^/\\.well-known/(.*)$", "dest": "/well-known/$1" }
```

The pay-off: one place to add a well-known file (`well-known/`, static _or_ generated), and it works both on Vercel and on a plain static host. This replaced an older arrangement that emitted each file at a root path with a per-file rewrite.

### 3. Point agents at the site index (`llms.txt`)

The site already had an [`llms.txt`](https://danny.is/llms.txt) — a Markdown index of everything on the site. The missing piece was telling agents it exists from any page they land on.

afdocs wants a directive that survives the HTML→Markdown conversion agents perform, so it can't be a `<link>` in the `<head>` — it has to be visible text near the top of the content. We added a small visually-hidden component, rendered near the top of `<main>` on every page type:

```astro
<!-- LLMDiscoveryNote.astro -->
<p class="sr-only">
  For AI agents and crawlers: a structured index of this site is available at
  <a href="https://danny.is/llms.txt">https://danny.is/llms.txt</a>.
</p>
```

The `.sr-only` utility hides it with `clip`/`position: absolute`, **not** `display: none` — the latter gets stripped by Markdown converters, the former survives.

Two related touches:

- The per-post Markdown endpoints (`/writing/<slug>.md`, `/notes/<slug>.md`) now emit the same pointer as a blockquote under the title: `> For the complete site index, see [llms.txt](https://danny.is/llms.txt)`.
- The links _inside_ `llms.txt` now point at the `.md` variants of articles and notes (e.g. `/writing/<slug>.md`), so an agent following the index gets Markdown directly rather than HTML it has to convert.

### 4. Serve Markdown when an agent asks for it

Every article and note already had a static `.md` twin (e.g. `/writing/moving-to-astro.md`). Step 3 made those discoverable; this step makes the _same URL_ return Markdown on request. When a request carries `Accept: text/markdown`, the Vercel config rewrites it to the `.md` file and sets the right content type:

```jsonc
{
  "src": "^/writing/([^/]+)/?$",
  "has": [{ "type": "header", "key": "accept", "value": ".*text/markdown.*" }],
  "dest": "/writing/$1.md",
  "headers": { "content-type": "text/markdown; charset=utf-8" }
}
```

There's an equivalent rule for notes, and one for the homepage — which has no `.md` twin, so it serves `llms.txt` instead (the most useful "site as Markdown" for an agent, since the real homepage is just a link hub).

Browsers never send `Accept: text/markdown`, so they're completely unaffected — they keep getting HTML. To stop a CDN or proxy caching one representation and serving it to the wrong client, the negotiable URLs also carry `Vary: Accept`. (Vercel already serves files with a `.md` extension as `text/markdown`, so direct `.md` access needed nothing.)

### 5. Advertise the index in an HTTP header

A `Link` header on every response points agents at the index before they've parsed a single byte of HTML:

```
Link: </llms.txt>; rel="describedby"
```

`describedby` is a registered relation meaning "this resource is described by the linked one," which is honestly what `llms.txt` is for the site.

### 6. Turn meta-refresh redirects into real HTTP redirects

The site has two kinds of redirect: short links (`/meeting`, `/cv`, `/linkedin`, …, defined in `src/config/redirects.ts`) and old cross-posted articles whose canonical home is elsewhere (Medium, via a `redirectURL` in frontmatter). Both were being served as **meta-refresh** pages — the browser fetched and rendered a full HTML page, _then_ bounced. That wastes a render, looks worse to crawlers, and registers as a "JavaScript redirect" to tooling.

Rather than hand-list redirects in the Vercel config, we made the build emit a single host-agnostic manifest and generate the routes from it.

**The build emits `dist/redirects.json`** (`src/pages/redirects.json.ts`) — a plain list unioning both sources:

```json
{
  "version": 1,
  "redirects": [
    { "source": "/meeting", "destination": "https://cal.com/dannysmith", "status": 302 },
    {
      "source": "/writing/2018-04-02-little-things",
      "destination": "https://medium.com/@dannysmith/little-things-c4b8fdcdc68c",
      "status": 302
    }
  ]
}
```

Generating it _inside_ the Astro build matters: it reads the articles via `getCollection`, so each `source` uses the exact same id the real route uses. That's robust even for articles with a custom `slug` — a script parsing filenames would have got those URLs wrong. (It also naturally skips drafts, which have no page.)

**At deploy, a small Vercel-specific script turns the manifest into real `302` routes.** `scripts/build-vercel-config.mjs` reads the base config and `dist/redirects.json`, injects a route per entry ahead of the content-negotiation and filesystem routes, and writes the final `.vercel/output/config.json`. The CI "Prepare Vercel output" step runs it instead of a plain copy.

The meta-refresh pages stay in the static build as the portable fallback, so the site still redirects correctly on a non-Vercel host — and because the manifest is deploy-target-neutral, another host could read `dist/redirects.json` and configure the same redirects itself.

**A gotcha worth recording.** This was the first code to read a collection field (`redirectURL`) through the site's `filterContentForPage` helper without casting the result. That helper is generic over a minimal constraint (`{ draft?, styleguide? }`); when TypeScript can't see Astro's _generated_ content types — which it can't in CI, where `tsc` runs before any `astro sync` — the generic collapses to that bare constraint and `redirectURL` "doesn't exist." It passed locally (where prior builds had generated the types) and failed in CI. The fix is the one the codebase already uses elsewhere: cast the result, `as CollectionEntry<'articles'>[]`.

## A free win: content now starts at the top

afdocs also checks how far down a page the first real content begins (it penalises pages that are mostly navigation before anything meaningful). Before this work, a swathe of pages failed outright — the homepage, the writing index, and every redirect stub had no prose the checker could latch onto, so it reported content starting at 100%.

The visually-hidden `llms.txt` pointer from step 3 fixed this as a side-effect: it's a short prose paragraph near the top of `<main>`, so it becomes the first "real content" the checker detects. The previously-failing pages dropped from 100% to roughly 2–23%, comfortably inside the passing range — without any work aimed specifically at the check.

## Results

Measured with the two tools, before this work vs after:

- **afdocs** — the checks we targeted flipped from failing to passing or warning: the `llms.txt` HTML/Markdown directives, content negotiation, `llms.txt`→`.md` links, redirect behaviour, and section-header serialization. (A couple of checks now flag the cross-post articles, because following their real redirect lands on Medium, which blocks scanners — the redirect is correct; the scanner just can't read the destination.)
- **isitagentready** — reached **Level 3, "Agent-Readable."** Content Signals, `Link` headers, and markdown negotiation all moved to passing.

## What we deliberately skipped, and why

Both tools also check for a tail of very new agent-protocol standards — MCP server cards, an A2A agent card, OAuth/auth discovery, DNS-based discovery, on-page WebMCP tools, and similar. We left all of these out on purpose. They target authenticated APIs, callable services, or agent-to-agent integration that a static personal site simply doesn't have; publishing that metadata would describe capabilities that don't exist. The scanners can't express "intentionally not applicable," so they keep flagging them — which is a limitation of the scoring, not a gap in the site.

The guiding judgement was to do the things that genuinely help an agent read and navigate the site, and to skip the speculative standards that don't fit what this site is.
