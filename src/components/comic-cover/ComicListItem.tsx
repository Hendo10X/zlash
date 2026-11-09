import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { readingFraction } from '@/features/library/selectors';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryComic } from '@/types/comic';

import { ComicCover } from './ComicCover';

interface ComicListItemProps {
  comic: LibraryComic;
  subtitle: string;
  /** Shows a slim progress bar with this label, e.g. "42%". */
  progressLabel?: string;
}

export function ComicListItem({ comic, subtitle, progressLabel }: ComicListItemProps) {
  const { colors } = useAppTheme();
  const fraction = readingFraction(comic);

  return (
    <Pressable
      onPress={() => router.push(`/comic/${comic.id}`)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginHorizontal: -10,
        borderRadius: 16,
        backgroundColor: pressed ? colors.surface : 'transparent',
      })}>
      <View style={{ width: 48 }}>
        <ComicCover comic={comic} compact radius={8} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="body" weight="semibold" numberOfLines={1} className="text-ink">
          {comic.title}
        </AppText>
        <AppText variant="footnote" numberOfLines={1} className="text-ink-dim" style={{ marginTop: 2 }} tabular>
          {subtitle}
        </AppText>
        {progressLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min(fraction, 1) * 100}%`, backgroundColor: colors.accent }} />
            </View>
            <AppText variant="caption" weight="medium" className="text-ink-dim" tabular>
              {progressLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
