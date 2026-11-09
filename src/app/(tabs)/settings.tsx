import Constants from 'expo-constants';
import { Switch } from 'heroui-native';
import {
  AlignLeft,
  Archive,
  BookOpenCheck,
  Columns2,
  ExternalLink,
  HardDrive,
  Info,
  MessageSquareWarning,
  Moon,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { AppText } from '@/components/ui/Text';
import { BottomTabBarHeight } from '@/constants/theme';
import { formatFileSize } from '@/features/library/selectors';
import { clearReaderCache, getReaderCacheSize } from '@/features/reader/reader-cache';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';

const GITHUB_URL = 'https://github.com/zlash-app/zlash'; // placeholder — update once the repo is public
const PAGE_FIT_ORDER = ['width', 'height', 'screen', 'original'] as const;
const PAGE_FIT_LABELS: Record<(typeof PAGE_FIT_ORDER)[number], string> = {
  width: 'Fit width',
  height: 'Fit height',
  screen: 'Fit screen',
  original: 'Original size',
};

function comingSoon(feature: string) {
  Alert.alert(feature, 'This is planned for an upcoming release of Zlash.');
}

export default function SettingsScreen() {
  const { scheme } = useAppTheme();
  const settings = useSettingsStore();
  const comics = useLibraryStore((s) => s.comics);

  const totalStorage = comics.reduce((sum, c) => sum + c.fileSize, 0);
  const [cacheSize, setCacheSize] = useState(0);

  // Re-measure whenever the tab is focused — reading a comic fills the cache.
  useFocusEffect(
    useCallback(() => {
      setCacheSize(getReaderCacheSize());
    }, [])
  );

  const handleClearCache = () => {
    clearReaderCache();
    setCacheSize(getReaderCacheSize());
    Alert.alert('Cache cleared', 'Decoded reader pages were removed. They’ll be re-created from your comics as you read.');
  };
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const cycleFit = () => {
    const i = PAGE_FIT_ORDER.indexOf(settings.defaultPageFit);
    settings.setDefaultPageFit(PAGE_FIT_ORDER[(i + 1) % PAGE_FIT_ORDER.length]);
  };

  return (
    <View className="flex-1 bg-base">
      <StatusBar barStyle="auto" />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pb-4 pt-1">
          <AppText weight="bold" className="text-[30px] tracking-tight text-ink">
            Settings
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: BottomTabBarHeight + 24, gap: 28 }}
          showsVerticalScrollIndicator={false}>
          <View>
            <SectionHeader title="Appearance" className="mb-3" />
            <SegmentedControl
              value={settings.appearance}
              onChange={settings.setAppearance}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'System', value: 'system' },
              ]}
            />
          </View>

          <View>
            <SectionHeader title="Reading" className="mb-1" />
            <SettingsRow
              icon={AlignLeft}
              label="Reading direction"
              trailing={
                <SegmentedControl
                  value={settings.defaultReadingDirection}
                  onChange={settings.setDefaultReadingDirection}
                  options={[
                    { label: 'LTR', value: 'ltr' },
                    { label: 'RTL', value: 'rtl' },
                  ]}
                />
              }
            />
            <SettingsRow
              icon={Columns2}
              label="Reading mode"
              trailing={
                <SegmentedControl
                  value={settings.defaultReadingMode}
                  onChange={settings.setDefaultReadingMode}
                  options={[
                    { label: 'Single', value: 'single' },
                    { label: 'Double', value: 'double' },
                    { label: 'Vertical', value: 'vertical' },
                  ]}
                />
              }
            />
            <SettingsRow
              icon={ScanLine}
              label="Page fitting"
              description={PAGE_FIT_LABELS[settings.defaultPageFit]}
              onPress={cycleFit}
              showChevron
            />
            <SettingsRow
              icon={scheme === 'dark' ? Moon : Sun}
              label="Keep screen awake"
              trailing={<Switch isSelected={settings.keepScreenAwake} onSelectedChange={settings.setKeepScreenAwake} />}
            />
            <SettingsRow
              icon={BookOpenCheck}
              label="Auto-hide controls"
              trailing={<Switch isSelected={settings.autoHideControls} onSelectedChange={settings.setAutoHideControls} />}
            />
          </View>

          <View>
            <SectionHeader title="Storage" className="mb-1" />
            <SettingsRow icon={HardDrive} label="Comic storage" description={formatFileSize(totalStorage)} />
            <SettingsRow icon={Archive} label="Reader cache" description={formatFileSize(cacheSize)} />
            <SettingsRow
              icon={Trash2}
              label="Clear cache"
              onPress={handleClearCache}
            />
            <SettingsRow
              icon={ScrollText}
              label="Manage imported comics"
              onPress={() => comingSoon('Manage imported comics')}
              showChevron
            />
            <SettingsRow
              icon={ShieldCheck}
              label="Backup & restore"
              onPress={() => comingSoon('Backup & restore')}
              showChevron
            />
          </View>

          <View>
            <SectionHeader title="Application" className="mb-1" />
            <SettingsRow label="Version" description={version} />
            <SettingsRow
              icon={ExternalLink}
              label="GitHub repository"
              onPress={() => Linking.openURL(GITHUB_URL)}
              showChevron
            />
            <SettingsRow
              icon={MessageSquareWarning}
              label="Report a bug"
              onPress={() => Linking.openURL(`${GITHUB_URL}/issues/new`)}
              showChevron
            />
            <SettingsRow
              icon={Info}
              label="About Zlash"
              onPress={() =>
                Alert.alert('Zlash', 'Your comics. Your library. Your way.\n\nA free, open-source, local-first comic reader.')
              }
              showChevron
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
