// We import JSZip's self-contained browserify bundle directly
// (`jszip/dist/jszip.min.js`) rather than the package's default entry point,
// since the default entry pulls in `readable-stream` and other Node-only
// modules that Metro can't resolve. The dist bundle has no external
// `require()`s — it inlines everything — and exports the same API, so we can
// safely re-use the package's own published types for it.
declare module 'jszip/dist/jszip.min.js' {
  import JSZip from 'jszip';
  export default JSZip;
}
