import { File } from 'expo-file-system';

import { findComicByHash, getComicById, insertComic } from '@/database/repositories/comics-repository';
import { extractCbzCover } from '@/services/archive/cbz';
import { comicDirectory, comicFile, coverFile, ensureStorageDirectories } from '@/services/file-system/paths';
import { detectFormat } from '@/services/metadata/format';
import { titleFromFilename } from '@/services/metadata/title';
import { estimatePdfPageCount } from '@/services/pdf/page-count';
import type { Comic } from '@/types/comic';
import { generateId } from '@/utils/id';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
}

export type ImportResult =
  | { status: 'success'; comic: Comic }
  | { status: 'duplicate'; filename: string; existing: Comic }
  | { status: 'unsupported'; filename: string }
  | { status: 'error'; filename: string; message: string };

/**
 * Imports one picked file into Zlash's managed library: validates the
 * format, hashes it for duplicate detection, copies it into app storage,
 * extracts what metadata it can, and inserts the database record.
 *
 * Mirrors the "Import Service Responsibilities" in the product spec (§11).
 * Never touches the original picked file beyond reading it.
 */
export async function importComicFile(picked: PickedFile): Promise<ImportResult> {
  const format = detectFormat(picked.name);
  if (!format) {
    return { status: 'unsupported', filename: picked.name };
  }

  ensureStorageDirectories();

  const sourceFile = new File(picked.uri);
  let hash: string;
  try {
    hash = await sourceFile.digest('SHA-256');
  } catch {
    return { status: 'error', filename: picked.name, message: 'Could not read the file' };
  }

  const existing = await findComicByHash(hash);
  if (existing) {
    return { status: 'duplicate', filename: picked.name, existing };
  }

  const id = generateId();
  const destFile = comicFile(id, format);

  try {
    comicDirectory(id).create({ intermediates: true, idempotent: true });
    await sourceFile.copy(destFile);
  } catch {
    return { status: 'error', filename: picked.name, message: 'Could not copy the file into your library' };
  }

  let pageCount = 0;
  let coverPath: string | undefined;

  try {
    if (format === 'cbz') {
      const extracted = await extractCbzCover(destFile);
      const cover = coverFile(id, extracted.extension);
      await cover.write(extracted.bytes);
      pageCount = extracted.pageCount;
      coverPath = cover.uri;
    } else if (format === 'pdf') {
      pageCount = await estimatePdfPageCount(destFile);
    }
    // CBR: page count and cover stay unknown until RAR extraction is
    // implemented — the file still imports successfully (see
    // docs/ROADMAP-STATUS.md).
  } catch {
    comicDirectory(id).delete();
    return { status: 'error', filename: picked.name, message: 'Could not read the comic contents' };
  }

  await insertComic({
    id,
    title: titleFromFilename(picked.name),
    originalFilename: picked.name,
    filePath: destFile.uri,
    fileHash: hash,
    coverPath,
    format,
    fileSize: picked.size,
    pageCount,
  });

  const comic = await getComicById(id);
  if (!comic) {
    return { status: 'error', filename: picked.name, message: 'Import succeeded but the record could not be read back' };
  }

  return { status: 'success', comic };
}
