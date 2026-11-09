import type { PageFit, ReadingDirection, ReadingMode, ReadingStatus } from './reading';

/** Mirrors the `comics` SQLite table — see `src/database/schema.ts`. */
export interface Comic {
  id: string;
  title: string;
  series?: string;
  issueNumber?: string;
  originalFilename: string;
  filePath: string;
  fileHash: string;
  coverPath?: string;
  format: 'cbz' | 'cbr' | 'pdf';
  fileSize: number;
  pageCount: number;
  dateAdded: number;
  updatedAt: number;
  /** Per-comic reader overrides; undefined = use the Settings default. */
  readingDirection?: ReadingDirection;
  readingMode?: ReadingMode;
  pageFit?: PageFit;
}

/** Mirrors the `reading_progress` SQLite table. */
export interface ReadingProgress {
  comicId: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: number | null;
  status: ReadingStatus;
}

/** A comic joined with its reading progress — the shape most screens render. */
export interface LibraryComic extends Comic {
  progress?: ReadingProgress;
  /** Deterministic placeholder artwork, used until real cover extraction
   * (Phase 3) replaces it with `coverPath`. */
  placeholderTone: readonly [string, string];
}

export interface ReaderPreferences {
  readingDirection: ReadingDirection;
  readingMode: ReadingMode;
  pageFit: PageFit;
}
