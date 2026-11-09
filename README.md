# Zlash

> Your comics. Your library. Your way.

A free, open-source, local-first comic book reader for Android, built with Expo and React Native.

## Status

Phases 1–3 of the project roadmap are done: design system, app architecture, a fully navigable Library/History/Settings experience, and a real import pipeline (Android file picker → copy → hash/dedupe → CBZ/PDF metadata & cover extraction → SQLite). The library is DB-backed end to end — a fresh install starts empty and fills up as you import.

CBR files import (copied, hashed, deduped) but have no page count or cover yet — RAR extraction needs a vetted library, which hasn't been picked. Phase 4 is in progress. The reader renders real CBZ pages in single (with page-fit options), double-page, and vertical-scroll modes. PDF and CBR rendering are still waiting on native libraries. See [`docs/ROADMAP-STATUS.md`](./docs/ROADMAP-STATUS.md) for the full breakdown.

## Get started

```bash
npm install
npx expo run:android   # native modules (reanimated, sqlite, mmkv, etc.) require a dev build — Expo Go won't work
```

Use `npx expo install <package>` (not `npm install`) when adding any Expo/native dependency, so versions stay matched to the installed SDK.

## Stack

- **Expo SDK 58** + **React Native 0.88** + **React 19**
- **Expo Router** (file-based routing, `src/app/`)
- **Uniwind** (Tailwind CSS v4 bindings for React Native) for all styling
- **HeroUI Native** for a handful of complex primitives (e.g. `Switch`)
- **Reanimated** + **Gesture Handler** for motion and the reader's swipe/pinch interactions
- **expo-sqlite** for comics/progress/collections, **MMKV** for preferences
- **Zustand** for app state

## Project layout

```
src/
  app/                 Expo Router screens — (tabs)/, comic/[id], reader/[id], import
  components/          Reusable UI (comic-cover, empty-state, ui/, reader-controls)
  features/            Feature-local logic (library selectors, sample data, reader helpers)
  database/            SQLite schema, migrations, repositories
  services/            File system / archive / pdf / metadata (scaffolded, Phase 3+)
  stores/              Zustand stores (library, settings) + MMKV adapter
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

TBD — evaluate Apache-2.0 vs GPL-3.0 before the first public release (see the product spec, §16).
