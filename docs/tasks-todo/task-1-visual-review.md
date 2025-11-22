# Canonical Visual Component Inventory

This catalogue consolidates everything that surfaced in `analysis/design-system-analysis.md`, `analysis/component-library-analysis.md`, `analysis/design-review.md`, `analysis/footer-and-components.md`, and the screenshot manifest. It treats every visual object as a discrete component so future work can trace code back to an explicit artifact.

## 1. Brand & Hero Elements

- **Hero Masthead** — Oversized, ultra-bold uppercase sans serif spelling “DANNY SMITH”. Lives on the home page and scales down across tablet/phone. Defines the poster-like identity and sets the alignment baseline for the link list below.
- **Section Title Blocks** — Giant uppercase headings such as “WRITING”, “NOTES”, “NOW”. Use the same weight as the hero, act as the top anchor for each template, and occasionally include coral underlines.
- **Page Intro / Article Hero** — Combination of eyebrow label, main title, subtitle, and metadata (dates, reading time). Appears in article and note templates and introduces share/copy actions further down.
- **Styleguide Headings** — Distinct typographic pairings (uppercase sans for section names, serif italics for explanatory text) that document the design language on the `/styleguide` pages.

## 2. Navigation & Wayfinding Components

- **Primary Link List (Home Navigation Stack)** — Vertical list of uppercase labels with coral underlines spanning the text width. Includes internal sections, external platforms, and protocol-style links; spacing and underline thickness vary between breakpoints.
- **Secondary Label Treatments** — Smaller uppercase descriptors that sit beside or below the primary label (e.g., “REMOTE WORKING TOOLBOX”). They mix weights today but behave like a component.
- **Inline Link Chips** — Textual CTAs such as “share / copy / view”, often rendered as coral inline links with equal spacing.
- **Pagination Dots** — Small circular indicators sitting under the footer on some templates. Intended to show section counts but currently unlabeled.
- **Footer System** — Dark-mode inverse block with coral top rule, multi-column navigation, RSS links, social icons, and copyright. Exists in full-width and condensed versions depending on the page.
- **Theme Toggle Cluster** — Auto/Light/Dark segmented control shown in the styleguide/sidebar screenshots. Rounded pills with contrasting fills that allow manual color-scheme selection.

## 3. Content Listing Modules

- **Writing Index Row** — Date (gray), title (bold), optional badge, followed by a coral divider. Used on `/writing` and variant listing views.
- **Notes Overview Row** — Similar structure but often includes dotted baselines, more metadata, or an excerpt, giving a looser reading to match note tone.
- **Note Card / “Paper” Stack** — Elevated card with off-white background, dotted top/bottom borders, metadata, title, checklists, and CTA links. Exists in light and dark modes with subtle drop shadows.
- **Bookmark / Link Card** — Stylized external link preview featuring thumbnail, title/description, favicon or host, and optional action icon.
- **Now Page Items** — Timeline-like entries (status, what’s next, music) using the same typography/h-rule language as notes but tailored to the `now` content model.
- **Sidebar Stack (from screenshots)** — Vertical cluster containing theme toggle, contact links, and mini-callouts; acts as a navigation/utility component even though it only appears in reference imagery.

## 4. Article & Note Body Components

- **Body Copy Paragraphs** — Serif paragraphs with generous leading and balanced measure (~70 characters). Form the base component for all long-form content.
- **Section Subheads** — Mix of serif italics and uppercase sans depending on template. Include optional coral labels or underlines to differentiate article vs. note sections.
- **Metadata Bars** — Inline list of publishing info (date, time to read, categories) separated by coral dots or dividers.
- **Share Module / Post Footer** — Cluster of “share / copy / view as markdown” actions plus recommended next reads. Layout differs between article and note styleguides but functions as a reusable block.
- **Tag/Breadcrumb Stack at Article End** — Sequence of badges or inline links that help navigate to adjacent pieces.

## 5. Communication & Status Components

- **Callouts / Alerts** — Five documented variants: pale blue info, amber warning, mint success, pink error, and dark “code-style” callout. Each is a colored surface with optional coral heading and body text.
- **Badges & Tags** — Small uppercase pills in coral, teal, mint, cyan, and gray. Used for categories (“WRITING”), freshness (“NEW”), or platform labels (“GITHUB”).
- **Blockquotes** — Left-aligned quote blocks with coral borders or blue backgrounds plus attribution text.
- **Pull Quotes** — Oversized typographic call-outs surrounded by coral rules, often centered.
- **Dividers / Horizontal Rules** — Coral lines ranging from 2–6 px in thickness that separate navigation items, list rows, and sections.
- **Checklists / Task Lists** — Inline lists with checkboxes indicating completion state inside notes styleguide content.
- **Statistic / Highlight Blocks** — Structured metrics (numbers with labels) that appear in styleguide screenshots for note content.
- **Accordions** — Expandable sections with header row, chevron or plus/minus icon, coral underline, and collapsible body copy.
- **Toggles & Segmented Controls** — Auto/Light/Dark switch and similar pill-based toggles seen on styleguide pages.

## 6. Actions & Interactive Controls

- **Primary Button** — Coral fill, white text, rounded rectangle with ~40–48 px height. All-caps label.
- **Secondary / Ghost Buttons** — Implicitly referenced but not well-documented; likely outlined or text-only variants for lower-emphasis actions.
- **Icon Buttons** — Share/copy glyph buttons referenced in analyses even if not visible in screenshots; necessary for future parity.
- **Form Inputs** — Text fields, textareas, selects, and toggles shown in the styleguide. Feature 1 px borders, coral focus states, and stacked labels.
- **Checkboxes & Radios** — Present inside task lists and form examples; mix of native and custom styling.
- **Pagination / Next-Previous Links** — Inline textual nav at the close of articles/notes plus implied previous/next CTAs that pair with share modules.

## 7. Media & Data Display

- **Inline Code** — Monospaced text with subtle background highlight, used within paragraphs.
- **Code Blocks** — Dark charcoal panels with syntax highlighting, optional headings, and large padding.
- **Image Treatments** — Full-width single images, 2-column grids, 3-column grids, masonry-like galleries, and captioned images with consistent spacing.
- **Video Embeds** — 16:9 containers with thumbnail overlay and play button, inheriting rounded corners.
- **Audio Player Placeholder** — Mentioned as a gap; included to track the need for a consistent audio component if/when it ships.
- **Social Embeds** — Twitter/X cards, Instagram posts, and other external media frames with avatars, metadata, and action bars.
- **Link Preview / Bookmark Cards** — Generic open-graph cards with thumbnail, title, description, and URL string.
- **Tables** — Basic tables with bold headers, coral horizontal rules, and spacious padding.
- **Lists** — Ordered, unordered, definition, and inline checklists with coral bullets or numerals.

## 8. Layout, System & Utility Components

- **Containers** — Narrow reading column (~720–780 px), wide showcase container (~1200 px), and full-bleed hero container.
- **Spacing Utilities** — Implicit 8 px-based scale referenced throughout analyses; currently applied ad-hoc but treated here as a foundational component.
- **Elevation Tokens** — Surface levels for cards vs. backgrounds; especially relevant to note cards and link previews.
- **Animation & Transition Tokens** — Hover fades, accordion expansions, theme-toggling behaviors, and other motion cues noted even though not fully specified.
- **Accessibility Utilities** — Focus rings, skip links, and screen-reader-only text styles that need formal definitions to keep the system coherent.

This list should serve as the canonical reference: every redesign or refactor task can now point back to these named components before any new work begins.

# High-Impact Visual Recommendations

These recommendations aggregate the most valuable actions across `analysis/design-system-analysis.md`, `analysis/design-review.md`, `analysis/component-library-analysis.md`, and `analysis/footer-and-components.md`. They filter out low-value polish so the next design/engineering pass can focus on moves that materially increase beauty and consistency.

## 1. Foundational System Work

- **Ship a documented token set (color, typography, spacing, elevation, breakpoints).** All analyses noted that the current system is implicit. Capturing semantic tokens (e.g., `color-text-secondary`, `space-6`, `font-size-xl`) unlocks every other recommendation and prevents further drift.
- **Clamp the responsive type scale.** The hero masthead currently overwhelms laptop and ultrawide layouts. Define a modular scale (e.g., clamp for H0/H1) so headings stay dramatic without dominating the viewport or wrapping awkwardly.
- **Normalize accent usage and divider weights.** Coral underlines are the site’s strongest motif, yet stroke thickness varies wildly. Define `divider-thin`, `divider-default`, and `divider-bold` tokens and map every rule/underline to one of them.
- **Reinforce surface elevation especially in dark mode.** Notes cards and styleguide components flatten out against charcoal backgrounds. Establish `surface-0/1/2` colors plus shadow tokens so paper layers stay legible in both themes.

## 2. Component & Pattern Fixes Worth Pursuing

- **Define a proper button hierarchy.** Only one coral button exists. Introduce secondary (outline) and tertiary (text) tiers, along with icon/button combinations, hover/focus/disabled states, and size scale so CTAs don’t blur together.
- **Standardize badges/tags with defined meaning.** Current color usage is decorative. Assign semantics (e.g., coral = “new/featured”, teal = “platform”, mint = “status”) and document when a tag appears on lists, article headers, or cards.
- **Create a resilient card/elevation shell for link previews and embeds.** External embeds, bookmark cards, and image grids all improvise their borders and spacing. A single “card” primitive—with slots for media, content, metadata, and actions—will remove guesswork and fix dark-mode contrast at the same time.
- **Document image and caption treatments.** Full-width images, 2/3-column grids, and galleries each need explicit aspect rules, gap tokens, caption sizes, and responsive stacking behavior.
- **Enhance code blocks and inline code.** Dark mode blocks look great but lack copy buttons, language labels, and consistent inline styling. Adding those features improves readability on documentation-style posts.
- **Finish the accordion, toggle, and share modules.** Accordions currently mix iconography styles, theme toggles lack consistent radii, and share/copy/view text has no hover or icon affordances. Spec’ing these micro-components prevents future one-off fixes.
- **Treat forms and validation states as first-class citizens.** Inputs, textareas, selects, and checkboxes appear in styleguides but without states. Define label positioning, helper text, focus/error styles, and responsive widths so future forms slot into the system.
- **Re-spec the footer.** Consolidate to a sensible, normalize typographybreakpoint, and ensure the coral rule + utility icons scale gracefully.

## 3. Layout & Consistency Improvements

- **Adopt an 8 px-based spacing scale and audit every section.** Map existing gaps (e.g., hero → nav, list row → divider, footer padding) to `space-1`…`space-10` tokens to eliminate ad-hoc margins.
- **Clarify navigation label formatting.** Choose a canonical syntax (e.g., `PLATFORM/IDENTIFIER`) for the home link list and document exceptions so special entries like `AT://DANNY.IS` feel intentional rather than inconsistent.
- **Balance the hero + content hierarchy.** Apply a viewport-based clamp to the hero masthead and align the first nav item directly beneath it at all breakpoints, preventing the “adrift” feeling called out in the design review.
- **Improve layout resilience on small screens.** Specify stacking behavior for footer columns, card grids, and inline metadata to avoid cramped typography on phone captures.
- **Replace unlabeled pagination dots with textual wayfinding.** Dots currently communicate nothing. Convert them to explicit “Section” links, a sitemap row, or remove them entirely in favor of clearer navigation.

Addressing this short list delivers the highest leverage blend of beauty and consistency upgrades, creating the structured foundation needed for any deeper refactor.

# Reusable Visual Systems & Coherent Patterns

This document reframes the component inventory through a designer’s lens, highlighting the reusable styles and patterns already present in the danny.is screenshots. It synthesizes observations from the analyses in `analysis/design-system-analysis.md`, `analysis/component-library-analysis.md`, and `analysis/design-review.md`.

## 1. Reusable Component & Style Families

1. **Poster-Scale Uppercase Headings** — Hero masthead and page section titles share the same condensed, ultra-bold sans serif with generous tracking. The typography creates a single visual “family” even when the layout shifts (home hero vs. WRITING/NOTES headers). Treat this as a reusable style rather than bespoke artwork.
2. **Coral Underline Navigation Links** — Link lists, article rows, and metadata stacks all rely on the same coral bar sat directly beneath text. Width, weight, and spacing vary today but the pattern (text + coral rule) is reusable everywhere from navigation to accordion headers.
3. **Single-Column Editorial Stack** — Nearly every page arranges content in a centered column with repeated modules (metadata, title, divider, content). This is essentially a layout component that can be paramaterized by spacing tokens.
4. **Paper Cards with Dotted Baselines** — Notes and certain styleguide entries use off-white cards with dotted borders at the top or bottom. The motif can be reused for any “secondary” content such as checklists, CTAs, or related links.
5. **Badge & Label Pills** — Category labels, external-platform badges, and NEW markers all use the same rounded rectangle capsule. Standardizing color intent allows the shape to become a true system artifact.
6. **Share/Copy Utility Row** — Inline actions at the bottom of articles and notes repeat the same coral text treatment separated by slashes. They function as a reusable micro-component even though they currently lack icons.
7. **Callout Surfaces** — All alert/callout types (info, warning, success, error, dark code) share identical padding, typography, and optional coral labels. Color alone differentiates meaning, making a strong argument for a single callout component with semantic modifiers.
8. **Link Preview Shells** — Twitter/X embeds, bookmark cards, and video blocks all share an elevated card with thumbnail/media area plus stacked metadata. Treating that shell as a base component enables consistent responsive behavior.
9. **Auto/Light/Dark Toggle Pills** — The segmented control pattern repeats in the sidebar reference and styleguides. It can cover any binary/ternary option set (theme, filter, view mode) if documented as a reusable style.
10. **Coral Divider System** — The coral horizontal rule is more than decoration; it is the connective tissue that signals transitions between modules. It is effectively a primitive that should be tokenized and applied consistently across lists, cards, and layout seams.

## 2. Coherent Visual Patterns Already in the Site

- **Warm-Neutral vs. Charcoal Duality** — Light mode leans on cream paper and charcoal text, while dark mode inverts with subtle adjustments. The accent coral remains constant, reinforcing brand continuity across schemes.
- **Metadata Formula** — Dates, read times, and contextual labels consistently use muted gray sans-serif text followed by a coral divider. Whether on writing lists or inside articles, the metadata cadence is identical.
- **Gridless Generous Spacing** — Instead of strict modular grids, the site uses wide vertical spacing (48–120 px) to create rhythm. This becomes a recognizable pattern that distinguishes Danny’s content from typical blog templates.
- **Monochrome Imagery Frames** — Images, videos, and embeds adopt neutral frames (soft borders, rounded corners) so the colorful content becomes the focal point. This restraint is a pattern worth keeping as new media surfaces are added.
- **All-Caps Navigation Vocabulary** — From the home link list to footer nav, uppercase label text is the norm. Even when metadata switches to sentence case, the system returns to all-caps for any “navigational” phrase, which helps scanning.
- **List → Divider → List Cadence** — Long lists always alternate between an item and a coral underline, making the pattern predictable regardless of content type (nav links, article lists, checklists).
- **Inset Content Highlights** — Blockquotes, pull quotes, callouts, and code blocks all act as inset “islands” with their own background/surface rules, providing predictable resting points while reading.
- **Inverted Footer Region** — Regardless of the page, the footer flips to a charcoal field with light text and retains the coral rule. This repeated inversion acts as the site’s visual “full stop.”
- **Manual Motion Discipline** — Although animations are not visible in screenshots, the design leans on simple transitions (hover color shifts, accordion reveals) rather than flashy motion. This subtlety is itself a pattern that should be preserved.

By capturing these reusable systems, designers and engineers can extend the visual language without re-litigating every decision. Each pattern above has already proven itself across multiple pages and simply needs clean documentation plus token support.
