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
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-ink',
  secondary: 'bg-elevated',
  ghost: 'bg-transparent',
};

const variantTextClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-base',
  secondary: 'text-ink',
  ghost: 'text-ink',
};

export function Button({
  label,
  onPress,
  icon: Icon,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const { style, onPressIn, onPressOut } = usePressScale(0.97);

  const iconColor = variant === 'primary' ? colors.base : colors.ink;

  return (
    <AnimatedPressable
      disabled={disabled}
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-full px-5 py-3 ${variantClasses[variant]} ${disabled ? 'opacity-40' : ''}`}>
      {Icon ? <Icon size={16} color={iconColor} /> : null}
      <AppText weight="semibold" className={`text-[14px] ${variantTextClasses[variant]}`}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}
