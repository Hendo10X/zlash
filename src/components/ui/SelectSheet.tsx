import { Check, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Sheet } from './Sheet';
import { AppText } from './Text';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface SelectSheetProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Single-choice picker in a bottom sheet. Picking closes the sheet. */
export function SelectSheet<T extends string>({
  visible,
  onClose,
  title,
  description,
  options,
  value,
  onChange,
}: SelectSheetProps<T>) {
  const { colors } = useAppTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title={title} description={description}>
      <View style={{ gap: 4 }}>
        {options.map((option) => {
          const selected = option.value === value;
          const Icon = option.icon;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                onChange(option.value);
                onClose();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 56,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: selected ? colors.accentSoft : pressed ? colors.line : 'transparent',
              })}>
              {Icon ? <Icon size={18} color={selected ? colors.accent : colors.inkDim} strokeWidth={2} /> : null}
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight={selected ? 'semibold' : 'medium'} className="text-ink">
                  {option.label}
                </AppText>
                {option.description ? (
                  <AppText variant="caption" className="text-ink-dim" style={{ marginTop: 1 }}>
                    {option.description}
                  </AppText>
                ) : null}
              </View>
              <View style={{ width: 20, alignItems: 'center' }}>
                {selected ? <Check size={18} color={colors.accent} strokeWidth={2.5} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
