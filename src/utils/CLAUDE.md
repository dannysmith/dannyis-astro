# Working in `src/utils`

## OG images are cached across builds — bump `CACHE_VERSION` when you change how they look

OG images are generated at build time in `og-image-generator.ts` and cached (content-addressed) across CI builds. The cache key includes each image's data (title, description, URL, type) but **not** the template markup, branding, fonts, or the baked background.

So if you change `og-templates.ts`, `og-branding.ts`, the baked background (`src/assets/og/background.svg`), the avatar (`public/avatar-circle.png`), the fonts the OG generator loads, or the renderer itself (upgrading `satori` or `@resvg/resvg-js`), bump `CACHE_VERSION` in `og-image-generator.ts`. Otherwise existing posts keep serving their old cached OG images and won't pick up your change.

See `docs/developer/deployment.md` for how the build cache fits into the wider pipeline.

## Link previews are cached too — but changing the parser needs no bump

The rule here is the opposite of the OG one. `linkPreview/` caches the raw `<head>` it captured, not the fields parsed out of it, so editing `parse.ts` — new field, better heuristic, bug fix — needs **no** bump: extraction re-runs every build against whatever is stored.

Bump only when what's *stored* changes:

- **`CACHE_VERSION` in `linkPreview/fetch.ts`** — the shape of a stored capture. It's part of the filename, so bumping orphans old entries rather than reading them.
- **`IMAGE_VERSION` in `linkPreview/image.ts`** — the encoding of a downloaded image: format, quality, or target size.

Worth knowing while working on the parser: the cache is a corpus of real captured heads, so running the old and new `readMetadata` over all of them and diffing every field is a regression test that touches no network.

See `docs/developer/link-metadata.md`.
