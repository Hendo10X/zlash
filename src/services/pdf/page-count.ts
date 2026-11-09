import type { File } from 'expo-file-system';

// Reading the whole PDF as text to regex-scan it is a stopgap until a real
// PDF library lands in Phase 4 (rendering needs one anyway). Skip it for
// very large files rather than risk loading, say, a 300MB PDF into a JS
// string just to learn its page count.
const MAX_SCAN_BYTES = 60 * 1024 * 1024;

const PAGES_COUNT = /\/Type\s*\/Pages[^>]{0,500}?\/Count\s+(\d+)/g;
const SINGLE_PAGE = /\/Type\s*\/Page(?!s)\b/g;

/**
 * Best-effort PDF page count by scanning the file's raw structure for
 * `/Type /Pages ... /Count N` (the page-tree root declares its own count,
 * which survives incremental saves better than counting individual
 * `/Type /Page` objects). Falls back to counting page objects directly, then
 * to `0` (shown as "—" in the UI) if neither pattern is found.
 */
export async function estimatePdfPageCount(file: File): Promise<number> {
  if (file.size > MAX_SCAN_BYTES) return 0;

  let text: string;
  try {
    text = await file.text();
  } catch {
    return 0;
  }

  let best = 0;
  for (const match of text.matchAll(PAGES_COUNT)) {
    const count = Number(match[1]);
    if (count > best) best = count;
  }
  if (best > 0) return best;

  const singlePageMatches = text.match(SINGLE_PAGE);
  return singlePageMatches?.length ?? 0;
}
