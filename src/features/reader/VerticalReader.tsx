import { type Ref, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, type ListViewToken } from 'react-native';

import type { PageSource } from '@/services/reader/page-source';

import type { ReaderPagerHandle } from './PagedReader';
import { VerticalPage } from './ReaderPage';
import { ZoomablePage } from './ZoomablePage';

interface VerticalReaderProps {
  ref?: Ref<ReaderPagerHandle>;
  source: PageSource;
  width: number;
  initialPage: number;
  onPageChange: (firstPage: number, lastPage: number) => void;
  onTap: () => void;
}

const VIEWABILITY = { viewAreaCoveragePercentThreshold: 40 };
const MAX_SCROLL_RETRIES = 6;

/**
 * Continuous top-to-bottom scrolling (webtoon-style). Page heights aren't
 * known until each page decodes, so there's no `getItemLayout`: jumping to a
 * page uses `scrollToIndex` with the standard estimate-and-retry fallback,
 * and `maintainVisibleContentPosition` stops pages above the viewport from
 * shoving the current page around as they load in at their real height.
 */
export function VerticalReader({ ref, source, width, initialPage, onPageChange, onTap }: VerticalReaderProps) {
  const listRef = useRef<FlatList<number>>(null);
  const pages = useMemo(() => Array.from({ length: source.pageCount }, (_, i) => i), [source.pageCount]);
  // The parent keeps passing the live page as `initialPage`; only the value
  // at mount matters, or every scroll would trigger a jump back.
  const [startPage] = useState(initialPage);
  const firstVisible = useRef(startPage);
  const userScrolled = useRef(false);
  const retries = useRef(0);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    retries.current = 0;
    listRef.current?.scrollToIndex({ index, animated, viewPosition: 0 });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToPage(page) {
        scrollToIndex(page, false);
        onPageChangeRef.current(page, page);
      },
    }),
    [scrollToIndex]
  );

  useEffect(() => {
    if (startPage <= 0) return;
    // Wait a frame so the list has laid out its first batch.
    const handle = requestAnimationFrame(() => scrollToIndex(startPage, false));
    return () => cancelAnimationFrame(handle);
  }, [startPage, scrollToIndex]);

  // FlatList requires this callback's identity to never change.
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const indices = viewableItems.map((v) => v.index).filter((i): i is number => i != null);
    if (indices.length === 0) return;
    const first = Math.min(...indices);
    firstVisible.current = first;
    onPageChangeRef.current(first, Math.max(...indices));
  }, []);

  return (
    <FlatList
      ref={listRef}
      data={pages}
      keyExtractor={(item) => String(item)}
      showsVerticalScrollIndicator={false}
      windowSize={5}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollBeginDrag={() => {
        userScrolled.current = true;
      }}
      // A short final page may never cover enough of the screen to count as
      // "viewable", so treat reaching the bottom as having seen it.
      onEndReachedThreshold={0.05}
      onEndReached={() => {
        if (userScrolled.current) onPageChangeRef.current(firstVisible.current, source.pageCount - 1);
      }}
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
        if (retries.current++ < MAX_SCROLL_RETRIES) {
          setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 }), 60);
        }
      }}
      renderItem={({ item }) => (
        <ZoomablePage onSingleTap={onTap} style={{ width }}>
          <VerticalPage source={source} index={item} width={width} />
        </ZoomablePage>
      )}
    />
  );
}
