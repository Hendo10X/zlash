import { Text, type TextProps } from 'react-native';

import { FontWeights, type FontWeight } from '@/constants/fonts';

interface AppTextProps extends TextProps {
  /** Which loaded Inter weight to render — defaults to regular. */
  weight?: FontWeight;
}

/** The only `Text` Zlash screens should import. Guarantees every piece of
 * copy in the app renders in Inter at a real, correctly-weighted file
 * (never the OS default, never a mono/system fallback). */
export function AppText({ weight = 'regular', style, ...rest }: AppTextProps) {
  return <Text style={[{ fontFamily: FontWeights[weight] }, style]} {...rest} />;
}
