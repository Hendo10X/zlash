import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Shared "press down slightly" feedback used by every tappable surface —
 * keeps the feel consistent and the Reanimated shared-value mutation
 * (which intentionally escapes React's render cycle) in one place.
 *
 * Fast in, slightly slower out, ease-out both ways: the press should feel
 * like it responds instantly and settles, never like it bounces.
 */
export function usePressScale(pressedScale = 0.97) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
    scale.value = withTiming(pressedScale, { duration: 90, easing: EASE_OUT });
  };
  const onPressOut = () => {
    // eslint-disable-next-line react-hooks/immutability -- intentional Reanimated shared-value mutation
    scale.value = withTiming(1, { duration: 180, easing: EASE_OUT });
  };

  return { style, onPressIn, onPressOut };
}
