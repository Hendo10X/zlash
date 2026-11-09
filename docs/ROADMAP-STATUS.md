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

Still open (most of this list was resolved later, see "Phase 4 follow-up" below):
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

## Phase 5 — Library management ✅ first version

- **Collections.** The library shows a chip row (All · your collections · New).
  Tap a chip to filter, long-press it to rename or delete. On a comic's details
  screen, *Collection* opens a picker where you can tick any number of
  collections or create one inline. Deleting a collection never deletes comics.
- **Manage comics** (Settings → Storage): every comic sorted by size, with
  multi-select and bulk remove.
- **Backup & restore** (Settings → Storage): saves reading progress,
  collections and settings as JSON to a folder you pick. Restoring matches
  comics by file hash, so it works on a new device once the same files are
  imported. Comic files themselves are not included.
- **Import a folder**, alongside picking files: scans a folder and up to 3
  levels of subfolders for CBZ/CBR/PDF.

## Phase 6 — Polish 🟡 first pass

Fixes from the first round of on-device testing:
- **Collapsed or overflowing screens and cut-off text.** Screens used
  `className="flex-1"` on `SafeAreaView`. Uniwind only styles core RN
  components, so that was silently dropped. Every screen now goes through
  `components/ui/Screen.tsx`, which does its layout with `style`. `AppText`
  now has a type scale (`variant`) with an explicit line height on every size,
  so Android no longer clips glyphs.
- **Accent is now green** (#22c55e dark / #16a34a light), matching the
  app icon.
- **Settings.** Grouped cards (`SettingsGroup`). The segmented toggles became
  select rows that open a bottom sheet (`SelectSheet`). On/off settings use
  a custom accent `Switch` (HeroUI's was removed).
- **One shared `Sheet`** (gorhom bottom-sheet with a 320ms no-overshoot
  timing curve) is used for every select, confirm, about, and coming-soon
  dialog in place of `Alert`.
- **Tab bar.** 4 tabs (Library, Browse, History, Settings). The indicator
  glides on a 260ms ease-out, with no spring or per-item scaling, and doesn't
  slide in on first layout. Tab switches have no screen transition. There's a
  selection haptic on change.
- **Import button** now sits 16pt above the tab bar, measured from the
  safe-area inset.
- **Browse tab** is a "coming soon" screen for plugin-based comic and manga
  sources.
- **History and list rows** show the real cover art (not a gradient), with
  an inline progress bar.
- **Redesigned** the import, comic details (blurred-cover backdrop), and
  reader controls (gradient fades, one chip row, green slider, inverted in
  RTL).
- **Motion tokens** live in `constants/motion.ts`: ease-out
  (0.23, 1, 0.32, 1) for enters and presses, and a sheet curve for long
  travel.

Second pass (after the first on-device test):
- **Import is now a half-height drawer** opened from the + button (and from
  the empty library), not a full-screen page. The `/import` route is gone.
- **`Sheet` was rewritten** on RN `Modal` + Reanimated instead of gorhom's
  portal-based `BottomSheetModal`, so taps inside sheets always register.
  Drag the handle down, tap the backdrop, or press back to close. Sheets lift
  above the keyboard.
- **Intro fade-ins removed** (comic details, Browse, empty states, cover
  images, default stack transition). Pushes still slide; reader controls
  still fade when toggled.
- Settings' dead GitHub / Report-a-bug rows were removed (the URL was a
  placeholder). Remove now deletes after the details screen has slid away.
  Un-marking a never-opened comic sets it back to unread.

## Phase 4 follow-up — PDF, CBR, per-comic preferences ✅

- **`modules/zlash-native`** is a local Expo module (Android, Kotlin), so
  nothing here depends on a third-party RN library:
  - PDF: Android's built-in `PdfRenderer` renders pages to JPEG at screen
    resolution into the reader cache. It also gives the real page count and
    renders the cover at import.
  - CBR: `junrar` lists and extracts entries. RAR5 archives aren't supported
    by any JVM library and fail with a clear "re-pack as CBZ" message.
  - JS loads it with `requireOptionalNativeModule`, so older builds, iOS and
    Expo Go show "needs the latest build" instead of crashing.
- **Files are identified by their bytes** (`services/archive/sniff.ts`): a
  ".cbr" that is really a ZIP is read in JS like a CBZ.
- **Backfill.** On startup, comics imported before this (CBR/PDF with no
  cover or a page count of 0) get covers and page counts filled in, in the
  background.
- **Per-comic reader preferences.** Migration 002 adds `reading_direction`,
  `reading_mode` and `page_fit` to `comics`. Changing them in the reader saves
  them for that comic; unset values fall back to the Settings defaults.
- The reader screen is now a generic `features/reader/ReaderView.tsx` over
  any `PageSource`. Local comics and streamed comics share it.

## Browse — OPDS servers ✅ first version

- Add a server in Browse (URL, optional username/password). Saving fetches
  the catalog first, so bad addresses are caught right away. Server rows live
  in SQLite (`sources`, migration 002); passwords live in the OS keystore
  (expo-secure-store).
- `services/opds/opds.ts` handles OPDS 1.x Atom feeds: navigation, paging
  (`rel="next"`), OpenSearch search, acquisition links, covers/thumbnails,
  and the **Page Streaming Extension**. Relative URLs are resolved by hand
  (RN's URL polyfill doesn't do relative resolution). Login is HTTP Basic.
- **Read online** (`app/stream.tsx`): pages download one at a time from the
  PSE template into the reader cache, so streamed comics get the full
  reader. Progress is kept per stream in MMKV, and Browse shows
  "Continue reading online".
- **Download to library**: picks the best CBZ/CBR/PDF acquisition link,
  downloads it with the server login, and runs the normal import pipeline
  (dedupe, cover, page count).
- Tested against the OPDS spec only, not yet against live Komga/Kavita
  servers.

Not yet: OPDS 2.0 (JSON) feeds, marking progress back on the server,
batch-downloading a whole series, Kavita's API-key login beyond putting the
key in the URL (which is how Kavita's OPDS URL already works).

## Phase 7 — Public release 🟡

- License: **GPL-3.0** (`LICENSE`).
- Android package: `dev.zlash.app` (kept on purpose).
- Lightning-Z icon and EAS profiles are in. A preview APK has been tested on
  a device.
- Still to do: store listing, screenshots, privacy policy (needed for the
  Play Store, even though Zlash collects nothing), and a public repo URL for
  the About screen.
