import { router } from 'expo-router';
import { ArrowLeft, Check, Library, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComicCover } from '@/components/comic-cover/ComicCover';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { formatFileSize, formatPageCount } from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';

/** Settings → Manage comics: every comic by size, with bulk delete. */
export default function ManageComicsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const comics = useLibraryStore((s) => s.comics);
  const removeComics = useLibraryStore((s) => s.removeComics);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const bySize = useMemo(() => [...comics].sort((a, b) => b.fileSize - a.fileSize), [comics]);
  const total = comics.reduce((sum, c) => sum + c.fileSize, 0);
  const selectedSize = comics.filter((c) => selected.has(c.id)).reduce((sum, c) => sum + c.fileSize, 0);
  const allSelected = comics.length > 0 && selected.size === comics.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <IconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <AppText variant="headline" className="text-ink">
            Manage comics
          </AppText>
          <AppText variant="caption" className="text-ink-dim" tabular>
            {comics.length} {comics.length === 1 ? 'comic' : 'comics'} · {formatFileSize(total)}
          </AppText>
        </View>
        {comics.length > 0 ? (
          <Pressable onPress={() => setSelected(allSelected ? new Set() : new Set(comics.map((c) => c.id)))} hitSlop={10} accessibilityRole="button">
            <AppText variant="callout" weight="semibold" style={{ color: colors.accent }}>
              {allSelected ? 'Select none' : 'Select all'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {comics.length === 0 ? (
        <EmptyState icon={Library} title="No comics yet" message="Comics you import will show up here with how much space each one uses." />
      ) : (
        <FlatList
          data={bySize}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom, gap: 4 }}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable
                onPress={() => toggle(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  borderRadius: 16,
                  backgroundColor: isSelected ? colors.accentSoft : pressed ? colors.surface : 'transparent',
                })}>
                <View style={{ width: 40 }}>
                  <ComicCover comic={item} compact radius={6} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="callout" weight="medium" numberOfLines={1} className="text-ink">
                    {item.title}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1} className="text-ink-dim" tabular>
                    {item.format.toUpperCase()} · {formatPageCount(item.pageCount)}
                  </AppText>
                </View>
                <AppText variant="footnote" weight="medium" className="text-ink-dim" tabular>
                  {formatFileSize(item.fileSize)}
                </AppText>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                    borderWidth: isSelected ? 0 : 2,
                    borderColor: colors.line,
                  }}>
                  {isSelected ? <Check size={15} color={colors.accentInk} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {selected.size > 0 ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
          <Button
            label={`Remove ${selected.size} · ${formatFileSize(selectedSize)}`}
            icon={Trash2}
            variant="destructive"
            size="lg"
            block
            onPress={() => setConfirmOpen(true)}
          />
        </View>
      ) : null}

      <Sheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Remove ${selected.size} ${selected.size === 1 ? 'comic' : 'comics'}?`}
        description={`Frees ${formatFileSize(selectedSize)}. Their reading progress is deleted too. The original files on your device aren’t affected.`}>
        <View style={{ gap: 8 }}>
          <Button
            label="Remove"
            variant="destructive"
            size="lg"
            block
            onPress={async () => {
              const ids = [...selected];
              setConfirmOpen(false);
              setSelected(new Set());
              await removeComics(ids);
            }}
          />
          <Button label="Cancel" variant="ghost" size="lg" block onPress={() => setConfirmOpen(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
