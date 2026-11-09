import { Image, type ImageContentPosition } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, PixelRatio, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Colors } from '@/constants/theme';
import type { PageDimensions, PageSource } from '@/services/reader/page-source';
import type { PageFit, ReadingDirection } from '@/types/reading';

import { fitPage, pagesInSpread, verticalPageHeight } from './layout';
import { usePageUri } from './use-page-source';

interface Viewport {
  width: number;
  height: number;
}

/** Tracks a page's decoded size, seeded from the source's shared cache so a
 * recycled/re-mounted page lays out correctly on its first frame. */
function usePageDimensions(source: PageSource, index: number) {
  const [dims, setDims] = useState<PageDimensions | undefined>(() => source.dimensions.get(index));
  const current = dims ?? source.dimensions.get(index);
  const onDimensions = (d: PageDimensions) => {
    source.dimensions.set(index, d);
    if (!current || current.width !== d.width || current.height !== d.height) setDims(d);
  };
  return [current, onDimensions] as const;
}

function PageImage({
  source,
  index,
  style,
  contentPosition = 'center',
  onDimensions,
}: {
  source: PageSource;
  index: number;
  style: { width: number; height: number };
  contentPosition?: ImageContentPosition;
  onDimensions?: (dims: PageDimensions) => void;
}) {
  const { uri, error } = usePageUri(source, index);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (error || (uri && failedUri === uri)) {
    return (
      <View style={style} className="items-center justify-center gap-2">
        <ImageOff size={22} color={Colors.dark.inkFaint} />
        <AppText variant="caption" style={{ color: Colors.dark.inkFaint }}>Page {index + 1} couldn’t be loaded</AppText>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={style} className="items-center justify-center">
        <ActivityIndicator color={Colors.dark.inkFaint} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="contain"
      contentPosition={contentPosition}
      // Pages are already local files; a memory cache is enough and keeps
      // expo-image from duplicating every page into its own disk cache.
      cachePolicy="memory"
      recyclingKey={uri}
      transition={0}
      allowDownscaling
      onLoad={(e) => onDimensions?.({ width: e.source.width, height: e.source.height })}
      onError={() => setFailedUri(uri)}
    />
  );
}

/** One page filling the viewport, sized by the current fit mode. */
export function SinglePage({
  source,
  index,
  viewport,
  fit,
}: {
  source: PageSource;
  index: number;
  viewport: Viewport;
  fit: PageFit;
}) {
  const [dims, onDimensions] = usePageDimensions(source, index);
  const fitted = fitPage(fit, dims, viewport, PixelRatio.get());
  const image = (
    <PageImage
      source={source}
      index={index}
      style={{ width: fitted.width, height: fitted.height }}
      onDimensions={onDimensions}
    />
  );

  if (!fitted.scrolls) {
    return <View style={[viewport, { alignItems: 'center', justifyContent: 'center' }]}>{image}</View>;
  }

  return (
    <ScrollView
      style={viewport}
      contentContainerStyle={{ alignItems: 'center', minHeight: viewport.height }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      {image}
    </ScrollView>
  );
}

/** Two facing pages (or a lone cover / trailing page), meeting at the spine. */
export function SpreadPage({
  source,
  spread,
  viewport,
  direction,
}: {
  source: PageSource;
  spread: number;
  viewport: Viewport;
  direction: ReadingDirection;
}) {
  const pages = pagesInSpread(spread, source.pageCount);

  if (pages.length === 1) {
    return (
      <View style={[viewport, { alignItems: 'center', justifyContent: 'center' }]}>
        <PageImage source={source} index={pages[0]} style={{ width: viewport.width / 2, height: viewport.height }} />
      </View>
    );
  }

  // Reading order → screen order: in RTL the first page sits on the right.
  const [left, right] = direction === 'rtl' ? [pages[1], pages[0]] : pages;
  const half = { width: viewport.width / 2, height: viewport.height };

  return (
    <View style={[viewport, { flexDirection: 'row' }]}>
      <PageImage source={source} index={left} style={half} contentPosition="right center" />
      <PageImage source={source} index={right} style={half} contentPosition="left center" />
    </View>
  );
}

/** A full-width page in vertical (continuous scroll) mode. */
export function VerticalPage({ source, index, width }: { source: PageSource; index: number; width: number }) {
  const [dims, onDimensions] = usePageDimensions(source, index);
  return (
    <PageImage
      source={source}
      index={index}
      style={{ width, height: verticalPageHeight(dims, width) }}
      onDimensions={onDimensions}
    />
  );
}
