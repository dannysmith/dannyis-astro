# Working in `src/utils`

## OG images are cached across builds — bump `CACHE_VERSION` when you change how they look

OG images are generated at build time in `og-image-generator.ts` and cached (content-addressed) across CI builds. The cache key includes each image's data (title, description, URL, type) but **not** the template markup, branding, or fonts.

So if you change `og-templates.ts`, `og-branding.ts`, or the fonts the OG generator loads, bump `CACHE_VERSION` in `og-image-generator.ts`. Otherwise existing posts keep serving their old cached OG images and won't pick up your change.

See `docs/developer/deployment.md` for how the build cache fits into the wider pipeline.
