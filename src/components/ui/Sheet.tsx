import { type ReactNode, useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EaseOut, EaseSheet } from '@/constants/motion';
import { useAppTheme } from '@/hooks/use-app-theme';

import { AppText } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** `auto` sizes to content; `half` opens at least half the screen tall. */
  size?: 'auto' | 'half';
  /** Wrap the body in a ScrollView, for content that can outgrow the screen. */
  scroll?: boolean;
  /** Set false while work is running so the sheet can't be swiped away. */
  dismissible?: boolean;
}

const ENTER_MS = 320;
const EXIT_MS = 220;

/**
 * The one bottom sheet every modal surface in the app is built from.
 *
 * Built on React Native's own `Modal` plus Reanimated, rather than a sheet
 * library: every touch inside it is a plain RN touch, so buttons and rows
 * always respond (the previous portal-based sheet dropped taps on some
 * Android builds). Drag the handle/header down, tap the backdrop, or press
 * back to close.
 */
export function Sheet({
  visible,
  onClose,
  title,
  description,
  children,
  size = 'auto',
  scroll = false,
  dismissible = true,
}: SheetProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const offset = useSharedValue(screenHeight);
  const fade = useSharedValue(0);

  // Mount as soon as it opens (adjusting state during render, per React's
  // guidance); on close, animate out first, then unmount.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      offset.value = withTiming(0, { duration: ENTER_MS, easing: EaseSheet });
      fade.value = withTiming(1, { duration: ENTER_MS, easing: EaseOut });
    } else {
      fade.value = withTiming(0, { duration: EXIT_MS, easing: EaseOut });
      offset.value = withTiming(screenHeight, { duration: EXIT_MS, easing: EaseOut }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, screenHeight, offset, fade]);

  // Lift the sheet above the keyboard (Modal windows don't get adjustResize).
  useEffect(() => {
    if (!mounted) return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [mounted]);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  const drag = Gesture.Pan()
    .enabled(dismissible)
    .activeOffsetY(8)
    .onUpdate((e) => {
      // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
      offset.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        runOnJS(onClose)();
      } else {
        // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
        offset.value = withTiming(0, { duration: 200, easing: EaseOut });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value * 0.5 }));

  if (!mounted) return null;

  const body = <View style={{ paddingHorizontal: 20 }}>{children}</View>;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={requestClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={requestClose} accessibilityLabel="Close" />
        </Animated.View>

        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: keyboardHeight }} pointerEvents="box-none">
          <Animated.View
            style={[
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: screenHeight - insets.top - 24 - keyboardHeight,
                minHeight: size === 'half' ? Math.min(screenHeight * 0.5, screenHeight - insets.top - 24) : undefined,
                paddingBottom: (keyboardHeight > 0 ? 12 : insets.bottom) + 16,
              },
              sheetStyle,
            ]}>
            <GestureDetector gesture={drag}>
              <View collapsable={false} style={{ paddingHorizontal: 20 }}>
                <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 14 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
                </View>
                {title ? (
                  <AppText variant="headline" className="text-ink" style={{ marginBottom: description ? 4 : 12, paddingHorizontal: 4 }}>
                    {title}
                  </AppText>
                ) : null}
                {description ? (
                  <AppText variant="footnote" className="text-ink-dim" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
                    {description}
                  </AppText>
                ) : null}
              </View>
            </GestureDetector>

            {scroll ? (
              <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {body}
              </ScrollView>
            ) : (
              <View style={{ flexShrink: 1 }}>{body}</View>
            )}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
