import { Directory, File, Paths } from 'expo-file-system';

import { type ImportResult, importComicFile } from '@/features/importer/import-comic';
import { authHeaders, importableFormat, type OpdsCredentials, type OpdsEntry } from '@/services/opds/opds';
import { useLibraryStore } from '@/stores/library-store';

/** Best importable acquisition link for an entry, preferring CBZ. */
export function downloadableAcquisition(entry: OpdsEntry) {
  const options = entry.acquisitions.map((a) => ({ acq: a, format: importableFormat(a) })).filter((o) => o.format);
  const rank = { cbz: 0, cbr: 1, pdf: 2 } as const;
  options.sort((a, b) => rank[a.format!] - rank[b.format!]);
  return options[0] as { acq: OpdsEntry['acquisitions'][number]; format: 'cbz' | 'cbr' | 'pdf' } | undefined;
}

function safeFilename(title: string) {
  return title.replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'comic';
}

/** Downloads an OPDS entry and runs it through the normal import pipeline. */
export async function downloadToLibrary(entry: OpdsEntry, creds?: OpdsCredentials): Promise<ImportResult> {
  const choice = downloadableAcquisition(entry);
  const name = `${safeFilename(entry.title)}.${choice?.format ?? 'cbz'}`;
  if (!choice) return { status: 'unsupported', filename: name };

  const dir = new Directory(Paths.cache, 'downloads');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const temp = new File(dir, name);

  try {
    if (temp.exists) temp.delete();
    await File.downloadFileAsync(choice.acq.url, temp, { headers: authHeaders(creds), idempotent: true });
  } catch {
    return { status: 'error', filename: name, message: 'The download failed. Check your connection and try again.' };
  }

  try {
    const result = await importComicFile({ uri: temp.uri, name, size: temp.size ?? 0 });
    if (result.status === 'success') await useLibraryStore.getState().refresh();
    return result;
  } finally {
    try {
      temp.delete();
    } catch {}
  }
}
