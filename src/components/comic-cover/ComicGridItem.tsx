import { router } from 'expo-router';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { readingFraction } from '@/features/library/selectors';
import { usePressScale } from '@/hooks/use-press-scale';
import type { LibraryComic } from '@/types/comic';

import { ComicCover } from './ComicCover';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ComicGridItem({ comic }: { comic: LibraryComic }) {
  const { style, onPressIn, onPressOut } = usePressScale();

  return (
    <AnimatedPressable
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => router.push(`/comic/${comic.id}`)}>
      <ComicCover comic={comic} progress={readingFraction(comic)} />
    </AnimatedPressable>
  );
}
