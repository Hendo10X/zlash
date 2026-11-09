import { File } from 'expo-file-system';

import { updateComicMetadata } from '@/database/repositories/comics-repository';
import { extractCbzCover } from '@/services/archive/cbz';
import { extractRarEntry, listRarPages, rarEntryExtension } from '@/services/archive/rar';
import { sniffArchive } from '@/services/archive/sniff';
import { coverFile } from '@/services/file-system/paths';
import { pdfPageCount, renderPdfPage } from '@/services/pdf/pdf-page-source';
import { useLibraryStore } from '@/stores/library-store';

import { ZlashNative } from '../../../modules/zlash-native';

let running = false;

/**
 * Comics imported before CBR/PDF reading existed have no cover and a page
 * count of 0. Once per app start, quietly fill those in, one at a time.
 */
export async function backfillMissingMetadata() {
  if (running) return;
  running = true;
  try {
    const targets = useLibraryStore.getState().comics.filter((c) => c.pageCount === 0 || !c.coverPath);
    let changed = false;
    for (const comic of targets) {
      const file = new File(comic.filePath);
      if (!file.exists) continue;
      try {
        const kind = comic.format === 'pdf' ? 'pdf' : await sniffArchive(file);
        if (kind === 'zip') {
          const extracted = await extractCbzCover(file);
          const cover = coverFile(comic.id, extracted.extension);
          await cover.write(extracted.bytes);
          await updateComicMetadata(comic.id, { pageCount: extracted.pageCount, coverPath: cover.uri });
          changed = true;
        } else if (kind === 'rar' && ZlashNative) {
          const pages = await listRarPages(file);
          if (pages.length === 0) continue;
          const cover = coverFile(comic.id, rarEntryExtension(pages[0]));
          await extractRarEntry(file, pages[0], cover);
          await updateComicMetadata(comic.id, { pageCount: pages.length, coverPath: cover.uri });
          changed = true;
        } else if (kind === 'pdf' && ZlashNative) {
          const pageCount = await pdfPageCount(file);
          const cover = coverFile(comic.id, 'jpg');
          await renderPdfPage(file, 0, 600, cover);
          await updateComicMetadata(comic.id, { pageCount, coverPath: cover.uri });
          changed = true;
        }
      } catch {
        // Unreadable (e.g. RAR5) — leave it; the reader shows the reason.
      }
    }
    if (changed) await useLibraryStore.getState().refresh();
  } finally {
    running = false;
  }
}
