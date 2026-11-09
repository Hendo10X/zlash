import { requireOptionalNativeModule } from 'expo';

export interface RenderedPage {
  width: number;
  height: number;
}

interface ZlashNativeModule {
  /** Number of pages in a local PDF (`file://` URI). */
  pdfPageCount(uri: string): Promise<number>;
  /** Renders one PDF page (0-based) to a JPEG at `outUri`, `targetWidth` px wide. */
  renderPdfPage(uri: string, index: number, targetWidth: number, outUri: string): Promise<RenderedPage>;
  /** Every file entry name in a local RAR archive, in archive order. */
  listRarEntries(uri: string): Promise<string[]>;
  /** Extracts one RAR entry to `outUri`. */
  extractRarEntry(uri: string, entryName: string, outUri: string): Promise<void>;
}

/**
 * Zlash's own native helpers (see `android/`). `null` when the running
 * binary doesn't include them — e.g. Expo Go, iOS, or an APK built before
 * this module existed — so callers can show a clear message instead of
 * crashing.
 */
export const ZlashNative = requireOptionalNativeModule<ZlashNativeModule>('ZlashNative');
