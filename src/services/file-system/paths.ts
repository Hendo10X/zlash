import { Directory, File, Paths } from 'expo-file-system';

import type { Comic } from '@/types/comic';

const comicsRoot = () => new Directory(Paths.document, 'comics');
const coversRoot = () => new Directory(Paths.document, 'covers');
const readerCacheRoot = () => new Directory(Paths.cache, 'reader');

/** Creates the app's managed storage directories if they don't exist yet.
 * Safe to call repeatedly (idempotent). */
export function ensureStorageDirectories(): void {
  for (const dir of [comicsRoot(), coversRoot(), readerCacheRoot()]) {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  }
}

export function comicDirectory(comicId: string): Directory {
  return new Directory(comicsRoot(), comicId);
}

export function comicFile(comicId: string, format: Comic['format']): File {
  return new File(comicDirectory(comicId), `original.${format}`);
}

export function coverFile(comicId: string, extension = 'jpg'): File {
  return new File(coversRoot(), `${comicId}.${extension}`);
}

/** Root of the reader's decoded-page cache. Lives under `Paths.cache`, so the
 * OS may purge it at any time — everything in here must be re-derivable from
 * the original comic file. */
export function readerCacheRootDirectory(): Directory {
  return readerCacheRoot();
}

/** Decoded pages for one comic: `Paths.cache/reader/{id}/{pageIndex}.{ext}`. */
export function readerCacheDirectory(comicId: string): Directory {
  return new Directory(readerCacheRoot(), comicId);
}
