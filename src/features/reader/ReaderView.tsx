import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReaderControls } from '@/components/reader-controls/ReaderControls';
import { AppText } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import type { PageSource } from '@/services/reader/page-source';
import { useSettingsStore } from '@/stores/settings-store';
import type { ReaderPreferences } from '@/types/comic';
import type { PageFit, ReadingMode } from '@/types/reading';

import { PagedReader, type ReaderPagerHandle } from './PagedReader';
import { VerticalReader } from './VerticalReader';

const KEEP_AWAKE_TAG = 'zlash-reader';
const PROGRESS_SAVE_DELAY = 600;
const AUTO_HIDE_DELAY = 3200;
const MODE_ORDER: ReadingMode[] = ['single', 'double', 'vertical'];
const FIT_ORDER: PageFit[] = ['width', 'height', 'screen', 'original'];

const cycle = <T,>(order: T[], value: T) => order[(order.indexOf(value) + 1) % order.length];

/** Keeps the screen on while a reader is mounted, if the setting allows. */
export function useReaderKeepAwake() {
  const keepScreenAwake = useSettingsStore((s) => s.keepScreenAwake);
  useEffect(() => {
    if (keepScreenAwake) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [keepScreenAwake]);
}

/** Settings defaults, for comics without their own preferences. */
export function useDefaultReaderPreferences(): ReaderPreferences {
  const readingDirection = useSettingsStore((s) => s.defaultReadingDirection);
  const readingMode = useSettingsStore((s) => s.defaultReadingMode);
  const pageFit = useSettingsStore((s) => s.defaultPageFit);
  return { readingDirection, readingMode, pageFit };
}

export interface ReaderViewProps {
  title: string;
  source: PageSource;
  initialPage: number;
  /** Starting mode/fit/direction (per-comic preference or Settings default). */
  initialPreferences: ReaderPreferences;
  /** Called with the new preferences whenever the reader changes one. */
  onPreferencesChange?: (prefs: ReaderPreferences) => void;
  /** Debounced. `last` is the last page on screen (e.g. right half of a spread). */
  onProgress: (first: number, last: number, totalPages: number) => void;
}

/** The full reading experience over any `PageSource` — library comics and
 * streamed OPDS comics both render through this. */
export function ReaderView({ title, source, initialPage, initialPreferences, onPreferencesChange, onProgress }: ReaderViewProps) {
  const autoHideControls = useSettingsStore((s) => s.autoHideControls);

  const { width, height } = useWindowDimensions();
  const pagerRef = useRef<ReaderPagerHandle>(null);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ timer: ReturnType<typeof setTimeout>; run: () => void } | null>(null);

  const totalPages = source.pageCount;
  const [direction, setDirection] = useState(initialPreferences.readingDirection);
  const [mode, setMode] = useState(initialPreferences.readingMode);
  const [fit, setFit] = useState(initialPreferences.pageFit);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [visible, setVisible] = useState(() => {
    const page = Math.min(Math.max(initialPage, 0), totalPages - 1);
    return { first: page, last: page };
  });

  const scheduleAutoHide = useCallback(() => {
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    if (!autoHideControls) return;
    autoHideTimer.current = setTimeout(() => setControlsVisible(false), AUTO_HIDE_DELAY);
  }, [autoHideControls]);

  useEffect(() => {
    scheduleAutoHide();
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, [scheduleAutoHide]);

  // Flush any debounced progress save when leaving the reader.
  useEffect(
    () => () => {
      if (pendingSave.current) {
        clearTimeout(pendingSave.current.timer);
        pendingSave.current.run();
      }
    },
    []
  );

  const handlePageChange = useCallback(
    (first: number, last: number) => {
      setVisible((prev) => (prev.first === first && prev.last === last ? prev : { first, last }));

      // Progress stores the first page on screen (so resuming in any mode
      // shows it), but the comic counts as finished once the last page has
      // been on screen — e.g. as the right half of the final spread.
      const run = () => {
        pendingSave.current = null;
        onProgress(first, last, totalPages);
      };
      if (pendingSave.current) clearTimeout(pendingSave.current.timer);
      pendingSave.current = { timer: setTimeout(run, PROGRESS_SAVE_DELAY), run };
    },
    [totalPages, onProgress]
  );

  const handleToggleControls = useCallback(() => {
    setControlsVisible((v) => {
      const next = !v;
      if (next) scheduleAutoHide();
      return next;
    });
  }, [scheduleAutoHide]);

  const viewport = { width, height };
  const pageLabel =
    visible.last > visible.first
      ? `Pages ${visible.first + 1}–${visible.last + 1} of ${totalPages}`
      : `Page ${visible.first + 1} of ${totalPages}`;

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden={!controlsVisible} barStyle="light-content" />

      {mode === 'vertical' ? (
        <VerticalReader
          // Re-mount (and re-open at the current page) when the width changes,
          // since every page's height is derived from it.
          key={`vertical-${width}`}
          ref={pagerRef}
          source={source}
          width={width}
          initialPage={visible.first}
          onPageChange={handlePageChange}
          onTap={handleToggleControls}
        />
      ) : (
        <PagedReader
          // Re-mount on mode or size change: page offsets are multiples of
          // the viewport width, and single/double index different item lists.
          key={`${mode}-${width}x${height}`}
          ref={pagerRef}
          source={source}
          mode={mode}
          fit={fit}
          direction={direction}
          viewport={viewport}
          initialPage={visible.first}
          onPageChange={handlePageChange}
          onTap={handleToggleControls}
        />
      )}

      {controlsVisible ? (
        <ReaderControls
          title={title}
          pageLabel={pageLabel}
          currentPage={visible.first}
          totalPages={totalPages}
          onBack={() => router.back()}
          onSeek={(page) => pagerRef.current?.scrollToPage(page)}
          readingDirection={direction}
          onToggleDirection={() => {
            const next = direction === 'ltr' ? 'rtl' : 'ltr';
            setDirection(next);
            onPreferencesChange?.({ readingDirection: next, readingMode: mode, pageFit: fit });
          }}
          readingMode={mode}
          onCycleMode={() => {
            const next = cycle(MODE_ORDER, mode);
            setMode(next);
            onPreferencesChange?.({ readingDirection: direction, readingMode: next, pageFit: fit });
          }}
          pageFit={fit}
          onCycleFit={() => {
            const next = cycle(FIT_ORDER, fit);
            setFit(next);
            onPreferencesChange?.({ readingDirection: direction, readingMode: mode, pageFit: next });
          }}
          onInteract={scheduleAutoHide}
        />
      ) : null}
    </View>
  );
}

/** Full-screen dark state for loading / not-found / can't-render, with a
 * way back out (the normal controls need an open page source). */
export function ReaderMessage({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70">
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <AppText variant="callout" weight="semibold" numberOfLines={1} style={{ flex: 1, color: colors.ink }}>
          {title}
        </AppText>
      </View>
      <View className="flex-1 items-center justify-center gap-3 px-10">
        {children}
        {message ? (
          <AppText variant="callout" style={{ color: colors.inkDim, textAlign: 'center' }}>
            {message}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
