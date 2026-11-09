import { type Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, View } from 'react-native';

import type { PageSource } from '@/services/reader/page-source';
import type { PageFit, ReadingDirection } from '@/types/reading';

import { pagesInSpread, spreadCount, spreadForPage } from './layout';
import { SinglePage, SpreadPage } from './ReaderPage';
import { ZoomablePage } from './ZoomablePage';

export interface ReaderPagerHandle {
  scrollToPage(page: number): void;
}

interface PagedReaderProps {
  ref?: Ref<ReaderPagerHandle>;
  source: PageSource;
  mode: 'single' | 'double';
  fit: PageFit;
  direction: ReadingDirection;
  viewport: { width: number; height: number };
  /** Real page index to open at. Only read on mount — the parent re-keys
   * this component on mode/size changes to re-open at the current page. */
  initialPage: number;
  /** First and last page index now on screen (equal in single mode). */
  onPageChange: (firstPage: number, lastPage: number) => void;
  onTap: () => void;
}

/** Horizontal swipe pager for single-page and double-page (spread) modes. */
export function PagedReader({
  ref,
  source,
  mode,
  fit,
  direction,
  viewport,
  initialPage,
  onPageChange,
  onTap,
}: PagedReaderProps) {
  const listRef = useRef<FlatList<number>>(null);
  const { width } = viewport;

  const itemCount = mode === 'single' ? source.pageCount : spreadCount(source.pageCount);
  const items = useMemo(() => Array.from({ length: itemCount }, (_, i) => i), [itemCount]);
  const itemForPage = useCallback((page: number) => (mode === 'single' ? page : spreadForPage(page)), [mode]);
  const pagesForItem = useCallback(
    (item: number) => (mode === 'single' ? [item] : pagesInSpread(item, source.pageCount)),
    [mode, source.pageCount]
  );

  const reportItem = useCallback(
    (item: number) => {
      const pages = pagesForItem(item);
      if (pages.length > 0) onPageChange(pages[0], pages[pages.length - 1]);
    },
    [pagesForItem, onPageChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToPage(page) {
        const item = itemForPage(page);
        listRef.current?.scrollToOffset({ offset: item * width, animated: true });
        // Programmatic scrolls don't reliably fire onMomentumScrollEnd on
        // Android, so report the new position directly.
        reportItem(item);
      },
    }),
    [itemForPage, width, reportItem]
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const item = Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.x / width), 0), itemCount - 1);
      reportItem(item);
    },
    [width, itemCount, reportItem]
  );

  // Flipping the whole pager (and un-flipping each page's content) reverses
  // which way a swipe advances the comic without touching page indices.
  // Spreads additionally swap their two pages for RTL (see SpreadPage).
  const flip = direction === 'rtl' ? { transform: [{ scaleX: -1 as const }] } : undefined;

  return (
    <FlatList
      ref={listRef}
      data={items}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={Math.min(itemForPage(initialPage), Math.max(itemCount - 1, 0))}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      keyExtractor={(item) => String(item)}
      onMomentumScrollEnd={handleMomentumEnd}
      // Render the visible page plus one neighbour either side: this is also
      // what prefetches (decodes) the next page before it's swiped to.
      windowSize={3}
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      style={flip}
      renderItem={({ item }) => (
        <View style={flip}>
          <ZoomablePage onSingleTap={onTap} style={viewport}>
            {mode === 'single' ? (
              <SinglePage source={source} index={item} viewport={viewport} fit={fit} />
            ) : (
              <SpreadPage source={source} spread={item} viewport={viewport} direction={direction} />
            )}
          </ZoomablePage>
        </View>
      )}
    />
  );
}
