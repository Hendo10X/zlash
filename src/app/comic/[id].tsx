import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  FolderPlus,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react-native';
import { Alert, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComicCover } from '@/components/comic-cover/ComicCover';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { AppText } from '@/components/ui/Text';
import { formatFileSize, formatPageCount, formatRelativeDate, readingFraction } from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';

const FORMAT_LABELS = { cbz: 'CBZ', cbr: 'CBR', pdf: 'PDF' } as const;

export default function ComicDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comic = useLibraryStore((s) => s.comics.find((c) => c.id === id));
  const setStatus = useLibraryStore((s) => s.setStatus);
  const removeComic = useLibraryStore((s) => s.removeComic);

  if (!comic) {
    return (
      <View className="flex-1 items-center justify-center bg-base">
        <AppText className="text-ink-dim">Comic not found.</AppText>
      </View>
    );
  }

  const fraction = readingFraction(comic);
  const isCompleted = comic.progress?.status === 'completed';
  const hasStarted = Boolean(comic.progress && comic.progress.currentPage > 0);
  const [from, to] = comic.placeholderTone;

  return (
    <View className="flex-1 bg-base">
      <StatusBar barStyle="light-content" />

      <View className="absolute inset-x-0 top-0 h-[340px] overflow-hidden">
        <LinearGradient colors={[to, from]} style={{ flex: 1, opacity: 0.55 }} />
      </View>

      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center justify-between px-5">
          <IconButton icon={ArrowLeft} variant="surface" onPress={() => router.back()} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <View className="items-center px-10 pt-6">
            <View style={{ width: 168 }}>
              <ComicCover comic={comic} progress={fraction} />
            </View>

            <AppText weight="bold" className="mt-5 text-center text-[22px] leading-7 text-ink">
              {comic.title}
            </AppText>
            {comic.series ? (
              <AppText className="mt-1 text-center text-[14px] text-ink-dim">
                {comic.series} {comic.issueNumber}
              </AppText>
            ) : null}

            <View className="mt-3 flex-row items-center gap-2">
              <Badge label={FORMAT_LABELS[comic.format]} />
              <Badge label={formatPageCount(comic.pageCount)} />
              {isCompleted ? <Badge label="Completed" accent /> : null}
            </View>

            <View className="mt-6 w-full">
              <Button
                label={isCompleted ? 'Read again' : hasStarted ? 'Continue reading' : 'Start reading'}
                icon={isCompleted ? RotateCcw : Play}
                onPress={() => router.push(`/reader/${comic.id}`)}
              />
            </View>

            <View className="mt-6 flex-row justify-center gap-8">
              <ActionIcon
                icon={FolderPlus}
                label="Collection"
                onPress={() => Alert.alert('Collections', 'Collections are coming in an upcoming release.')}
              />
              <ActionIcon
                icon={CheckCircle2}
                label={isCompleted ? 'Completed' : 'Mark read'}
                onPress={() => setStatus(comic.id, isCompleted ? 'reading' : 'completed')}
              />
              <ActionIcon
                icon={Trash2}
                label="Remove"
                destructive
                onPress={() =>
                  Alert.alert('Remove from library?', comic.originalFilename, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => {
                        removeComic(comic.id);
                        router.back();
                      },
                    },
                  ])
                }
              />
            </View>
          </View>

          <View className="mx-5 mt-10 border-t border-line pt-5">
            <AppText weight="semibold" className="mb-3 text-[13px] uppercase tracking-wider text-ink-dim">
              Details
            </AppText>
            <DetailRow label="Original filename" value={comic.originalFilename} />
            <DetailRow label="Format" value={FORMAT_LABELS[comic.format]} />
            <DetailRow label="File size" value={formatFileSize(comic.fileSize)} />
            <DetailRow label="Pages" value={comic.pageCount > 0 ? String(comic.pageCount) : '—'} />
            <DetailRow label="Date added" value={formatRelativeDate(comic.dateAdded)} />
            {comic.progress?.lastReadAt ? (
              <DetailRow label="Last read" value={formatRelativeDate(comic.progress.lastReadAt)} />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Badge({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${accent ? 'bg-accent' : 'bg-elevated'}`}>
      <AppText weight="medium" className={`text-[11px] ${accent ? 'text-accent-ink' : 'text-ink-dim'}`}>
        {label}
      </AppText>
    </View>
  );
}

function ActionIcon({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: typeof FolderPlus;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="items-center gap-1.5">
      <IconButton icon={icon} variant="surface" onPress={onPress} />
      <AppText style={{ fontSize: 11, color: destructive ? colors.accent : colors.inkDim }}>{label}</AppText>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <AppText className="text-[14px] text-ink-dim">{label}</AppText>
      <AppText weight="medium" numberOfLines={1} className="ml-4 flex-shrink text-[14px] text-ink">
        {value}
      </AppText>
    </View>
  );
}
