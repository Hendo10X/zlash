import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, Folder, RefreshCw, Search, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { AppText } from '@/components/ui/Text';
import { RemoteCover } from '@/features/browse/RemoteCover';
import { useAppTheme } from '@/hooks/use-app-theme';
import { buildSearchUrl, fetchFeed, type OpdsEntry, type OpdsFeed } from '@/services/opds/opds';
import { credentialsFor, useSourcesStore } from '@/stores/sources-store';

const GUTTER = 20;
const GAP = 14;

/** One page of an OPDS catalog: folders as rows, comics as a cover grid. */
export default function SourceFeedScreen() {
  const { id, url, title } = useLocalSearchParams<{ id: string; url?: string; title?: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const source = useSourcesStore((s) => s.sources.find((x) => x.id === id));
  const rememberEntries = useSourcesStore((s) => s.rememberEntries);
  const creds = credentialsFor(source);
  const feedUrl = url ?? source?.url;

  const [feed, setFeed] = useState<OpdsFeed | null>(null);
  const [entries, setEntries] = useState<OpdsEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);

  const username = source?.username;
  const password = source?.password;
  useEffect(() => {
    if (!feedUrl) return;
    let cancelled = false;
    fetchFeed(feedUrl, username ? { username, password } : undefined).then(
      (result) => {
        if (cancelled) return;
        rememberEntries(result.entries);
        setFeed(result);
        setEntries(result.entries);
        setError(null);
      },
      (e) => !cancelled && setError(e instanceof Error ? e.message : 'Couldn’t load this catalog.')
    );
    return () => {
      cancelled = true;
    };
  }, [feedUrl, username, password, attempt, rememberEntries]);

  const loadMore = useCallback(async () => {
    if (!feed?.nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchFeed(feed.nextUrl, creds);
      rememberEntries(next.entries);
      setEntries((current) => {
        const seen = new Set(current.map((e) => e.key));
        return [...current, ...next.entries.filter((e) => !seen.has(e.key))];
      });
      setFeed({ ...feed, nextUrl: next.nextUrl });
    } catch {
      // Leave the list as is; reaching the end again retries.
    }
    setLoadingMore(false);
  }, [feed, loadingMore, creds, rememberEntries]);

  const search = async (text: string) => {
    if (!feed || !text.trim()) return;
    try {
      const searchUrl = await buildSearchUrl(feed, text.trim(), creds);
      router.push({ pathname: '/source/[id]', params: { id, url: searchUrl, title: `“${text.trim()}”` } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    }
  };

  if (!source) {
    return (
      <Screen>
        <EmptyState icon={WifiOff} title="Server not found" message="It may have been removed." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const canSearch = Boolean(feed?.searchTemplate || feed?.searchDescriptionUrl);
  const allPublications = entries.length > 0 && entries.every((e) => !e.navigationUrl);
  const columns = width >= 640 ? 4 : 3;
  const cellWidth = (width - GUTTER * 2 - GAP * (columns - 1)) / columns;

  const openEntry = (entry: OpdsEntry) => {
    if (entry.navigationUrl) {
      router.push({ pathname: '/source/[id]', params: { id, url: entry.navigationUrl, title: entry.title } });
    } else {
      router.push({ pathname: '/source/entry', params: { sourceId: id, key: entry.key } });
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <IconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="headline" numberOfLines={1} className="text-ink">
            {title ?? feed?.title ?? source.name}
          </AppText>
          {title || feed ? (
            <AppText variant="caption" numberOfLines={1} className="text-ink-dim">
              {source.name}
            </AppText>
          ) : null}
        </View>
        {canSearch ? <IconButton icon={Search} accessibilityLabel="Search" onPress={() => setSearchOpen((v) => !v)} /> : null}
      </View>

      {searchOpen ? (
        <SearchField value={query} onChangeText={setQuery} onClose={() => setSearchOpen(false)} placeholder={`Search ${source.name}`} onSubmit={search} />
      ) : null}

      {error && entries.length === 0 ? (
        <EmptyState icon={WifiOff} title="Couldn’t load" message={error} actionLabel="Try again" onAction={() => setAttempt((n) => n + 1)} />
      ) : !feed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.inkFaint} />
        </View>
      ) : entries.length === 0 ? (
        <EmptyState icon={Folder} title="Nothing here" message="This part of the catalog is empty." />
      ) : allPublications ? (
        <FlatList
          key={`grid-${columns}`}
          data={entries}
          numColumns={columns}
          keyExtractor={(e) => e.key}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: GUTTER }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.inkFaint} /> : undefined}
          renderItem={({ item }) => (
            <Pressable onPress={() => openEntry(item)} style={({ pressed }) => ({ width: cellWidth, marginBottom: 20, opacity: pressed ? 0.7 : 1 })}>
              <RemoteCover uri={item.thumbnail} creds={creds} radius={10} />
              <AppText variant="caption" weight="medium" numberOfLines={2} className="text-ink" style={{ marginTop: 6 }}>
                {item.title}
              </AppText>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.inkFaint} /> : undefined}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEntry(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 10,
                paddingHorizontal: 6,
                borderRadius: 14,
                backgroundColor: pressed ? colors.surface : 'transparent',
              })}>
              {item.navigationUrl && !item.thumbnail ? (
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
                  <Folder size={18} color={colors.inkDim} />
                </View>
              ) : (
                <View style={{ width: 40 }}>
                  <RemoteCover uri={item.thumbnail} creds={creds} radius={6} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="callout" weight="medium" numberOfLines={2} className="text-ink">
                  {item.title}
                </AppText>
                {item.author || item.summary ? (
                  <AppText variant="caption" numberOfLines={1} className="text-ink-dim">
                    {item.author ?? item.summary}
                  </AppText>
                ) : null}
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
          )}
        />
      )}

      {error && entries.length > 0 ? (
        <Pressable
          onPress={() => setError(null)}
          style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16, padding: 14, borderRadius: 16, backgroundColor: colors.elevated, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <RefreshCw size={16} color="#ef4444" />
          <AppText variant="footnote" style={{ color: '#ef4444', flex: 1 }}>
            {error}
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}
