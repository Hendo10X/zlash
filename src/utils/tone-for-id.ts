import { CoverPalette } from '@/constants/theme';

/** Deterministically maps a comic's id to a placeholder cover gradient, so
 * the same comic always gets the same tone across app restarts without
 * needing to store it anywhere. */
export function toneForId(id: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return CoverPalette[Math.abs(hash) % CoverPalette.length];
}
