import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Single MMKV instance used for all local app preferences (appearance,
 * reading defaults, library view options, etc). Reading progress and
 * comic metadata live in SQLite instead — see `src/database`.
 */
export const preferencesStorage = createMMKV({ id: 'zlash.preferences' });

/** Adapter so zustand's `persist` middleware can read/write through MMKV. */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => preferencesStorage.set(name, value),
  getItem: (name) => preferencesStorage.getString(name) ?? null,
  removeItem: (name) => preferencesStorage.remove(name),
};
