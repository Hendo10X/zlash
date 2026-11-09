/** Mirrors the `collections` SQLite table. */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  comicIds: string[];
}
