/**
 * Core table definitions for Zlash's local-first SQLite database.
 * Executed by migration 001 — see `src/database/migrations`.
 *
 * Large binary data (cover art, page images) is never stored here: only
 * file paths into app-private storage. See `src/services/file-system`.
 */

export const CREATE_COMICS_TABLE = `
  CREATE TABLE IF NOT EXISTS comics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    series TEXT,
    issue_number TEXT,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_hash TEXT NOT NULL UNIQUE,
    cover_path TEXT,
    format TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    page_count INTEGER DEFAULT 0,
    date_added INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

export const CREATE_READING_PROGRESS_TABLE = `
  CREATE TABLE IF NOT EXISTS reading_progress (
    comic_id TEXT PRIMARY KEY,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    last_read_at INTEGER,
    status TEXT NOT NULL DEFAULT 'unread',

    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
  );
`;

export const CREATE_COLLECTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

export const CREATE_COLLECTION_COMICS_TABLE = `
  CREATE TABLE IF NOT EXISTS collection_comics (
    collection_id TEXT NOT NULL,
    comic_id TEXT NOT NULL,
    added_at INTEGER NOT NULL,

    PRIMARY KEY (collection_id, comic_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
  );
`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_comics_title ON comics(title);',
  'CREATE INDEX IF NOT EXISTS idx_comics_date_added ON comics(date_added);',
  'CREATE INDEX IF NOT EXISTS idx_comics_series ON comics(series);',
  'CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read_at);',
  'CREATE INDEX IF NOT EXISTS idx_reading_progress_status ON reading_progress(status);',
  'CREATE INDEX IF NOT EXISTS idx_collection_comics_comic ON collection_comics(comic_id);',
];
