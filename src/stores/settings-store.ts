import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Appearance,
  LibraryViewMode,
  PageFit,
  ReadingDirection,
  ReadingMode,
} from '@/types/reading';

import { zustandMMKVStorage } from './mmkv';

interface SettingsState {
  appearance: Appearance;
  defaultReadingDirection: ReadingDirection;
  defaultReadingMode: ReadingMode;
  defaultPageFit: PageFit;
  keepScreenAwake: boolean;
  autoHideControls: boolean;
  libraryViewMode: LibraryViewMode;

  setAppearance: (appearance: Appearance) => void;
  setDefaultReadingDirection: (direction: ReadingDirection) => void;
  setDefaultReadingMode: (mode: ReadingMode) => void;
  setDefaultPageFit: (fit: PageFit) => void;
  setKeepScreenAwake: (value: boolean) => void;
  setAutoHideControls: (value: boolean) => void;
  setLibraryViewMode: (mode: LibraryViewMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: 'system',
      defaultReadingDirection: 'ltr',
      defaultReadingMode: 'single',
      defaultPageFit: 'width',
      keepScreenAwake: true,
      autoHideControls: true,
      libraryViewMode: 'grid',

      setAppearance: (appearance) => set({ appearance }),
      setDefaultReadingDirection: (defaultReadingDirection) => set({ defaultReadingDirection }),
      setDefaultReadingMode: (defaultReadingMode) => set({ defaultReadingMode }),
      setDefaultPageFit: (defaultPageFit) => set({ defaultPageFit }),
      setKeepScreenAwake: (keepScreenAwake) => set({ keepScreenAwake }),
      setAutoHideControls: (autoHideControls) => set({ autoHideControls }),
      setLibraryViewMode: (libraryViewMode) => set({ libraryViewMode }),
    }),
    {
      name: 'zlash.settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
