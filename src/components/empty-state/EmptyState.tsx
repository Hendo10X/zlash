import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
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
    <Animated.View
      entering={FadeIn.duration(260).easing(EaseOut)}
      style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 64 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          marginBottom: 18,
        }}>
        <Icon size={24} color={colors.inkDim} strokeWidth={1.75} />
      </View>
      <AppText variant="headline" className="text-ink" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText variant="callout" className="text-ink-dim" style={{ textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 22 }}>
          <Button label={actionLabel} variant="accent" onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  );
}
