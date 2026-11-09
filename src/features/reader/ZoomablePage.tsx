import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MAX_SCALE = 3;

/** Pinch-to-zoom + pan wrapper for a single reader page. Resets to 1x when
 * released below that scale so the horizontal pager can take over again. */
export function ZoomablePage({
  children,
  onSingleTap,
  style: containerStyle,
}: {
  children: ReactNode;
  onSingleTap?: () => void;
  /** Explicit size for the zoom container. Defaults to `flex: 1`, which
   * collapses inside auto-height parents like vertical list cells. */
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : 2;
      scale.value = withTiming(next);
      savedScale.value = next;
      if (next === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const singleTap = Gesture.Tap()
    .maxDuration(200)
    .requireExternalGestureToFail(doubleTap)
    .onEnd(() => {
      if (onSingleTap) runOnJS(onSingleTap)();
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const composed = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[containerStyle ?? { flex: 1 }, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}
