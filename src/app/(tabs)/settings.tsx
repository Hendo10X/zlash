import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import {
  AlignLeft,
  Archive,
  ArrowLeftToLine,
  ArrowRightToLine,
  BookOpenCheck,
  Columns2,
  ExternalLink,
  GalleryVertical,
  HardDrive,
  Info,
  Maximize2,
  MessageSquareWarning,
  Monitor,
  Moon,
  MoveHorizontal,
  MoveVertical,
  Palette,
  RectangleVertical,
  Scan,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Sun,
  Trash2,
  Eye,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen, ScreenHeader, useTabBarClearance } from '@/components/ui/Screen';
import { type SelectOption, SelectSheet } from '@/components/ui/SelectSheet';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { AppText } from '@/components/ui/Text';
import { formatFileSize } from '@/features/library/selectors';
import { clearReaderCache, getReaderCacheSize } from '@/features/reader/reader-cache';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { Appearance, PageFit, ReadingDirection, ReadingMode } from '@/types/reading';

const GITHUB_URL = 'https://github.com/zlash-app/zlash'; // placeholder — update once the repo is public

const APPEARANCE: SelectOption<Appearance>[] = [
  { value: 'system', label: 'System', description: 'Match your device setting', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];
const DIRECTION: SelectOption<ReadingDirection>[] = [
  { value: 'ltr', label: 'Left to right', description: 'Western comics', icon: ArrowRightToLine },
  { value: 'rtl', label: 'Right to left', description: 'Manga', icon: ArrowLeftToLine },
];
const MODE: SelectOption<ReadingMode>[] = [
  { value: 'single', label: 'Single page', description: 'Swipe one page at a time', icon: RectangleVertical },
  { value: 'double', label: 'Double page', description: 'Two-page spreads, best in landscape', icon: Columns2 },
  { value: 'vertical', label: 'Vertical scroll', description: 'Continuous, webtoon-style', icon: GalleryVertical },
];
const FIT: SelectOption<PageFit>[] = [
  { value: 'width', label: 'Fit width', description: 'Fill the width, scroll tall pages', icon: MoveHorizontal },
  { value: 'height', label: 'Fit height', icon: MoveVertical },
  { value: 'screen', label: 'Fit screen', description: 'Always show the whole page', icon: Scan },
  { value: 'original', label: 'Original size', description: 'Never upscale', icon: Maximize2 },
];

const labelOf = <T extends string>(options: SelectOption<T>[], value: T) => options.find((o) => o.value === value)?.label ?? value;

type SheetKey = 'appearance' | 'direction' | 'mode' | 'fit' | 'clear' | 'about' | 'manage' | 'backup' | null;

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const comics = useLibraryStore((s) => s.comics);
  const bottom = useTabBarClearance();
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const close = () => setSheet(null);

  const totalStorage = comics.reduce((sum, c) => sum + c.fileSize, 0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // Re-measure whenever the tab is focused — reading a comic fills the cache.
  useFocusEffect(
    useCallback(() => {
      setCacheSize(getReaderCacheSize());
    }, [])
  );

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom, gap: 28 }} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="Appearance">
          <SettingsRow
            icon={Palette}
            label="Theme"
            value={labelOf(APPEARANCE, settings.appearance)}
            showChevron
            onPress={() => setSheet('appearance')}
          />
        </SettingsGroup>

        <SettingsGroup title="Reading" footer="These are defaults. You can change them per session from the reader.">
          <SettingsRow
            icon={AlignLeft}
            label="Reading direction"
            value={settings.defaultReadingDirection.toUpperCase()}
            showChevron
            onPress={() => setSheet('direction')}
          />
          <SettingsRow
            icon={Columns2}
            label="Reading mode"
            value={labelOf(MODE, settings.defaultReadingMode).split(' ')[0]}
            showChevron
            onPress={() => setSheet('mode')}
          />
          <SettingsRow
            icon={ScanLine}
            label="Page fit"
            value={labelOf(FIT, settings.defaultPageFit).replace('Fit ', '')}
            showChevron
            onPress={() => setSheet('fit')}
          />
          <SettingsRow
            icon={Eye}
            label="Keep screen awake"
            trailing={<Switch value={settings.keepScreenAwake} onValueChange={settings.setKeepScreenAwake} />}
          />
          <SettingsRow
            icon={BookOpenCheck}
            label="Auto-hide controls"
            trailing={<Switch value={settings.autoHideControls} onValueChange={settings.setAutoHideControls} />}
          />
        </SettingsGroup>

        <SettingsGroup title="Storage">
          <SettingsRow icon={HardDrive} label="Comics" value={formatFileSize(totalStorage)} />
          <SettingsRow icon={Archive} label="Reader cache" value={formatFileSize(cacheSize)} />
          <SettingsRow icon={Trash2} label="Clear cache" destructive onPress={() => setSheet('clear')} />
          <SettingsRow icon={ScrollText} label="Manage comics" showChevron onPress={() => setSheet('manage')} />
          <SettingsRow icon={ShieldCheck} label="Backup & restore" showChevron onPress={() => setSheet('backup')} />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon={Info} label="About Zlash" value={`v${version}`} showChevron onPress={() => setSheet('about')} />
          <SettingsRow icon={ExternalLink} label="GitHub" showChevron onPress={() => Linking.openURL(GITHUB_URL)} />
          <SettingsRow
            icon={MessageSquareWarning}
            label="Report a bug"
            showChevron
            onPress={() => Linking.openURL(`${GITHUB_URL}/issues/new`)}
          />
        </SettingsGroup>
      </ScrollView>

      <SelectSheet
        visible={sheet === 'appearance'}
        onClose={close}
        title="Theme"
        options={APPEARANCE}
        value={settings.appearance}
        onChange={settings.setAppearance}
      />
      <SelectSheet
        visible={sheet === 'direction'}
        onClose={close}
        title="Reading direction"
        options={DIRECTION}
        value={settings.defaultReadingDirection}
        onChange={settings.setDefaultReadingDirection}
      />
      <SelectSheet
        visible={sheet === 'mode'}
        onClose={close}
        title="Reading mode"
        options={MODE}
        value={settings.defaultReadingMode}
        onChange={settings.setDefaultReadingMode}
      />
      <SelectSheet
        visible={sheet === 'fit'}
        onClose={close}
        title="Page fit"
        description="Applies in single-page mode."
        options={FIT}
        value={settings.defaultPageFit}
        onChange={settings.setDefaultPageFit}
      />

      <Sheet
        visible={sheet === 'clear'}
        onClose={close}
        title="Clear reader cache?"
        description={`Frees ${formatFileSize(cacheSize)}. Pages are re-created from your comics as you read, so nothing is lost.`}>
        <View style={{ gap: 8 }}>
          <Button
            label="Clear cache"
            variant="destructive"
            size="lg"
            block
            onPress={() => {
              clearReaderCache();
              setCacheSize(getReaderCacheSize());
              close();
            }}
          />
          <Button label="Cancel" variant="ghost" size="lg" block onPress={close} />
        </View>
      </Sheet>

      <ComingSoonSheet visible={sheet === 'manage'} onClose={close} title="Manage comics" body="Bulk select, delete and see storage per comic." />
      <ComingSoonSheet visible={sheet === 'backup'} onClose={close} title="Backup & restore" body="Export your library and reading progress, and bring it to a new device." />

      <Sheet visible={sheet === 'about'} onClose={close}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <Image source={require('../../../assets/images/icon.png')} style={{ width: 72, height: 72, borderRadius: 18 }} />
          <AppText variant="title" className="text-ink" style={{ marginTop: 14 }}>
            Zlash
          </AppText>
          <AppText variant="footnote" className="text-ink-dim" tabular>
            Version {version}
          </AppText>
          <AppText variant="callout" className="text-ink-dim" style={{ textAlign: 'center', marginTop: 12, marginBottom: 20 }}>
            Your comics. Your library. Your way.{'\n'}A free, open-source, local-first comic reader.
          </AppText>
          <Button label="Done" variant="secondary" size="lg" block onPress={close} />
        </View>
      </Sheet>
    </Screen>
  );
}

function ComingSoonSheet({ visible, onClose, title, body }: { visible: boolean; onClose: () => void; title: string; body: string }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} description={`${body} This is coming in an upcoming release.`}>
      <Button label="Got it" variant="secondary" size="lg" block onPress={onClose} />
    </Sheet>
  );
}
