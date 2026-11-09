import { router } from 'expo-router';
import { BookOpen, Grid2x2, List, Plus, Search } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Platform, StatusBar, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComicGridItem } from '@/components/comic-cover/ComicGridItem';
import { ComicListItem } from '@/components/comic-cover/ComicListItem';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SearchField } from '@/components/ui/SearchField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppText } from '@/components/ui/Text';
import { formatPageCount, formatRelativeDate, filterComics, getCurrentlyReading, readingFraction, sortComics } from '@/features/library/selectors';
import { BottomTabBarHeight } from '@/constants/theme';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { LibrarySortKey } from '@/types/reading';

const SORT_OPTIONS: { key: LibrarySortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'title', label: 'Title' },
  { key: 'dateAdded', label: 'Date added' },
  { key: 'progress', label: 'Progress' },
];

function useColumnCount(width: number) {
  if (width >= 640) return 4;
  if (width >= 420) return 3;
  return 2;
}

export default function LibraryScreen() {
  const comics = useLibraryStore((s) => s.comics);
  const isLoading = useLibraryStore((s) => s.isLoading);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const sortKey = useLibraryStore((s) => s.sortKey);
  const setSortKey = useLibraryStore((s) => s.setSortKey);
  const viewMode = useSettingsStore((s) => s.libraryViewMode);
  const setViewMode = useSettingsStore((s) => s.setLibraryViewMode);

  const [searchOpen, setSearchOpen] = useState(false);
  const { width } = useWindowDimensions();
  const columns = useColumnCount(width);

  const visibleComics = useMemo(
    () => sortComics(filterComics(comics, searchQuery), sortKey),
    [comics, searchQuery, sortKey]
  );
  const currentlyReading = useMemo(() => getCurrentlyReading(comics), [comics]);

  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex((o) => o.key === sortKey);
    setSortKey(SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].key);
  };

  return (
    <View className="flex-1 bg-base">
      <StatusBar barStyle="auto" />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <AppText weight="bold" className="text-[20px] tracking-tight text-ink">
            Zlash
          </AppText>
          <IconButton icon={Search} variant="ghost" onPress={() => setSearchOpen((v) => !v)} />
        </View>

        {searchOpen ? (
          <SearchField value={searchQuery} onChangeText={setSearchQuery} onClose={() => setSearchOpen(false)} />
        ) : null}

        <FlatList
          data={visibleComics}
          key={viewMode === 'grid' ? `grid-${columns}` : 'list'}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? columns : 1}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: BottomTabBarHeight + (Platform.OS === 'ios' ? 24 : 16),
          }}
          columnWrapperStyle={viewMode === 'grid' ? { gap: 14 } : undefined}
          ListHeaderComponent={
            <View className="mb-5">
              <View className="mb-1 flex-row items-end justify-between">
                <AppText weight="bold" className="text-[30px] tracking-tight text-ink">
                  Library
                </AppText>
                <AppText className="mb-1.5 text-[13px] text-ink-dim">
                  {comics.length} comic{comics.length === 1 ? '' : 's'}
                </AppText>
              </View>

              {currentlyReading.length > 0 ? (
                <View className="mt-5">
                  <SectionHeader title="Continue reading" className="mb-3" />
                  <FlatList
                    data={currentlyReading}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                    renderItem={({ item }) => (
                      <View style={{ width: 128 }}>
                        <ComicGridItem comic={item} />
                        <AppText className="mt-1.5 text-[11px] text-ink-dim">
                          {formatRelativeDate(item.progress?.lastReadAt ?? item.dateAdded)}
                        </AppText>
                      </View>
                    )}
                  />
                </View>
              ) : null}

              <View className="mb-3 mt-6 flex-row items-center justify-between">
                <SectionHeader title="All comics" />
                <View className="flex-row items-center gap-2">
                  <Button label={SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Sort'} variant="ghost" onPress={cycleSort} />
                  <IconButton
                    size={34}
                    icon={viewMode === 'grid' ? List : Grid2x2}
                    variant="surface"
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  />
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoading ? undefined : (
              <EmptyState
                icon={BookOpen}
                title={searchQuery ? 'No matches' : 'Your library is empty'}
                message={
                  searchQuery
                    ? 'Try a different title or series name.'
                    : 'Import your existing CBZ, CBR, or PDF comics to start reading.'
                }
                actionLabel={searchQuery ? undefined : 'Import comics'}
                onAction={searchQuery ? undefined : () => router.push('/import')}
              />
            )
          }
          renderItem={({ item }) =>
            viewMode === 'grid' ? (
              <GridCell>
                <ComicGridItem comic={item} />
              </GridCell>
            ) : (
              <ComicListItem
                comic={item}
                subtitle={item.series ? `${item.series} ${item.issueNumber ?? ''}`.trim() : formatPageCount(item.pageCount)}
                progressLabel={
                  item.progress
                    ? item.progress.status === 'completed'
                      ? 'Completed'
                      : `${Math.round(readingFraction(item) * 100)}%`
                    : undefined
                }
              />
            )
          }
        />
      </SafeAreaView>

      <View className="absolute" style={{ right: 20, bottom: BottomTabBarHeight + 14 }}>
        <IconButton size={52} icon={Plus} variant="accent" onPress={() => router.push('/import')} />
      </View>
    </View>
  );
}

function GridCell({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, marginBottom: 20 }}>{children}</View>;
}
