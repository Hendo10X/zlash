import type { Comic } from '@/types/comic';

const EXTENSION_FORMATS: Record<string, Comic['format']> = {
  cbz: 'cbz',
  zip: 'cbz',
  cbr: 'cbr',
  rar: 'cbr',
  pdf: 'pdf',
};

export function detectFormat(filename: string): Comic['format'] | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return EXTENSION_FORMATS[extension] ?? null;
}

export const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_FORMATS);
