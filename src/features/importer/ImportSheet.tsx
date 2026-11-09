import { AlertCircle, Check, ChevronRight, Copy, FileUp, FolderOpen, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { SUPPORTED_EXTENSIONS } from '@/services/metadata/format';

import { type ImportItem, type ImportItemStatus, useImportQueue } from './use-import-queue';

/** The half-height import drawer opened by the library's + button. */
export function ImportSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { items, isRunning, message, pickFiles, pickFolder, reset } = useImportQueue();

  const close = () => {
    if (isRunning) return;
    onClose();
    // Clear results after the exit animation so the sheet doesn't flash back
    // to the picker while it slides away.
    setTimeout(reset, 260);
  };

  const added = items?.filter((i) => i.status === 'success').length ?? 0;
  const finished = items?.filter((i) => i.status !== 'pending' && i.status !== 'working').length ?? 0;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      size="half"
      scroll
      dismissible={!isRunning}
      title={items ? (isRunning ? 'Importing…' : 'Import complete') : 'Add comics'}
      description={
        items
          ? `${finished} of ${items.length} processed · ${added} added`
          : 'Zlash copies files into its private library and never changes the originals.'
      }>
      {!items ? (
        <View style={{ gap: 8 }}>
          <OptionRow icon={FileUp} label="Choose files" description="Pick one or more comics" onPress={pickFiles} />
          <OptionRow icon={FolderOpen} label="Import a folder" description="Add every comic in a folder and its subfolders" onPress={pickFolder} />
          {message ? (
            <AppText variant="footnote" style={{ color: '#ef4444', marginTop: 4, paddingHorizontal: 4 }}>
              {message}
            </AppText>
          ) : null}
          <AppText variant="caption" className="text-ink-faint" style={{ marginTop: 8, textAlign: 'center' }}>
            {SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(' · ')}
          </AppText>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map((item) => (
            <ImportRow key={item.key} item={item} />
          ))}
          <View style={{ marginTop: 8 }}>
            <Button label={isRunning ? 'Importing…' : 'Done'} variant={isRunning ? 'secondary' : 'accent'} size="lg" block disabled={isRunning} onPress={close} />
          </View>
        </View>
      )}
    </Sheet>
  );
}

function OptionRow({ icon: Icon, label, description, onPress }: { icon: LucideIcon; label: string; description: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 18,
        backgroundColor: pressed ? colors.line : colors.base,
      })}>
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
        <Icon size={19} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold" className="text-ink">
          {label}
        </AppText>
        <AppText variant="caption" className="text-ink-dim" style={{ marginTop: 1 }}>
          {description}
        </AppText>
      </View>
      <ChevronRight size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

function ImportRow({ item }: { item: ImportItem }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.base }}>
      <StatusIcon status={item.status} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="callout" weight="medium" numberOfLines={1} className="text-ink">
          {item.name}
        </AppText>
        <AppText variant="caption" numberOfLines={2} className="text-ink-dim" style={{ marginTop: 2 }}>
          {item.detail ?? (item.status === 'working' ? 'Copying and reading pages…' : 'Waiting')}
        </AppText>
      </View>
    </View>
  );
}

function StatusIcon({ status }: { status: ImportItemStatus }) {
  const { colors } = useAppTheme();
  const circle = (bg: string, child: React.ReactNode) => (
    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>{child}</View>
  );
  switch (status) {
    case 'pending':
      return circle(colors.line, null);
    case 'working':
      return circle(colors.line, <ActivityIndicator size="small" color={colors.inkDim} />);
    case 'success':
      return circle(colors.accentSoft, <Check size={15} color={colors.accent} strokeWidth={3} />);
    case 'duplicate':
      return circle(colors.line, <Copy size={14} color={colors.inkDim} />);
    case 'unsupported':
    case 'error':
      return circle('rgba(239, 68, 68, 0.12)', <AlertCircle size={15} color="#ef4444" />);
  }
}
