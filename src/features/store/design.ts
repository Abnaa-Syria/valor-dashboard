/** Shapes of the design data stored on frames and themes (see backend cosmetic-metadata.ts). */

export type ThemeTokens = Record<string, string | number>;
export type ThemeDesign = { appearance: 'dark' | 'light'; tokens: ThemeTokens };

export type FrameLayout = {
  avatar: { x: number; y: number; size: number };
  ring: { x: number; y: number; width: number; height: number };
};
export type FrameDesign = { glowColor: string; layout: FrameLayout };

export type TokenDef = { key: string; type: 'color' | 'radius'; label: string };
export type TokenGroup = { group: string; description: string; tokens: TokenDef[] };

export const defaultFrameLayout: FrameLayout = {
  avatar: { x: 32 / 168, y: 32 / 168, size: 104 / 168 },
  ring: { x: 12 / 168, y: 12 / 168, width: 144 / 168, height: 144 / 168 },
};

/** Sample avatar for previews: a neutral silhouette. */
export const sampleAvatar =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b5b95"/><stop offset="1" stop-color="#2b2140"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="18" fill="#cfc3e6"/><path d="M18 96c4-20 18-30 32-30s28 10 32 30z" fill="#cfc3e6"/></svg>`,
  );

// ───────────── Contrast (WCAG 2.1) ─────────────

function channel(value: number) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The pairs the Figma "contrast review" checks. min: 4.5 for text, 3 for controls. */
export const contrastPairs: { label: string; fg: string; bg: string; min: number }[] = [
  { label: 'Primary text on background', fg: 'text-primary', bg: 'bg', min: 4.5 },
  { label: 'Primary text on surface', fg: 'text-primary', bg: 'surface', min: 4.5 },
  { label: 'Secondary text on surface', fg: 'text-secondary', bg: 'surface', min: 4.5 },
  { label: 'Muted text on surface', fg: 'text-muted', bg: 'surface', min: 4.5 },
  { label: 'Muted text on raised surface', fg: 'text-muted', bg: 'surface-raised', min: 4.5 },
  { label: 'Accent text & links on surface', fg: 'accent-text', bg: 'surface', min: 4.5 },
  { label: 'Button label on accent', fg: 'on-accent', bg: 'accent', min: 4.5 },
  { label: 'Inactive nav on surface', fg: 'nav-inactive', bg: 'surface', min: 4.5 },
  { label: 'Control borders on surface', fg: 'border-control', bg: 'surface', min: 3 },
  { label: 'Disabled label on disabled fill', fg: 'disabled-text', bg: 'disabled-surface', min: 3 },
];

/** Drops the alpha part of #RRGGBBAA so contrast is computed on the solid color. */
export const solid = (value: unknown) => (typeof value === 'string' ? value.slice(0, 7) : '#000000');
