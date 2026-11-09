import type { ReadingProgress } from '@/types/comic';
import type { ReadingStatus } from '@/types/reading';

import { getDatabase } from '../client';

interface ReadingProgressRow {
  comic_id: string;
  current_page: number;
  total_pages: number;
  last_read_at: number | null;
  status: string;
}

function rowToProgress(row: ReadingProgressRow): ReadingProgress {
  return {
    comicId: row.comic_id,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    lastReadAt: row.last_read_at,
    status: row.status as ReadingStatus,
  };
}

export async function getProgress(comicId: string): Promise<ReadingProgress | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReadingProgressRow>(
    'SELECT * FROM reading_progress WHERE comic_id = ?;',
    comicId
  );
  return row ? rowToProgress(row) : null;
}

export async function getAllProgress(): Promise<ReadingProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReadingProgressRow>('SELECT * FROM reading_progress;');
  return rows.map(rowToProgress);
}

/** Debounced/checkpointed by the reader — not meant to be called every frame. */
export async function saveProgress(
  comicId: string,
  currentPage: number,
  totalPages: number,
  status: ReadingStatus = 'reading'
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO reading_progress (comic_id, current_page, total_pages, last_read_at, status)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(comic_id) DO UPDATE SET
       current_page = excluded.current_page,
       total_pages = excluded.total_pages,
       last_read_at = excluded.last_read_at,
       status = excluded.status;`,
    comicId,
    currentPage,
    totalPages,
    Date.now(),
    status
  );
}

export async function setStatus(comicId: string, status: ReadingStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO reading_progress (comic_id, status, last_read_at)
     VALUES (?, ?, ?)
     ON CONFLICT(comic_id) DO UPDATE SET status = excluded.status;`,
    comicId,
    status,
    Date.now()
  );
}

/** Writes a progress row exactly as given (used by backup restore, which
 * must keep the original last-read time rather than stamping "now"). */
export async function restoreProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO reading_progress (comic_id, current_page, total_pages, last_read_at, status)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(comic_id) DO UPDATE SET
       current_page = excluded.current_page,
       total_pages = excluded.total_pages,
       last_read_at = excluded.last_read_at,
       status = excluded.status;`,
    progress.comicId,
    progress.currentPage,
    progress.totalPages,
    progress.lastReadAt,
    progress.status
  );
}
