import type { TextStyle } from 'react-native';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const sizes = {
  minTouchTarget: 44,
  control: 48,
  input: 52,
} as const;

type TypographyTokens = Record<
  'caption' | 'label' | 'body' | 'bodyStrong' | 'title' | 'heading' | 'display',
  Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>
>;

export const typography: TypographyTokens = {
  caption: { fontSize: 10, fontWeight: '600', lineHeight: 14 },
  label: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  title: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  heading: { fontSize: 24, fontWeight: '900', lineHeight: 31 },
  display: { fontSize: 28, fontWeight: '900', lineHeight: 36 },
};
