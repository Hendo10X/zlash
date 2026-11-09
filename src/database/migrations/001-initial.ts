import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CREATE_COLLECTIONS_TABLE,
  CREATE_COLLECTION_COMICS_TABLE,
  CREATE_COMICS_TABLE,
  CREATE_INDEXES,
  CREATE_READING_PROGRESS_TABLE,
} from '../schema';

export const MIGRATION_001_INITIAL = {
  version: 1,
  name: 'initial',
  async up(db: SQLiteDatabase) {
    await db.execAsync(CREATE_COMICS_TABLE);
    await db.execAsync(CREATE_READING_PROGRESS_TABLE);
    await db.execAsync(CREATE_COLLECTIONS_TABLE);
    await db.execAsync(CREATE_COLLECTION_COMICS_TABLE);
    for (const statement of CREATE_INDEXES) {
      await db.execAsync(statement);
    }
  },
};
