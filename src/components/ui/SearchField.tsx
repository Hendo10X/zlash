import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FontWeights } from '@/constants/fonts';
import { EaseOut } from '@/constants/motion';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
  onSubmit?: (text: string) => void;
}

export function SearchField({ value, onChangeText, onClose, placeholder, onSubmit }: SearchFieldProps) {
  const { colors } = useAppTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(180).easing(EaseOut)}
      exiting={FadeOut.duration(120)}
      style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 46,
          borderRadius: 14,
          paddingHorizontal: 14,
          backgroundColor: colors.surface,
        }}>
        <Search size={17} color={colors.inkFaint} />
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Search your library'}
          placeholderTextColor={colors.inkFaint}
          selectionColor={colors.accent}
          returnKeyType="search"
          onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
          style={{ flex: 1, fontFamily: FontWeights.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 }}
        />
        <Pressable
          hitSlop={12}
          accessibilityLabel="Close search"
          onPress={() => {
            onChangeText('');
            onClose();
          }}>
          <X size={17} color={colors.inkFaint} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
