/**
 * JS-side mirror of the color tokens defined in `src/global.css`.
 *
 * Styling in components should use Uniwind `className`s (e.g. `bg-base`,
 * `text-ink`) wherever possible — these tokens exist only for the handful
 * of places that need a raw color value in JS: status bar style, SVG icon
 * `color` props, native overlays, chart-like progress rings, etc.
 *
 * Keep this in sync with the `@variant dark` / `@variant light` blocks in
 * global.css.
 */
export const Colors = {
  dark: {
    base: '#171717',
    surface: '#202020',
    elevated: '#262626',
    ink: '#f5f5f5',
    inkDim: '#a3a3a3',
    inkFaint: '#737373',
    line: '#303030',
    accent: '#22c55e',
    accentInk: '#052e16',
    accentSoft: 'rgba(34, 197, 94, 0.14)',
    overlay: 'rgba(10, 10, 10, 0.72)',
  },
  light: {
    base: '#f5f3ee',
    surface: '#ffffff',
    elevated: '#ffffff',
    ink: '#171717',
    inkDim: '#737373',
    inkFaint: '#a19d93',
    line: '#e7e5e0',
    accent: '#16a34a',
    accentInk: '#ffffff',
    accentSoft: 'rgba(22, 163, 74, 0.12)',
    overlay: 'rgba(23, 23, 23, 0.55)',
  },
} as const;

export type AppScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light;

/** A set of distinct, muted tones used to generate placeholder cover art
 * until a comic's real artwork has been extracted. Picked for a warm,
 * paper-and-ink feel rather than saturated "app icon" colors. */
export const CoverPalette = [
  ['#2b2420', '#4a3b2f'],
  ['#1f2a2b', '#35504f'],
  ['#2a2320', '#6b4a3a'],
  ['#20242b', '#3a4a6b'],
  ['#2b2020', '#6b3a3a'],
  ['#242a20', '#4a6b3a'],
  ['#2a2032', '#5a3a6b'],
  ['#1f1f1f', '#4d4d4d'],
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

/** Floating tab bar geometry — see `components/ui/TabBar.tsx`. Screens use
 * `useTabBarClearance()` rather than these directly, since the real offset
 * depends on the device's bottom safe-area inset. */
export const TabBarMetrics = { height: 64, bottomGap: 12 } as const;

/** Shared motion tokens. Ease-out for anything entering or responding to a
 * touch; short durations so the UI never feels like it's waiting on itself. */
export const Motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;
export const MaxContentWidth = 720;
