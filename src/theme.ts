import { theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'dark' | 'light';

// VALOR brand palette (Figma: Cover & Logo, 05 — Brand & Design Language, App Screens).
// Dark is the original console look; light keeps the same violet brand on bright surfaces.
const palettes = {
  dark: {
    base: '#0B0A12',
    surface: '#15121F',
    surfaceRaised: '#1C1829',
    field: '#120F1C',
    line: '#2A2440',
    lineSoft: '#211C32',
    primary: '#7C3AED',
    link: '#A78BFA',
    linkHover: '#C4B5FD',
    text: '#F4F1FF',
    textSecondary: '#A39DBB',
    textTertiary: '#7C7694',
    tableHead: '#9C94B8',
    tabSelected: '#FFFFFF',
    tabIdle: '#9C94B8',
    segmentedIdle: '#A9A3C2',
    softFill: 'rgba(255, 255, 255, 0.03)',
    softFill2: 'rgba(255, 255, 255, 0.05)',
    trackBg: 'rgba(255, 255, 255, 0.04)',
    breadcrumbItem: '#7C7694',
    breadcrumbSep: '#4B4466',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F43F5E',
    shadow: '0 18px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(167, 139, 250, 0.14)',
  },
  light: {
    base: '#F5F3FB',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    field: '#FFFFFF',
    line: '#DDD5EF',
    lineSoft: '#ECE7F6',
    primary: '#7C3AED',
    link: '#6D28D9',
    linkHover: '#7C3AED',
    text: '#17122B',
    textSecondary: '#5E5878',
    textTertiary: '#8A84A3',
    tableHead: '#6B6585',
    tabSelected: '#17122B',
    tabIdle: '#6B6585',
    segmentedIdle: '#5E5878',
    softFill: 'rgba(124, 58, 237, 0.03)',
    softFill2: 'rgba(124, 58, 237, 0.06)',
    trackBg: 'rgba(124, 58, 237, 0.07)',
    breadcrumbItem: '#8A84A3',
    breadcrumbSep: '#C9C2DD',
    success: '#059669',
    warning: '#D97706',
    error: '#E11D48',
    shadow: '0 18px 48px -16px rgba(46, 16, 101, 0.22), 0 0 0 1px rgba(124, 58, 237, 0.12)',
  },
} as const;

const display = "'Space Grotesk', 'Inter', system-ui, sans-serif";

export function buildTheme(mode: ThemeMode): ThemeConfig {
  const c = palettes[mode];
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorInfo: c.primary,
      colorLink: c.link,
      colorLinkHover: c.linkHover,
      colorBgBase: c.base,
      colorBgLayout: c.base,
      colorBgContainer: c.surface,
      colorBgElevated: c.surfaceRaised,
      colorBorder: c.line,
      colorBorderSecondary: c.lineSoft,
      colorText: c.text,
      colorTextSecondary: c.textSecondary,
      colorTextTertiary: c.textTertiary,
      colorSuccess: c.success,
      colorWarning: c.warning,
      colorError: c.error,
      borderRadius: 12,
      borderRadiusLG: 18,
      borderRadiusSM: 8,
      controlHeight: 38,
      controlHeightLG: 46,
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14,
      boxShadowSecondary: c.shadow,
    },
    components: {
      Layout: { bodyBg: 'transparent', headerBg: 'transparent', siderBg: 'transparent', headerHeight: 68 },
      // The sidebar is a dark brand panel in both modes (it carries the official logo).
      Menu: {
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
        darkItemSelectedBg: 'transparent',
        darkItemColor: '#A9A3C2',
        darkItemHoverColor: '#FFFFFF',
        darkItemHoverBg: 'rgba(167, 139, 250, 0.08)',
        darkGroupTitleColor: '#6F6889',
        itemHeight: 40,
        itemMarginInline: 12,
        itemBorderRadius: 12,
        iconSize: 16,
      },
      Card: { colorBgContainer: 'transparent', headerFontSize: 15, headerHeightSM: 46 },
      Table: {
        headerBg: mode === 'dark' ? 'rgba(124, 58, 237, 0.07)' : 'rgba(124, 58, 237, 0.05)',
        headerColor: c.tableHead,
        headerSplitColor: 'transparent',
        rowHoverBg: mode === 'dark' ? 'rgba(124, 58, 237, 0.09)' : 'rgba(124, 58, 237, 0.05)',
        borderColor: c.lineSoft,
        colorBgContainer: 'transparent',
        cellPaddingBlock: 14,
      },
      Tabs: { inkBarColor: c.link, itemSelectedColor: c.tabSelected, itemColor: c.tabIdle, itemHoverColor: c.linkHover, titleFontSize: 14 },
      Button: {
        fontWeight: 600,
        primaryShadow: mode === 'dark' ? '0 10px 28px -10px rgba(124, 58, 237, 0.9)' : '0 10px 24px -12px rgba(124, 58, 237, 0.7)',
        defaultBg: c.softFill,
        defaultBorderColor: c.line,
      },
      Input: { activeBg: c.field, hoverBg: c.field, colorBgContainer: c.field },
      InputNumber: { activeBg: c.field, hoverBg: c.field, colorBgContainer: c.field },
      Select: { colorBgContainer: c.field, optionSelectedBg: mode === 'dark' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.10)' },
      DatePicker: { colorBgContainer: c.field },
      Segmented: { itemSelectedBg: c.primary, trackBg: c.trackBg, itemColor: c.segmentedIdle },
      Statistic: { contentFontSize: 30, titleFontSize: 13 },
      Typography: { fontFamilyCode: "'JetBrains Mono', monospace" },
      Tag: { defaultBg: c.softFill2 },
      Modal: { contentBg: c.surfaceRaised, headerBg: c.surfaceRaised },
      Drawer: { colorBgElevated: c.surfaceRaised },
      Breadcrumb: { itemColor: c.breadcrumbItem, lastItemColor: c.link, linkColor: c.tableHead, linkHoverColor: c.linkHover, separatorColor: c.breadcrumbSep },
      Descriptions: { labelBg: 'transparent' },
      Collapse: { headerBg: c.softFill, contentBg: 'transparent' },
      Popover: { colorBgElevated: c.surfaceRaised },
      Dropdown: { colorBgElevated: c.surfaceRaised },
    },
  };
}

/** Chart colours (recharts needs real values, not CSS variables). */
export function chartColors(mode: ThemeMode) {
  return mode === 'dark'
    ? { ink: '#9085E9', grid: 'rgba(167,139,250,0.08)', axis: 'rgba(214,208,240,0.45)', cursorFill: 'rgba(167,139,250,0.06)', cursorStroke: 'rgba(196,181,253,0.4)', dotRing: '#15121F', progress: '#9085E9' }
    : { ink: '#7C3AED', grid: 'rgba(124,58,237,0.10)', axis: 'rgba(23,18,43,0.5)', cursorFill: 'rgba(124,58,237,0.06)', cursorStroke: 'rgba(124,58,237,0.35)', dotRing: '#FFFFFF', progress: '#7C3AED' };
}

export const fonts = { display };
