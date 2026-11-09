import { router } from 'expo-router';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { readingFraction } from '@/features/library/selectors';
import { usePressScale } from '@/hooks/use-press-scale';
import type { LibraryComic } from '@/types/comic';

import { ComicCover } from './ComicCover';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Cover with title (and optional caption) underneath. */
export function ComicGridItem({ comic, caption, showTitle = true }: { comic: LibraryComic; caption?: string; showTitle?: boolean }) {
  const { style, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <AnimatedPressable
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={comic.title}
      onPress={() => router.push(`/comic/${comic.id}`)}>
      <ComicCover comic={comic} progress={readingFraction(comic)} />
      {showTitle ? (
        <AppText variant="footnote" weight="medium" numberOfLines={1} className="text-ink" style={{ marginTop: 8 }}>
          {comic.title}
        </AppText>
      ) : null}
      {caption ? (
        <AppText variant="caption" numberOfLines={1} className="text-ink-dim" style={{ marginTop: 1 }}>
          {caption}
        </AppText>
      ) : null}
    </AnimatedPressable>
  );
}
