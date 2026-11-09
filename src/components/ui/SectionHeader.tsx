import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Text';

interface SectionHeaderProps {
  title: string;
  trailing?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, trailing, className }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between ${className ?? ''}`}>
      <AppText weight="semibold" className="text-[13px] uppercase tracking-wider text-ink-dim">
        {title}
      </AppText>
      {trailing}
    </View>
  );
}
