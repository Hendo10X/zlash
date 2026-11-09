import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { usePressScale } from '@/hooks/use-press-scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';
  size?: 'md' | 'lg';
  disabled?: boolean;
  /** Stretch to the parent's width. */
  block?: boolean;
}

export function Button({
  label,
  onPress,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  block = false,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const { style, onPressIn, onPressOut } = usePressScale(0.97);

  const palette = {
    primary: { bg: colors.ink, fg: colors.base },
    accent: { bg: colors.accent, fg: colors.accentInk },
    secondary: { bg: colors.line, fg: colors.ink },
    ghost: { bg: 'transparent', fg: colors.ink },
    destructive: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#ef4444' },
  }[variant];

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      accessibilityRole="button"
      style={[
        style,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 999,
          paddingHorizontal: size === 'lg' ? 24 : 18,
          height: size === 'lg' ? 52 : 44,
          backgroundColor: palette.bg,
          opacity: disabled ? 0.4 : 1,
          alignSelf: block ? 'stretch' : 'auto',
        },
      ]}>
      {Icon ? <Icon size={size === 'lg' ? 18 : 16} color={palette.fg} strokeWidth={2.25} /> : null}
      <AppText variant={size === 'lg' ? 'body' : 'callout'} weight="semibold" style={{ color: palette.fg }}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}
