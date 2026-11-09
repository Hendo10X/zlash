import type { LibraryComic } from '@/types/comic';
import type { LibrarySortKey } from '@/types/reading';

export function filterComics(comics: LibraryComic[], query: string): LibraryComic[] {
  const q = query.trim().toLowerCase();
  if (!q) return comics;
  return comics.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.series?.toLowerCase().includes(q) ||
      c.originalFilename.toLowerCase().includes(q)
  );
}

export function sortComics(comics: LibraryComic[], key: LibrarySortKey): LibraryComic[] {
  const sorted = [...comics];
  switch (key) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'dateAdded':
      return sorted.sort((a, b) => b.dateAdded - a.dateAdded);
    case 'progress':
      return sorted.sort((a, b) => {
        const pa = a.progress ? a.progress.currentPage / Math.max(a.progress.totalPages, 1) : -1;
        const pb = b.progress ? b.progress.currentPage / Math.max(b.progress.totalPages, 1) : -1;
        return pb - pa;
      });
    case 'recent':
    default:
      return sorted.sort((a, b) => {
        const la = a.progress?.lastReadAt ?? 0;
        const lb = b.progress?.lastReadAt ?? 0;
        if (la !== lb) return lb - la;
        return b.dateAdded - a.dateAdded;
      });
  }
}

export function getCurrentlyReading(comics: LibraryComic[]): LibraryComic[] {
  return comics
    .filter((c) => c.progress?.status === 'reading')
    .sort((a, b) => (b.progress?.lastReadAt ?? 0) - (a.progress?.lastReadAt ?? 0));
}

export function getRecentlyOpened(comics: LibraryComic[]): LibraryComic[] {
  return comics
    .filter((c) => c.progress?.lastReadAt)
    .sort((a, b) => (b.progress?.lastReadAt ?? 0) - (a.progress?.lastReadAt ?? 0));
}

export function getCompleted(comics: LibraryComic[]): LibraryComic[] {
  return comics
    .filter((c) => c.progress?.status === 'completed')
    .sort((a, b) => (b.progress?.lastReadAt ?? 0) - (a.progress?.lastReadAt ?? 0));
}

export function readingFraction(comic: LibraryComic): number {
  if (!comic.progress || comic.progress.totalPages === 0) return 0;
  return comic.progress.currentPage / comic.progress.totalPages;
}

export function formatPageCount(pageCount: number): string {
  // 0 means "unknown" (e.g. CBR archives, until real RAR extraction lands),
  // not "empty" — see docs/ROADMAP-STATUS.md.
  return pageCount > 0 ? `${pageCount} pages` : 'Page count unavailable';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
