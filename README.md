# Zlash

> Your comics. Your library. Your way.

A free, open-source, local-first comic book reader for Android, built with Expo and React Native.

## Status

First feature-complete version:

- **Library** — import CBZ, CBR and PDF (single files or whole folders), real covers and page counts, collections, search/sort, manage storage, backup & restore.
- **Reader** — CBZ, CBR (RAR4 and ZIP-based; RAR5 isn't supported) and PDF, in single, double-page and vertical modes. Mode, fit and direction are remembered per comic.
- **Browse** — connect Komga, Kavita, Calibre-Web, Ubooquity or any OPDS 1.x catalog. Browse and search it, read online page by page where the server supports OPDS-PSE (Komga, Kavita), or download comics into the library.

See [`docs/ROADMAP-STATUS.md`](./docs/ROADMAP-STATUS.md) for details and known limits.

## Get started

```bash
npm install
npx expo run:android   # needs a dev build — Expo Go lacks Zlash's native modules (modules/zlash-native, sqlite, mmkv…)
```

Use `npx expo install <package>` (not `npm install`) when adding any Expo/native dependency, so versions stay matched to the installed SDK.

## Stack

- **Expo SDK 58** + **React Native 0.88** + **React 19**
- **Expo Router** (file-based routing, `src/app/`)
- **Uniwind** (Tailwind CSS v4 bindings for React Native) for all styling
- **Reanimated** + **Gesture Handler** for motion and the reader's swipe/pinch interactions
- **expo-sqlite** for comics/progress/collections, **MMKV** for preferences
- **Zustand** for app state
- **`modules/zlash-native`** — a local Expo module (Kotlin): PDF rendering via Android's `PdfRenderer`, RAR extraction via junrar
- **fast-xml-parser** for OPDS feeds, **expo-secure-store** for server passwords

## Project layout

```
src/
  app/                 Expo Router screens — (tabs)/, comic/[id], reader/[id], manage, source/, stream
  components/          Reusable UI (comic-cover, empty-state, ui/, reader-controls)
  features/            Feature logic — importer, reader, collections, browse, backup
  database/            SQLite schema, migrations, repositories
  services/            File system, archives (zip/rar), pdf, opds, metadata
  stores/              Zustand stores (library, settings, sources) + MMKV adapter
modules/zlash-native/  Local native module (Android)
  hooks/, types/, constants/
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for more on how these fit together.

## Scripts

```bash
npx expo start          # dev server
npx tsc --noEmit         # typecheck
npx expo lint            # lint
npx expo-doctor          # dependency/config health check
```

## License

[GPL-3.0](./LICENSE). Forks and modified versions must stay open source under the same license.
