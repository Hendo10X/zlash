import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deleteSource, listSources, upsertSource } from '@/database/repositories/sources-repository';
import type { OpdsCredentials, OpdsEntry } from '@/services/opds/opds';
import type { Source } from '@/types/source';
import { generateId } from '@/utils/id';

import { zustandMMKVStorage } from './mmkv';

const passwordKey = (id: string) => `zlash.source.${id}.password`;

interface SourcesState {
  sources: Source[];
  loaded: boolean;
  /** Entries seen while browsing, so detail/reader screens can open one by
   * key without refetching the feed. In memory only. */
  entries: Record<string, OpdsEntry>;
  load: () => Promise<void>;
  saveSource: (input: Omit<Source, 'id'> & { id?: string }) => Promise<string>;
  removeSource: (id: string) => Promise<void>;
  rememberEntries: (entries: OpdsEntry[]) => void;
}

export const useSourcesStore = create<SourcesState>((set, get) => ({
  sources: [],
  loaded: false,
  entries: {},

  load: async () => {
    try {
      const rows = await listSources();
      const sources = await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          name: row.name,
          url: row.url,
          username: row.username ?? undefined,
          password: (await SecureStore.getItemAsync(passwordKey(row.id)).catch(() => null)) ?? undefined,
        }))
      );
      set({ sources, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  saveSource: async (input) => {
    const id = input.id ?? generateId();
    await upsertSource({ id, name: input.name, url: input.url, username: input.username || null });
    if (input.password) await SecureStore.setItemAsync(passwordKey(id), input.password);
    else await SecureStore.deleteItemAsync(passwordKey(id)).catch(() => {});
    const source: Source = { id, name: input.name, url: input.url, username: input.username || undefined, password: input.password || undefined };
    set((state) => ({
      sources: state.sources.some((s) => s.id === id) ? state.sources.map((s) => (s.id === id ? source : s)) : [...state.sources, source],
    }));
    return id;
  },

  removeSource: async (id) => {
    await deleteSource(id);
    await SecureStore.deleteItemAsync(passwordKey(id)).catch(() => {});
    set((state) => ({ sources: state.sources.filter((s) => s.id !== id) }));
  },

  rememberEntries: (entries) => {
    const next = { ...get().entries };
    for (const e of entries) next[e.key] = e;
    set({ entries: next });
  },
}));

export function credentialsFor(source?: Source): OpdsCredentials | undefined {
  return source?.username ? { username: source.username, password: source.password } : undefined;
}

/** Where you left off in comics read online, keyed by stream URL template. */
export interface StreamProgress {
  page: number;
  total: number;
  title: string;
  sourceId: string;
  entryKey: string;
  lastReadAt: number;
  /** Kept so the comic can be resumed straight from Browse. */
  entry: OpdsEntry;
}

interface StreamProgressState {
  progress: Record<string, StreamProgress>;
  save: (template: string, value: StreamProgress) => void;
}

export const useStreamProgressStore = create<StreamProgressState>()(
  persist(
    (set) => ({
      progress: {},
      save: (template, value) => set((state) => ({ progress: { ...state.progress, [template]: value } })),
    }),
    { name: 'zlash.stream-progress', storage: createJSONStorage(() => zustandMMKVStorage) }
  )
);
