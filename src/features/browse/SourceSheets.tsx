import { Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchFeed, normaliseServerUrl } from '@/services/opds/opds';
import { useSourcesStore } from '@/stores/sources-store';
import type { Source } from '@/types/source';

/** Add a server (no `source`) or edit one. Saving tests the connection first. */
export function SourceFormSheet({ visible, onClose, source }: { visible: boolean; onClose: () => void; source?: Source }) {
  const saveSource = useSourcesStore((s) => s.saveSource);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(source?.name ?? '');
      setUrl(source?.url ?? '');
      setUsername(source?.username ?? '');
      setPassword(source?.password ?? '');
      setError(null);
    }
  }

  const submit = async () => {
    const normalised = normaliseServerUrl(url);
    if (!normalised) return;
    setBusy(true);
    setError(null);
    try {
      const feed = await fetchFeed(normalised, username ? { username, password } : undefined);
      await saveSource({ id: source?.id, name: name.trim() || feed.title, url: normalised, username: username.trim(), password });
      setBusy(false);
      onClose();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Couldn’t connect to that server.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissible={!busy}
      scroll
      title={source ? 'Edit server' : 'Add a server'}
      description="Paste the OPDS address of a comic server, like Komga (…/opds/v1.2/catalog), Kavita, Calibre-Web or Ubooquity.">
      <View style={{ gap: 10 }}>
        <TextField value={url} onChangeText={setUrl} placeholder="https://comics.example.com/opds/v1.2/catalog" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        <TextField value={name} onChangeText={setName} placeholder="Name (optional)" />
        <TextField value={username} onChangeText={setUsername} placeholder="Username (optional)" autoCapitalize="none" autoCorrect={false} />
        <TextField value={password} onChangeText={setPassword} placeholder="Password (optional)" secureTextEntry autoCapitalize="none" />
        {error ? (
          <AppText variant="footnote" style={{ color: '#ef4444', paddingHorizontal: 4 }}>
            {error}
          </AppText>
        ) : null}
        <View style={{ marginTop: 6 }}>
          <Button label={busy ? 'Connecting…' : source ? 'Save' : 'Connect'} variant="accent" size="lg" block disabled={busy || !url.trim()} onPress={submit} />
        </View>
        <AppText variant="caption" className="text-ink-faint" style={{ textAlign: 'center' }}>
          Passwords are kept in your phone’s secure keystore.
        </AppText>
      </View>
    </Sheet>
  );
}

/** Long-press menu for a server card. */
export function SourceActionsSheet({ visible, onClose, source, onEdit }: { visible: boolean; onClose: () => void; source?: Source; onEdit: () => void }) {
  const { colors } = useAppTheme();
  const removeSource = useSourcesStore((s) => s.removeSource);
  const [confirm, setConfirm] = useState(false);

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setConfirm(false);
  }

  if (!source) return null;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={confirm ? `Remove “${source.name}”?` : source.name}
      description={confirm ? 'Comics you downloaded from it stay in your library.' : source.url}>
      {confirm ? (
        <View style={{ gap: 8 }}>
          <Button
            label="Remove server"
            variant="destructive"
            size="lg"
            block
            onPress={async () => {
              onClose();
              await removeSource(source.id);
            }}
          />
          <Button label="Cancel" variant="ghost" size="lg" block onPress={() => setConfirm(false)} />
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          {[
            { label: 'Edit', icon: <Pencil size={18} color={colors.inkDim} />, onPress: onEdit, destructive: false },
            { label: 'Remove', icon: <Trash2 size={18} color="#ef4444" />, onPress: () => setConfirm(true), destructive: true },
          ].map((row) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 56,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: pressed ? colors.line : 'transparent',
              })}>
              {row.icon}
              <AppText variant="body" weight="medium" style={{ color: row.destructive ? '#ef4444' : colors.ink }}>
                {row.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
}
