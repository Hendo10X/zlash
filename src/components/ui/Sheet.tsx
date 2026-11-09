import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EaseSheet } from '@/constants/motion';
import { useAppTheme } from '@/hooks/use-app-theme';

import { AppText } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

/**
 * The one bottom sheet every modal surface in the app is built from, so all
 * sheets share the same radius, padding, backdrop and motion. Declarative
 * (`visible`) on top of gorhom's imperative present/dismiss. Sized to its
 * content; drag down, tap the backdrop, or press back to close.
 */
export function Sheet({ visible, onClose, title, description, children }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  // Timing instead of the default spring: a long travel distance with any
  // overshoot reads as wobbly. This curve decelerates hard and lands flat.
  const animationConfigs = useBottomSheetTimingConfigs({ duration: 320, easing: EaseSheet });

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: colors.line, width: 36, height: 4 }}>
      <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 16 }}>
        {title ? (
          <View style={{ marginBottom: description ? 4 : 12, paddingHorizontal: 4 }}>
            <AppText variant="headline" className="text-ink">
              {title}
            </AppText>
          </View>
        ) : null}
        {description ? (
          <AppText variant="footnote" className="text-ink-dim" style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            {description}
          </AppText>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
