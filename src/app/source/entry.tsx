import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, Check, Download, Play } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { downloadableAcquisition, downloadToLibrary } from '@/features/browse/download';
import { RemoteCover } from '@/features/browse/RemoteCover';
import { useAppTheme } from '@/hooks/use-app-theme';
import { credentialsFor, useSourcesStore, useStreamProgressStore } from '@/stores/sources-store';

type DownloadState = { status: 'idle' } | { status: 'working' } | { status: 'done'; comicId?: string; message: string } | { status: 'error'; message: string };

/** A comic on an OPDS server: read it online, or download it to the library. */
export default function SourceEntryScreen() {
  const { sourceId, key } = useLocalSearchParams<{ sourceId: string; key: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const source = useSourcesStore((s) => s.sources.find((x) => x.id === sourceId));
  const entry = useSourcesStore((s) => s.entries[key]);
  const progress = useStreamProgressStore((s) => (entry?.stream ? s.progress[entry.stream.template] : undefined));
  const creds = credentialsFor(source);
  const [download, setDownload] = useState<DownloadState>({ status: 'idle' });

  if (!entry || !source) {
    return (
      <Screen>
        <EmptyState icon={BookOpen} title="Comic not available" message="Go back and open it from the catalog again." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const acquisition = downloadableAcquisition(entry);
  const started = progress && progress.page > 0;

  const startDownload = async () => {
    setDownload({ status: 'working' });
    const result = await downloadToLibrary(entry, creds);
    switch (result.status) {
      case 'success':
        setDownload({ status: 'done', comicId: result.comic.id, message: 'Added to your library.' });
        break;
      case 'duplicate':
        setDownload({ status: 'done', comicId: result.existing.id, message: `Already in your library as “${result.existing.title}”.` });
        break;
      case 'unsupported':
        setDownload({ status: 'error', message: 'This server only offers a format Zlash can’t import.' });
        break;
      case 'error':
        setDownload({ status: 'error', message: result.message });
        break;
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: 160 }}>
            <RemoteCover uri={entry.cover ?? entry.thumbnail} creds={creds} radius={14} />
          </View>
          <AppText variant="title" className="text-ink" style={{ marginTop: 20, textAlign: 'center' }}>
            {entry.title}
          </AppText>
          {entry.author ? (
            <AppText variant="callout" className="text-ink-dim" style={{ marginTop: 2, textAlign: 'center' }}>
              {entry.author}
            </AppText>
          ) : null}
          <AppText variant="footnote" className="text-ink-faint" style={{ marginTop: 6 }} tabular>
            {[source.name, entry.stream ? `${entry.stream.count} pages` : null].filter(Boolean).join('  ·  ')}
          </AppText>
        </View>

        <View style={{ gap: 10, marginTop: 24 }}>
          {entry.stream ? (
            <Button
              label={started ? `Continue online · page ${progress!.page + 1}` : 'Read online'}
              icon={Play}
              variant="accent"
              size="lg"
              block
              onPress={() => router.push({ pathname: '/stream', params: { sourceId, key } })}
            />
          ) : null}

          {acquisition ? (
            download.status === 'done' ? (
              <Button
                label="Open in library"
                icon={Check}
                variant="secondary"
                size="lg"
                block
                onPress={() => (download.comicId ? router.push(`/comic/${download.comicId}`) : undefined)}
              />
            ) : (
              <Button
                label={download.status === 'working' ? 'Downloading…' : `Download to library (${acquisition.format.toUpperCase()})`}
                icon={Download}
                variant={entry.stream ? 'secondary' : 'accent'}
                size="lg"
                block
                disabled={download.status === 'working'}
                onPress={startDownload}
              />
            )
          ) : null}

          {download.status === 'done' || download.status === 'error' ? (
            <AppText variant="footnote" style={{ color: download.status === 'error' ? '#ef4444' : colors.accent, textAlign: 'center' }}>
              {download.message}
            </AppText>
          ) : null}

          {!entry.stream && !acquisition ? (
            <AppText variant="callout" className="text-ink-dim" style={{ textAlign: 'center' }}>
              This server doesn’t offer this item as a comic Zlash can read.
            </AppText>
          ) : null}
        </View>

        {entry.summary ? (
          <View style={{ marginTop: 28, padding: 16, borderRadius: 20, backgroundColor: colors.surface }}>
            <AppText variant="footnote" weight="semibold" className="text-ink-dim" style={{ marginBottom: 6 }}>
              About
            </AppText>
            <AppText variant="callout" className="text-ink">
              {entry.summary}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
