import type { PageDimensions } from '@/services/reader/page-source';
import type { PageFit } from '@/types/reading';

/** Aspect ratio (height / width) assumed for a page before it has decoded —
 * typical US comic page proportions. */
export const DEFAULT_PAGE_ASPECT = 1.54;

export interface FittedPage {
  width: number;
  height: number;
  /** True when the page is taller than the viewport and needs to scroll. */
  scrolls: boolean;
}

/**
 * Sizes a page for single-page mode.
 *
 * - `screen`: whole page visible (contain).
 * - `width`: page fills the viewport width; scrolls vertically if taller.
 * - `height`: page fills the viewport height. If that would make it wider
 *   than the viewport it falls back to `screen` — a horizontally-scrolling
 *   page inside a horizontal pager steals the page-turn swipe.
 * - `original`: 1 image pixel = 1 physical pixel, never upscaled; pages
 *   wider than the viewport are scaled to width (same reason as `height`).
 *
 * `pixelRatio` is `PixelRatio.get()`; passed in to keep this pure.
 */
export function fitPage(
  fit: PageFit,
  dims: PageDimensions | undefined,
  viewport: { width: number; height: number },
  pixelRatio: number
): FittedPage {
  const contain: FittedPage = { width: viewport.width, height: viewport.height, scrolls: false };
  if (!dims || dims.width <= 0 || dims.height <= 0) return contain;

  const aspect = dims.height / dims.width;
  const byWidth = (): FittedPage => {
    const height = viewport.width * aspect;
    return { width: viewport.width, height, scrolls: height > viewport.height + 0.5 };
  };

  switch (fit) {
    case 'width':
      return byWidth();
    case 'height': {
      const width = viewport.height / aspect;
      return width > viewport.width ? contain : { width, height: viewport.height, scrolls: false };
    }
    case 'original': {
      const width = dims.width / pixelRatio;
      if (width > viewport.width) return byWidth();
      const height = dims.height / pixelRatio;
      return { width, height, scrolls: height > viewport.height + 0.5 };
    }
    case 'screen':
    default:
      return contain;
  }
}

/** Height of a page in vertical (webtoon-style) mode, where every page is
 * full-width and pages stack with no gaps. */
export function verticalPageHeight(dims: PageDimensions | undefined, viewportWidth: number): number {
  const aspect = dims && dims.width > 0 ? dims.height / dims.width : DEFAULT_PAGE_ASPECT;
  return Math.round(viewportWidth * aspect);
}

// ---------------------------------------------------------------------------
// Double-page spreads
//
// Page 0 (the cover) is shown alone, then pages pair up as (1,2), (3,4), …,
// matching how printed comics put the cover on a right-hand page. A trailing
// odd page is shown alone.
// ---------------------------------------------------------------------------

export function spreadCount(pageCount: number): number {
  if (pageCount <= 0) return 0;
  return 1 + Math.ceil((pageCount - 1) / 2);
}

export function spreadForPage(page: number): number {
  return page <= 0 ? 0 : Math.floor((page + 1) / 2);
}

/** Page indices in a spread, in reading order (not screen order). */
export function pagesInSpread(spread: number, pageCount: number): number[] {
  if (spread <= 0) return pageCount > 0 ? [0] : [];
  const first = spread * 2 - 1;
  return first + 1 < pageCount ? [first, first + 1] : first < pageCount ? [first] : [];
}
