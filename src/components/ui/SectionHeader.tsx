import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/Text';

interface SectionHeaderProps {
  title: string;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Quiet section label. Sentence case, not shouty uppercase. */
export function SectionHeader({ title, trailing, style }: SectionHeaderProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }, style]}>
      <AppText variant="footnote" weight="semibold" className="text-ink-dim">
        {title}
      </AppText>
      {trailing}
    </View>
  );
}
