import type { Collection } from '@/types/collection';

import { getDatabase } from '../client';

interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}

export async function listCollections(): Promise<Collection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CollectionRow>(
    'SELECT * FROM collections ORDER BY updated_at DESC;'
  );
  const collections: Collection[] = [];
  for (const row of rows) {
    const comicIdRows = await db.getAllAsync<{ comic_id: string }>(
      'SELECT comic_id FROM collection_comics WHERE collection_id = ?;',
      row.id
    );
    collections.push({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      comicIds: comicIdRows.map((r) => r.comic_id),
    });
  }
  return collections;
}

export async function createCollection(id: string, name: string, description?: string) {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO collections (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
    id,
    name,
    description ?? null,
    now,
    now
  );
}

export async function addComicToCollection(collectionId: string, comicId: string) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO collection_comics (collection_id, comic_id, added_at) VALUES (?, ?, ?);`,
    collectionId,
    comicId,
    Date.now()
  );
}

export async function removeComicFromCollection(collectionId: string, comicId: string) {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM collection_comics WHERE collection_id = ? AND comic_id = ?;',
    collectionId,
    comicId
  );
}
