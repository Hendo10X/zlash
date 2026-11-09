import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { ComicListItem } from '@/components/comic-cover/ComicListItem';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Screen, ScreenHeader, useTabBarClearance } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatRelativeDate, getCompleted, getCurrentlyReading, getRecentlyOpened, readingFraction } from '@/features/library/selectors';
import { useLibraryStore } from '@/stores/library-store';
import type { LibraryComic } from '@/types/comic';

export default function HistoryScreen() {
  const comics = useLibraryStore((s) => s.comics);
  const bottom = useTabBarClearance();

  const currentlyReading = useMemo(() => getCurrentlyReading(comics), [comics]);
  const completed = useMemo(() => getCompleted(comics), [comics]);
  // "Recently opened" minus what's already shown above, so nothing repeats.
  const recentlyOpened = useMemo(() => {
    const shown = new Set([...currentlyReading, ...completed].map((c) => c.id));
    return getRecentlyOpened(comics).filter((c) => !shown.has(c.id));
  }, [comics, currentlyReading, completed]);

  const hasHistory = currentlyReading.length + completed.length + recentlyOpened.length > 0;

  return (
    <Screen>
      <ScreenHeader title="History" />
      {!hasHistory ? (
        <EmptyState icon={Clock} title="Nothing read yet" message="Comics you open will show up here so you can jump back in." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom, gap: 24 }} showsVerticalScrollIndicator={false}>
          <Section title="Continue reading" comics={currentlyReading} progress />
          <Section title="Recently opened" comics={recentlyOpened} />
          <Section title="Completed" comics={completed} />
        </ScrollView>
      )}
    </Screen>
  );
}

function Section({ title, comics, progress = false }: { title: string; comics: LibraryComic[]; progress?: boolean }) {
  if (comics.length === 0) return null;
  return (
    <View>
      <SectionHeader title={title} style={{ marginBottom: 2 }} />
      {comics.map((comic) => (
        <ComicListItem
          key={comic.id}
          comic={comic}
          subtitle={
            progress && comic.progress
              ? `Page ${comic.progress.currentPage + 1} of ${comic.progress.totalPages} · ${formatRelativeDate(comic.progress.lastReadAt ?? comic.dateAdded)}`
              : formatRelativeDate(comic.progress?.lastReadAt ?? comic.dateAdded)
          }
          progressLabel={progress ? `${Math.round(readingFraction(comic) * 100)}%` : undefined}
        />
      ))}
    </View>
  );
}
