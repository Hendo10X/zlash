import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { useState } from 'react';

import { detectFormat } from '@/services/metadata/format';
import { useLibraryStore } from '@/stores/library-store';

import { importComicFile, type PickedFile } from './import-comic';

export type ImportItemStatus = 'pending' | 'working' | 'success' | 'duplicate' | 'unsupported' | 'error';

export interface ImportItem {
  key: string;
  name: string;
  status: ImportItemStatus;
  detail?: string;
}

/** How deep "Import a folder" looks into subfolders (series/volume layouts). */
const MAX_FOLDER_DEPTH = 3;

function collectComicFiles(dir: Directory, depth: number, out: PickedFile[]) {
  for (const entry of dir.list()) {
    if (entry instanceof Directory) {
      if (depth < MAX_FOLDER_DEPTH) collectComicFiles(entry, depth + 1, out);
    } else if (entry instanceof File && detectFormat(entry.name)) {
      out.push({ uri: entry.uri, name: entry.name, size: entry.size ?? 0 });
    }
  }
}

/**
 * Picking + sequential import with live per-file status. Shared by the
 * import sheet; the actual import of one file lives in `import-comic.ts`.
 */
export function useImportQueue() {
  const refresh = useLibraryStore((s) => s.refresh);
  const [items, setItems] = useState<ImportItem[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const patchItem = (key: string, patch: Partial<ImportItem>) =>
    setItems((current) => current?.map((item) => (item.key === key ? { ...item, ...patch } : item)) ?? current);

  const run = async (files: PickedFile[]) => {
    const initial: ImportItem[] = files.map((file, index) => ({ key: `${index}-${file.name}`, name: file.name, status: 'pending' }));
    setItems(initial);
    setIsRunning(true);

    // Sequential on purpose — each import can briefly hold a whole archive
    // in memory, so parallel imports would stack those peaks.
    for (const [index, item] of initial.entries()) {
      patchItem(item.key, { status: 'working' });
      let outcome;
      try {
        outcome = await importComicFile(files[index]);
      } catch {
        outcome = { status: 'error' as const, filename: item.name, message: 'Something went wrong importing this file' };
      }
      switch (outcome.status) {
        case 'success':
          patchItem(item.key, { status: 'success', detail: 'Added to your library' });
          break;
        case 'duplicate':
          patchItem(item.key, { status: 'duplicate', detail: `Already in your library as “${outcome.existing.title}”` });
          break;
        case 'unsupported':
          patchItem(item.key, { status: 'unsupported', detail: `.${outcome.filename.split('.').pop()} files aren’t supported` });
          break;
        case 'error':
          patchItem(item.key, { status: 'error', detail: outcome.message });
          break;
      }
    }

    setIsRunning(false);
    await refresh();
  };

  const pickFiles = async () => {
    setMessage(null);
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
    if (result.canceled || result.assets.length === 0) return;
    await run(result.assets.map((a) => ({ uri: a.uri, name: a.name, size: a.size ?? 0 })));
  };

  const pickFolder = async () => {
    setMessage(null);
    let dir: Directory;
    try {
      dir = await Directory.pickDirectoryAsync();
    } catch {
      return; // picker cancelled
    }
    const files: PickedFile[] = [];
    try {
      collectComicFiles(dir, 0, files);
    } catch {
      setMessage('Zlash couldn’t read that folder. Try picking the files directly instead.');
      return;
    }
    if (files.length === 0) {
      setMessage('No CBZ, CBR or PDF files were found in that folder.');
      return;
    }
    await run(files);
  };

  const reset = () => {
    setItems(null);
    setMessage(null);
  };

  return { items, isRunning, message, pickFiles, pickFolder, reset };
}
