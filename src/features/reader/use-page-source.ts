import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';

import { openCbzPageSource } from '@/services/archive/cbz-page-source';
import { openRarPageSource } from '@/services/archive/rar';
import { sniffArchive } from '@/services/archive/sniff';
import { openPdfPageSource } from '@/services/pdf/pdf-page-source';
import { type PageSource, PageSourceClosedError } from '@/services/reader/page-source';
import type { Comic } from '@/types/comic';

import { pruneReaderCache } from './reader-cache';

export type PageSourceState =
  | { status: 'loading' }
  | { status: 'ready'; source: PageSource }
  | { status: 'unsupported'; message: string }
  | { status: 'error'; message: string };

/** Picks the reader for a library file by its actual bytes. */
async function openLocalPageSource(comicId: string, format: Comic['format'], file: File): Promise<PageSource> {
  const kind = format === 'pdf' ? 'pdf' : await sniffArchive(file);
  switch (kind) {
    case 'zip':
      return openCbzPageSource(comicId, file);
    case 'rar':
      return openRarPageSource(comicId, file);
    case 'pdf':
      return openPdfPageSource(comicId, file);
    default:
      throw new Error('This file isn’t a comic archive Zlash can read.');
  }
}

/** Opens the comic's file for reading for as long as the reader is mounted. */
export function usePageSource(comic: Pick<Comic, 'id' | 'format' | 'filePath'> | undefined): PageSourceState {
  const comicId = comic?.id;
  const format = comic?.format;
  const filePath = comic?.filePath;
  const key = `${comicId}:${filePath}`;

  // Tagged with the comic it belongs to, so switching comics reads as
  // "loading" immediately instead of briefly showing the previous source.
  const [result, setResult] = useState<{ key: string; state: PageSourceState } | null>(null);

  useEffect(() => {
    if (!comicId || !format || !filePath) return;

    let cancelled = false;
    let opened: PageSource | undefined;
    const setState = (state: PageSourceState) => setResult({ key, state });

    (async () => {
      try {
        const file = new File(filePath);
        if (!file.exists) throw new Error('The comic file is missing from your library storage.');
        pruneReaderCache(comicId);
        const source = await openLocalPageSource(comicId, format, file);
        if (cancelled) {
          source.close();
          return;
        }
        opened = source;
        setState({ status: 'ready', source });
      } catch (e) {
        if (!cancelled) {
          setState({ status: 'error', message: e instanceof Error ? e.message : 'Could not open this comic.' });
        }
      }
    })();

    return () => {
      cancelled = true;
      opened?.close();
    };
  }, [key, comicId, format, filePath]);

  if (!result || result.key !== key) return { status: 'loading' };
  return result.state;
}

/** Resolves one page's local image URI, decoding it on first request. */
export function usePageUri(source: PageSource, index: number): { uri: string | null; error: boolean } {
  const [result, setResult] = useState<{ index: number; uri: string | null; error: boolean }>({
    index,
    uri: null,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    source.getPageUri(index).then(
      (uri) => !cancelled && setResult({ index, uri, error: false }),
      (e) => !cancelled && !(e instanceof PageSourceClosedError) && setResult({ index, uri: null, error: true })
    );
    return () => {
      cancelled = true;
    };
  }, [source, index]);

  // Don't flash the previous page's image when a recycled cell gets a new index.
  return result.index === index ? result : { uri: null, error: false };
}
