// Stub for node-only builtins (node:sqlite, fs, keytar) in the browser
// worker bundle. Melange modules only reach them under Node runtime
// detection; in browser they must resolve to an inert object.
export default {};
