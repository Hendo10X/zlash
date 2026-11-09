import type { ReactNode } from 'react';
import { StatusBar, View } from 'react-native';
import { type Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarMetrics } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

import { AppText } from './Text';

/**
 * Root container for every screen. Layout goes through `style`, not
 * `className`: Uniwind only styles React Native's core components, so a
 * `className="flex-1"` on `SafeAreaView` was silently dropped — that's what
 * collapsed the import and settings screens.
 */
export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: Edge[] }) {
  const { scheme, colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Large page title with optional trailing actions, aligned to the content gutter. */
export function ScreenHeader({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 }}>
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <AppText variant="footnote" weight="medium" className="text-ink-dim">
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="display" className="text-ink">
          {title}
        </AppText>
      </View>
      {trailing ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{trailing}</View> : null}
    </View>
  );
}

/** Distance from the bottom of the screen to the top of the floating tab bar. */
export function useTabBarTop() {
  const insets = useSafeAreaInsets();
  return insets.bottom + TabBarMetrics.bottomGap + TabBarMetrics.height;
}

/** Bottom padding so scrollable content clears the floating tab bar. */
export function useTabBarClearance(extra = 24) {
  return useTabBarTop() + extra;
}
