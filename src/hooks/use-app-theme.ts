import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';

import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * Keeps Uniwind's active theme (which drives every `dark:` className in the
 * app) in sync with the user's appearance preference, and resolves the
 * concrete 'light' | 'dark' scheme for the handful of call sites that need
 * a raw color value instead of a className (status bar, SVG icons, etc).
 */
export function useAppTheme() {
  const appearance = useSettingsStore((state) => state.appearance);
  const systemScheme = useColorScheme();

  useEffect(() => {
    Uniwind.setTheme(appearance);
  }, [appearance]);

  const scheme = appearance === 'system' ? (systemScheme ?? 'dark') : appearance;

  return {
    scheme,
    colors: Colors[scheme],
  };
}
