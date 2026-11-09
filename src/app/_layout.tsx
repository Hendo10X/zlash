import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { backfillMissingMetadata } from '@/features/importer/backfill';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import { useSourcesStore } from '@/stores/sources-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Keeps Uniwind's theme in sync with the appearance preference as early
  // as possible, even before any screen mounts.
  const { colors } = useAppTheme();

  useEffect(() => {
    useLibraryStore
      .getState()
      .refresh()
      .then(() => backfillMissingMetadata());
    useSourcesStore.getState().load();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.base } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="comic/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="reader/[id]" options={{ animation: 'none', presentation: 'fullScreenModal' }} />
            <Stack.Screen name="manage" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="source/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="source/entry" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="stream" options={{ animation: 'none', presentation: 'fullScreenModal' }} />
          </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
