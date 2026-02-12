# Font Reference

Detailed reference for the custom fonts used on this site, including variable font axes, OpenType features, and CSS usage patterns.

## Overview

| Font | Role | Type | Source |
|------|------|------|--------|
| [Literata](#literata) | Prose / body text | Variable (weight + optical size) | Self-built from source |
| [League Spartan](#league-spartan) | UI / headings | Variable (weight) | Self-hosted from release |
| [Fira Code](#fira-code) | Code / monospace | Variable (weight) | Fontsource (temporary) |

CSS custom properties for font stacks are defined in `src/styles/_foundation.css`:

```css
--font-ui: 'League Spartan', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-display: 'League Spartan', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-prose: 'Literata', Georgia, 'Times New Roman', serif;
--font-code: 'Fira Code Variable', 'Fira Code', 'Inconsolata', monospace;
```

| Variable | Purpose |
|----------|---------|
| `--font-ui` | Interface elements: navigation, buttons, labels, form controls |
| `--font-display` | Large display typography: page titles, hero text, brand marks |
| `--font-prose` | Long-form reading: articles, body text |
| `--font-code` | Code blocks, inline code |

**Note:** `--font-ui` and `--font-display` currently share the same font stack. They are separated to allow independent experimentation with display typefaces.

---

## Literata

A contemporary serif designed for long-form reading, with excellent screen rendering.

### Source Information

| Property | Value |
|----------|-------|
| Version | 3.103 |
| Repository | [googlefonts/literata](https://github.com/googlefonts/literata) |
| Build date | January 2026 |
| Files | `Literata-v3.103-2026-01-19.woff2`, `Literata-Italic-v3.103-2026-01-19.woff2` |

Built locally using `gftools builder` from the source `.glyphs` files.

### Variable Axes

#### Weight (`wght`)

Controls the thickness of strokes.

| Value | Name |
|-------|------|
| 200 | ExtraLight |
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |
| 800 | ExtraBold |
| 900 | Black |

```css
/* Named weights */
font-weight: 400;
font-weight: bold; /* 700 */

/* Any value in range */
font-weight: 450;

/* Using CSS custom property */
font-weight: var(--font-weight-semibold);
```

#### Optical Size (`opsz`)

Adjusts letterforms for different sizes. Smaller values have more open counters, larger x-height, and heavier strokes for legibility at small sizes. Larger values are more refined for display use.

| Value | Intended Use |
|-------|--------------|
| 7 | Captions, footnotes (~7pt) |
| 12 | Body text (~12pt) |
| 36 | Subheadings (~36pt) |
| 72 | Display / headlines (~72pt) |

```css
/* Automatic (browser adjusts based on font-size) */
font-optical-sizing: auto;

/* Manual control */
font-optical-sizing: none;
font-variation-settings: 'opsz' 72;

/* Combine with weight */
font-variation-settings: 'opsz' 7, 'wght' 500;
```

**Note:** Modern browsers automatically adjust optical size based on `font-size` when `font-optical-sizing: auto` (the default). Manual control is rarely needed.

### OpenType Features

Literata includes a rich set of OpenType features. Enable them using `font-feature-settings` or the more semantic `font-variant-*` properties.

#### Small Caps

Convert lowercase letters to small capital forms.

```css
/* Preferred method */
font-variant-caps: small-caps;

/* Alternative */
font-feature-settings: 'smcp' on;
```

#### Caps to Small Caps (`c2sc`)

Convert uppercase letters to small caps (use with `smcp` for all-small-caps text).

```css
/* All small caps */
font-variant-caps: all-small-caps;

/* Alternative */
font-feature-settings: 'smcp' on, 'c2sc' on;
```

#### Ligatures

| Feature | Property | Description |
|---------|----------|-------------|
| `liga` | Standard ligatures | Common ligatures like fi, fl (on by default) |
| `dlig` | Discretionary ligatures | Additional stylistic ligatures |

```css
/* Standard ligatures (usually on by default) */
font-variant-ligatures: common-ligatures;

/* Enable discretionary ligatures */
font-variant-ligatures: discretionary-ligatures;

/* Disable all ligatures */
font-variant-ligatures: none;

/* Using font-feature-settings */
font-feature-settings: 'liga' on, 'dlig' on;
```

#### Numerals

| Feature | Description |
|---------|-------------|
| `onum` | Oldstyle numerals (varying heights, some descend below baseline) |
| `lnum` | Lining numerals (uniform height, align with capitals) |
| `pnum` | Proportional numerals (varying widths) |
| `tnum` | Tabular numerals (fixed width, for aligning columns) |

```css
/* Oldstyle proportional (nice for prose) */
font-variant-numeric: oldstyle-nums proportional-nums;

/* Lining tabular (for tables/data) */
font-variant-numeric: lining-nums tabular-nums;

/* Using font-feature-settings */
font-feature-settings: 'onum' on, 'pnum' on;
```

#### Fractions

Converts sequences like `1/2` into proper fraction glyphs.

```css
font-variant-numeric: diagonal-fractions;

/* Alternative */
font-feature-settings: 'frac' on;
```

#### Super/Subscript

Proper typographic super/subscript characters (better than `vertical-align` hacks).

```css
/* Superscript */
font-variant-position: super;
font-feature-settings: 'sups' on;

/* Subscript */
font-variant-position: sub;
font-feature-settings: 'subs' on;
```

#### Case-Sensitive Forms (`case`)

Adjusts punctuation and symbols to better align with capital letters.

```css
font-feature-settings: 'case' on;
```

#### Slashed Zero (`zero`)

Distinguishes zero from the letter O.

```css
font-variant-numeric: slashed-zero;

/* Or */
font-feature-settings: 'zero' on;
```

#### Ordinals (`ordn`)

Superscript letters for ordinals (1st, 2nd, 3rd).

```css
font-variant-numeric: ordinal;

/* Or */
font-feature-settings: 'ordn' on;
```

#### Stylistic Sets

Literata includes stylistic sets primarily for Greek polytonic typography:

| Set | Description |
|-----|-------------|
| `ss01` | **Greek prosgegrammeni (adscript iota)** — Displays the mute iota beside uppercase Greek vowels (Α, Η, Ω) rather than below them. Used in some scholarly publishing traditions outside Greece. |
| `ss02` | **Alternate arrows and geometric shapes** — Provides alternate forms for certain symbols. |

```css
/* Enable Greek adscript iota for scholarly text */
.greek-scholarly {
  font-feature-settings: 'ss01' on;
}
```

These stylistic sets are specialised for Greek typography and unlikely to be needed for English text.

### Complete Feature List

All OpenType features available in Literata:

| Tag | Name | Default | When to use |
|-----|------|---------|-------------|
| `aalt` | Access All Alternates | - | Font inspection tools; not for CSS |
| `c2sc` | Caps to Small Caps | off | Combined with `smcp` for all-small-caps text (acronyms, emphasis) |
| `case` | Case-Sensitive Forms | off | ALL CAPS text — adjusts punctuation to align with capitals |
| `ccmp` | Glyph Composition/Decomposition | on | Leave on; handles character composition |
| `dlig` | Discretionary Ligatures | off | Decorative text; may reduce readability in body copy |
| `dnom` | Denominators | off | Building custom fractions manually |
| `frac` | Fractions | off | Display proper fractions (½ instead of 1/2) in recipes, measurements |
| `liga` | Standard Ligatures | on | Leave on; improves fi, fl combinations |
| `lnum` | Lining Figures | off | Numbers in tables, UI, or mixed with capitals |
| `locl` | Localized Forms | on | Leave on; provides correct forms for different languages |
| `numr` | Numerators | off | Building custom fractions manually |
| `onum` | Oldstyle Figures | off | Body text — numbers blend with lowercase (3 and 4 descend) |
| `ordn` | Ordinals | off | Automatic superscript for 1st, 2nd, 3rd |
| `pnum` | Proportional Figures | off | Body text — numbers have varying widths |
| `sinf` | Scientific Inferiors | off | Chemical formulas (H₂O) |
| `smcp` | Small Caps | off | Acronyms (NASA), emphasis, legal text |
| `ss01` | Greek Prosgegrammeni | off | Scholarly Greek text with adscript iota |
| `ss02` | Alternate Symbols | off | Alternate arrows/geometric shapes |
| `subs` | Subscript | off | Chemical formulas, footnote markers |
| `sups` | Superscript | off | Footnotes, mathematical notation, trademark symbols |
| `tnum` | Tabular Figures | off | Tables, columns of numbers that need to align vertically |
| `zero` | Slashed Zero | off | Code, technical contexts — distinguishes 0 from O |

---

## League Spartan

A bold, geometric sans-serif inspired by American sign painting.

### Source Information

| Property | Value |
|----------|-------|
| Version | 2.220 |
| Repository | [theleagueof/league-spartan](https://github.com/theleagueof/league-spartan) |
| Download date | January 2026 |
| Files | `LeagueSpartan-v2.220-2026-01-19.woff2` (web), `LeagueSpartan-Regular.ttf`, `LeagueSpartan-Bold.ttf` (OG images) |

Downloaded from the [GitHub releases](https://github.com/theleagueof/league-spartan/releases/tag/2.220).

### Static TTF Files for OG Image Generation

The static TTF files (`LeagueSpartan-Regular.ttf` and `LeagueSpartan-Bold.ttf`) are required for build-time OG image generation. [Satori](https://github.com/vercel/satori), the library that renders JSX to images, does not support woff2 fonts—it requires TTF format. These files are loaded by `src/utils/og-image-generator.ts` and should not be removed.

### Variable Axes

#### Weight (`wght`)

Range: 200–900

| Value | Name |
|-------|------|
| 200 | ExtraLight |
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |
| 800 | ExtraBold |
| 900 | Black |

```css
font-weight: 600;
font-weight: var(--font-weight-semibold);
```

### OpenType Features

League Spartan includes the following OpenType features:

| Tag | Name | Description |
|-----|------|-------------|
| `aalt` | Access All Alternates | Access to all alternate glyphs |
| `calt` | Contextual Alternates | Context-aware glyph substitution |
| `case` | Case-Sensitive Forms | Adjusts punctuation for all-caps text |
| `ccmp` | Glyph Composition | Handles character composition |
| `frac` | Fractions | Proper fraction forms (½) |
| `liga` | Standard Ligatures | Common ligature combinations |
| `locl` | Localized Forms | Language-specific glyph forms |
| `ordn` | Ordinals | Superscript for 1st, 2nd, 3rd |
| `sups` | Superscript | Superior/superscript figures |
| `ss01` | Stylistic Set 1 | **Alternate C and a** — provides alternate forms for C (and variants) and lowercase 'a' |
| `ss02` | Stylistic Set 2 | **Alternate Q** — provides an alternate Q design |

```css
/* Enable alternate letterforms */
.alt-style {
  font-feature-settings: 'ss01' on; /* Alternate C and a */
}

/* Case-sensitive punctuation for headings */
h1 {
  text-transform: uppercase;
  font-feature-settings: 'case' on;
}
```

---

## Fira Code

A monospace font with programming ligatures, designed for code readability.

### Source Information

| Property | Value |
|----------|-------|
| Repository | [tonsky/FiraCode](https://github.com/tonsky/FiraCode) |
| Current source | [Fontsource](https://fontsource.org/fonts/fira-code) (`@fontsource-variable/fira-code`) |
| Status | **Temporary** — may be replaced or self-hosted in future |

Loaded via Fontsource in `src/components/layout/BaseHead.astro`:

```typescript
import '@fontsource-variable/fira-code';
```

### Variable Axes

#### Weight (`wght`)

| Value | Name |
|-------|------|
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |

### OpenType Features

Fira Code includes programming ligatures and stylistic sets. Key features:

| Feature | Description |
|---------|-------------|
| `liga` | Programming ligatures (`=>`, `->`, `!=`, `===`, etc.) |
| `calt` | Contextual alternates |
| `ss01` | Alternate `r` (sans-serif style) |
| `ss02` | Alternate `<=`, `>=` (less than/greater than with horizontal bar) |
| `ss03` | Alternate `&` |
| `ss04` | Alternate `$` |
| `ss05` | Alternate `@` |
| `ss06` | Alternate `\\` (thin backslash) |
| `ss07` | Alternate `=~`, `!~` (regexp operators) |
| `ss08` | Alternate `==`, `===`, `!=`, `!==` (gaps in equals signs) |
| `zero` | Slashed/dotted zero |
| `onum` | Oldstyle numerals |

```css
/* Enable stylistic sets for code readability */
code {
  font-feature-settings: 'ss01' on, 'ss08' on;
}

/* Disable ligatures if preferred */
code {
  font-variant-ligatures: none;
}
```

See the [Fira Code wiki](https://github.com/tonsky/FiraCode/wiki/How-to-enable-stylistic-sets) for visual examples of each stylistic set.

---

## CSS Best Practices

### Prefer `font-variant-*` over `font-feature-settings`

The `font-variant-*` properties are more readable and don't override each other:

```css
/* Good - properties are independent */
.element {
  font-variant-caps: small-caps;
  font-variant-numeric: oldstyle-nums;
}

/* Problematic - second declaration overrides first */
.element {
  font-feature-settings: 'smcp' on;
  font-feature-settings: 'onum' on; /* This removes smcp! */
}

/* If you must use font-feature-settings, combine them */
.element {
  font-feature-settings: 'smcp' on, 'onum' on;
}
```
### Variable Font Performance

Variable fonts load a single file for all weights/styles, but consider:

- **Subsetting**: Remove unused glyphs/features for smaller files
- **`font-display: swap`**: Show fallback text immediately while font loads
- **Preload critical fonts**: `<link rel="preload" href="/fonts/..." as="font" crossorigin>`

### Feature Detection

Check for variable font support if providing fallbacks:

```css
@supports (font-variation-settings: normal) {
  body {
    font-family: 'Literata', serif;
  }
}
```

---

## Adding New Fonts

When adding a new font to this project:

1. Add font files to `public/fonts/`, as woff2 variable fonts if available.
2. Define `@font-face` rules in `src/styles/global.css`
3. Add a CSS custom property for the font stack
4. Document in this file following the pattern above:
   - Source information (version, repository, build date)
   - Variable axes with values and CSS examples
   - OpenType features with CSS examples
