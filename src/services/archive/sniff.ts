import type { File } from 'expo-file-system';

export type ArchiveKind = 'zip' | 'rar' | 'pdf' | 'unknown';

/**
 * Identifies a file by its first bytes, not its extension. Many ".cbr"
 * files are really ZIP archives (renamed CBZ), and those can be read fully
 * in JS without the native RAR reader.
 */
export async function sniffArchive(file: File): Promise<ArchiveKind> {
  let head: Uint8Array;
  try {
    const handle = file.open();
    try {
      head = handle.readBytesSync(8);
    } finally {
      handle.close();
    }
  } catch {
    return 'unknown';
  }
  if (head[0] === 0x50 && head[1] === 0x4b) return 'zip'; // "PK"
  if (head[0] === 0x52 && head[1] === 0x61 && head[2] === 0x72 && head[3] === 0x21) return 'rar'; // "Rar!"
  if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) return 'pdf'; // "%PDF"
  return 'unknown';
}
