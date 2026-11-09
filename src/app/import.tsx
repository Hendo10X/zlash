import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { AlertCircle, Check, Copy, FileUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
import { importComicFile } from '@/features/importer/import-comic';
import { useAppTheme } from '@/hooks/use-app-theme';
import { SUPPORTED_EXTENSIONS } from '@/services/metadata/format';
import { useLibraryStore } from '@/stores/library-store';

type ItemStatus = 'pending' | 'working' | 'success' | 'duplicate' | 'unsupported' | 'error';

interface ImportItem {
  key: string;
  name: string;
  status: ItemStatus;
  detail?: string;
}

export default function ImportScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const refresh = useLibraryStore((s) => s.refresh);
  const [items, setItems] = useState<ImportItem[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const patchItem = (key: string, patch: Partial<ImportItem>) =>
    setItems((current) => current?.map((item) => (item.key === key ? { ...item, ...patch } : item)) ?? current);

  const pickAndImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
    if (result.canceled || result.assets.length === 0) return;

    const initial: ImportItem[] = result.assets.map((asset, index) => ({
      key: `${index}-${asset.name}`,
      name: asset.name,
      status: 'pending',
    }));
    setItems(initial);
    setIsRunning(true);

    // Sequential on purpose — each import can briefly hold a whole archive
    // in memory, so parallel imports would stack those peaks.
    for (const [index, item] of initial.entries()) {
      patchItem(item.key, { status: 'working' });
      const asset = result.assets[index];
      const outcome = await importComicFile({ uri: asset.uri, name: asset.name, size: asset.size ?? 0 });

      switch (outcome.status) {
        case 'success':
          patchItem(item.key, { status: 'success', detail: 'Added to your library' });
          break;
        case 'duplicate':
          patchItem(item.key, { status: 'duplicate', detail: `Already in your library as “${outcome.existing.title}”` });
          break;
        case 'unsupported':
          patchItem(item.key, { status: 'unsupported', detail: `.${outcome.filename.split('.').pop()} files aren’t supported` });
          break;
        case 'error':
          patchItem(item.key, { status: 'error', detail: outcome.message });
          break;
      }
    }

    setIsRunning(false);
    await refresh();
  };

  const done = items?.filter((i) => i.status === 'success').length ?? 0;
  const finished = items?.filter((i) => i.status !== 'pending' && i.status !== 'working').length ?? 0;

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <AppText variant="headline" className="text-ink" style={{ flex: 1 }}>
          {items ? (isRunning ? 'Importing…' : 'Import complete') : 'Import'}
        </AppText>
        <IconButton icon={X} size={36} accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      {!items ? (
        <Animated.View
          entering={FadeIn.duration(260).easing(EaseOut)}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 80 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accentSoft,
            }}>
            <FileUp size={30} color={colors.accent} strokeWidth={1.75} />
          </View>
          <AppText variant="title" className="text-ink" style={{ marginTop: 20, textAlign: 'center' }}>
            Import your comics
          </AppText>
          <AppText variant="callout" className="text-ink-dim" style={{ marginTop: 8, textAlign: 'center', maxWidth: 300 }}>
            Pick files from your device. Zlash copies them into your private library and never touches the originals.
          </AppText>
          <View style={{ marginTop: 28 }}>
            <Button label="Choose files" icon={FileUp} variant="accent" size="lg" onPress={pickAndImport} />
          </View>
          <AppText variant="caption" className="text-ink-faint" style={{ marginTop: 14 }}>
            {SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(' · ')}
          </AppText>
        </Animated.View>
      ) : (
        <>
          <AppText variant="footnote" className="text-ink-dim" style={{ paddingHorizontal: 20, marginBottom: 8 }} tabular>
            {finished} of {items.length} processed · {done} added
          </AppText>
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(240).easing(EaseOut)}>
                <ImportRow item={item} />
              </Animated.View>
            )}
          />
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
            <Button label={isRunning ? 'Importing…' : 'Done'} size="lg" block disabled={isRunning} onPress={() => router.back()} />
          </View>
        </>
      )}
    </Screen>
  );
}

function ImportRow({ item }: { item: ImportItem }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.surface,
      }}>
      <StatusIcon status={item.status} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="callout" weight="medium" numberOfLines={1} className="text-ink">
          {item.name}
        </AppText>
        <AppText variant="caption" numberOfLines={2} className="text-ink-dim" style={{ marginTop: 2 }}>
          {item.detail ?? (item.status === 'working' ? 'Copying and reading pages…' : 'Waiting')}
        </AppText>
      </View>
    </View>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  const { colors } = useAppTheme();
  const circle = (bg: string, child: React.ReactNode) => (
    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      {child}
    </View>
  );

  switch (status) {
    case 'pending':
      return circle(colors.elevated, null);
    case 'working':
      return circle(colors.elevated, <ActivityIndicator size="small" color={colors.inkDim} />);
    case 'success':
      return circle(colors.accentSoft, <Check size={15} color={colors.accent} strokeWidth={3} />);
    case 'duplicate':
      return circle(colors.elevated, <Copy size={14} color={colors.inkDim} />);
    case 'unsupported':
    case 'error':
      return circle('rgba(239, 68, 68, 0.12)', <AlertCircle size={15} color="#ef4444" />);
  }
}
