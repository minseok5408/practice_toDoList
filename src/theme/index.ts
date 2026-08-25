import { createContext, useContext } from 'react';

import { radii, sizes, spacing, typography } from './tokens';

const lightColors = {
  background: '#f6f7fb',
  surface: '#ffffff',
  surfaceMuted: '#f0f1f7',
  surfaceRaised: '#ffffff',
  primary: '#6657e8',
  primaryDark: '#5143cf',
  primarySoft: '#eeecff',
  text: '#1d2130',
  textMuted: '#74798c',
  textSoft: '#a2a6b5',
  border: '#e7e8ef',
  success: '#2d9b72',
  successSoft: '#e8f7f1',
  danger: '#d34f67',
  dangerSoft: '#fff0f3',
  warning: '#e4a33b',
  warningSoft: '#fff7e8',
  shadow: '#242139',
  overlay: 'rgba(22, 20, 34, 0.48)',
} as const;

type ThemeColors = { [Key in keyof typeof lightColors]: string };

const darkColors: ThemeColors = {
  background: '#11121a',
  surface: '#1b1d28',
  surfaceMuted: '#252733',
  surfaceRaised: '#222431',
  primary: '#8c7fff',
  primaryDark: '#7668ec',
  primarySoft: '#2e2a50',
  text: '#f4f4f8',
  textMuted: '#b0b2c0',
  textSoft: '#7f8292',
  border: '#30323f',
  success: '#5dc49a',
  successSoft: '#19372e',
  danger: '#ff8296',
  dangerSoft: '#42232c',
  warning: '#f0ba62',
  warningSoft: '#3b3020',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.68)',
};

function createShadows(themeColors: ThemeColors, dark: boolean) {
  return {
    card: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: dark ? 0.2 : 0.07,
      shadowRadius: 20,
      elevation: 3,
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
