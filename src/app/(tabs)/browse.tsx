import { Download, Globe, type LucideIcon, Puzzle, Search } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, ScreenHeader, useTabBarClearance } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { EaseOut } from '@/constants/motion';
import { useAppTheme } from '@/hooks/use-app-theme';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Puzzle, title: 'Source plugins', body: 'Add comic and manga sources as installable extensions.' },
  { icon: Search, title: 'Search everywhere', body: 'Find a series across every source you’ve added.' },
  { icon: Download, title: 'Download to library', body: 'Chapters land in your library and read offline.' },
];

/** Placeholder for the upcoming plugin-based source browser. */
export default function BrowseScreen() {
  const { colors } = useAppTheme();
  const bottom = useTabBarClearance();

  return (
    <Screen>
      <ScreenHeader title="Browse" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(320).easing(EaseOut)}
          style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 22, overflow: 'hidden' }}>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.accentSoft,
            }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
            <AppText variant="caption" weight="semibold" style={{ color: colors.accent }}>
              Coming soon
            </AppText>
          </View>

          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              marginTop: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.elevated,
            }}>
            <Globe size={24} color={colors.ink} strokeWidth={1.75} />
          </View>

          <AppText variant="title" className="text-ink" style={{ marginTop: 16 }}>
            Find comics from anywhere
          </AppText>
          <AppText variant="callout" className="text-ink-dim" style={{ marginTop: 6 }}>
            Browse and download comics and manga from sources you choose, straight into your Zlash library.
          </AppText>
        </Animated.View>

        <View style={{ marginTop: 12, gap: 8 }}>
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Animated.View
              key={title}
              entering={FadeInDown.delay(60 + i * 50)
                .duration(320)
                .easing(EaseOut)}
              style={{
                flexDirection: 'row',
                gap: 14,
                alignItems: 'center',
                padding: 16,
                borderRadius: 20,
                backgroundColor: colors.surface,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.elevated,
                }}>
                <Icon size={17} color={colors.inkDim} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold" className="text-ink">
                  {title}
                </AppText>
                <AppText variant="footnote" className="text-ink-dim" style={{ marginTop: 1 }}>
                  {body}
                </AppText>
              </View>
            </Animated.View>
          ))}
        </View>

        <AppText variant="caption" className="text-ink-faint" style={{ textAlign: 'center', marginTop: 20 }}>
          Zlash will never ship with sources built in. You add the ones you want.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
