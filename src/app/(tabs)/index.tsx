import { router } from 'expo-router';
import { ArrowDownUp, BookOpen, ChevronDown, Grid2x2, List, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';

import { ComicGridItem } from '@/components/comic-cover/ComicGridItem';
import { ComicListItem } from '@/components/comic-cover/ComicListItem';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen, ScreenHeader, useTabBarClearance, useTabBarTop } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { type SelectOption, SelectSheet } from '@/components/ui/SelectSheet';
import { AppText } from '@/components/ui/Text';
import {
  filterComics,
  formatPageCount,
  formatRelativeDate,
  getCurrentlyReading,
  readingFraction,
  sortComics,
} from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { LibrarySortKey } from '@/types/reading';

const SORT_OPTIONS: SelectOption<LibrarySortKey>[] = [
  { value: 'recent', label: 'Recently read' },
  { value: 'title', label: 'Title' },
  { value: 'dateAdded', label: 'Date added' },
  { value: 'progress', label: 'Progress' },
];

const GUTTER = 20;
const GAP = 14;
const FAB_SIZE = 56;

function columnCount(width: number) {
  if (width >= 640) return 4;
  if (width >= 420) return 3;
  return 2;
}

export default function LibraryScreen() {
  const { colors } = useAppTheme();
  const comics = useLibraryStore((s) => s.comics);
  const isLoading = useLibraryStore((s) => s.isLoading);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const sortKey = useLibraryStore((s) => s.sortKey);
  const setSortKey = useLibraryStore((s) => s.setSortKey);
  const viewMode = useSettingsStore((s) => s.libraryViewMode);
  const setViewMode = useSettingsStore((s) => s.setLibraryViewMode);

  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { width } = useWindowDimensions();
  const columns = columnCount(width);
  const cellWidth = (width - GUTTER * 2 - GAP * (columns - 1)) / columns;
  const tabBarTop = useTabBarTop();
  const bottomPadding = useTabBarClearance(FAB_SIZE + 32);

  const visibleComics = useMemo(() => sortComics(filterComics(comics, searchQuery), sortKey), [comics, searchQuery, sortKey]);
  const currentlyReading = useMemo(() => getCurrentlyReading(comics), [comics]);
  const isGrid = viewMode === 'grid';
  const hasComics = comics.length > 0;

  const header = (
    <View style={{ paddingBottom: 12 }}>
      {currentlyReading.length > 0 && !searchQuery ? (
        <View style={{ marginBottom: 24 }}>
          <SectionHeader title="Continue reading" style={{ paddingHorizontal: GUTTER, marginBottom: 10 }} />
          <FlatList
            data={currentlyReading}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}
            renderItem={({ item }) => (
              <View style={{ width: 120 }}>
                <ComicGridItem
                  comic={item}
                  caption={`${Math.round(readingFraction(item) * 100)}% · ${formatRelativeDate(item.progress?.lastReadAt ?? item.dateAdded)}`}
                />
              </View>
            )}
          />
        </View>
      ) : null}

      {hasComics ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER }}>
          <Pressable
            onPress={() => setSortOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Sort comics"
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 34,
              paddingHorizontal: 12,
              borderRadius: 17,
              backgroundColor: pressed ? colors.elevated : colors.surface,
            })}>
            <ArrowDownUp size={14} color={colors.inkDim} />
            <AppText variant="footnote" weight="medium" className="text-ink">
              {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
            </AppText>
            <ChevronDown size={14} color={colors.inkFaint} />
          </Pressable>
          <AppText variant="footnote" className="text-ink-faint" tabular>
            {visibleComics.length} {visibleComics.length === 1 ? 'comic' : 'comics'}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <ScreenHeader
        title="Library"
        trailing={
          hasComics ? (
            <>
              <IconButton icon={Search} variant="surface" accessibilityLabel="Search" onPress={() => setSearchOpen((v) => !v)} />
              <IconButton
                icon={isGrid ? List : Grid2x2}
                variant="surface"
                accessibilityLabel={isGrid ? 'Show as list' : 'Show as grid'}
                onPress={() => setViewMode(isGrid ? 'list' : 'grid')}
              />
            </>
          ) : null
        }
      />

      {searchOpen ? <SearchField value={searchQuery} onChangeText={setSearchQuery} onClose={() => setSearchOpen(false)} /> : null}

      <FlatList
        data={visibleComics}
        key={isGrid ? `grid-${columns}` : 'list'}
        keyExtractor={(item) => item.id}
        numColumns={isGrid ? columns : 1}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
        columnWrapperStyle={isGrid ? { gap: GAP, paddingHorizontal: GUTTER } : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? undefined : (
            <EmptyState
              icon={searchQuery ? Search : BookOpen}
              title={searchQuery ? 'No matches' : 'Your library is empty'}
              message={
                searchQuery ? 'Try a different title or series name.' : 'Import CBZ, CBR or PDF comics from your device to start reading.'
              }
              actionLabel={searchQuery ? undefined : 'Import comics'}
              onAction={searchQuery ? undefined : () => router.push('/import')}
            />
          )
        }
        renderItem={({ item }) =>
          isGrid ? (
            <View style={{ width: cellWidth, marginBottom: 22 }}>
              <ComicGridItem comic={item} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: GUTTER }}>
              <ComicListItem
                comic={item}
                subtitle={item.series ? `${item.series} ${item.issueNumber ?? ''}`.trim() : formatPageCount(item.pageCount)}
                progressLabel={
                  item.progress && item.progress.currentPage > 0
                    ? item.progress.status === 'completed'
                      ? 'Done'
                      : `${Math.round(readingFraction(item) * 100)}%`
                    : undefined
                }
              />
            </View>
          )
        }
      />

      {hasComics ? (
        <IconButton
          size={FAB_SIZE}
          icon={Plus}
          variant="accent"
          accessibilityLabel="Import comics"
          onPress={() => router.push('/import')}
          // Sits a clear 16pt above the floating tab bar, never touching it.
          style={{
            position: 'absolute',
            right: GUTTER,
            bottom: tabBarTop + 16,
            shadowColor: colors.accent,
            shadowOpacity: 0.35,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        />
      ) : null}

      <SelectSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Sort by"
        options={SORT_OPTIONS}
        value={sortKey}
        onChange={setSortKey}
      />
    </Screen>
  );
}
