import type { LucideIcon } from 'lucide-react-native';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';
import { usePressScale } from '@/hooks/use-press-scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  size?: number;
  variant?: 'surface' | 'ghost' | 'accent';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon: Icon,
  onPress,
  size = 40,
  variant = 'surface',
  accessibilityLabel,
  style: extraStyle,
}: IconButtonProps) {
  const { colors } = useAppTheme();
  const { style, onPressIn, onPressOut } = usePressScale(0.92);

  const bg = variant === 'accent' ? colors.accent : variant === 'ghost' ? 'transparent' : colors.elevated;
  const fg = variant === 'accent' ? colors.accentInk : colors.ink;

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // Keep the touch target at least 44pt even when the visual is smaller.
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={[
        style,
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg },
        extraStyle,
      ]}>
      <Icon size={Math.round(size * 0.45)} color={fg} strokeWidth={2} />
    </AnimatedPressable>
  );
}
