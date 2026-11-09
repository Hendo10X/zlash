import type { File } from 'expo-file-system';

import { ZlashNative } from '../../../modules/zlash-native';
import { naturalCompare } from '@/utils/natural-sort';

import { createCachedPageSource } from './cache-page-source';

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|bmp)$/i;

export const RAR_UNAVAILABLE =
  'Reading RAR-based CBR files needs the latest Zlash build. Update the app, or re-pack this comic as CBZ.';

function native() {
  if (!ZlashNative) throw new Error(RAR_UNAVAILABLE);
  return ZlashNative;
}

/** Image entries of a RAR archive, in natural reading order. */
export async function listRarPages(file: File): Promise<string[]> {
  const entries = await native().listRarEntries(file.uri);
  return entries.filter((name) => !name.startsWith('__MACOSX') && IMAGE_EXTENSION.test(name)).sort(naturalCompare);
}

export async function extractRarEntry(file: File, entry: string, out: File) {
  await native().extractRarEntry(file.uri, entry, out.uri);
}

const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? 'jpg';

export async function openRarPageSource(comicId: string, file: File) {
  const pages = await listRarPages(file);
  if (pages.length === 0) throw new Error('No image pages found in archive');
  return createCachedPageSource({
    cacheKey: comicId,
    pageCount: pages.length,
    concurrency: 2,
    extensionFor: (i) => ext(pages[i]),
    produce: (i, part) => extractRarEntry(file, pages[i], part),
  });
}

export function rarEntryExtension(name: string) {
  return ext(name);
}
