import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Shared "press down slightly" animation used by every tappable surface in
 * the app (grid items, buttons, icon buttons, tab bar items) — keeps that
 * feel consistent and keeps the Reanimated shared-value mutation (which
 * intentionally escapes React's render cycle, so ESLint's react-compiler
 * integration can't verify it) confined to one place instead of repeated
 * per component.
 */
export function usePressScale(pressedScale = 0.96) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
    scale.value = withTiming(pressedScale, { duration: 100 });
  };
  const onPressOut = () => {
    // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
    scale.value = withTiming(1, { duration: 150 });
  };

  return { style, onPressIn, onPressOut };
}
