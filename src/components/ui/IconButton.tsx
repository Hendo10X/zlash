import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';
import { usePressScale } from '@/hooks/use-press-scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  size?: number;
  variant?: 'surface' | 'ghost' | 'accent';
  active?: boolean;
}

export function IconButton({
  icon: Icon,
  onPress,
  size = 38,
  variant = 'surface',
  active = false,
}: IconButtonProps) {
  const { colors } = useAppTheme();
  const { style, onPressIn, onPressOut } = usePressScale(0.92);

  const bg =
    variant === 'accent' ? 'bg-accent' : active ? 'bg-ink' : variant === 'ghost' ? '' : 'bg-elevated';

  const iconColor =
    variant === 'accent' ? colors.accentInk : active ? colors.base : colors.ink;

  return (
    <AnimatedPressable
      style={[style, { width: size, height: size }]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      className={`items-center justify-center rounded-full ${bg}`}>
      <Icon size={Math.round(size * 0.45)} color={iconColor} strokeWidth={2} />
    </AnimatedPressable>
  );
}
