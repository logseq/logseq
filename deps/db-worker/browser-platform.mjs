import { dirname, isAbsolute, resolve } from "node:path";

// Select the browser's absent vector capability before following Node
// imports. Both the worker and publishing read API use this platform boundary.
export function browserVectorBackend() {
  return {
    name: "browser-vector-backend",
    enforce: "pre",
    resolveId(id, importer) {
      if (!isAbsolute(id) && (!id.startsWith(".") || !importer)) return null;
      const file = isAbsolute(id) ? id : resolve(dirname(importer), id);
      if (!/\/runtime\/melange\/(vector_index|embedding)\.js$/.test(file)) return null;
      return file.replace(/\.js$/, "_browser.js");
    },
  };
}
