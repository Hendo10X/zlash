import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryComic } from '@/types/comic';

interface ComicCoverProps {
  comic: LibraryComic;
  /** 0–1. Renders a thin accent bar along the bottom edge when > 0. */
  progress?: number;
  /** Compact rendering for list thumbnails: no title text on placeholders. */
  compact?: boolean;
  radius?: number;
}

/**
 * The comic's real extracted cover when one exists (CBZ imports), otherwise
 * a tonal gradient placeholder. Always 2:3 so grids and lists never jump
 * while the image loads.
 */
export function ComicCover({ comic, progress = 0, compact = false, radius = 12 }: ComicCoverProps) {
  const { colors } = useAppTheme();
  const [from, to] = comic.placeholderTone;

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: colors.elevated,
      }}>
      {comic.coverPath ? (
        <Image
          source={{ uri: comic.coverPath }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={0}
          recyclingKey={comic.id}
        />
      ) : (
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: compact ? 0 : 10 }}>
          {compact ? null : (
            <AppText variant="footnote" weight="semibold" numberOfLines={3} style={{ color: '#ffffff' }}>
              {comic.title}
            </AppText>
          )}
        </LinearGradient>
      )}

      {/* Hairline inner border so covers don't bleed into the background. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      />

      {progress > 0 ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View style={{ height: '100%', width: `${Math.min(progress, 1) * 100}%`, backgroundColor: colors.accent }} />
        </View>
      ) : null}
    </View>
  );
}
