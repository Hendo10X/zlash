import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import type { LibraryComic } from '@/types/comic';

interface ComicCoverProps {
  comic: LibraryComic;
  /** 0–1. Renders a thin accent bar along the bottom edge when > 0. */
  progress?: number;
}

/**
 * Renders the comic's real extracted cover when one exists (currently only
 * CBZ imports produce one — see `services/archive/cbz.ts`), falling back to
 * a tonal gradient + title placeholder for PDF, CBR, and anything still
 * importing.
 */
export function ComicCover({ comic, progress = 0 }: ComicCoverProps) {
  const [from, to] = comic.placeholderTone;

  return (
    <View className="aspect-[2/3] w-full overflow-hidden rounded-md bg-elevated">
      {comic.coverPath ? (
        <Image source={{ uri: comic.coverPath }} style={{ flex: 1 }} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 10 }}>
          {comic.series ? (
            <AppText
              weight="medium"
              numberOfLines={1}
              className="mb-1 text-[11px] uppercase tracking-wider text-white/60">
              {comic.series}
            </AppText>
          ) : null}
          <AppText weight="semibold" numberOfLines={3} className="text-[15px] leading-tight text-white">
            {comic.title}
          </AppText>
          {comic.issueNumber ? (
            <AppText className="mt-0.5 text-[11px] text-white/55">{comic.issueNumber}</AppText>
          ) : null}
        </LinearGradient>
      )}

      {progress > 0 ? (
        <View className="absolute inset-x-0 bottom-0 h-[3px] bg-black/25">
          <View className="h-full bg-accent" style={{ width: `${Math.min(progress, 1) * 100}%` }} />
        </View>
      ) : null}
    </View>
  );
}
