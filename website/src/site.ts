import { BookOpen, Compass, Library } from '@lucide/astro';

/*
  Everything the page says and links to lives here.
  Edit this file to change copy or wire up the real download link.
*/

/** The APK is either published at a URL or not yet released. There is no third state. */
export type Download =
  | { readonly status: 'released'; readonly version: string; readonly href: string }
  | { readonly status: 'soon' };

export interface Feature {
  readonly icon: typeof Library;
  readonly title: string;
  readonly body: string;
}

export const site = {
  name: 'Zlash',
  tagline: 'Your comics. Your library. Your way.',
  summary:
    'A free, open-source comic reader for Android. Your files stay on your phone. No account, no ads, no tracking.',

  download: {
    status: 'released',
    version: '1.0.0',
    href: 'https://github.com/Hendo10X/zlash/releases/download/v1.0.0/zlash-1.0.0.apk',
  } as Download,
  /** Public repository URL, or null while the repo is private. */
  sourceHref: 'https://github.com/Hendo10X/zlash' as string | null,

  features: [
    {
      icon: Library,
      title: 'Library',
      body: 'Import CBZ, CBR and PDF, one file or a whole folder. Real covers, collections, search, and backup when you need it.',
    },
    {
      icon: BookOpen,
      title: 'Reader',
      body: 'Single page, double page or vertical scroll. Zlash remembers the mode, fit and direction for every comic.',
    },
    {
      icon: Compass,
      title: 'Browse',
      body: 'Connect Komga, Kavita, Calibre-Web, Ubooquity or any OPDS catalog. Read online page by page, or download to keep.',
    },
  ] satisfies readonly Feature[],

  openSource: {
    title: 'Open source, for good',
    body: 'Zlash is licensed under GPL-3.0. Anyone can read the code, and every fork has to stay open too.',
  },
} as const;
