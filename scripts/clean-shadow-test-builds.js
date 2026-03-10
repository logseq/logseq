const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const targets = [
  path.join(repoRoot, ".shadow-cljs", "builds", "test"),
  path.join(repoRoot, ".shadow-cljs", "builds", "test-no-worker"),
  path.join(repoRoot, "static", "tests.js"),
  path.join(repoRoot, "static", "tests-no-worker.js"),
];

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
}
