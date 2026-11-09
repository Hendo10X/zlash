# Architecture

## Layers

- **`src/app/`** — Expo Router screens only. No database queries, file I/O,
  or archive parsing should live here; screens call into `stores/`,
  `features/`, and `database/repositories/`.
- **`src/components/`** — presentational, reusable UI with no feature-specific
  logic (`ui/` for generic primitives, `comic-cover/`, `empty-state/`,
  `reader-controls/` for domain-shaped pieces reused across screens).
- **`src/features/`** — feature-local logic that isn't a generic component:
  selectors/derivations (`library/selectors.ts`), the import orchestrator
  (`importer/import-comic.ts`), reader helpers like `ZoomablePage`.
- **`src/database/`** — the only place that talks to SQLite. `schema.ts`
  defines tables, `migrations/` applies them in order, `repositories/`
  expose typed functions (`getAllComics`, `saveProgress`, …) — never raw SQL
  outside this folder.
- **`src/services/`** — format/platform-specific engines, called only from
  `features/` (the importer and the reader), never directly from screens:
  `file-system/paths.ts` (managed storage layout, using the new
  `File`/`Directory`/`Paths` API from `expo-file-system`), `archive/cbz.ts`
  (JSZip-based CBZ reading), `pdf/page-count.ts` (regex-based page-count
  stopgap), `metadata/` (format detection, filename → title).
- **`src/stores/`** — Zustand. `library-store.comics` is DB-backed
  (`refresh()` loads from the repositories; `updateProgress`/`setStatus`/
  `removeComic` write through) plus search/sort UI state. `settings-store`
  persists user preferences to MMKV.
- **`src/hooks/`**, **`src/types/`**, **`src/constants/`** — cross-cutting.

## Styling

Everything uses Uniwind `className`s against the tokens in `src/global.css`
(`bg-base`, `text-ink`, `text-ink-dim`, `bg-accent`, etc. — see that file for
the full set and their light/dark values). Raw hex values should only appear
in `src/constants/theme.ts` (the JS mirror used for things a `className`
can't reach: `StatusBar` style, SVG icon `color` props) and in
`src/constants/theme.ts`'s `CoverPalette` (placeholder cover gradients).

Typography always goes through `AppText` (`src/components/ui/Text.tsx`), not
React Native's `Text` — see the comment in `src/constants/fonts.ts` for why
(Expo Google Fonts ships one static file per weight, so a numeric
`fontWeight` / Tailwind `font-semibold` silently does nothing on a custom
font; `AppText`'s `weight` prop maps to the exact loaded family instead).

## Import pipeline (Phase 3)

`features/importer/import-comic.ts` is the single entry point — it's the
only thing `src/app/import.tsx` calls, and it owns the full sequence:
validate extension → hash (`File.digest('SHA-256')`) → check
`comics-repository.findComicByHash` → copy into managed storage → delegate
to the right `services/` module for metadata/cover → `insertComic`. Adding a
format (e.g. CB7) means adding a `services/archive/cb7.ts` and one branch in
this function — screens and the store don't change.

Managed storage layout (`services/file-system/paths.ts`):
`Paths.document/comics/{id}/original.{ext}` for the copied file,
`Paths.document/covers/{id}.jpg` for an extracted cover. Both are built with
`new File(...)`/`new Directory(...)`, not string concatenation — this is
expo-file-system's current (non-legacy) API.

## Reader (Phase 4)

`src/app/reader/[id].tsx` calls `features/reader/use-page-source.ts`, which
opens the right `PageSource` implementation for the comic's format (today
only `services/archive/cbz-page-source.ts`). The rest of the reader only
sees the `PageSource` interface (`pageCount`, `getPageUri(index)`, a shared
`dimensions` cache, `close()`). Adding PDF or CBR rendering means writing one
new implementation and adding one branch in `usePageSource`. Nothing else
changes.

- `features/reader/PagedReader.tsx` — horizontal pager for single and double
  modes.
- `features/reader/VerticalReader.tsx` — continuous vertical scroll.
- `features/reader/ReaderPage.tsx` — `SinglePage` / `SpreadPage` /
  `VerticalPage`, all built on one `PageImage` that handles the loading and
  error states.
- `features/reader/layout.ts` — pure sizing math (page fit, spread indexing).
- `features/reader/reader-cache.ts` — cache size, clearing, and LRU pruning.
  Settings and the library store use this. Nothing else touches the reader
  cache directory directly.
