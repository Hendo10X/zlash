import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryComic } from '@/types/comic';

interface ComicListItemProps {
  comic: LibraryComic;
  subtitle: string;
  progressLabel?: string;
}

export function ComicListItem({ comic, subtitle, progressLabel }: ComicListItemProps) {
  const { colors } = useAppTheme();
  const [from, to] = comic.placeholderTone;

  return (
    <Pressable
      onPress={() => router.push(`/comic/${comic.id}`)}
      className="flex-row items-center gap-3 py-2.5 active:opacity-60">
      <View className="h-[64px] w-[44px] overflow-hidden rounded-[6px] bg-elevated">
        <LinearGradient colors={[from, to]} style={{ flex: 1 }} />
      </View>

      <View className="flex-1">
        <AppText weight="medium" numberOfLines={1} className="text-[15px] text-ink">
          {comic.title}
        </AppText>
        <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-ink-dim">
          {subtitle}
        </AppText>
        {progressLabel ? (
          <AppText weight="medium" className="mt-1 text-[12px] text-accent">
            {progressLabel}
          </AppText>
        ) : null}
      </View>

      <ChevronRight size={18} color={colors.inkFaint} />
    </Pressable>
  );
}
