import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SettingsRowProps {
  icon?: LucideIcon;
  label: string;
  description?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export function SettingsRow({
  icon: Icon,
  label,
  description,
  trailing,
  onPress,
  destructive = false,
  showChevron = false,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-line py-3.5 active:opacity-60">
      {Icon ? (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-elevated">
          <Icon size={15} color={destructive ? colors.accent : colors.inkDim} />
        </View>
      ) : null}
      <View className="flex-1">
        <AppText weight="medium" style={{ fontSize: 15, color: destructive ? colors.accent : colors.ink }}>
          {label}
        </AppText>
        {description ? (
          <AppText className="mt-0.5 text-[12px] text-ink-dim">{description}</AppText>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <ChevronRight size={16} color={colors.inkFaint} /> : null}
    </Wrapper>
  );
}
