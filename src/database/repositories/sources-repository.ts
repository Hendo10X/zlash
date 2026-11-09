import { getDatabase } from '../client';

export interface SourceRow {
  id: string;
  name: string;
  url: string;
  username: string | null;
  created_at: number;
}

export async function listSources(): Promise<SourceRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<SourceRow>('SELECT * FROM sources ORDER BY created_at ASC;');
}

export async function upsertSource(row: Omit<SourceRow, 'created_at'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sources (id, name, url, username, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, url = excluded.url, username = excluded.username;`,
    row.id,
    row.name,
    row.url,
    row.username,
    Date.now()
  );
}

export async function deleteSource(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sources WHERE id = ?;', id);
}
