import { TextInput, type TextInputProps } from 'react-native';

import { FontWeights } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

/** Single-line text input styled to sit on a sheet or card surface. */
export function TextField(props: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.inkFaint}
      selectionColor={colors.accent}
      cursorColor={colors.accent}
      {...props}
      style={[
        {
          height: 52,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.base,
          color: colors.ink,
          fontFamily: FontWeights.medium,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}
