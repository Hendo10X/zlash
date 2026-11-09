import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator } from 'react-native';

import { Colors } from '@/constants/theme';
import { ReaderMessage, ReaderView, useDefaultReaderPreferences, useReaderKeepAwake } from '@/features/reader/ReaderView';
import { usePageSource } from '@/features/reader/use-page-source';
import { useLibraryStore } from '@/stores/library-store';
import type { ReaderPreferences } from '@/types/comic';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comic = useLibraryStore((s) => s.comics.find((c) => c.id === id));
  const updateProgress = useLibraryStore((s) => s.updateProgress);
  const setReaderPreferences = useLibraryStore((s) => s.setReaderPreferences);
  const defaults = useDefaultReaderPreferences();
  const pageSource = usePageSource(comic);
  useReaderKeepAwake();

  const handleProgress = useCallback(
    (first: number, last: number, total: number) => updateProgress(id, first, total, last >= total - 1 ? 'completed' : 'reading'),
    [id, updateProgress]
  );
  const handlePreferences = useCallback((prefs: ReaderPreferences) => setReaderPreferences(id, prefs), [id, setReaderPreferences]);

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
      return (
        <ReaderView
          title={comic.title}
          source={pageSource.source}
          initialPage={comic.progress?.currentPage ?? 0}
          initialPreferences={{
            readingDirection: comic.readingDirection ?? defaults.readingDirection,
            readingMode: comic.readingMode ?? defaults.readingMode,
            pageFit: comic.pageFit ?? defaults.pageFit,
          }}
          onPreferencesChange={handlePreferences}
          onProgress={handleProgress}
        />
      );
  }
}
