import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReaderControls } from '@/components/reader-controls/ReaderControls';
import { AppText } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import { PagedReader, type ReaderPagerHandle } from '@/features/reader/PagedReader';
import { usePageSource } from '@/features/reader/use-page-source';
import { VerticalReader } from '@/features/reader/VerticalReader';
import type { PageSource } from '@/services/reader/page-source';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { LibraryComic } from '@/types/comic';
import type { PageFit, ReadingMode } from '@/types/reading';

const KEEP_AWAKE_TAG = 'zlash-reader';
const PROGRESS_SAVE_DELAY = 600;
const AUTO_HIDE_DELAY = 3200;
const MODE_ORDER: ReadingMode[] = ['single', 'double', 'vertical'];
const FIT_ORDER: PageFit[] = ['width', 'height', 'screen', 'original'];

const cycle = <T,>(order: T[], value: T) => order[(order.indexOf(value) + 1) % order.length];

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comic = useLibraryStore((s) => s.comics.find((c) => c.id === id));
  const keepScreenAwake = useSettingsStore((s) => s.keepScreenAwake);
  const pageSource = usePageSource(comic);

  useEffect(() => {
    if (keepScreenAwake) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [keepScreenAwake]);

  if (!comic) {
    return <ReaderMessage title="Comic not found." />;
  }

  switch (pageSource.status) {
    case 'loading':
      return (
        <ReaderMessage title={comic.title}>
          <ActivityIndicator color={Colors.dark.inkFaint} />
        </ReaderMessage>
      );
    case 'unsupported':
    case 'error':
      return <ReaderMessage title={comic.title} message={pageSource.message} />;
    case 'ready':
      return <Reader comic={comic} source={pageSource.source} />;
  }
}

function Reader({ comic, source }: { comic: LibraryComic; source: PageSource }) {
  const updateProgress = useLibraryStore((s) => s.updateProgress);
  const defaultReadingDirection = useSettingsStore((s) => s.defaultReadingDirection);
  const defaultReadingMode = useSettingsStore((s) => s.defaultReadingMode);
  const defaultPageFit = useSettingsStore((s) => s.defaultPageFit);
  const autoHideControls = useSettingsStore((s) => s.autoHideControls);

  const { width, height } = useWindowDimensions();
  const pagerRef = useRef<ReaderPagerHandle>(null);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ timer: ReturnType<typeof setTimeout>; run: () => void } | null>(null);

  const totalPages = source.pageCount;
  const [direction, setDirection] = useState(defaultReadingDirection);
  const [mode, setMode] = useState(defaultReadingMode);
  const [fit, setFit] = useState(defaultPageFit);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [visible, setVisible] = useState(() => {
    const page = Math.min(Math.max(comic.progress?.currentPage ?? 0, 0), totalPages - 1);
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

  const comicId = comic.id;
  const handlePageChange = useCallback(
    (first: number, last: number) => {
      setVisible((prev) => (prev.first === first && prev.last === last ? prev : { first, last }));

      // Progress stores the first page on screen (so resuming in any mode
      // shows it), but the comic counts as finished once the last page has
      // been on screen — e.g. as the right half of the final spread.
      const run = () => {
        pendingSave.current = null;
        updateProgress(comicId, first, totalPages, last >= totalPages - 1 ? 'completed' : 'reading');
      };
      if (pendingSave.current) clearTimeout(pendingSave.current.timer);
      pendingSave.current = { timer: setTimeout(run, PROGRESS_SAVE_DELAY), run };
    },
    [comicId, totalPages, updateProgress]
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
          title={comic.title}
          pageLabel={pageLabel}
          currentPage={visible.first}
          totalPages={totalPages}
          onBack={() => router.back()}
          onSeek={(page) => pagerRef.current?.scrollToPage(page)}
          readingDirection={direction}
          onToggleDirection={() => setDirection((d) => (d === 'ltr' ? 'rtl' : 'ltr'))}
          readingMode={mode}
          onCycleMode={() => setMode((m) => cycle(MODE_ORDER, m))}
          pageFit={fit}
          onCycleFit={() => setFit((f) => cycle(FIT_ORDER, f))}
          onInteract={scheduleAutoHide}
        />
      ) : null}
    </View>
  );
}

/** Full-screen dark state for loading / not-found / can't-render, with a
 * way back out (the normal controls need an open page source). */
function ReaderMessage({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
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
