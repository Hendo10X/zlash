# Roadmap status

Tracks the phases from the product spec. Updated as work lands — see the spec's
own "Development Roadmap" (§17) for the full phase descriptions.

## Phase 1 — Foundation ✅

- Expo + TypeScript + Expo Router project, feature-based `src/` layout
- Uniwind (Tailwind v4) design tokens for light/dark (`src/global.css`, `src/constants/theme.ts`)
- Inter loaded as the only typeface, weight-correct via `AppText` (no monospace anywhere)
- SQLite schema + migrations + repositories (`src/database`)
- Zustand stores + MMKV-backed settings persistence

## Phase 2 — Library UI ✅

- Library screen: continue-reading rail, grid/list toggle, sort, search, empty state
- Comic Details screen
- History screen (currently reading / recently opened / completed)
- Settings screen (appearance, reading defaults, storage, application)
- Custom bottom tab bar with an animated active indicator

Originally built against sample data; now DB-backed (see Phase 3).

## Phase 3 — Import system ✅ (CBZ/PDF real, CBR partial)

`src/app/import.tsx` is a working flow: Android document picker (multi-select,
`*/*` since SAF MIME filtering for `.cbz`/`.cbr` is unreliable — we validate
by extension ourselves after picking) → per-file hash → duplicate check →
copy into app-private storage → format-specific metadata extraction → SQLite
insert, with live per-file status in the UI and a library refresh on
completion.

`library-store` is now DB-backed end to end: `refresh()` loads from
`comics-repository`/`reading-progress-repository` on app start and after
import, `removeComic`/`setStatus` write through immediately, and
`updateProgress` does an optimistic in-memory update plus a fire-and-forget
`saveProgress` call. **Sample data (`features/library/sample-data.ts`) has
been removed** — a fresh install now genuinely starts with an empty library
and the Phase 2 empty-state UI, per the spec.

Per format:
- **CBZ** — fully real: natural-sorted page list via JSZip, first page
  extracted as the actual cover (`ComicCover` now renders it), real page
  count.
- **PDF** — real page count via a regex scan of the PDF's page-tree
  `/Count` (a stopgap until a real PDF library lands for Phase 4 rendering;
  skipped for files over 60MB to avoid loading huge files as a JS string).
  No real thumbnail yet — falls back to the gradient placeholder cover.
- **CBR** — imports successfully (copied, hashed, deduped, inserted) but
  page count is unknown (shown as "Page count unavailable") and there's no
  cover, because there's no RAR-extraction library wired up yet. The spec
  itself flags CBR as needing independent verification (§7) — a vetted RAR
  solution for RN is still an open decision, not a default pick.

Known limitations to revisit:
- JSZip loads the whole CBZ into memory (via `file.bytes()`) — fine at
  typical comic sizes, but a native streaming unzip would be the real
  Phase 4-grade answer for very large archives.
- Imports run sequentially, not in parallel, specifically to avoid stacking
  those memory peaks when multiple files are picked at once.
- No "manage imported comics" / storage breakdown UI yet (Settings' rows for
  these are still stubs) — that's Phase 5.

## Phase 4 — Comic reader 🟡 CBZ real; PDF/CBR blocked on libraries

**Real CBZ rendering.** Opening a comic goes through a format-agnostic
`PageSource` (`services/reader/page-source.ts`). The CBZ implementation
(`services/archive/cbz-page-source.ts`) parses the archive once, then
inflates pages on demand into `Paths.cache/reader/{comicId}/{index}.{ext}`
and hands `expo-image` a file URI, so image decoding stays native. It caps
decoding at 2 pages at a time (JSZip runs on the JS thread), shares one decode
between concurrent requests for the same page, and writes each page via a
temp file + rename so a crash can't leave a truncated page that later counts
as cached. Pages cached in an earlier session load without opening the archive.

**Reading modes** (toggle from a chip in the reader's bottom bar, default from
Settings):
- **Single:** horizontal swipe pager with LTR/RTL, pinch and double-tap zoom.
  Page fit is a second chip: *width* (scrolls vertically if the page is
  taller than the screen), *height*, *screen*, *original* (no upscaling).
  *Height* and *original* fall back to contain or fit-width when the page
  would be wider than the screen, because a horizontally-scrolling page
  inside a horizontal pager steals the page-turn swipe.
- **Double:** cover alone, then facing pairs (1–2, 3–4, …), meeting at the
  spine. RTL swaps the pair's order on screen.
- **Vertical:** continuous webtoon-style scrolling, full-width pages, using
  `maintainVisibleContentPosition` so pages above the viewport don't push the
  current page around as they load at their real height.

**Progress** saves the first page on screen, so resuming works in any mode.
The comic is marked completed once the last page has been on screen (e.g.
the right half of the final spread). A pending debounced save is flushed
when you leave the reader. Mode/fit/direction changes made in the reader only
last for that session. The defaults come from Settings.

**Cache management:** the reader keeps decoded pages for the comic you're
reading plus the 3 most recently read others, and deletes older ones when a
comic opens. Deleting a comic also clears its cache. Settings → Storage now
shows the real "Reader cache" size, and "Clear cache" really clears it.

Still open:
- **PDF rendering.** This needs a native PDF renderer, and choosing one is a
  dependency decision that hasn't been made. PDFs currently open to a clear
  "can't be displayed yet" screen instead of placeholder pages.
- **CBR rendering.** Same RAR-library blocker as import (see Phase 3).
- No on-device run yet. Typecheck and lint pass, and the layout/spread math
  and decode limiter were unit-checked. Gesture feel (nested vertical scroll
  in fit-width, pinch while in a list) still needs testing on a real Android
  build.
- No per-comic remembered reader preferences (`ReaderPreferences` type exists,
  no DB column yet).
- JSZip still loads the whole CBZ into memory while it's open.

## Phase 5 — Library management ⏳ not started

Collections have a repository (`collections-repository.ts`) but no UI.
Storage management and "manage imported comics" are stub rows in Settings
that show a "coming soon" alert.

## Phase 6 — Polish ⏳ not started

## Phase 7 — Public release ⏳ not started

No custom app icon/splash artwork yet (still Expo's placeholder images —
only the background colors were updated to match the palette). No license
has been chosen (§16). `app.json`'s Android package is a placeholder
(`dev.zlash.app`) — update it to your real reverse-domain before building a
release APK.
