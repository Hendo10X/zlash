import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

/**
 * A rounded card of rows separated by inset hairlines — the grouped-list
 * pattern used by most well-designed settings screens. Rows never need
 * their own borders.
 */
export function SettingsGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View>
      {title ? (
        <AppText variant="footnote" weight="semibold" className="text-ink-dim" style={{ marginBottom: 8, marginLeft: 4 }}>
          {title}
        </AppText>
      ) : null}
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <View key={row.key ?? i}>
            {row}
            {i < rows.length - 1 ? (
              <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 60, opacity: 0.8 }} />
            ) : null}
          </View>
        ))}
      </View>
      {footer ? (
        <AppText variant="caption" className="text-ink-faint" style={{ marginTop: 8, marginHorizontal: 4 }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

interface SettingsRowProps {
  icon?: LucideIcon;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Right-aligned current value (for select rows). */
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export function SettingsRow({
  icon: Icon,
  label,
  description,
  value,
  trailing,
  onPress,
  destructive = false,
  showChevron = false,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const tint = destructive ? '#ef4444' : colors.ink;

  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: pressed ? colors.elevated : 'transparent',
      }}>
      {Icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? 'rgba(239, 68, 68, 0.12)' : colors.elevated,
          }}>
          <Icon size={16} color={destructive ? '#ef4444' : colors.inkDim} strokeWidth={2} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="body" weight="medium" numberOfLines={1} style={{ color: tint }}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" numberOfLines={2} className="text-ink-dim" style={{ marginTop: 1 }}>
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="callout" numberOfLines={1} className="text-ink-dim" tabular style={{ flexShrink: 0 }}>
          {value}
        </AppText>
      ) : null}
      {trailing ? <View style={{ flexShrink: 0 }}>{trailing}</View> : null}
      {showChevron ? <ChevronRight size={16} color={colors.inkFaint} style={{ marginLeft: -4 }} /> : null}
    </View>
  );

  if (!onPress) return content(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
