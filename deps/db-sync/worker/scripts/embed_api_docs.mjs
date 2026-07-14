import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/api-docs.html", import.meta.url), "utf8");
writeFileSync(
  new URL("../dist/api-docs.generated.mjs", import.meta.url),
  `export default ${JSON.stringify(html)};\n`,
);
