import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FontWeights } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export function SearchField({ value, onChangeText, onClose, placeholder }: SearchFieldProps) {
  const { colors } = useAppTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
      className="mx-5 mb-2 flex-row items-center gap-2 rounded-full bg-elevated px-4 py-3">
      <Search size={16} color={colors.inkFaint} />
      <TextInput
        autoFocus
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search your library'}
        placeholderTextColor={colors.inkFaint}
        className="flex-1 text-[15px] text-ink"
        style={{ fontFamily: FontWeights.regular }}
      />
      <Pressable
        hitSlop={8}
        onPress={() => {
          onChangeText('');
          onClose();
        }}>
        <X size={16} color={colors.inkFaint} />
      </Pressable>
    </Animated.View>
  );
}
