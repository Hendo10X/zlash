import { File } from 'expo-file-system';
import { create } from 'zustand';

import {
  addComicToCollection,
  createCollection as persistCreateCollection,
  deleteCollection as persistDeleteCollection,
  listCollections,
  removeComicFromCollection,
  renameCollection as persistRenameCollection,
  touchCollection,
} from '@/database/repositories/collections-repository';
import { deleteComic, getAllComics } from '@/database/repositories/comics-repository';
import {
  getAllProgress,
  saveProgress,
  setStatus as persistStatus,
} from '@/database/repositories/reading-progress-repository';
import { clearComicReaderCache } from '@/features/reader/reader-cache';
import { comicDirectory } from '@/services/file-system/paths';
import type { Collection } from '@/types/collection';
import type { LibraryComic } from '@/types/comic';
import type { LibrarySortKey, ReadingStatus } from '@/types/reading';
import { generateId } from '@/utils/id';
import { toneForId } from '@/utils/tone-for-id';

interface LibraryState {
  comics: LibraryComic[];
  collections: Collection[];
  isLoading: boolean;
  searchQuery: string;
  sortKey: LibrarySortKey;
  /** Library filter: null shows everything. */
  activeCollectionId: string | null;
  setSearchQuery: (query: string) => void;
  setSortKey: (key: LibrarySortKey) => void;
  setActiveCollection: (id: string | null) => void;
  /** Reloads comics, progress and collections from SQLite. */
  refresh: () => Promise<void>;
  updateProgress: (comicId: string, currentPage: number, totalPages: number, status?: ReadingStatus) => void;
  setStatus: (comicId: string, status: ReadingStatus) => void;
  removeComic: (comicId: string) => Promise<void>;
  removeComics: (comicIds: string[]) => Promise<void>;

  createCollection: (name: string) => Promise<string>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleComicInCollection: (collectionId: string, comicId: string) => Promise<void>;
}

function deleteComicFiles(comic: LibraryComic) {
  // The DB row is already gone — a dangling file on disk is a storage
  // leak, not a correctness problem, so failures here aren't fatal.
  try {
    comicDirectory(comic.id).delete();
  } catch {}
  clearComicReaderCache(comic.id);
  if (comic.coverPath) {
    try {
      new File(comic.coverPath).delete();
    } catch {}
  }
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  comics: [],
  collections: [],
  isLoading: true,
  searchQuery: '',
  sortKey: 'recent',
  activeCollectionId: null,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortKey: (sortKey) => set({ sortKey }),
  setActiveCollection: (activeCollectionId) => set({ activeCollectionId }),

  refresh: async () => {
    try {
      const [comics, progress, collections] = await Promise.all([getAllComics(), getAllProgress(), listCollections()]);
      const progressByComicId = new Map(progress.map((p) => [p.comicId, p]));
      const active = get().activeCollectionId;
      set({
        comics: comics.map((comic) => ({
          ...comic,
          progress: progressByComicId.get(comic.id),
          placeholderTone: toneForId(comic.id),
        })),
        collections,
        activeCollectionId: active && collections.some((c) => c.id === active) ? active : null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // Updates the in-memory copy immediately for a responsive reader, and
  // persists in the background — the reader doesn't need to wait on it.
  updateProgress: (comicId, currentPage, totalPages, status) => {
    const resolvedStatus = status ?? (currentPage >= totalPages - 1 ? 'completed' : 'reading');
    set((state) => ({
      comics: state.comics.map((c) =>
        c.id === comicId
          ? { ...c, progress: { comicId, currentPage, totalPages, lastReadAt: Date.now(), status: resolvedStatus } }
          : c
      ),
    }));
    saveProgress(comicId, currentPage, totalPages, resolvedStatus).catch(() => {});
  },

  setStatus: (comicId, status) => {
    set((state) => ({
      comics: state.comics.map((c) =>
        c.id === comicId
          ? {
              ...c,
              progress: c.progress
                ? { ...c.progress, status }
                : { comicId, currentPage: 0, totalPages: c.pageCount, lastReadAt: Date.now(), status },
            }
          : c
      ),
    }));
    persistStatus(comicId, status).catch(() => {});
  },

  removeComic: (comicId) => get().removeComics([comicId]),

  removeComics: async (comicIds) => {
    const ids = new Set(comicIds);
    const doomed = get().comics.filter((c) => ids.has(c.id));
    // Drop from memory first so every screen updates at once, even while
    // the files are still being deleted.
    set((state) => ({
      comics: state.comics.filter((c) => !ids.has(c.id)),
      collections: state.collections.map((col) => ({ ...col, comicIds: col.comicIds.filter((id) => !ids.has(id)) })),
    }));
    for (const comic of doomed) {
      try {
        await deleteComic(comic.id);
      } catch {}
      deleteComicFiles(comic);
    }
  },

  createCollection: async (name) => {
    const id = generateId();
    const trimmed = name.trim();
    await persistCreateCollection(id, trimmed);
    const now = Date.now();
    set((state) => ({ collections: [{ id, name: trimmed, createdAt: now, updatedAt: now, comicIds: [] }, ...state.collections] }));
    return id;
  },

  renameCollection: async (id, name) => {
    const trimmed = name.trim();
    await persistRenameCollection(id, trimmed);
    set((state) => ({ collections: state.collections.map((c) => (c.id === id ? { ...c, name: trimmed, updatedAt: Date.now() } : c)) }));
  },

  deleteCollection: async (id) => {
    await persistDeleteCollection(id);
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId,
    }));
  },

  toggleComicInCollection: async (collectionId, comicId) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const has = collection.comicIds.includes(comicId);
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, updatedAt: Date.now(), comicIds: has ? c.comicIds.filter((id) => id !== comicId) : [...c.comicIds, comicId] }
          : c
      ),
    }));
    if (has) await removeComicFromCollection(collectionId, comicId);
    else await addComicToCollection(collectionId, comicId);
    await touchCollection(collectionId);
  },
}));
