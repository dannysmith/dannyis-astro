/**
 * Mermaid diagram theme configuration.
 *
 * Mermaid can't take var() in themeVariables (its color engine needs
 * parseable colors — mermaid-js/mermaid#6677), so diagrams are rendered with
 * the sentinel hexes below and satteri-mermaid rewrites each one to its
 * `--mermaid-*` variable, defined in _mermaid.css. The sentinel doubles as
 * the var() fallback, so contexts without the site stylesheet (RSS readers)
 * degrade to the light theme. Colors mermaid derives from unset theme
 * variables stay fixed; if one looks wrong in dark mode, set its variable
 * explicitly here.
 *
 * @see https://mermaid.js.org/config/theming.html
 */
import { readFileSync, readdirSync } from 'node:fs';

/**
 * Sentinel palette (light-mode values). Each value is a find-and-replace
 * target in the rendered SVG, so values must be unique. The variable names in
 * _mermaid.css are the kebab-cased keys. Accents are named by hue like the
 * site tokens they map to; the rest are named by role.
 */
const colors = {
  // Node/actor fills
  surface: '#faf6ef',
  surfaceSecondary: '#f5ede8',
  surfaceTertiary: '#f8f3ed',

  text: '#1a1d20',

  // Edge-label masks, diagram background
  background: '#ffffff',

  // The site accent palette
  coral: '#d9745b',
  purple: '#9b6ea6',
  green: '#7baa99',
  yellow: '#e6c84a',
  blue: '#2f8adc',
  pink: '#af467e',
  orange: '#ff9845',

  noteBackground: '#fff9e6',
  errorBackground: '#ffebee',
  errorText: '#c62828',
};

const cssVar = name => `--mermaid-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`;

/** [bakedColor, cssVarWithFallback] pairs applied to the rendered SVG string. */
export const mermaidColorReplacements = [
  ...Object.entries(colors).map(([name, hex]) => [hex, `var(${cssVar(name)}, ${hex})`]),
  // Flowchart edge-label backgrounds (.labelBkg): mermaid derives this from
  // `background` at 50% alpha, so it escapes the sentinel rewrite. Matched as
  // serialized — verify after mermaid upgrades (render-test script).
  ['rgba(255, 255, 255, 0.5)', 'var(--mermaid-label-background, rgba(255, 255, 255, 0.5))'],
];

/**
 * The build-time Chromium measures label boxes with the fonts it has loaded;
 * if those differ from the display font, labels clip. So the UI font is
 * inlined as a data: stylesheet for the renderer, with font-display:block so
 * Chromium loads it before measuring.
 */
const fontsDir = new URL('../../public/fonts/', import.meta.url);
const figtreeFile = readdirSync(fontsDir).find(file => /^Figtree-v.*\.woff2$/.test(file));
const fontFaceCss =
  "@font-face{font-family:'Figtree';" +
  `src:url(data:font/woff2;base64,${readFileSync(new URL(figtreeFile, fontsDir)).toString('base64')}) format('woff2');` +
  'font-weight:300 900;font-style:normal;font-display:block;}';
export const mermaidFontCss = `data:text/css;base64,${Buffer.from(fontFaceCss).toString('base64')}`;

export const mermaidConfig = {
  theme: 'base',
  // Matches --font-ui. Must be top-level: mermaid-isomorphic defaults it to arial.
  fontFamily: "'Figtree', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  themeVariables: {
    // Primary colors for flowchart nodes
    primaryColor: colors.surface,
    primaryTextColor: colors.text,
    primaryBorderColor: colors.coral,

    // Secondary colors for variety
    secondaryColor: colors.surfaceSecondary,
    secondaryTextColor: colors.text,
    secondaryBorderColor: colors.purple,

    // Tertiary colors
    tertiaryColor: colors.surfaceTertiary,
    tertiaryTextColor: colors.text,
    tertiaryBorderColor: colors.green,

    // Lines and connections
    lineColor: colors.coral,
    textColor: colors.text,
    edgeLabelBackground: colors.background,

    // Background
    background: colors.background,

    // Sequence diagram specific
    actorBkg: colors.surface,
    actorBorder: colors.coral,
    actorTextColor: colors.text,
    actorLineColor: colors.coral,
    signalColor: colors.text,
    signalTextColor: colors.text,
    labelBoxBkgColor: colors.surfaceSecondary,
    labelBoxBorderColor: colors.coral,
    labelTextColor: colors.text,
    loopTextColor: colors.text,
    activationBkgColor: colors.surfaceSecondary,
    activationBorderColor: colors.coral,
    sequenceNumberColor: colors.background,

    // Note colors
    noteBkgColor: colors.noteBackground,
    noteTextColor: colors.text,
    noteBorderColor: colors.yellow,

    // Gantt
    sectionBkgColor: colors.surfaceSecondary,
    altSectionBkgColor: colors.background,
    sectionBkgColor2: colors.surfaceTertiary,
    taskTextColor: colors.text,
    taskTextOutsideColor: colors.text,
    todayLineColor: colors.coral,

    // Pie
    pie1: colors.coral,
    pie2: colors.purple,
    pie3: colors.green,
    pie4: colors.yellow,
    pie5: colors.blue,
    pie6: colors.pink,
    pie7: colors.orange,
    pieTitleTextColor: colors.text,
    pieSectionTextColor: colors.text,
    pieLegendTextColor: colors.text,
    pieStrokeColor: colors.background,
    pieOuterStrokeColor: colors.background,
    pieOpacity: 1,

    // Misc
    mainBkg: colors.surface,
    errorBkgColor: colors.errorBackground,
    errorTextColor: colors.errorText,
  },
};
