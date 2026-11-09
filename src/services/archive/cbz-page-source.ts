import { File } from 'expo-file-system';

import { readerCacheDirectory } from '@/services/file-system/paths';
import {
  createLimiter,
  type PageDimensions,
  type PageSource,
  PageSourceClosedError,
} from '@/services/reader/page-source';

import { readCbz } from './cbz';

const DECODE_CONCURRENCY = 2;

/**
 * Opens a CBZ for reading. The archive's central directory is parsed once
 * (JSZip, whole file in memory — see `readCbz`), and individual pages are
 * inflated on demand and written to the reader cache, so `expo-image` can
 * decode them natively from a file URI instead of us shuttling base64
 * through the JS bridge. Pages already in the cache from a previous session
 * are served without touching the archive at all.
 */
export async function openCbzPageSource(comicId: string, file: File): Promise<PageSource> {
  const { pages } = await readCbz(file);
  if (pages.length === 0) {
    throw new Error('No image pages found in archive');
  }

  const dir = readerCacheDirectory(comicId);
  const limit = createLimiter(DECODE_CONCURRENCY);
  const inflight = new Map<number, Promise<string>>();
  const dimensions = new Map<number, PageDimensions>();
  let closed = false;

  const ensureDir = () => {
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  };

  const targetFor = (index: number) => {
    const ext = pages[index].name.split('.').pop()?.toLowerCase() ?? 'jpg';
    return new File(dir, `${index}.${ext}`);
  };

  const decode = async (index: number): Promise<string> => {
    if (closed) throw new PageSourceClosedError();
    const target = targetFor(index);
    if (target.exists) return target.uri;

    const bytes = await pages[index].async('uint8array');
    if (closed) throw new PageSourceClosedError();

    // Write to a temp name and rename, so a crash mid-write never leaves a
    // truncated image that a later session would treat as a cache hit.
    ensureDir();
    const part = new File(dir, `${index}.part`);
    await part.write(bytes);
    await part.move(target, { overwrite: true });
    return target.uri;
  };

  return {
    pageCount: pages.length,
    dimensions,

    getPageUri(index) {
      if (closed) return Promise.reject(new PageSourceClosedError());
      if (index < 0 || index >= pages.length) {
        return Promise.reject(new RangeError(`Page ${index} out of range (0–${pages.length - 1})`));
      }

      const cached = targetFor(index);
      if (cached.exists) return Promise.resolve(cached.uri);

      let pending = inflight.get(index);
      if (!pending) {
        pending = limit(() => decode(index)).finally(() => inflight.delete(index));
        inflight.set(index, pending);
      }
      return pending;
    },

    close() {
      closed = true;
      inflight.clear();
      dimensions.clear();
    },
  };
}
