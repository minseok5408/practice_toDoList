import { createContext, useContext } from 'react';

import { radii, sizes, spacing, typography } from './tokens';

const lightColors = {
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceMuted: '#edf2f7',
  surfaceRaised: '#ffffff',
  primary: '#2563eb',
  primaryDark: '#174ea6',
  primarySoft: '#e8f0fe',
  text: '#172033',
  textMuted: '#667085',
  textSoft: '#98a2b3',
  border: '#dfe6ee',
  success: '#16866a',
  successSoft: '#e5f6f1',
  danger: '#d1435b',
  dangerSoft: '#fdecef',
  warning: '#d68a13',
  warningSoft: '#fff4df',
  shadow: '#1b314f',
  overlay: 'rgba(15, 23, 42, 0.52)',
} as const;

type ThemeColors = { [Key in keyof typeof lightColors]: string };

const darkColors: ThemeColors = {
  background: '#0b1118',
  surface: '#121a24',
  surfaceMuted: '#1b2633',
  surfaceRaised: '#17212d',
  primary: '#6ea8fe',
  primaryDark: '#397dd8',
  primarySoft: '#19345a',
  text: '#f3f6fa',
  textMuted: '#a8b3c2',
  textSoft: '#718096',
  border: '#283646',
  success: '#58c9a5',
  successSoft: '#163a31',
  danger: '#ff8092',
  dangerSoft: '#44232c',
  warning: '#f2b85c',
  warningSoft: '#3d301e',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.68)',
};

function createShadows(themeColors: ThemeColors, dark: boolean) {
  return {
    card: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: dark ? 0.18 : 0.055,
      shadowRadius: 12,
      elevation: 2,
    },
    floating: {
      shadowColor: themeColors.primaryDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: dark ? 0.3 : 0.24,
      shadowRadius: 16,
      elevation: 6,
    },
  } as const;
}

export type AppTheme = {
  dark: boolean;
  colors: ThemeColors;
  shadows: ReturnType<typeof createShadows>;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
  typography: typeof typography;
};

function createTheme(colors: ThemeColors, dark: boolean): AppTheme {
  return {
    dark,
    colors,
    shadows: createShadows(colors, dark),
    spacing,
    radii,
    sizes,
    typography,
  };
}

export const lightTheme = createTheme(lightColors, false);
export const darkTheme = createTheme(darkColors, true);
export const ThemeContext = createContext<AppTheme>(lightTheme);

export function useAppTheme() {
  return useContext(ThemeContext);
}

export { radii, sizes, spacing, typography } from './tokens';
