import type { File } from 'expo-file-system';
import { Dimensions, PixelRatio } from 'react-native';

import { createCachedPageSource } from '@/services/archive/cache-page-source';
import { ZlashNative } from '../../../modules/zlash-native';

export const PDF_UNAVAILABLE = 'Reading PDFs needs the latest Zlash build. Update the app to open this comic.';

function native() {
  if (!ZlashNative) throw new Error(PDF_UNAVAILABLE);
  return ZlashNative;
}

/** Render width in device pixels: the screen's long edge, so pages stay
 * sharp in landscape and when zoomed a little, capped to bound memory. */
export function pdfRenderWidth() {
  const { width, height } = Dimensions.get('window');
  return Math.min(2000, Math.round(Math.max(width, height) * PixelRatio.get()));
}

export async function pdfPageCount(file: File): Promise<number> {
  return native().pdfPageCount(file.uri);
}

export async function renderPdfPage(file: File, index: number, width: number, out: File) {
  await native().renderPdfPage(file.uri, index, width, out.uri);
}

export async function openPdfPageSource(comicId: string, file: File) {
  const pageCount = await pdfPageCount(file);
  if (pageCount === 0) throw new Error('This PDF has no pages.');
  const width = pdfRenderWidth();
  return createCachedPageSource({
    cacheKey: comicId,
    pageCount,
    // PdfRenderer allows one open page per document; renders are serial.
    concurrency: 1,
    extensionFor: () => 'jpg',
    produce: (i, part) => renderPdfPage(file, i, width, part),
  });
}
