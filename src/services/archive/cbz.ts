import type { File } from 'expo-file-system';
// The default `jszip` entry pulls in Node-only modules Metro can't resolve —
// import the self-contained browserify bundle instead. See
// `src/types/jszip-dist.d.ts`.
import JSZip from 'jszip/dist/jszip.min.js';

import { naturalCompare } from '@/utils/natural-sort';

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|bmp)$/i;

export interface CbzContents {
  zip: JSZip;
  /** Image entries only, in natural reading order. */
  pages: JSZip.JSZipObject[];
}

/**
 * Loads a CBZ file and returns its page entries in natural order.
 *
 * Loads the whole archive into memory via JSZip, which is fine for typical
 * comic sizes but not infinite — a native streaming unzip would be the
 * Phase 4 upgrade if very large archives turn out to be a problem.
 */
export async function readCbz(file: File): Promise<CbzContents> {
  const bytes = await file.bytes();
  const zip = await JSZip.loadAsync(bytes);

  const pages = Object.values(zip.files)
    .filter((entry) => !entry.dir && !entry.name.startsWith('__MACOSX') && IMAGE_EXTENSION.test(entry.name))
    .sort((a, b) => naturalCompare(a.name, b.name));

  return { zip, pages };
}

export interface ExtractedCover {
  pageCount: number;
  /** The actual image extension found in the archive (e.g. 'png', 'jpg') —
   * the caller should use this rather than assuming one, since the cover
   * bytes are written as-is, not re-encoded. */
  extension: string;
  bytes: Uint8Array;
}

/** Reads the first page as the comic's cover and the total page count.
 * Writing it to disk is the caller's job (see `comicFile`/`coverFile` in
 * `services/file-system/paths.ts`), since this module only knows about
 * archive contents, not managed storage layout. */
export async function extractCbzCover(sourceFile: File): Promise<ExtractedCover> {
  const { pages } = await readCbz(sourceFile);
  if (pages.length === 0) {
    throw new Error('No image pages found in archive');
  }

  const extension = pages[0].name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const bytes = await pages[0].async('uint8array');

  return { pageCount: pages.length, extension, bytes };
}
