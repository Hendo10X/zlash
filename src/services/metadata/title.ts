/**
 * Derives a readable title from a raw filename. Metadata embedded in the
 * archive (e.g. ComicInfo.xml) isn't read yet — this is the "filename"
 * source the product spec lists as the first metadata tier (§6.3).
 */
export function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^./\\]+$/, '');
  const spaced = withoutExtension.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
  return spaced.length > 0 ? spaced : filename;
}
