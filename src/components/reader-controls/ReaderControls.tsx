import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRightToLine,
  Columns2,
  GalleryVertical,
  type LucideIcon,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  RectangleVertical,
  Scan,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
import { Colors } from '@/constants/theme';
import type { PageFit, ReadingDirection, ReadingMode } from '@/types/reading';

const MODE_META: Record<ReadingMode, { label: string; icon: LucideIcon }> = {
  single: { label: 'Single', icon: RectangleVertical },
  double: { label: 'Double', icon: Columns2 },
  vertical: { label: 'Vertical', icon: GalleryVertical },
};

const FIT_META: Record<PageFit, { label: string; icon: LucideIcon }> = {
  width: { label: 'Width', icon: MoveHorizontal },
  height: { label: 'Height', icon: MoveVertical },
  screen: { label: 'Screen', icon: Scan },
  original: { label: 'Original', icon: Maximize2 },
};

const DIRECTION_META: Record<ReadingDirection, { label: string; icon: LucideIcon }> = {
  ltr: { label: 'LTR', icon: ArrowRightToLine },
  rtl: { label: 'RTL', icon: ArrowLeftToLine },
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
  /** Called on any control interaction, so the screen can restart its auto-hide timer. */
  onInteract?: () => void;
}

const c = Colors.dark;
const ENTER = FadeIn.duration(180).easing(EaseOut);
const EXIT = FadeOut.duration(140);

/** Reader chrome. Always dark (it sits on artwork, not app surfaces) and
 * fades in over soft gradients rather than hard-edged bars. */
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
  const withInteract = (fn: () => void) => () => {
    onInteract?.();
    fn();
  };

  return (
    <>
      <Animated.View entering={ENTER} exiting={EXIT} pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
        <LinearGradient
          pointerEvents="box-none"
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
          style={{ paddingTop: insets.top + 8, paddingBottom: 28, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={onBack}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              })}>
              <ArrowLeft size={18} color={c.ink} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="callout" weight="semibold" numberOfLines={1} style={{ color: c.ink }}>
                {title}
              </AppText>
              <AppText variant="caption" style={{ color: c.inkDim }} tabular>
                {pageLabel}
              </AppText>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={ENTER} exiting={EXIT} pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          pointerEvents="box-none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
          style={{ paddingTop: 36, paddingBottom: insets.bottom + 14, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText variant="caption" weight="medium" style={{ color: c.inkDim, minWidth: 24, textAlign: 'right' }} tabular>
              {currentPage + 1}
            </AppText>
            <Slider
              style={{ flex: 1, height: 36 }}
              minimumValue={0}
              maximumValue={Math.max(totalPages - 1, 0)}
              step={1}
              value={currentPage}
              // RTL readers expect page 1 on the right.
              inverted={readingDirection === 'rtl' && readingMode !== 'vertical'}
              onSlidingStart={onInteract}
              onSlidingComplete={(v) => {
                onInteract?.();
                onSeek(Math.round(v));
              }}
              minimumTrackTintColor={c.accent}
              maximumTrackTintColor="rgba(255,255,255,0.25)"
              thumbTintColor="#ffffff"
            />
            <AppText variant="caption" weight="medium" style={{ color: c.inkDim, minWidth: 24 }} tabular>
              {totalPages}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 }}>
            <Chip {...MODE_META[readingMode]} onPress={withInteract(onCycleMode)} />
            {readingMode === 'single' ? <Chip {...FIT_META[pageFit]} onPress={withInteract(onCycleFit)} /> : null}
            {readingMode !== 'vertical' ? <Chip {...DIRECTION_META[readingDirection]} onPress={withInteract(onToggleDirection)} /> : null}
          </View>
        </LinearGradient>
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
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: pressed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
      })}>
      <Icon size={14} color={c.ink} />
      <AppText variant="caption" weight="semibold" style={{ color: c.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}
