import { Image } from 'expo-image';
import { BookOpen } from 'lucide-react-native';
import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { authHeaders, type OpdsCredentials } from '@/services/opds/opds';

/** 2:3 cover from an OPDS server, sent with the source's login. */
export function RemoteCover({ uri, creds, radius = 12 }: { uri?: string; creds?: OpdsCredentials; radius?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.surface }}>
      {uri ? (
        <Image source={{ uri, headers: authHeaders(creds) }} style={{ flex: 1 }} contentFit="cover" cachePolicy="disk" recyclingKey={uri} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={20} color={colors.inkFaint} />
        </View>
      )}
    </View>
  );
}
