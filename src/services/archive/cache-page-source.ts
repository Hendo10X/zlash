import { File } from 'expo-file-system';

import { readerCacheDirectory } from '@/services/file-system/paths';
import { createLimiter, type PageDimensions, type PageSource, PageSourceClosedError } from '@/services/reader/page-source';

/**
 * Shared shell for page sources that produce each page as a file in the
 * reader cache (`Paths.cache/reader/{cacheKey}/{index}.{ext}`): a cache hit
 * is served straight from disk, misses run `produce` with bounded
 * concurrency, and concurrent requests for the same page share one run.
 * `produce` writes to the `.part` file it's given; it's renamed into place
 * only once complete, so a crash never leaves a truncated page behind.
 */
export function createCachedPageSource(options: {
  cacheKey: string;
  pageCount: number;
  concurrency: number;
  extensionFor: (index: number) => string;
  produce: (index: number, part: File) => Promise<void>;
  onClose?: () => void;
}): PageSource {
  const { cacheKey, pageCount, concurrency, extensionFor, produce } = options;
  const dir = readerCacheDirectory(cacheKey);
  const limit = createLimiter(concurrency);
  const inflight = new Map<number, Promise<string>>();
  const dimensions = new Map<number, PageDimensions>();
  let closed = false;

  const targetFor = (index: number) => new File(dir, `${index}.${extensionFor(index)}`);

  const run = async (index: number) => {
    if (closed) throw new PageSourceClosedError();
    const target = targetFor(index);
    if (target.exists) return target.uri;
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const part = new File(dir, `${index}.part`);
    await produce(index, part);
    if (closed) throw new PageSourceClosedError();
    await part.move(target, { overwrite: true });
    return target.uri;
  };

  return {
    pageCount,
    dimensions,
    getPageUri(index) {
      if (closed) return Promise.reject(new PageSourceClosedError());
      if (index < 0 || index >= pageCount) {
        return Promise.reject(new RangeError(`Page ${index} out of range (0–${pageCount - 1})`));
      }
      const cached = targetFor(index);
      if (cached.exists) return Promise.resolve(cached.uri);
      let pending = inflight.get(index);
      if (!pending) {
        pending = limit(() => run(index)).finally(() => inflight.delete(index));
        inflight.set(index, pending);
      }
      return pending;
    },
    close() {
      closed = true;
      inflight.clear();
      options.onClose?.();
    },
  };
}
