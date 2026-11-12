# Zlash website

Landing page for the Zlash comic reader. Astro 5, dark only.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run check    # type check
```

## Where things live

- `src/site.ts` — all copy and links. For a new release, upload the APK to a GitHub release and update `download.version` and `download.href`.
- `src/hero/wordmark/` — the interactive ASCII ZLASH: `ascii-field.ts` is the simulation and drawing, `Wordmark.astro` measures the real text and wires up the pointer.
- `src/theme/theme.css` — the only tokens: background, two text tones, one accent, motion curve.
- One folder per section: `nav/`, `hero/`, `features/`, `open-source/`, `footer/`. Each component holds its own styles.
- `src/download/DownloadLink.astro` — the only place that reads the download state.
- `src/motion/Reveal.astro` — wraps anything that should fade in once on scroll.
