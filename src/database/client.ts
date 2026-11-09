import { type SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

import { migrations } from './migrations';

const DATABASE_NAME = 'zlash.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= version) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    version = migration.version;
  }

  await db.execAsync(`PRAGMA user_version = ${version};`);
}

/** Opens (or returns the cached) Zlash database, migrated to the latest schema. */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}
