import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row rounded-full bg-elevated p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center justify-center rounded-full py-2"
            style={{ backgroundColor: active ? colors.ink : 'transparent' }}>
            <AppText
              weight="medium"
              style={{ fontSize: 13, color: active ? colors.base : colors.inkDim }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
