import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, Copy, FileUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { AppText } from '@/components/ui/Text';
import { SUPPORTED_EXTENSIONS } from '@/services/metadata/format';
import { importComicFile } from '@/features/importer/import-comic';
import { useAppTheme } from '@/hooks/use-app-theme';
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
  const refresh = useLibraryStore((s) => s.refresh);
  const [items, setItems] = useState<ImportItem[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const patchItem = (key: string, patch: Partial<ImportItem>) =>
    setItems((current) => current?.map((item) => (item.key === key ? { ...item, ...patch } : item)) ?? current);

  const pickAndImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: '*/*',
    });
    if (result.canceled || result.assets.length === 0) return;

    const initial: ImportItem[] = result.assets.map((asset, index) => ({
      key: `${index}-${asset.name}`,
      name: asset.name,
      status: 'pending',
    }));
    setItems(initial);
    setIsRunning(true);

    // Sequential on purpose — each import can briefly hold a whole archive
    // in memory (see services/archive/cbz.ts), so running several at once
    // would multiply that peak rather than overlap cheap I/O.
    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      const item = initial[i];
      patchItem(item.key, { status: 'working' });

      const outcome = await importComicFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
      });

      switch (outcome.status) {
        case 'success':
          patchItem(item.key, { status: 'success', detail: outcome.comic.title });
          break;
        case 'duplicate':
          patchItem(item.key, { status: 'duplicate', detail: `Already in your library as "${outcome.existing.title}"` });
          break;
        case 'unsupported':
          patchItem(item.key, { status: 'unsupported', detail: `Unsupported file type (.${outcome.filename.split('.').pop()})` });
          break;
        case 'error':
          patchItem(item.key, { status: 'error', detail: outcome.message });
          break;
      }
    }

    setIsRunning(false);
    await refresh();
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-base">
      <SafeAreaView className="flex-1">
        <View className="flex-row justify-end px-5 pt-2">
          <IconButton icon={X} variant="surface" onPress={() => router.back()} />
        </View>

        {!items ? (
          <View className="flex-1 items-center justify-center gap-5 px-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-elevated">
              <FileUp size={26} color={colors.inkDim} strokeWidth={1.5} />
            </View>
            <View className="gap-2">
              <AppText weight="semibold" className="text-center text-[18px] text-ink">
                Import your comics
              </AppText>
              <AppText className="text-center text-[14px] leading-5 text-ink-dim">
                Pick CBZ, CBR, or PDF files from your device. Zlash copies them into your private
                library — your originals are never modified.
              </AppText>
            </View>
            <View className="mt-2">
              <Button label="Choose files" icon={FileUp} onPress={pickAndImport} />
            </View>
            <AppText className="text-center text-[12px] text-ink-faint">
              Supports .{SUPPORTED_EXTENSIONS.join(', .')}
            </AppText>
          </View>
        ) : (
          <>
            <View className="px-5 pb-2 pt-1">
              <AppText weight="bold" className="text-[22px] tracking-tight text-ink">
                Importing
              </AppText>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 2 }}
              renderItem={({ item }) => <ImportRow item={item} />}
            />
            <View className="px-5 pb-6 pt-2">
              <Button label="Done" onPress={handleDone} disabled={isRunning} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function ImportRow({ item }: { item: ImportItem }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-3 border-b border-line py-3">
      <StatusIcon status={item.status} color={colors.inkDim} accent={colors.accent} />
      <View className="flex-1">
        <AppText weight="medium" numberOfLines={1} className="text-[14px] text-ink">
          {item.name}
        </AppText>
        {item.detail ? (
          <AppText numberOfLines={2} className="mt-0.5 text-[12px] text-ink-dim">
            {item.detail}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function StatusIcon({ status, color, accent }: { status: ItemStatus; color: string; accent: string }) {
  switch (status) {
    case 'pending':
    case 'working':
      return <ActivityIndicator size="small" color={color} />;
    case 'success':
      return <CheckCircle2 size={18} color={accent} />;
    case 'duplicate':
      return <Copy size={18} color={color} />;
    case 'unsupported':
    case 'error':
      return <AlertCircle size={18} color={accent} />;
  }
}
