import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { Compass, History, Library, type LucideIcon, Settings as SettingsIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
import { TabBarMetrics } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Library', icon: Library },
  browse: { label: 'Browse', icon: Compass },
  history: { label: 'History', icon: History },
  settings: { label: 'Settings', icon: SettingsIcon },
};

const INSET = 6;

/**
 * Floating pill tab bar. The active-tab highlight glides between tabs with a
 * short ease-out (no spring overshoot, no per-item scaling) — the old spring
 * plus press-scale combination was what made switching feel wobbly.
 */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useAppTheme();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = (barWidth - INSET * 2) / Math.max(state.routes.length, 1);

  const x = useSharedValue(0);
  const positioned = useRef(false);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const target = INSET + state.index * tabWidth;
    if (!positioned.current) {
      // First layout: jump into place instead of sliding in from the left.
      x.value = target;
      positioned.current = true;
    } else {
      x.value = withTiming(target, { duration: 260, easing: EaseOut });
    }
  }, [state.index, tabWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + TabBarMetrics.bottomGap,
        height: TabBarMetrics.height,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: INSET,
        borderRadius: TabBarMetrics.height / 2,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        shadowColor: '#000',
        shadowOpacity: scheme === 'dark' ? 0.4 : 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      }}>
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: INSET,
              bottom: INSET,
              width: tabWidth,
              borderRadius: (TabBarMetrics.height - INSET * 2) / 2,
              backgroundColor: colors.elevated,
            },
            indicatorStyle,
          ]}
        />
      ) : null}

      {state.routes.map((route, index) => {
        const tab = TABS[route.name] ?? { label: route.name, icon: Library };
        const focused = state.index === index;
        const Icon = tab.icon;
        const color = focused ? colors.ink : colors.inkFaint;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!focused) Haptics.selectionAsync().catch(() => {});
              navigateToTab(route.key);
            }}
            style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Icon size={20} strokeWidth={focused ? 2.25 : 1.9} color={focused ? colors.accent : color} />
            <AppText variant="micro" weight={focused ? 'semibold' : 'medium'} style={{ color }}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
