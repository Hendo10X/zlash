import { File } from 'expo-file-system';

import { findComicByHash, getComicById, insertComic } from '@/database/repositories/comics-repository';
import { extractCbzCover } from '@/services/archive/cbz';
import { extractRarEntry, listRarPages, rarEntryExtension } from '@/services/archive/rar';
import { sniffArchive } from '@/services/archive/sniff';
import { comicDirectory, comicFile, coverFile, ensureStorageDirectories } from '@/services/file-system/paths';
import { detectFormat } from '@/services/metadata/format';
import { titleFromFilename } from '@/services/metadata/title';
import { estimatePdfPageCount } from '@/services/pdf/page-count';
import { pdfPageCount, renderPdfPage } from '@/services/pdf/pdf-page-source';
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
    // Trust the bytes, not the extension: plenty of ".cbr" files are ZIPs.
    const kind = format === 'pdf' ? 'pdf' : await sniffArchive(destFile);

    if (kind === 'zip') {
      const extracted = await extractCbzCover(destFile);
      const cover = coverFile(id, extracted.extension);
      await cover.write(extracted.bytes);
      pageCount = extracted.pageCount;
      coverPath = cover.uri;
    } else if (kind === 'rar') {
      const pages = await listRarPages(destFile);
      if (pages.length === 0) throw new Error('No image pages found in archive');
      const cover = coverFile(id, rarEntryExtension(pages[0]));
      await extractRarEntry(destFile, pages[0], cover);
      pageCount = pages.length;
      coverPath = cover.uri;
    } else if (kind === 'pdf') {
      try {
        pageCount = await pdfPageCount(destFile);
        const cover = coverFile(id, 'jpg');
        await renderPdfPage(destFile, 0, 600, cover);
        coverPath = cover.uri;
      } catch {
        // Older build without the native renderer: keep the import, use the
        // regex page count and a placeholder cover.
        pageCount = await estimatePdfPageCount(destFile);
      }
    } else {
      throw new Error('Unrecognised archive');
    }
  } catch (e) {
    try {
      comicDirectory(id).delete();
    } catch {}
    const message = e instanceof Error && /RAR5|latest Zlash build/.test(e.message) ? e.message : 'Could not read the comic contents';
    return { status: 'error', filename: picked.name, message };
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
