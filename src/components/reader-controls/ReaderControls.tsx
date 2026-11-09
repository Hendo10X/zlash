import Slider from '@react-native-community/slider';
import {
  ArrowLeft,
  ArrowLeftRight,
  Columns2,
  GalleryVertical,
  type LucideIcon,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  RectangleVertical,
  Scan,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import type { PageFit, ReadingDirection, ReadingMode } from '@/types/reading';

const MODE_META: Record<ReadingMode, { label: string; icon: LucideIcon }> = {
  single: { label: 'Single', icon: RectangleVertical },
  double: { label: 'Double', icon: Columns2 },
  vertical: { label: 'Vertical', icon: GalleryVertical },
};

const FIT_META: Record<PageFit, { label: string; icon: LucideIcon }> = {
  width: { label: 'Fit width', icon: MoveHorizontal },
  height: { label: 'Fit height', icon: MoveVertical },
  screen: { label: 'Fit screen', icon: Scan },
  original: { label: 'Original', icon: Maximize2 },
};

interface ReaderControlsProps {
  title: string;
  /** e.g. "Page 4 of 22" or "Pages 4–5 of 22". */
  pageLabel: string;
  currentPage: number;
  totalPages: number;
  onBack: () => void;
  onSeek: (page: number) => void;
  readingDirection: ReadingDirection;
  onToggleDirection: () => void;
  readingMode: ReadingMode;
  onCycleMode: () => void;
  pageFit: PageFit;
  onCycleFit: () => void;
  /** Called on any control interaction, so the screen can restart its
   * auto-hide timer. */
  onInteract?: () => void;
}

/** Top/bottom chrome shown over the reader while controls are visible.
 * Always renders against the dark palette regardless of app theme, since
 * it sits on top of comic artwork rather than app surfaces. */
export function ReaderControls({
  title,
  pageLabel,
  currentPage,
  totalPages,
  onBack,
  onSeek,
  readingDirection,
  onToggleDirection,
  readingMode,
  onCycleMode,
  pageFit,
  onCycleFit,
  onInteract,
}: ReaderControlsProps) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const withInteract = (fn: () => void) => () => {
    onInteract?.();
    fn();
  };

  // Fit only applies to single-page mode: double always contains both pages,
  // vertical is always full-width. Direction is meaningless in vertical.
  const showFit = readingMode === 'single';
  const showDirection = readingMode !== 'vertical';

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(160)}
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 bg-overlay"
        style={{ paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 16 }}>
        <View className="flex-row items-center gap-3">
          <IconCircle onPress={onBack}>
            <ArrowLeft size={18} color={colors.ink} />
          </IconCircle>
          <View className="flex-1">
            <AppText weight="medium" numberOfLines={1} style={{ fontSize: 14, color: colors.ink }}>
              {title}
            </AppText>
            <AppText style={{ fontSize: 12, color: colors.inkDim }}>{pageLabel}</AppText>
          </View>
          {showDirection ? (
            <IconCircle onPress={withInteract(onToggleDirection)}>
              <ArrowLeftRight size={16} color={colors.ink} />
              <AppText weight="semibold" style={{ fontSize: 9, color: colors.inkDim, marginTop: -1 }}>
                {readingDirection.toUpperCase()}
              </AppText>
            </IconCircle>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(160)}
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 bg-overlay"
        style={{ paddingBottom: insets.bottom + 10, paddingTop: 10, paddingHorizontal: 20 }}>
        <Slider
          minimumValue={0}
          maximumValue={Math.max(totalPages - 1, 0)}
          step={1}
          value={currentPage}
          onSlidingStart={onInteract}
          onSlidingComplete={(v) => {
            onInteract?.();
            onSeek(Math.round(v));
          }}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.ink}
        />
        <View className="mt-2 flex-row justify-center gap-2">
          <Chip {...MODE_META[readingMode]} onPress={withInteract(onCycleMode)} />
          {showFit ? <Chip {...FIT_META[pageFit]} onPress={withInteract(onCycleFit)} /> : null}
        </View>
      </Animated.View>
    </>
  );
}

function Chip({ label, icon: Icon, onPress }: { label: string; icon: LucideIcon; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 active:opacity-70">
      <Icon size={14} color={Colors.dark.ink} />
      <AppText weight="medium" style={{ fontSize: 12, color: Colors.dark.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function IconCircle({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
      style={{ minWidth: 36 }}>
      {children}
    </Pressable>
  );
}
