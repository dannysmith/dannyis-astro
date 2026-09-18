# Task X: Verify OG images after the satori 0.33 upgrade

## Overview

[PR #160](https://github.com/dannysmith/dannyis-astro/pull/160) bumped `satori` from `^0.29.0` to `^0.33.4` as part of the Astro 7.3.3 dependency refresh. Satori 0.33.0 **integrated HarfBuzz text shaping**, which changes glyph positioning and line-breaking.

No API changed and the build passes. Two OG images were spot-checked visually during that PR and both looked correct:

- a long article title wrapping across four lines, with smart apostrophes (`IT'S`, `YOU'RE`) rendering properly
- a short note title on one line, with the `NOTE` badge

That is only two images out of ~240, and neither exercised the cases most likely to shift under new text shaping. This task is the wider sweep.

**This is a verification task, not a known bug.** If everything looks right, close it without a code change.

## Starting state

- `satori@0.33.4`, `@resvg/resvg-js@2.6.2`
- OG images are generated **at build time as routes**, not committed:
  - `src/pages/writing/[...slug]/og-image.png.ts`
  - `src/pages/notes/[...slug]/og-image.png.ts`
  - `src/pages/[...page]/og-image.png.ts`
- Templates live in `src/utils/og-templates.ts`; the satori/resvg call is in `src/utils/og-image-generator.ts`
- `bun run generate-og-image` (`scripts/generate-og-image.ts`) renders a single image directly — much faster than a full build

## What to check

Generate a spread of OG images and read the PNGs back to look at them. Prioritise cases that stress text shaping:

- titles with **non-ASCII characters** — accents, em-dashes, curly quotes
- a **very long unbreakable token** (a URL-like string or long compound word)
- a title landing **right on a wrap boundary**, where a small metric change flips the line count
- **note vs article** variants (different template, `NOTE` badge)
- the **monospace URL line** at the bottom, which uses a different font to the title

Look for:

- text overflowing its box or clipping at the edges
- clipped descenders (g, y, p, q) from changed line-height handling
- line-wrapping that differs from before
- altered letter-spacing or word-spacing, especially in the uppercase title
- vertical centring drifting off

## If something shifted

Adjust the templates in `src/utils/og-templates.ts` to suit the new shaping. **Don't pin satori back** — the rest of the dependency tree is on 0.33.4 and the shaping change is the intended direction of travel.

## Done when

OG images render correctly across the cases above and `bun run check:all` passes.

## Notes

A full `bun run build` takes roughly 15–20 minutes, because it also optimises ~2200 images. That's expected, not a hang. Use `bun run generate-og-image` for iteration.
