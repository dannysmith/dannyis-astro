# Task 1: Agent-Readiness Improvements

**Related:** [GitHub issue #127 — LLM-Ready Checks](https://github.com/dannysmith/dannyis-astro/issues/127)

## Background

Two tools assess how well this site serves AI agents and crawlers:

- **afdocs** (`bunx afdocs check https://danny.is`) — checks whether our _content_ is agent-readable against the [Agent-Friendly Docs spec](https://agentdocsspec.com/spec/). Baseline at time of writing: **11 passed, 4 warnings, 7 failed, 1 skipped**.
- **[isitagentready.com](https://isitagentready.com/danny.is)** (Cloudflare) — checks adoption of emerging agent _discovery/protocol_ standards. Baseline ~25/100. Many of its checks are bleeding-edge drafts; we deliberately ignore several (see "Out of Scope").

We already have a strong baseline: `llms.txt`, per-post `.md` endpoints, three RSS feeds, rich JSON-LD, a sitemap, and a clean `robots.txt`. This task closes the gaps that are genuinely worth closing.

## Guiding principles (important)

1. **The static build must keep working anywhere.** `astro build` produces portable HTML in `dist/`. Everything we can do portably, we do in `dist/`.
2. **`vercel.output-config.json` is the host-specific layer.** It already handles things static HTML can't (caching, real HTTP redirects, header injection). Only put things here that genuinely cannot be done in static output. Treat new Vercel-specific behaviour as graceful enhancement — the site must still be sensible if served from a dumb static host.
3. **Minimise Vercel lock-in**, but it's not an absolute rule. Two items below (content negotiation, HTTP redirects) can _only_ be done at the host layer; that's acceptable.

---

## Workstream A — Portable changes (live in `dist/`, work on any host)

### A0. Unify `.well-known` serving (foundational — do before A4)

**Two problems, one scheme.**

1. **Vercel won't serve a dot-dir.** Its static layer treats dot-prefixed directories as hidden, so `dist/.well-known/` 404s (documented in `src/pages/standard-site-publication.ts:6-9`). The current workaround emits each resource at a _root_ path and rewrites — leaving `dist/.well-known/` empty, so a non-Vercel host has nothing at `/.well-known/...`.
2. **Astro won't reliably build a dot-dir under `src/pages/`.** So _generated_ well-known resources (the existing `standard-site-publication` endpoint; any future TS-generated file in the style of `humans.txt.ts`/`llms.txt.ts`) can't naturally live at `.well-known/` either.

Both vanish if we **author everything at a non-dot `well-known/` path — mixing static and generated freely — and synthesize the canonical `.well-known/` copy at build time.** The current `standard-site-publication` "root path + rewrite" trick stops being a special case and becomes the _general_ rule.

**Scheme:**

1. **Author all well-known resources under `well-known/` (non-dot)**, exactly like the rest of the site:
   - **Static → `public/well-known/`** (copied verbatim to `dist/well-known/`). e.g. move `public/security.txt` → `public/well-known/security.txt` (its `Canonical:` line still points at `/.well-known/security.txt`, which keeps resolving via step 3); `public/well-known/agent-skills/consume-danny-is/SKILL.md` (A4).
   - **Generated → `src/pages/well-known/*.ts`** (prerendered to `dist/well-known/*`), same pattern as `humans.txt.ts`. e.g. move `src/pages/standard-site-publication.ts` → `src/pages/well-known/site.standard.publication.ts`; generate the agent-skills index at `src/pages/well-known/agent-skills/index.json.ts` (lets us compute the `SKILL.md` sha256 at build — see A4).

   Everything lands in `dist/well-known/...`, which **Vercel serves natively** (it's a normal dir — the same reason today's root-level workaround works).

2. **Synthesize the portable dot-dir.** A `postbuild` step copies the tree so the canonical path exists for non-Vercel hosts (goal a). Lives in the portable build, so `astro preview` reflects it too (symmetric with the existing `prebuild`):

   ```jsonc
   "postbuild": "cp -r dist/well-known dist/.well-known"
   ```

   (`astro build` empties `dist/` each run, so the dot-dir never pre-exists to cause nesting.)

3. **One Vercel rewrite** maps canonical dot-URLs to the served non-dot path (Vercel ignores the `.well-known/` copy). Replace **both** existing per-file rewrites in `vercel.output-config.json` with a single catch-all, just before `{ "handle": "filesystem" }`:

   ```jsonc
   { "src": "^/\\.well-known/(.*)$", "dest": "/well-known/$1" }
   ```

**Net result:** one authoring convention (`well-known/`, static _or_ generated), portability via one `postbuild` line, one rewrite for Vercel, and the `standard-site-publication` special-case disappears. Update its file comment to describe the new scheme. No change to `deploy.yml` needed.

**Confirm during implementation:** that Astro builds a dotted multi-segment route filename in a subfolder (`src/pages/well-known/site.standard.publication.ts` → `/well-known/site.standard.publication`). Expected to work (cf. `rss.xml.js` → `/rss.xml`), but verify in the build output; if not, fall back to a build script that writes that one file.

### A1. Content Signals in `robots.txt`

Declare AI-usage preferences per the [Content Signals](https://contentsignals.org/) convention. Add a `Content-Signal:` line inside the `User-agent: *` group of `public/robots.txt`. Omitting a signal = "no stated preference"; `=yes`/`=no` are the only values.

**Decided:** `search=yes, ai-input=yes`, and **`ai-train` deliberately omitted** (neutral — no stated preference, keeps options open).

With the explanatory comment block the policy recommends:

```
# Content Signals — see https://contentsignals.org/
#   search:   build a search index / provide search results (not AI summaries)
#   ai-input: use content as real-time input to AI models (RAG, grounding)
#   ai-train: train or fine-tune AI models
# yes = allowed, no = disallowed, omitted = no stated preference.

User-agent: *
Content-Signal: search=yes, ai-input=yes
Allow: /

Sitemap: https://danny.is/sitemap-index.xml
```

_Resolves:_ isitagentready "Content Signals". _Note:_ advisory signal, not access control.

### A2. `llms.txt` discovery directive (HTML + markdown)

afdocs wants every content page to point agents at `llms.txt`, in both the rendered DOM and the `.md` output. **It is not a `<link rel>`** — it must be visible text near the top of the content that survives HTML→markdown conversion.

- **HTML side:** add a visually-hidden block near the top of `<main>` content in the shared layouts (article, note, and the base page layout). Use clip-rect hiding, **not `display:none`** (converters strip it). Text e.g. _"For AI agents: a full site index is available at /llms.txt"_. Must not live inside `<nav>` (nav text is explicitly discounted by the checker). Verify any existing `.sr-only` utility uses `clip`, not `display:none`, before reusing it.
- **Markdown side:** in both `.md` route handlers (`src/pages/writing/[...slug].md.ts`, `src/pages/notes/[...slug].md.ts`), emit a blockquote right after the `# Title`:

  ```
  > For the complete site index, see [llms.txt](https://danny.is/llms.txt)
  ```

_Resolves:_ afdocs `llms-txt-directive-html`, `llms-txt-directive-md` (2 failures).

### A3. Point `llms.txt` links at `.md` variants

afdocs prefers the links inside `llms.txt` to resolve to markdown (in addition to HTML is fine). In `src/pages/llms.txt.ts`, the article and note link lists currently emit `/writing/<id>/` and `/notes/<id>/`. Append `.md` variants (simplest: change those list links to the `.md` URLs, since `llms.txt` is an agent-facing artifact). Keep external links and page links as-is.

_Resolves:_ afdocs `llms-txt-links-markdown` (warning).

### A4. Agent Skills Discovery index (+ a SKILL.md)

Publish an Agent Skills Discovery index ([RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc)), plus the referenced `SKILL.md`. **Depends on A0** — both live under the `well-known/` convention and are served via the A0 scheme (`dist/well-known/` for Vercel, synthesized `dist/.well-known/` for portability).

- **`SKILL.md` → static** at `public/well-known/agent-skills/consume-danny-is/SKILL.md`.
- **`index.json` → generated** at `src/pages/well-known/agent-skills/index.json.ts`. Generating it (rather than committing a static file) lets the route read `SKILL.md` at build time and compute its sha256 digest, so the digest can never drift out of sync with the file.

**Decided:** publish a single **"consume danny.is"** skill — a `SKILL.md` describing how an agent should consume this site as structured content: the `llms.txt` index, the per-post `.md` endpoints (and `Accept: text/markdown` content negotiation from B1), and the RSS feeds. Self-referential, genuinely useful, low risk. Name e.g. `consume-danny-is`.

Shape (each `skills` entry needs `name`, `type` ∈ `skill-md`|`archive`, `description`, `url`, `digest: "sha256:<hex>"`):

```json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "consume-danny-is",
      "type": "skill-md",
      "description": "How to consume danny.is as structured content: llms.txt index, per-post .md endpoints, Accept: text/markdown negotiation, and RSS feeds.",
      "url": "/.well-known/agent-skills/consume-danny-is/SKILL.md",
      "digest": "sha256:<computed at build from the SKILL.md bytes>"
    }
  ]
}
```

The `digest` is `sha256` over the raw `SKILL.md` bytes, computed in the generating route (e.g. read the file via `?raw` or `fs`, hash with `node:crypto`). `SKILL.md` is markdown with YAML frontmatter (`name: consume-danny-is`, plus `description`). Note the `url` keeps the canonical `/.well-known/...` form (that's the public URL agents fetch; the A0 rewrite resolves it).

_Resolves:_ isitagentready "Agent Skills index". _Content-Type note:_ see B2 (SKILL.md needs `text/markdown`).

### A5. content-start-position audit + fixes

afdocs flags **9 of 50 pages** where content begins past the 50% mark of the HTML→markdown conversion (too much nav/boilerplate before the first real heading/prose). The per-post `.md` endpoints start with `# Title` immediately, so the offenders are almost certainly the **HTML pages without a `.md` variant** (home, `/writing` and `/notes` index pages, styleguide, etc.), where the converter sees nav/chrome first.

**Audit before changing anything** (user request — there may or may not be quick wins):

1. Identify the exact 9 pages (afdocs verbose output / re-run and inspect).
2. For each, determine whether the fix is (a) trimming pre-content boilerplate/nav in the markup, or (b) giving those pages a `.md` variant (which short-circuits conversion and starts at `# Title`).
3. Decide per-page; the styleguide pages are dev-facing and low-stakes, so may not be worth it.

Related lower-priority afdocs items in the same area (styleguide-driven): `section-header-quality`, `tabbed-content-serialization`, `page-size-html`, `markdown-content-parity` — all trace to the styleguide tab components. Evaluate during the audit; likely "won't fix" given the styleguide is internal reference.

_Resolves (partially):_ afdocs `content-start-position` (failure) and possibly several styleguide-related warnings.

---

## Workstream B — Host-config layer (`vercel.output-config.json`)

These need the Build Output API routing layer. They degrade gracefully on a dumb static host (which would just serve HTML and the `.md` files at their own URLs).

### B1. Content negotiation: `Accept: text/markdown` → markdown

The single highest-leverage item: satisfies **both** tools. The `.md` files already exist as static assets in `dist/`. Add routes (before the `filesystem` handler) that rewrite a content URL to its `.md` sibling when the request's `Accept` header contains `text/markdown`:

```jsonc
{
  "src": "^/writing/([^/]+)/?$",
  "has": [{ "type": "header", "key": "accept", "value": ".*text/markdown.*" }],
  "dest": "/writing/$1.md",
},
{
  "src": "^/notes/([^/]+)/?$",
  "has": [{ "type": "header", "key": "accept", "value": ".*text/markdown.*" }],
  "dest": "/notes/$1.md",
}
```

Pair with B2 so the negotiated response carries `Content-Type: text/markdown` (afdocs requires that exact type to pass; the spec asks for nothing else — no `Vary`, no token header).

_Resolves:_ afdocs `content-negotiation` (failure) + isitagentready "Markdown for Agents".

### B2. Correct `Content-Type` headers for new/markdown assets

Add header routes so:

- `^/.*\.md$` → `content-type: text/markdown; charset=utf-8` (needed by B1; also improves direct `.md` access). Use a `"continue": true` header route ordered **before** the A0 `.well-known` catch-all rewrite, so a request for `/.well-known/agent-skills/.../SKILL.md` gets the header set before being rewritten to `/well-known/...`. _Check_ this doesn't clash with how the `.md` files are already served. (This rule also covers the `SKILL.md` from A4; `index.json` gets `application/json` from its extension automatically.)

### B3. `Link` response headers (RFC 8288)

Add `Link` headers (in the catch-all `^/(.*)$` route's `headers`, or a dedicated route) advertising discovery resources, e.g.:

```
Link: </llms.txt>; rel="llms-txt", </sitemap-index.xml>; rel="sitemap"
```

Only reference resources we actually ship. _Resolves:_ isitagentready "Link headers".

### B4. Convert Medium cross-post redirects to real HTTP redirects — _DEFERRED_

> **Deferred (decided).** The build-pipeline change is likely more awkward than it's worth right now. Leave the meta-refresh redirects as-is for this pass; afdocs `redirect-behavior` stays red intentionally. Revisit later if/when we touch the deploy pipeline. Details kept below for when we pick it up.

~34 articles with `platform` + `redirectURL` frontmatter currently redirect via `<meta http-equiv="refresh">` in `src/layouts/Article.astro:64` — these are the JS redirects afdocs flags (`7 detected` in the sample). Convert to real HTTP redirects.

**Constraint:** with a static build and no Astro adapter, Astro's own `redirects` config also emits meta-refresh HTML (no server), so a real `301/302` _must_ come from the Vercel routing layer. Proposed approach that keeps the static build portable:

1. Keep the meta-refresh stub in `dist/` as the portable fallback (non-Vercel hosts still redirect).
2. Add a build step that reads articles with `platform` + `redirectURL` and **merges generated redirect routes into `config.json`** during the "Prepare Vercel output" stage of `deploy.yml`. On Vercel the HTTP redirect intercepts before the stub is ever served.

When picked up, also decide whether these articles should fully `301` to their external canonical (vs. keeping a visitable stub). afdocs only credits `301`/`302` by name.

_Resolves (when done):_ afdocs `redirect-behavior` (failure).

---

## Out of Scope (we accept failing these checks)

When re-running the tools, these will stay red **by design** — that's correct, not a gap:

- **MCP Server Card, WebMCP, `/mcp` endpoint** — there is no MCP server for this site's content, so there is nothing truthful to advertise. WebMCP additionally requires runtime JS on every page, which violates the site's zero-JS-by-default principle.
- **OAuth/OIDC discovery, OAuth Protected Resource Metadata, `auth.md`** — the site has no authenticated APIs. Publishing auth-discovery metadata would actively mislead agents about endpoints that don't exist.
- **DNS-AID records** — DNS-level (SVCB/HTTPS + DNSSEC) agent discovery; very early IETF draft, infrastructure-heavy, no payoff for a personal content site.

- **API catalog (RFC 9727 `/.well-known/api-catalog`)** — _considered and dropped._ Modeling `llms.txt`/RSS as callable "APIs" is a spec stretch with no real-world agent adoption for content sites; `llms.txt` already covers the intent. isitagentready "API Catalog" stays red by choice.
- **Redirect conversion (B4)** — _deferred this pass_ (see B4). afdocs `redirect-behavior` stays red for now.

isitagentready cannot express "intentionally public / not applicable", so it will keep penalising several of the above. That's a limitation of the scanner, not a TODO.

---

## Verification

After implementation, re-run both tools and confirm the in-scope checks flip green and the out-of-scope ones are the _only_ remaining failures:

```bash
bunx afdocs check https://danny.is
```

…and re-scan `https://isitagentready.com/danny.is`. Also run `bun run check:all` after code changes.

---

## Decisions (resolved 2026-06-13)

1. **Content Signals `ai-train` (A1):** stay neutral — omit `ai-train`; ship `search=yes, ai-input=yes`.
2. **Agent Skills (A4):** publish a single "consume danny.is" skill (`consume-danny-is`).
3. **API catalog (A5):** dropped — see Out of Scope.
4. **Redirect conversion (B4):** deferred this pass — see B4 / Out of Scope.

## In-scope summary

After the above, the active work is: **A0 (.well-known plumbing, do first), A1, A2, A3, A4, A5 (content-start audit), B1, B2, B3.**
