import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * - Per-comic reader preferences (null = use the Settings default).
 * - OPDS sources for the Browse tab. Passwords are NOT stored here; they
 *   live in the OS keystore via expo-secure-store, keyed by source id.
 */
export const MIGRATION_002_READER_PREFS_AND_SOURCES = {
  version: 2,
  name: 'reader-prefs-and-sources',
  async up(db: SQLiteDatabase) {
    await db.execAsync('ALTER TABLE comics ADD COLUMN reading_direction TEXT;');
    await db.execAsync('ALTER TABLE comics ADD COLUMN reading_mode TEXT;');
    await db.execAsync('ALTER TABLE comics ADD COLUMN page_fit TEXT;');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        username TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  },
};
