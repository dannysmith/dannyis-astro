/**
 * Mermaid diagram theme configuration
 * Diagrams are generated at build-time in light mode using brand colors.
 * In dark mode, they're displayed in a light-colored container (handled by CSS).
 *
 * @see https://mermaid.js.org/config/theming.html
 */

// Brand colors for Mermaid diagrams
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

export const mermaidConfig = {
  theme: 'base',
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
