/** Pixel dimensions of a decoded page, as reported by the image decoder. */
export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * A format-agnostic handle on an opened comic's pages. The reader only ever
 * talks to this interface, so adding PDF/CBR rendering means adding another
 * implementation — the reader screen doesn't change.
 */
export interface PageSource {
  /** Authoritative page count from the opened file (may differ from the
   * count stored at import time if the file was re-imported or changed). */
  readonly pageCount: number;
  /** Resolves to a local `file://` URI an `<Image>` can display. Concurrent
   * calls for the same page share one decode. */
  getPageUri(index: number): Promise<string>;
  /** Decoded dimensions cache, filled in by the reader as pages load, so
   * re-mounted pages (FlatList recycling, mode switches) don't jump in size. */
  readonly dimensions: Map<number, PageDimensions>;
  /** Releases the in-memory archive and cancels queued decodes. */
  close(): void;
}

export class PageSourceClosedError extends Error {
  constructor() {
    super('Page source was closed');
  }
}

/** Runs at most `concurrency` async tasks at a time. Page decoding happens on
 * the JS thread (JSZip inflate), so unbounded parallelism just makes every
 * page — including the one on screen — arrive later. */
export function createLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (active >= concurrency) return;
    const run = queue.shift();
    if (run) run();
  };

  return function limit<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        active++;
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
  };
}
