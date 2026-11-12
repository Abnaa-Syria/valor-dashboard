import { theme as antdTheme, type ThemeConfig } from 'antd';

// Colors from the VALOR brand palette (Figma: 05 — Brand & Design Language).
export const colors = {
  base: '#0B0A12',
  surface: '#14111F',
  surfaceRaised: '#1B1729',
  primary: '#7C3AED',
  light: '#C4B5FD',
  magenta: '#D946EF',
} as const;

export const theme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: colors.primary,
    colorBgBase: colors.base,
    colorBgContainer: colors.surface,
    colorBgElevated: colors.surfaceRaised,
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  components: {
    Layout: { bodyBg: colors.base, headerBg: colors.surface, siderBg: colors.surface },
    Menu: { darkItemBg: colors.surface, darkItemSelectedBg: colors.primary },
    Card: { colorBorderSecondary: '#262138' },
  },
};
