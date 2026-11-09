import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReaderMessage, ReaderView, useDefaultReaderPreferences, useReaderKeepAwake } from '@/features/reader/ReaderView';
import { openStreamPageSource } from '@/services/opds/stream-page-source';
import { useSourcesStore, useStreamProgressStore } from '@/stores/sources-store';

/** Reads an OPDS-PSE comic page by page, straight from the server. */
export default function StreamReaderScreen() {
  const { sourceId, key } = useLocalSearchParams<{ sourceId: string; key: string }>();
  const source = useSourcesStore((s) => s.sources.find((x) => x.id === sourceId));
  const cachedEntry = useSourcesStore((s) => s.entries[key]);
  const savedEntry = useStreamProgressStore((s) => Object.values(s.progress).find((p) => p.entryKey === key)?.entry);
  const entry = cachedEntry ?? savedEntry;
  const stream = entry?.stream;
  const progress = useStreamProgressStore((s) => (stream ? s.progress[stream.template] : undefined));
  const saveProgress = useStreamProgressStore((s) => s.save);
  const defaults = useDefaultReaderPreferences();
  useReaderKeepAwake();

  const username = source?.username;
  const password = source?.password;
  const pageSource = useMemo(
    () => (stream ? openStreamPageSource(stream, username ? { username, password } : undefined) : null),
    [stream, username, password]
  );
  useEffect(() => () => pageSource?.close(), [pageSource]);

  // Snapshot the resume page once; later saves must not move the reader.
  const [initialPage] = useState(() => progress?.page ?? 0);

  const handleProgress = useCallback(
    (first: number, _last: number, total: number) => {
      if (!stream || !entry) return;
      saveProgress(stream.template, { page: first, total, title: entry.title, sourceId, entryKey: key, lastReadAt: Date.now(), entry });
    },
    [stream, entry, sourceId, key, saveProgress]
  );

  if (!source) return <ReaderMessage title="Server not found" message="It may have been removed from Browse." />;
  if (!entry || !stream || !pageSource) {
    return <ReaderMessage title={entry?.title ?? 'Unavailable'} message="This comic can’t be streamed from the server. Try downloading it instead." />;
  }

  return (
    <ReaderView
      title={entry.title}
      source={pageSource}
      initialPage={initialPage}
      initialPreferences={defaults}
      onProgress={handleProgress}
    />
  );
}

