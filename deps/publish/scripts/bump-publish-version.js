const fs = require("fs");
const path = require("path");

const renderPath = path.join(__dirname, "..", "src", "logseq", "publish", "render.cljs");
const source = fs.readFileSync(renderPath, "utf8");
const timestamp = Date.now();

const next = source.replace(
  /\(defonce version [^)]+\)/,
  `(defonce version ${timestamp})`
);

if (next === source) {
  throw new Error("Failed to update logseq.publish.render/version.");
}

fs.writeFileSync(renderPath, next);
