import { File } from 'expo-file-system';
import { create } from 'zustand';

import { deleteComic, getAllComics } from '@/database/repositories/comics-repository';
import {
  getAllProgress,
  saveProgress,
  setStatus as persistStatus,
} from '@/database/repositories/reading-progress-repository';
import { clearComicReaderCache } from '@/features/reader/reader-cache';
import { comicDirectory } from '@/services/file-system/paths';
import type { LibraryComic } from '@/types/comic';
import type { LibrarySortKey, ReadingStatus } from '@/types/reading';
import { toneForId } from '@/utils/tone-for-id';

interface LibraryState {
  comics: LibraryComic[];
  isLoading: boolean;
  searchQuery: string;
  sortKey: LibrarySortKey;
  setSearchQuery: (query: string) => void;
  setSortKey: (key: LibrarySortKey) => void;
  /** Reloads `comics` from SQLite. Call after import, delete, or any
   * reading-status change that didn't already update the in-memory copy. */
  refresh: () => Promise<void>;
  updateProgress: (comicId: string, currentPage: number, totalPages: number, status?: ReadingStatus) => void;
  setStatus: (comicId: string, status: ReadingStatus) => void;
  removeComic: (comicId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  comics: [],
  isLoading: true,
  searchQuery: '',
  sortKey: 'recent',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortKey: (sortKey) => set({ sortKey }),

  refresh: async () => {
    const [comics, progress] = await Promise.all([getAllComics(), getAllProgress()]);
    const progressByComicId = new Map(progress.map((p) => [p.comicId, p]));
    set({
      comics: comics.map((comic) => ({
        ...comic,
        progress: progressByComicId.get(comic.id),
        placeholderTone: toneForId(comic.id),
      })),
      isLoading: false,
    });
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

  removeComic: async (comicId) => {
    const comic = get().comics.find((c) => c.id === comicId);
    await deleteComic(comicId);
    if (comic) {
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
    set((state) => ({ comics: state.comics.filter((c) => c.id !== comicId) }));
  },
}));
