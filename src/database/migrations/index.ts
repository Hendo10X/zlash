import { MIGRATION_001_INITIAL } from './001-initial';
import { MIGRATION_002_READER_PREFS_AND_SOURCES } from './002-reader-prefs-and-sources';

/** Ordered list of migrations. Append new ones — never edit a shipped one. */
export const migrations = [MIGRATION_001_INITIAL, MIGRATION_002_READER_PREFS_AND_SOURCES];
