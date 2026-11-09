import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { History, Library, Settings as SettingsIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { usePressScale } from '@/hooks/use-press-scale';

const ICONS = {
  index: Library,
  history: History,
  settings: SettingsIcon,
} as const;

const LABELS: Record<string, string> = {
  index: 'Library',
  history: 'History',
  settings: 'Settings',
};

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / Math.max(state.routes.length, 1);

  const indicatorX = useSharedValue(0);
  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 220,
    });
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth,
  }));

  return (
    <View
      className="absolute inset-x-4 flex-row items-center rounded-full border border-line bg-surface"
      style={{ bottom: insets.bottom + 10, height: 62 }}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
      {barWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[indicatorStyle, { position: 'absolute', top: 7, bottom: 7 }]}
          className="rounded-full bg-elevated"
        />
      ) : null}

      {state.routes.map((route, index) => (
        <TabBarItem
          key={route.key}
          routeKey={route.key}
          routeName={route.name}
          isFocused={state.index === index}
          onPress={() => navigateToTab(route.key)}
        />
      ))}
    </View>
  );
}

function TabBarItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeKey: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const Icon = ICONS[routeName as keyof typeof ICONS] ?? Library;
  const { style, onPressIn, onPressOut } = usePressScale(0.9);

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Pressable
        className="items-center justify-center gap-1 py-2"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}>
        <Icon size={20} strokeWidth={isFocused ? 2.25 : 1.75} color={isFocused ? colors.ink : colors.inkFaint} />
        <AppText
          weight={isFocused ? 'semibold' : 'medium'}
          style={{ fontSize: 11, color: isFocused ? colors.ink : colors.inkFaint }}>
          {LABELS[routeName] ?? routeName}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}
