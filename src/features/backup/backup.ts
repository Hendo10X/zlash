import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';

import { addComicToCollection, createCollection } from '@/database/repositories/collections-repository';
import { restoreProgress } from '@/database/repositories/reading-progress-repository';
import { useLibraryStore } from '@/stores/library-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { ReadingStatus } from '@/types/reading';
import { generateId } from '@/utils/id';

/**
 * Library backup = reading progress, collections and settings, as JSON.
 * Comics are matched by file hash, so a backup restores onto a new device
 * once the same comic files have been imported there. The comic files
 * themselves are not included (they can be gigabytes).
 */
interface BackupFileV1 {
  app: 'zlash';
  version: 1;
  exportedAt: number;
  comics: { hash: string; title: string; filename: string }[];
  progress: { hash: string; currentPage: number; totalPages: number; lastReadAt: number | null; status: ReadingStatus }[];
  collections: { name: string; description?: string; hashes: string[] }[];
  settings: Record<string, unknown>;
}

const SETTINGS_KEYS = [
  'appearance',
  'defaultReadingDirection',
  'defaultReadingMode',
  'defaultPageFit',
  'keepScreenAwake',
  'autoHideControls',
  'libraryViewMode',
] as const;

export type BackupOutcome = { status: 'done'; message: string } | { status: 'cancelled' } | { status: 'error'; message: string };

function buildBackup(): BackupFileV1 {
  const { comics, collections } = useLibraryStore.getState();
  const settings = useSettingsStore.getState();
  const hashById = new Map(comics.map((c) => [c.id, c.fileHash]));
  return {
    app: 'zlash',
    version: 1,
    exportedAt: Date.now(),
    comics: comics.map((c) => ({ hash: c.fileHash, title: c.title, filename: c.originalFilename })),
    progress: comics
      .filter((c) => c.progress)
      .map((c) => ({
        hash: c.fileHash,
        currentPage: c.progress!.currentPage,
        totalPages: c.progress!.totalPages,
        lastReadAt: c.progress!.lastReadAt,
        status: c.progress!.status,
      })),
    collections: collections.map((col) => ({
      name: col.name,
      description: col.description,
      hashes: col.comicIds.map((id) => hashById.get(id)).filter((h): h is string => Boolean(h)),
    })),
    settings: Object.fromEntries(SETTINGS_KEYS.map((k) => [k, settings[k]])),
  };
}

export async function exportBackup(): Promise<BackupOutcome> {
  let dir: Directory;
  try {
    dir = await Directory.pickDirectoryAsync();
  } catch {
    return { status: 'cancelled' };
  }
  try {
    const backup = buildBackup();
    const date = new Date().toISOString().slice(0, 10);
    const file = dir.createFile(`zlash-backup-${date}.json`, 'application/json');
    await file.write(JSON.stringify(backup, null, 2));
    return {
      status: 'done',
      message: `Saved progress for ${backup.progress.length} ${backup.progress.length === 1 ? 'comic' : 'comics'} and ${backup.collections.length} ${backup.collections.length === 1 ? 'collection' : 'collections'}.`,
    };
  } catch {
    return { status: 'error', message: 'Couldn’t save the backup to that folder. Try a different one.' };
  }
}

export async function importBackup(): Promise<BackupOutcome> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (picked.canceled || picked.assets.length === 0) return { status: 'cancelled' };

  let backup: BackupFileV1;
  try {
    backup = JSON.parse(await new File(picked.assets[0].uri).text());
    if (backup?.app !== 'zlash' || backup.version !== 1) throw new Error('not a backup');
  } catch {
    return { status: 'error', message: 'That file isn’t a Zlash backup.' };
  }

  const store = useLibraryStore.getState();
  const idByHash = new Map(store.comics.map((c) => [c.fileHash, c.id]));

  try {
    let restoredProgress = 0;
    for (const p of backup.progress ?? []) {
      const comicId = idByHash.get(p.hash);
      if (!comicId) continue;
      await restoreProgress({ comicId, currentPage: p.currentPage, totalPages: p.totalPages, lastReadAt: p.lastReadAt, status: p.status });
      restoredProgress++;
    }

    let restoredCollections = 0;
    for (const col of backup.collections ?? []) {
      const existing = store.collections.find((c) => c.name.toLowerCase() === col.name.toLowerCase());
      const collectionId = existing?.id ?? generateId();
      if (!existing) await createCollection(collectionId, col.name, col.description);
      for (const hash of col.hashes) {
        const comicId = idByHash.get(hash);
        if (comicId) await addComicToCollection(collectionId, comicId);
      }
      restoredCollections++;
    }

    const settingsPatch: Record<string, unknown> = {};
    for (const key of SETTINGS_KEYS) {
      if (backup.settings && key in backup.settings) settingsPatch[key] = backup.settings[key];
    }
    useSettingsStore.setState(settingsPatch);

    await store.refresh();

    const missing = (backup.comics ?? []).filter((c) => !idByHash.has(c.hash)).length;
    return {
      status: 'done',
      message:
        `Restored progress for ${restoredProgress} ${restoredProgress === 1 ? 'comic' : 'comics'} and ${restoredCollections} ${restoredCollections === 1 ? 'collection' : 'collections'}.` +
        (missing > 0 ? ` ${missing} ${missing === 1 ? 'comic in the backup isn’t' : 'comics in the backup aren’t'} in your library yet — import them, then restore again.` : ''),
    };
  } catch {
    return { status: 'error', message: 'Something went wrong partway through restoring, so only part of the backup may have been applied.' };
  }
}
