import { Text, type TextProps, type TextStyle } from 'react-native';

import { FontWeights, type FontWeight } from '@/constants/fonts';

/**
 * Type scale. Every variant sets an explicit line height: on Android, text
 * sized only via `fontSize` (or a Tailwind `text-[Npx]` class) can be clipped
 * at the top/bottom with Inter's metrics, which is what was cutting words off.
 */
export const TypeScale = {
  display: { fontSize: 30, lineHeight: 38 },
  title: { fontSize: 22, lineHeight: 28 },
  headline: { fontSize: 17, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  callout: { fontSize: 14, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  micro: { fontSize: 11, lineHeight: 14 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TypeScale;

const DEFAULT_WEIGHT: Record<TypeVariant, FontWeight> = {
  display: 'bold',
  title: 'bold',
  headline: 'semibold',
  body: 'regular',
  callout: 'regular',
  footnote: 'regular',
  caption: 'regular',
  micro: 'medium',
};

interface AppTextProps extends TextProps {
  /** Size + line height from the type scale. Defaults to `body`. */
  variant?: TypeVariant;
  /** Which loaded Inter weight to render. Defaults per variant. */
  weight?: FontWeight;
  /** Fixed-width digits, for page counts and sizes that update in place. */
  tabular?: boolean;
}

/** The only `Text` Zlash screens should import. Guarantees every piece of
 * copy renders in Inter at a real, correctly-weighted file and a line height
 * that can't clip. Use `className` for color only; size comes from `variant`. */
export function AppText({ variant = 'body', weight, tabular, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[
        TypeScale[variant],
        { fontFamily: FontWeights[weight ?? DEFAULT_WEIGHT[variant]] },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
