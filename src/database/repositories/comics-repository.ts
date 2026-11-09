import type { Comic } from '@/types/comic';

import { getDatabase } from '../client';

/** Raw shape of a `comics` row, as stored (snake_case, SQLite primitives). */
interface ComicRow {
  id: string;
  title: string;
  series: string | null;
  issue_number: string | null;
  original_filename: string;
  file_path: string;
  file_hash: string;
  cover_path: string | null;
  format: string;
  file_size: number;
  page_count: number;
  date_added: number;
  updated_at: number;
}

function rowToComic(row: ComicRow): Comic {
  return {
    id: row.id,
    title: row.title,
    series: row.series ?? undefined,
    issueNumber: row.issue_number ?? undefined,
    originalFilename: row.original_filename,
    filePath: row.file_path,
    coverPath: row.cover_path ?? undefined,
    format: row.format as Comic['format'],
    fileSize: row.file_size,
    pageCount: row.page_count,
    dateAdded: row.date_added,
    updatedAt: row.updated_at,
  };
}

export async function getAllComics(): Promise<Comic[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ComicRow>('SELECT * FROM comics ORDER BY date_added DESC;');
  return rows.map(rowToComic);
}

export async function getComicById(id: string): Promise<Comic | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ComicRow>('SELECT * FROM comics WHERE id = ?;', id);
  return row ? rowToComic(row) : null;
}

export async function findComicByHash(hash: string): Promise<Comic | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ComicRow>('SELECT * FROM comics WHERE file_hash = ?;', hash);
  return row ? rowToComic(row) : null;
}

export interface InsertComicInput extends Omit<Comic, 'dateAdded' | 'updatedAt'> {
  fileHash: string;
}

/** Inserts a newly-imported comic. Caller is responsible for the actual
 * file copy and duplicate-hash check (see `src/services/file-system`). */
export async function insertComic(input: InsertComicInput): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO comics
      (id, title, series, issue_number, original_filename, file_path, file_hash, cover_path, format, file_size, page_count, date_added, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    input.id,
    input.title,
    input.series ?? null,
    input.issueNumber ?? null,
    input.originalFilename,
    input.filePath,
    input.fileHash,
    input.coverPath ?? null,
    input.format,
    input.fileSize,
    input.pageCount,
    now,
    now
  );
}

export async function deleteComic(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM comics WHERE id = ?;', id);
}
