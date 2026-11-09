import { File } from 'expo-file-system';
import { Dimensions, PixelRatio } from 'react-native';

import { createCachedPageSource } from '@/services/archive/cache-page-source';

import { authHeaders, type OpdsCredentials, type OpdsStream, streamPageUrl } from './opds';

/** Short stable id for a stream, used as its reader-cache folder name. */
export function streamCacheKey(template: string) {
  let h = 5381;
  for (let i = 0; i < template.length; i++) h = ((h << 5) + h + template.charCodeAt(i)) | 0;
  return `stream-${(h >>> 0).toString(36)}`;
}

/**
 * Pages fetched one by one from an OPDS-PSE server into the reader cache,
 * so streamed comics get the same reader, zoom and caching as local ones.
 */
export function openStreamPageSource(stream: OpdsStream, creds?: OpdsCredentials) {
  const { width, height } = Dimensions.get('window');
  const maxWidth = Math.min(2000, Math.round(Math.max(width, height) * PixelRatio.get()));
  const headers = authHeaders(creds);
  return createCachedPageSource({
    cacheKey: streamCacheKey(stream.template),
    pageCount: stream.count,
    concurrency: 3,
    extensionFor: () => 'img',
    produce: async (index, part) => {
      if (part.exists) part.delete();
      await File.downloadFileAsync(streamPageUrl(stream, index, maxWidth), part, { headers, idempotent: true });
    },
  });
}
