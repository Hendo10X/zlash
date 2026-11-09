import { Directory, File } from 'expo-file-system';

import { readerCacheDirectory, readerCacheRootDirectory } from '@/services/file-system/paths';

/** How many comics' decoded pages to keep on disk besides the one being
 * opened. Decoded pages are roughly the size of the original archive, so an
 * unbounded cache would quietly double the app's storage footprint. */
const MAX_CACHED_COMICS = 3;

function sizeOf(entry: Directory | File): number {
  if (entry instanceof File) return entry.size ?? 0;
  try {
    return entry.list().reduce((sum, child) => sum + sizeOf(child), 0);
  } catch {
    return 0;
  }
}

/** Total bytes used by decoded reader pages across all comics. */
export function getReaderCacheSize(): number {
  const root = readerCacheRootDirectory();
  return root.exists ? sizeOf(root) : 0;
}

/** Deletes every decoded page. Pages are re-decoded from the original
 * comic files on demand, so this never loses user data. */
export function clearReaderCache(): void {
  const root = readerCacheRootDirectory();
  try {
    if (root.exists) root.delete();
  } catch {}
  root.create({ intermediates: true, idempotent: true });
}

export function clearComicReaderCache(comicId: string): void {
  try {
    const dir = readerCacheDirectory(comicId);
    if (dir.exists) dir.delete();
  } catch {}
}

/** Keeps only the most recently touched comics' page caches, never evicting
 * `keepComicId` (the comic being opened). Best-effort: failures are ignored
 * since the OS can purge `Paths.cache` anyway. */
export function pruneReaderCache(keepComicId: string): void {
  const root = readerCacheRootDirectory();
  if (!root.exists) return;

  try {
    const others = root
      .list()
      .filter((e): e is Directory => e instanceof Directory && e.name !== keepComicId)
      .map((dir) => ({ dir, mtime: dir.info().modificationTime ?? 0 }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const { dir } of others.slice(MAX_CACHED_COMICS)) {
      try {
        dir.delete();
      } catch {}
    }
  } catch {}
}
