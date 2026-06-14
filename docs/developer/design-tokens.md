# Design Token System

CSS custom properties defined in `src/styles/_foundation.css`. Uses OKLCH colours with `light-dark()` for automatic theming, and Utopia-generated fluid scales for spacing and typography.

This doc captures the _why_ and the _when to use_. For exact values, read `_foundation.css` — it's the single source of truth, and these tokens change rarely.

## Naming patterns

| Category | Token pattern | Example |
|----------|--------------|---------|
| Colours (adaptive) | `--color-{name}` | `--color-coral`, `--color-text` |
| Colours (semantic) | `--color-{purpose}` | `--color-accent`, `--color-background` |
| Surfaces | `--color-background-{name}` + `.surface-white` utility | `--color-background-secondary` |
| Spacing | `--space-{size}` | `--space-m`, `--space-l` |
| Font size | `--font-size-{size}` | `--font-size-base`, `--font-size-lg` |
| Line height | `--leading-{name}` | `--leading-normal`, `--leading-tight` |
| Letter spacing | `--tracking-{name}` | `--tracking-wide`, `--tracking-tight` |
| Font weight | `--font-weight-{name}` | `--font-weight-bold`, `--font-weight-normal` |
| Border width | `--border-width-{size}` | `--border-width-hairline`, `--border-width-thick` |
| Border radius | `--radius-{size}` | `--radius-sm`, `--radius-md` |
| Duration | `--duration-{speed}` | `--duration-fast`, `--duration-normal` |
| Shadow | `--shadow-{size}` | `--shadow-small`, `--shadow-medium` |

---

## Colour system

### OKLCH

All colours use OKLCH for perceptual uniformity and wide-gamut support. Syntax is `oklch(lightness chroma hue)` — lightness `0–100%`, chroma `0–0.4` (0 = grey), hue `0–360`.

### Hue variables

Base hues (`--hue-coral`, `--hue-pink`, …) are shared across light and dark modes and used to derive the adaptive palette. This is why a single hue stays recognisable in both themes — only lightness/chroma shift.

### Adaptive palette

Colours that auto-switch for light/dark via `light-dark()`. Prefer the semantic alias (below) where one exists.

| Token | Usage |
|-------|-------|
| `--color-coral` | Primary accent |
| `--color-pink` | Alternate accent |
| `--color-orange` | Warning states |
| `--color-purple` | Visited links |
| `--color-yellow` | Highlights |
| `--color-green` | Success states |
| `--color-blue` | Info states |

Non-adaptive absolutes also exist: `--color-white`, `--color-black`, `--color-ink` (dark text), `--color-charcoal` (dark background), `--color-beige` (light background).

### Semantic colours

Role-based tokens — **use these in components**, not the raw palette:

| Token | Purpose |
|-------|---------|
| `--color-accent` | Primary brand colour (coral) |
| `--color-visited` | Visited link colour (purple) |
| `--color-highlight` | Text highlight/mark (yellow) |
| `--color-background` | Page background |
| `--color-background-secondary` | Subtle background variation |
| `--color-text` | Primary text colour |
| `--color-text-secondary` | Muted/secondary text |
| `--color-border` | Default border colour (10% opacity) |
| `--color-background-code` | Background for inline code / code blocks |
| `--color-focus-ring` | Focus outline colour (blue); applied globally by the reset layer |

There is no `--surface-raised` token. For raised cards/panels, use the `.surface-white` utility (`_utilities.css`), which sets a white-in-light / dark-grey-in-dark background and re-points `--color-background-secondary` for descendants.

### Deriving variants

Derive hover states and variants from existing tokens with relative colour syntax rather than creating new tokens. See [design.md § Deriving Variants](./design.md#deriving-variants) for the patterns (`oklch(from …)`, `color-mix()`, `light-dark()`).

---

## Spacing

Utopia-generated fluid spacing (`--space-3xs` … `--space-3xl`) that scales smoothly between 375px and 1280px viewports, plus one-up pairs (`--space-s-m`, `--space-l-xl`, …) for gaps that jump a size as the viewport grows. Exact clamps live in `_foundation.css`; tune via the Utopia space calculator.

### When to use which

| Context | Recommended token |
|---------|------------------|
| Micro adjustments (icon gaps) | `--space-3xs`, `--space-2xs` |
| Component padding | `--space-s`, `--space-m` |
| Component gaps | `--space-xs`, `--space-s` |
| Section spacing | `--space-l`, `--space-xl` |
| Page margins | `--space-m-l`, `--space-l-xl` |

---

## Typography

### Font families

| Variable | Purpose |
|----------|---------|
| `--font-display` | Large display typography: page titles, hero text, brand marks (Geist) |
| `--font-ui` | Interface elements **and** short-form prose — the document body default (Figtree) |
| `--font-prose` | Long-form reading: articles, anywhere `.longform-prose` applies (Literata) |
| `--font-code` | Code blocks, inline code (Fira Code) |

The body defaults to `--font-ui`, so UI and short-form prose share a typeface; long-form articles opt into `--font-prose` via `.longform-prose`. See `fonts.md` for the full font reference.

### Type scale

Utopia-generated, scaling 375px (1.2 ratio) → 1280px (1.333 ratio). **Use the semantic aliases, not the underlying `--step-N` tokens.**

| Alias | Step | Usage |
|-------|------|-------|
| `--font-size-xs` | `--step--2` | Captions, labels |
| `--font-size-sm` | `--step--1` | Metadata, small text |
| `--font-size-base` | `--step-0` | Body text |
| `--font-size-md` | `--step-1` | Large body, small headings |
| `--font-size-lg` | `--step-2` | H3, card titles |
| `--font-size-xl` | `--step-3` | H2, section titles |
| `--font-size-2xl` | `--step-4` | H1, page titles |
| `--font-size-3xl` | `--step-5` | Hero masthead |

### Line height, letter spacing, weight

- **Line height:** `--leading-none` (0.9, display) → `--leading-loose` (1.7, long-form prose); body defaults to `--leading-normal` (1.55).
- **Letter spacing:** `--tracking-tight` (display) → `--tracking-wider` (small all-caps); body is `--tracking-normal`.
- **Weight:** `--font-weight-light` (300) through `--font-weight-heavy` (900). Note `--font-weight-normal` is **350**, not 400.

### Measure

`--measure-standard` (70ch) caps line length for readability.

---

## Borders & radius

Widths run from `--border-width-hairline` (`max(0.0625rem, 1px)` — never subpixel, but scales with rem on high-DPI) up to `--border-width-accent` (1rem, decorative bars). Radii run `--radius-xs` … `--radius-lg`, plus `--radius-full` (`calc(infinity * 1px)`) for pills.

---

## Motion

`--duration-fast` / `--duration-normal` / `--duration-slow` (150 / 200 / 300ms) paired with `--ease-in-out`:

```css
.element {
  transition: color var(--duration-fast) var(--ease-in-out);
}
```

---

## Shadows

Use the `drop-shadow` filter (not `box-shadow`) so shadows follow rounded corners: `--shadow-small` (cards at rest) / `--shadow-medium` (cards on hover).

```css
.card {
  filter: var(--shadow-small);
}
.card:hover {
  filter: var(--shadow-medium);
}
```

---

## @property declarations

Typed custom properties enable two things untyped variables can't: smooth animation (CSS can only interpolate typed values) and type checking. Globals live in `global.css`; hue properties are `<number>` for smooth interpolation.

Components can also declare their own scoped typed properties for transitions on internal state:

```css
/* ContentCard.astro - smooth colour transition on hover */
@property --_border-color {
  syntax: '<color>';
  inherits: false; /* scoped to this component, won't leak to children */
  initial-value: oklch(70% 0.18 25);
}

.content-card {
  --_border-color: var(--color-accent);
  &::before {
    background: var(--_border-color);
    transition: background var(--duration-fast) var(--ease-in-out);
  }
}
```

Reach for component-scoped `@property` when animating between colours, or to type-check a component-internal value. Use `inherits: false` to keep it local.

---

## Browser support

All features used are Baseline (widely available): OKLCH, `light-dark()`, relative colours, `@property`, and container queries.

---

## When to create new tokens

**Don't** create a token for one-off values, derived values (use relative colour syntax or `calc()`), theme variants (use `light-dark()` inline), or slight variations of an existing token.

**Do** create one when a value is used identically in 3+ unrelated places, a semantic role has no existing token, or the value is foundational and likely to change site-wide.

```css
/* ❌ Don't create --color-accent-hover */
--color-accent-hover: oklch(60% 0.18 25);

/* ✅ Derive it inline */
.button:hover {
  background: oklch(from var(--color-accent) calc(l - 0.1) c h);
}

/* ❌ Don't create --space-card-padding; ✅ use the existing token */
.card {
  padding: var(--space-m);
}
```

---

## Utopia resources

- **Type calculator:** https://utopia.fyi/type/calculator
- **Space calculator:** https://utopia.fyi/space/calculator
- **Configuration used:** 375px min → 1280px max, 16px → 20px base, 1.2 → 1.333 ratio
