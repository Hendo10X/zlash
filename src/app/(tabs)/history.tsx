import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComicListItem } from '@/components/comic-cover/ComicListItem';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppText } from '@/components/ui/Text';
import { BottomTabBarHeight } from '@/constants/theme';
import {
  formatRelativeDate,
  getCompleted,
  getCurrentlyReading,
  getRecentlyOpened,
  readingFraction,
} from '@/features/library/selectors';
import { useLibraryStore } from '@/stores/library-store';

export default function HistoryScreen() {
  const comics = useLibraryStore((s) => s.comics);

  const currentlyReading = useMemo(() => getCurrentlyReading(comics), [comics]);
  const recentlyOpened = useMemo(() => getRecentlyOpened(comics), [comics]);
  const completed = useMemo(() => getCompleted(comics), [comics]);

  const hasHistory = recentlyOpened.length > 0;

  return (
    <View className="flex-1 bg-base">
      <StatusBar barStyle="auto" />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pb-4 pt-1">
          <AppText weight="bold" className="text-[30px] tracking-tight text-ink">
            History
          </AppText>
        </View>

        {!hasHistory ? (
          <EmptyState
            icon={Clock}
            title="Nothing read yet"
            message="Comics you open will show up here so you can jump back in."
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: BottomTabBarHeight + 24 }}
            showsVerticalScrollIndicator={false}>
            {currentlyReading.length > 0 ? (
              <View className="mb-6">
                <SectionHeader title="Currently reading" className="mb-1" />
                {currentlyReading.map((comic) => (
                  <ComicListItem
                    key={comic.id}
                    comic={comic}
                    subtitle={`Page ${comic.progress?.currentPage} of ${comic.progress?.totalPages}`}
                    progressLabel={`${Math.round(readingFraction(comic) * 100)}%`}
                  />
                ))}
              </View>
            ) : null}

            <View className="mb-6">
              <SectionHeader title="Recently opened" className="mb-1" />
              {recentlyOpened.map((comic) => (
                <ComicListItem
                  key={comic.id}
                  comic={comic}
                  subtitle={formatRelativeDate(comic.progress?.lastReadAt ?? comic.dateAdded)}
                />
              ))}
            </View>

            {completed.length > 0 ? (
              <View className="mb-6">
                <SectionHeader title="Completed" className="mb-1" />
                {completed.map((comic) => (
                  <ComicListItem
                    key={comic.id}
                    comic={comic}
                    subtitle={formatRelativeDate(comic.progress?.lastReadAt ?? comic.dateAdded)}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
