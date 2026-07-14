/**
 * Mermaid diagram theme configuration.
 *
 * Mermaid can't take var() in themeVariables (its color engine needs
 * parseable colors — mermaid-js/mermaid#6677), so diagrams are rendered with
 * the sentinel hexes below and satteri-mermaid rewrites each one to its
 * `--mermaid-*` variable, defined in _mermaid.css. Colors mermaid derives
 * from unset theme variables stay fixed; if one looks wrong in dark mode,
 * set its variable explicitly here.
 *
 * @see https://mermaid.js.org/config/theming.html
 */
import { readFileSync, readdirSync } from 'node:fs';

/**
 * Sentinel palette (light-mode values). Each hex is a find-and-replace target
 * in the rendered SVG, so values must be unique. The variable names in
 * _mermaid.css are the kebab-cased keys.
 */
const colors = {
  beige: '#faf6ef',
  beigeSecondary: '#f5ede8',
  beigeTertiary: '#f8f3ed',
  ink: '#34383d',
  charcoal: '#1a1d20',
  white: '#ffffff',
  coral: '#d9745b',
  purple: '#9b6ea6',
  green: '#7baa99',
  yellow: '#e6c84a',
  yellowLight: '#fff9e6',
  errorBackground: '#ffebee',
  errorText: '#c62828',
};

/** [bakedHex, cssVar] pairs applied to the rendered SVG string. */
export const mermaidColorReplacements = Object.entries(colors).map(([name, hex]) => [
  hex,
  `var(--mermaid-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)})`,
]);

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
    primaryColor: colors.beige,
    primaryTextColor: colors.charcoal,
    primaryBorderColor: colors.coral,

    // Secondary colors for variety
    secondaryColor: colors.beigeSecondary,
    secondaryTextColor: colors.charcoal,
    secondaryBorderColor: colors.purple,

    // Tertiary colors
    tertiaryColor: colors.beigeTertiary,
    tertiaryTextColor: colors.charcoal,
    tertiaryBorderColor: colors.green,

    // Lines and connections
    lineColor: colors.coral,
    textColor: colors.charcoal,
    edgeLabelBackground: colors.white,

    // Background
    background: colors.white,

    // Sequence diagram specific
    actorBkg: colors.beige,
    actorBorder: colors.coral,
    actorTextColor: colors.charcoal,
    actorLineColor: colors.coral,
    signalColor: colors.charcoal,
    signalTextColor: colors.charcoal,
    labelBoxBkgColor: colors.beigeSecondary,
    labelBoxBorderColor: colors.coral,
    labelTextColor: colors.charcoal,
    loopTextColor: colors.charcoal,
    activationBkgColor: colors.beigeSecondary,
    activationBorderColor: colors.coral,
    sequenceNumberColor: colors.white,

    // Note colors
    noteBkgColor: colors.yellowLight,
    noteTextColor: colors.ink,
    noteBorderColor: colors.yellow,

    // Misc
    mainBkg: colors.beige,
    errorBkgColor: colors.errorBackground,
    errorTextColor: colors.errorText,
  },
};
