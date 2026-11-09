/**
 * Expo Google Fonts ships one static font file per weight (not a variable
 * font) — React Native can't fake-bold a custom font, so every weight needs
 * its own exact `fontFamily` name rather than a numeric `fontWeight`.
 * `AppText` (`src/components/ui/Text.tsx`) is the only place this should
 * be referenced; everywhere else should use its `weight` prop.
 */
export const FontWeights = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type FontWeight = keyof typeof FontWeights;
