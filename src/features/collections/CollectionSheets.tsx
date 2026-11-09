import { Check, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import type { Collection } from '@/types/collection';

/**
 * "Add to collection" for one comic: tick any number of collections, or make
 * a new one inline (which the comic is added to straight away).
 */
export function CollectionPickerSheet({ visible, onClose, comicId }: { visible: boolean; onClose: () => void; comicId: string }) {
  const { colors } = useAppTheme();
  const collections = useLibraryStore((s) => s.collections);
  const toggle = useLibraryStore((s) => s.toggleComicInCollection);
  const create = useLibraryStore((s) => s.createCollection);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCreating(false);
      setName('');
    }
  }

  const submit = async () => {
    if (!name.trim()) return;
    const id = await create(name);
    await toggle(id, comicId);
    setName('');
    setCreating(false);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add to collection" size="half" scroll>
      <View style={{ gap: 4 }}>
        {collections.length === 0 && !creating ? (
          <AppText variant="callout" className="text-ink-dim" style={{ paddingHorizontal: 4, marginBottom: 12 }}>
            Collections are your own shelves — group a series, a reading list, or anything you like.
          </AppText>
        ) : null}

        {collections.map((collection) => {
          const selected = collection.comicIds.includes(comicId);
          return (
            <Pressable
              key={collection.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(collection.id, comicId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 56,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: selected ? colors.accentSoft : pressed ? colors.line : 'transparent',
              })}>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight={selected ? 'semibold' : 'medium'} className="text-ink" numberOfLines={1}>
                  {collection.name}
                </AppText>
                <AppText variant="caption" className="text-ink-dim" tabular>
                  {collection.comicIds.length} {collection.comicIds.length === 1 ? 'comic' : 'comics'}
                </AppText>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.accent : 'transparent',
                  borderWidth: selected ? 0 : 2,
                  borderColor: colors.line,
                }}>
                {selected ? <Check size={15} color={colors.accentInk} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}

        {creating ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <TextField value={name} onChangeText={setName} placeholder="Collection name" autoFocus returnKeyType="done" onSubmitEditing={submit} maxLength={60} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="ghost" block onPress={() => setCreating(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Create" variant="accent" block disabled={!name.trim()} onPress={submit} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setCreating(true)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              paddingHorizontal: 14,
              borderRadius: 16,
              marginTop: 4,
              backgroundColor: pressed ? colors.line : colors.base,
            })}>
            <Plus size={18} color={colors.accent} strokeWidth={2.5} />
            <AppText variant="body" weight="semibold" style={{ color: colors.accent }}>
              New collection
            </AppText>
          </Pressable>
        )}

        <View style={{ marginTop: 12 }}>
          <Button label="Done" variant="accent" size="lg" block onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}

/** Create a collection (no `collection`) or rename one. */
export function CollectionNameSheet({
  visible,
  onClose,
  collection,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  collection?: Collection;
  onCreated?: (id: string) => void;
}) {
  const create = useLibraryStore((s) => s.createCollection);
  const rename = useLibraryStore((s) => s.renameCollection);
  const [name, setName] = useState('');

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setName(collection?.name ?? '');
  }

  const submit = async () => {
    if (!name.trim()) return;
    if (collection) {
      await rename(collection.id, name);
    } else {
      const id = await create(name);
      onCreated?.(id);
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={collection ? 'Rename collection' : 'New collection'}>
      <View style={{ gap: 12 }}>
        <TextField value={name} onChangeText={setName} placeholder="Collection name" autoFocus returnKeyType="done" onSubmitEditing={submit} maxLength={60} />
        <Button label={collection ? 'Save' : 'Create'} icon={collection ? undefined : FolderPlus} variant="accent" size="lg" block disabled={!name.trim()} onPress={submit} />
      </View>
    </Sheet>
  );
}

/** Long-press menu for a collection chip in the library. */
export function CollectionActionsSheet({ visible, onClose, collection }: { visible: boolean; onClose: () => void; collection?: Collection }) {
  const { colors } = useAppTheme();
  const deleteCollection = useLibraryStore((s) => s.deleteCollection);
  const [mode, setMode] = useState<'menu' | 'rename' | 'delete'>('menu');

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setMode('menu');
  }

  if (!collection) return null;

  if (mode === 'rename') {
    return <CollectionNameSheet visible={visible} onClose={onClose} collection={collection} />;
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={mode === 'delete' ? `Delete “${collection.name}”?` : collection.name}
      description={
        mode === 'delete'
          ? 'Only the collection is deleted. The comics in it stay in your library.'
          : `${collection.comicIds.length} ${collection.comicIds.length === 1 ? 'comic' : 'comics'}`
      }>
      {mode === 'delete' ? (
        <View style={{ gap: 8 }}>
          <Button
            label="Delete collection"
            variant="destructive"
            size="lg"
            block
            onPress={async () => {
              onClose();
              await deleteCollection(collection.id);
            }}
          />
          <Button label="Cancel" variant="ghost" size="lg" block onPress={() => setMode('menu')} />
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <MenuRow icon={<Pencil size={18} color={colors.inkDim} />} label="Rename" onPress={() => setMode('rename')} />
          <MenuRow icon={<Trash2 size={18} color="#ef4444" />} label="Delete" destructive onPress={() => setMode('delete')} />
        </View>
      )}
    </Sheet>
  );
}

function MenuRow({ icon, label, onPress, destructive = false }: { icon: React.ReactNode; label: string; onPress: () => void; destructive?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 56,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: pressed ? colors.line : 'transparent',
      })}>
      {icon}
      <AppText variant="body" weight="medium" style={{ color: destructive ? '#ef4444' : colors.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}
