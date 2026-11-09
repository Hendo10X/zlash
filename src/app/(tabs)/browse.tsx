import { router } from 'expo-router';
import { ChevronRight, Globe, Plus, Server } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/empty-state/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen, ScreenHeader, useTabBarClearance } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppText } from '@/components/ui/Text';
import { SourceActionsSheet, SourceFormSheet } from '@/features/browse/SourceSheets';
import { formatRelativeDate } from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSourcesStore, useStreamProgressStore } from '@/stores/sources-store';

function hostOf(url: string) {
  return url.replace(/^https?:\/\//i, '').split('/')[0];
}

/** Browse: comic servers you've connected (OPDS), plus comics you were
 * reading online. */
export default function BrowseScreen() {
  const { colors } = useAppTheme();
  const bottom = useTabBarClearance();
  const sources = useSourcesStore((s) => s.sources);
  const loaded = useSourcesStore((s) => s.loaded);
  const load = useSourcesStore((s) => s.load);
  const streamProgress = useStreamProgressStore((s) => s.progress);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionsFor, setActionsFor] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const continueOnline = useMemo(
    () =>
      Object.entries(streamProgress)
        .map(([template, p]) => ({ template, ...p }))
        .filter((p) => p.page < p.total - 1 && sources.some((s) => s.id === p.sourceId))
        .sort((a, b) => b.lastReadAt - a.lastReadAt)
        .slice(0, 5),
    [streamProgress, sources]
  );

  return (
    <Screen>
      <ScreenHeader
        title="Browse"
        trailing={sources.length > 0 ? <IconButton icon={Plus} accessibilityLabel="Add server" onPress={() => setFormOpen(true)} /> : null}
      />

      {loaded && sources.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Read from your comic server"
          message="Connect a Komga, Kavita, Calibre-Web or any OPDS server to browse its library, read online, or download comics to read offline."
          actionLabel="Add a server"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom, gap: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            <SectionHeader title="Servers" />
            {sources.map((source) => (
              <Pressable
                key={source.id}
                onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
                onLongPress={() => setActionsFor(source.id)}
                delayLongPress={350}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 20,
                  backgroundColor: pressed ? colors.elevated : colors.surface,
                })}>
                <View style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                  <Server size={19} color={colors.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="body" weight="semibold" numberOfLines={1} className="text-ink">
                    {source.name}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1} className="text-ink-dim">
                    {hostOf(source.url)}
                    {source.username ? ` · ${source.username}` : ''}
                  </AppText>
                </View>
                <ChevronRight size={18} color={colors.inkFaint} />
              </Pressable>
            ))}
            <AppText variant="caption" className="text-ink-faint" style={{ marginHorizontal: 4 }}>
              Long-press a server to edit or remove it.
            </AppText>
          </View>

          {continueOnline.length > 0 ? (
            <View style={{ gap: 4 }}>
              <SectionHeader title="Continue reading online" />
              {continueOnline.map((p) => {
                return (
                  <Pressable
                    key={p.template}
                    onPress={() => router.push({ pathname: '/stream', params: { sourceId: p.sourceId, key: p.entryKey } })}
                    style={({ pressed }) => ({ paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}>
                    <AppText variant="callout" weight="medium" numberOfLines={1} className="text-ink">
                      {p.title}
                    </AppText>
                    <AppText variant="caption" className="text-ink-dim" tabular>
                      Page {p.page + 1} of {p.total} · {formatRelativeDate(p.lastReadAt)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      )}

      <SourceFormSheet
        visible={formOpen || editingId !== null}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
        source={sources.find((s) => s.id === editingId)}
      />
      <SourceActionsSheet
        visible={actionsFor !== null}
        onClose={() => setActionsFor(null)}
        source={sources.find((s) => s.id === actionsFor)}
        onEdit={() => {
          const id = actionsFor;
          setActionsFor(null);
          setTimeout(() => setEditingId(id), 250);
        }}
      />
    </Screen>
  );
}
