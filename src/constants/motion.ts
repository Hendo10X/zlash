import { Easing } from 'react-native-reanimated';

/** Strong ease-out: quick to respond, gentle to settle. Use for enters,
 * press feedback and anything that follows a touch. */
export const EaseOut = Easing.bezier(0.23, 1, 0.32, 1);

/** iOS-sheet-like curve for things that slide a long way (sheets, drawers). */
export const EaseSheet = Easing.bezier(0.32, 0.72, 0, 1);
