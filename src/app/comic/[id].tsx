import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Circle, FolderPlus, type LucideIcon, Play, RotateCcw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComicCover } from '@/components/comic-cover/ComicCover';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
import { formatFileSize, formatPageCount, formatRelativeDate, readingFraction } from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';

const FORMAT_LABELS = { cbz: 'CBZ', cbr: 'CBR', pdf: 'PDF' } as const;
const HERO_HEIGHT = 380;

export default function ComicDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const comic = useLibraryStore((s) => s.comics.find((c) => c.id === id));
  const setStatus = useLibraryStore((s) => s.setStatus);
  const removeComic = useLibraryStore((s) => s.removeComic);
  const { colors, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<'remove' | 'collection' | null>(null);

  if (!comic) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base }}>
        <AppText className="text-ink-dim">Comic not found.</AppText>
      </View>
    );
  }

  const fraction = readingFraction(comic);
  const isCompleted = comic.progress?.status === 'completed';
  const hasStarted = Boolean(comic.progress && comic.progress.currentPage > 0);
  const [from, to] = comic.placeholderTone;

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <StatusBar barStyle="light-content" />

      {/* Backdrop: the cover itself, heavily blurred, fading into the page. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HERO_HEIGHT, overflow: 'hidden' }}>
        {comic.coverPath ? (
          <Image source={{ uri: comic.coverPath }} style={{ flex: 1, opacity: 0.6 }} contentFit="cover" blurRadius={40} />
        ) : (
          <LinearGradient colors={[to, from]} style={{ flex: 1, opacity: 0.7 }} />
        )}
        <LinearGradient
          colors={['transparent', colors.base]}
          locations={[0.35, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320).easing(EaseOut)} style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 172,
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 16,
            }}>
            <ComicCover comic={comic} progress={fraction} radius={14} />
          </View>

          <AppText variant="title" className="text-ink" style={{ marginTop: 22, textAlign: 'center' }}>
            {comic.title}
          </AppText>
          {comic.series ? (
            <AppText variant="callout" className="text-ink-dim" style={{ marginTop: 2, textAlign: 'center' }}>
              {comic.series} {comic.issueNumber}
            </AppText>
          ) : null}

          <AppText variant="footnote" className="text-ink-dim" style={{ marginTop: 8 }} tabular>
            {[FORMAT_LABELS[comic.format], formatPageCount(comic.pageCount), formatFileSize(comic.fileSize)].join('  ·  ')}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320).easing(EaseOut)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          {hasStarted && !isCompleted ? (
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <AppText variant="caption" className="text-ink-dim" tabular>
                  Page {(comic.progress?.currentPage ?? 0) + 1} of {comic.progress?.totalPages}
                </AppText>
                <AppText variant="caption" weight="semibold" className="text-ink" tabular>
                  {Math.round(fraction * 100)}%
                </AppText>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${fraction * 100}%`, backgroundColor: colors.accent }} />
              </View>
            </View>
          ) : null}

          <Button
            label={isCompleted ? 'Read again' : hasStarted ? 'Continue reading' : 'Start reading'}
            icon={isCompleted ? RotateCcw : Play}
            variant="accent"
            size="lg"
            block
            onPress={() => router.push(`/reader/${comic.id}`)}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Action
              icon={isCompleted ? CheckCircle2 : Circle}
              label={isCompleted ? 'Completed' : 'Mark read'}
              active={isCompleted}
              onPress={() => setStatus(comic.id, isCompleted ? 'reading' : 'completed')}
            />
            <Action icon={FolderPlus} label="Collection" onPress={() => setSheet('collection')} />
            <Action icon={Trash2} label="Remove" destructive onPress={() => setSheet('remove')} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(320).easing(EaseOut)}
          style={{ marginHorizontal: 20, marginTop: 28, padding: 16, borderRadius: 20, backgroundColor: colors.surface, gap: 12 }}>
          <AppText variant="footnote" weight="semibold" className="text-ink-dim">
            Details
          </AppText>
          <DetailRow label="File" value={comic.originalFilename} />
          <DetailRow label="Pages" value={comic.pageCount > 0 ? String(comic.pageCount) : '—'} />
          <DetailRow label="Added" value={formatRelativeDate(comic.dateAdded)} />
          {comic.progress?.lastReadAt ? <DetailRow label="Last read" value={formatRelativeDate(comic.progress.lastReadAt)} /> : null}
        </Animated.View>
      </ScrollView>

      {/* Floating back button stays put while the content scrolls under it. */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16 }}>
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)' }}
        />
      </View>

      <Sheet
        visible={sheet === 'remove'}
        onClose={() => setSheet(null)}
        title="Remove from library?"
        description={`“${comic.title}” and its reading progress will be deleted from Zlash. The original file on your device isn’t affected.`}>
        <View style={{ gap: 8 }}>
          <Button
            label="Remove"
            variant="destructive"
            size="lg"
            block
            onPress={() => {
              setSheet(null);
              router.back();
              removeComic(comic.id);
            }}
          />
          <Button label="Cancel" variant="ghost" size="lg" block onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet
        visible={sheet === 'collection'}
        onClose={() => setSheet(null)}
        title="Collections"
        description="Group comics into your own shelves. This is coming in an upcoming release.">
        <Button label="Got it" variant="secondary" size="lg" block onPress={() => setSheet(null)} />
      </Sheet>
    </View>
  );
}

function Action({
  icon: Icon,
  label,
  onPress,
  active = false,
  destructive = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  const color = destructive ? '#ef4444' : active ? colors.accent : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: pressed ? colors.elevated : colors.surface,
      })}>
      <Icon size={18} color={color} strokeWidth={2} />
      <AppText variant="caption" weight="medium" style={{ color: destructive ? color : colors.inkDim }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <AppText variant="callout" className="text-ink-dim">
        {label}
      </AppText>
      <AppText variant="callout" weight="medium" numberOfLines={1} className="text-ink" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
