/**
 * ForgeWorkout brand tokens.
 *
 * Identity: matte black + burnt orange, like a forge. Flat, bold, no
 * decoration. Dark mode is the "native" feel of the brand; light mode keeps
 * the same orange accent on a warm off-white surface so the app never reads
 * as a generic template.
 */

const colors = {
  light: {
    text: '#141110',
    tint: '#E85D2A',

    background: '#F7F4F1',
    foreground: '#141110',

    card: '#FFFFFF',
    cardForeground: '#141110',

    primary: '#E85D2A',
    primaryForeground: '#FFFFFF',

    secondary: '#EDE7E1',
    secondaryForeground: '#141110',

    muted: '#EDE7E1',
    mutedForeground: '#7A716A',

    accent: '#FCE7DA',
    accentForeground: '#B0431A',

    destructive: '#D94F3D',
    destructiveForeground: '#FFFFFF',

    success: '#3F9A5C',

    border: '#E3DCD4',
    input: '#E3DCD4',

    flame: '#E85D2A',
    flameDeep: '#B0431A',
    rest: '#8B8781',
  },

  dark: {
    text: '#F5F1EC',
    tint: '#FF7A3D',

    background: '#0E0C0B',
    foreground: '#F5F1EC',

    card: '#1A1715',
    cardForeground: '#F5F1EC',

    primary: '#FF7A3D',
    primaryForeground: '#140A05',

    secondary: '#231F1C',
    secondaryForeground: '#F5F1EC',

    muted: '#231F1C',
    mutedForeground: '#A39C93',

    accent: '#2B1B12',
    accentForeground: '#FF9C63',

    destructive: '#E8695A',
    destructiveForeground: '#140A05',

    success: '#5CBB7C',

    border: '#2A2622',
    input: '#2A2622',

    flame: '#FF7A3D',
    flameDeep: '#FF9C63',
    rest: '#6B665F',
  },

  radius: 14,
};

export default colors;
