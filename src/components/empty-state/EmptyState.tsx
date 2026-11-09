import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-4 px-10 py-20">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-elevated">
        <Icon size={24} color={colors.inkDim} strokeWidth={1.5} />
      </View>
      <View className="gap-1.5">
        <AppText weight="semibold" className="text-center text-[17px] text-ink">
          {title}
        </AppText>
        <AppText className="text-center text-[14px] leading-5 text-ink-dim">{message}</AppText>
      </View>
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
