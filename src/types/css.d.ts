// Lets TypeScript accept the side-effect `import '@/global.css'` in the root
// layout. Metro (via Uniwind) handles the actual CSS processing.
declare module '*.css';
